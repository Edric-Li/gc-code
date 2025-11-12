import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { Channel, ChannelStatus } from '@prisma/client';
import { SessionHashService } from './session-hash.service';
import { ISessionStorageService } from './session-storage/session-storage.interface';
import { SESSION_STORAGE_SERVICE } from '../constants';

@Injectable()
export class ClaudeChannelSelectorService {
  private readonly logger = new Logger(ClaudeChannelSelectorService.name);

  constructor(
    private prisma: PrismaService,
    private sessionHashService: SessionHashService,
    @Inject(SESSION_STORAGE_SERVICE) private sessionStorage: ISessionStorageService,
  ) {}

  /**
   * 为 API Key 选择可用的 Claude 渠道（支持 Sticky Session）
   */
  async selectChannel(apiKey: any, requestBody: any): Promise<Channel> {
    // 1. 生成会话哈希
    const sessionHash = this.generateSessionHash(requestBody);

    // 2. 如果有会话哈希，尝试使用 Sticky Session
    if (sessionHash) {
      const stickyChannel = await this.tryGetStickyChannel(
        sessionHash,
        apiKey.id,
      );

      if (stickyChannel) {
        this.logger.log(
          `✅ Sticky session hit: ${sessionHash} → ${stickyChannel.name}`,
        );

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
      await this.sessionStorage.setMapping(
        sessionHash,
        newChannel.id,
        apiKey.id,
      );
      this.logger.log(
        `🆕 Created sticky session: ${sessionHash} → ${newChannel.name}`,
      );
    }

    return newChannel;
  }

  /**
   * 生成会话哈希
   */
  private generateSessionHash(requestBody: any): string | null {
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
   * 尝试获取 Sticky Session 对应的渠道
   */
  private async tryGetStickyChannel(
    sessionHash: string,
    apiKeyId: string,
  ): Promise<Channel | null> {
    try {
      // 获取会话映射
      const mapping = await this.sessionStorage.getMapping(sessionHash);

      if (!mapping) {
        return null;
      }

      // 验证 API Key 是否匹配（防止跨用户使用）
      if (mapping.apiKeyId !== apiKeyId) {
        this.logger.warn(
          `⚠️ Session API Key mismatch: ${sessionHash}`,
        );
        return null;
      }

      // 检查渠道是否仍然可用
      const channel = await this.prisma.channel.findFirst({
        where: {
          id: mapping.channelId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!channel) {
        this.logger.warn(
          `⚠️ Mapped channel not found: ${mapping.channelId}`,
        );
        // 删除无效映射
        await this.sessionStorage.deleteMapping(sessionHash);
        return null;
      }

      // 检查渠道状态
      if (channel.status !== ChannelStatus.ACTIVE) {
        this.logger.warn(
          `⚠️ Mapped channel not active: ${channel.name} (${channel.status})`,
        );

        // 如果是限流且已过期，尝试恢复
        if (
          channel.status === ChannelStatus.RATE_LIMITED &&
          channel.rateLimitEndAt &&
          new Date() > channel.rateLimitEndAt
        ) {
          await this.restoreChannel(channel.id);
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
   * 选择新渠道
   */
  private async selectNewChannel(apiKey: any): Promise<Channel> {
    // 1. 如果 API Key 绑定了特定渠道，使用绑定的渠道
    if (apiKey.channelId) {
      const channel = await this.prisma.channel.findFirst({
        where: {
          id: apiKey.channelId,
          isActive: true,
          status: ChannelStatus.ACTIVE,
          deletedAt: null,
        },
      });

      if (!channel) {
        throw new BadRequestException('Bound channel is not available');
      }

      return channel;
    }

    // 2. 从共享渠道池中选择可用渠道
    const availableChannels = await this.prisma.channel.findMany({
      where: {
        isActive: true,
        status: ChannelStatus.ACTIVE,
        deletedAt: null,
        // 不在限流中
        OR: [
          { rateLimitEndAt: null },
          { rateLimitEndAt: { lte: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'asc' },      // 优先级排序
        { lastUsedAt: 'asc' },    // 最久未使用优先
      ],
    });

    if (availableChannels.length === 0) {
      throw new BadRequestException('No available Claude channels');
    }

    // 选择第一个渠道
    const selectedChannel = availableChannels[0];

    // 更新最后使用时间
    await this.prisma.channel.update({
      where: { id: selectedChannel.id },
      data: { lastUsedAt: new Date() },
    });

    return selectedChannel;
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
  }

  /**
   * 恢复渠道为正常状态
   */
  async restoreChannel(channelId: string) {
    await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        status: ChannelStatus.ACTIVE,
        rateLimitEndAt: null,
      },
    });
  }

  /**
   * 获取会话统计（用于监控）
   */
  async getSessionStats() {
    return await this.sessionStorage.getStats();
  }
}
