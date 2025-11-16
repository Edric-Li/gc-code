import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { Channel, ChannelStatus } from '@prisma/client';
import { SessionHashService } from './session-hash.service';
import { ISessionStorageService } from './session-storage/session-storage.interface';
import { SESSION_STORAGE_SERVICE } from '../constants';
import { ApiKeyInfo, ClaudeMessagesRequest } from '../interfaces/claude-api.interface';
import { ChannelPoolCacheService } from './channel-pool-cache.service';

@Injectable()
export class ClaudeChannelSelectorService {
  private readonly logger = new Logger(ClaudeChannelSelectorService.name);

  constructor(
    private prisma: PrismaService,
    private sessionHashService: SessionHashService,
    private channelPoolCache: ChannelPoolCacheService,
    @Inject(SESSION_STORAGE_SERVICE) private sessionStorage: ISessionStorageService
  ) {}

  /**
   * 为 API Key 选择可用的 Claude 渠道（支持 Sticky Session）
   */
  async selectChannel(apiKey: ApiKeyInfo, requestBody: ClaudeMessagesRequest): Promise<Channel> {
    // 1. 生成会话哈希
    const sessionHash = this.generateSessionHash(requestBody);

    // 2. 如果有会话哈希，尝试使用 Sticky Session
    if (sessionHash) {
      const stickyChannel = await this.tryGetStickyChannel(sessionHash, apiKey.id);

      if (stickyChannel) {
        this.logger.log(`✅ Sticky session hit: ${sessionHash} → ${stickyChannel.name}`);

        // 更新映射（增加请求计数）
        await this.sessionStorage.updateMapping(sessionHash);

        // 自动续期
        await this.sessionStorage.renewMapping(sessionHash);

        return stickyChannel;
      }
    }

    // 3. 没有 Sticky Session 或映射的渠道不可用，选择新渠道
    const newChannel = await this.selectNewChannel(apiKey);

    // 4. 建立新的会话映射
    if (sessionHash) {
      await this.sessionStorage.setMapping(sessionHash, newChannel.id, apiKey.id);
      this.logger.log(`🆕 Created sticky session: ${sessionHash} → ${newChannel.name}`);
    }

    return newChannel;
  }

  /**
   * 生成会话哈希
   */
  private generateSessionHash(requestBody: ClaudeMessagesRequest): string | null {
    try {
      if (!requestBody?.messages || requestBody.messages.length === 0) {
        return null;
      }

      return this.sessionHashService.generateHash(requestBody.messages);
    } catch (error) {
      this.logger.warn(`Failed to generate session hash: ${error.message}`);
      return null;
    }
  }

  /**
   * 尝试获取 Sticky Session 对应的渠道（优先使用缓存）
   */
  private async tryGetStickyChannel(
    sessionHash: string,
    apiKeyId: string
  ): Promise<Channel | null> {
    try {
      // 获取会话映射
      const mapping = await this.sessionStorage.getMapping(sessionHash);

      if (!mapping) {
        return null;
      }

      // 验证 API Key 是否匹配（防止跨用户使用）
      if (mapping.apiKeyId !== apiKeyId) {
        this.logger.warn(`⚠️ Session API Key mismatch: ${sessionHash}`);
        return null;
      }

      // 优先从缓存获取渠道（指定绑定渠道 ID）
      const channel = await this.channelPoolCache.getChannel(mapping.channelId);

      if (!channel) {
        this.logger.warn(`⚠️ Mapped channel not found or unavailable: ${mapping.channelId}`);
        // 删除无效映射
        await this.sessionStorage.deleteMapping(sessionHash);
        return null;
      }

      // 检查渠道状态（缓存可能稍有延迟）
      if (channel.status !== ChannelStatus.ACTIVE) {
        this.logger.warn(`⚠️ Mapped channel not active: ${channel.name} (${channel.status})`);

        // 如果是限流且已过期，尝试恢复
        if (
          channel.status === ChannelStatus.RATE_LIMITED &&
          channel.rateLimitEndAt &&
          new Date() > channel.rateLimitEndAt
        ) {
          await this.restoreChannel(channel.id);
          // 刷新缓存中的渠道信息
          await this.channelPoolCache.refresh();
          return channel;
        }

        // 删除映射，让用户使用其他渠道
        await this.sessionStorage.deleteMapping(sessionHash);
        return null;
      }

      return channel;
    } catch (error) {
      this.logger.error(`❌ Failed to get sticky channel: ${error.message}`);
      return null;
    }
  }

  /**
   * 选择新渠道（优先使用缓存）
   */
  private async selectNewChannel(apiKey: ApiKeyInfo): Promise<Channel> {
    // 从缓存池获取渠道（如果有绑定渠道，传递 channelId）
    const channel = await this.channelPoolCache.getChannel(apiKey.channelId || undefined);

    if (!channel) {
      if (apiKey.channelId) {
        throw new BadRequestException('Bound channel is not available');
      } else {
        throw new BadRequestException('No available Claude channels');
      }
    }

    // 异步更新最后使用时间（不阻塞响应）
    this.prisma.channel
      .update({
        where: { id: channel.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((error) => {
        this.logger.error(`Failed to update channel lastUsedAt: ${error.message}`);
      });

    return channel;
  }

  /**
   * 标记渠道为限流状态
   */
  async markChannelRateLimited(channelId: string, resetTimestamp?: number) {
    const resetTime = resetTimestamp ? new Date(resetTimestamp * 1000) : null;

    await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        status: ChannelStatus.RATE_LIMITED,
        rateLimitEndAt: resetTime,
      },
    });

    // 从缓存池中移除该渠道
    this.channelPoolCache.markChannelUnavailable(channelId);
    this.logger.log(`Channel ${channelId} marked as rate limited and removed from cache`);
  }

  /**
   * 标记渠道为错误状态
   */
  async markChannelError(channelId: string) {
    await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        status: ChannelStatus.ERROR,
        lastErrorAt: new Date(),
      },
    });

    // 从缓存池中移除该渠道
    this.channelPoolCache.markChannelUnavailable(channelId);
    this.logger.log(`Channel ${channelId} marked as error and removed from cache`);
  }

  /**
   * 恢复渠道为正常状态
   */
  async restoreChannel(channelId: string) {
    const channel = await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        status: ChannelStatus.ACTIVE,
        rateLimitEndAt: null,
      },
    });

    // 将渠道重新加入缓存池
    this.channelPoolCache.upsertChannel(channel);
    this.logger.log(`Channel ${channelId} restored and added back to cache`);
  }

  /**
   * 获取会话统计（用于监控）
   */
  async getSessionStats() {
    return await this.sessionStorage.getStats();
  }
}
