import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { Channel, ChannelStatus, ChannelTargetType } from '@prisma/client';
import { SessionHashService } from './session-hash.service';
import { ISessionStorageService } from './session-storage/session-storage.interface';
import { SESSION_STORAGE_SERVICE } from '../constants';
import { ApiKeyInfo, ClaudeMessagesRequest } from '../interfaces/claude-api.interface';
import { ChannelPoolCacheService } from './channel-pool-cache.service';
import { ChannelErrorTrackerService } from './channel-error-tracker.service';

@Injectable()
export class ClaudeChannelSelectorService {
  private readonly logger = new Logger(ClaudeChannelSelectorService.name);

  constructor(
    private prisma: PrismaService,
    private sessionHashService: SessionHashService,
    private channelPoolCache: ChannelPoolCacheService,
    private errorTracker: ChannelErrorTrackerService,
    @Inject(SESSION_STORAGE_SERVICE) private sessionStorage: ISessionStorageService
  ) {}

  /**
   * 为 API Key 选择可用的 Claude 渠道（支持 Sticky Session）
   */
  async selectChannel(apiKey: ApiKeyInfo, requestBody: ClaudeMessagesRequest): Promise<Channel> {
    // 1. 生成会话哈希
    const sessionHash = this.generateSessionHash(requestBody);

    // 2. 获取候选渠道列表（用于验证粘性会话）
    const candidateChannels = await this.getCandidateChannels(apiKey);

    if (candidateChannels.length === 0) {
      throw new BadRequestException('No available channels for this API Key');
    }

    // 3. 如果有会话哈希，尝试使用 Sticky Session
    if (sessionHash) {
      const stickyChannel = await this.tryGetStickyChannel(
        sessionHash,
        apiKey.id,
        candidateChannels
      );

      if (stickyChannel) {
        this.logger.log(`✅ Sticky session hit: ${sessionHash} → ${stickyChannel.name}`);

        // 更新映射（增加请求计数）
        await this.sessionStorage.updateMapping(sessionHash);

        // 自动续期
        await this.sessionStorage.renewMapping(sessionHash);

        // 异步更新最后使用时间
        this.prisma.channel
          .update({
            where: { id: stickyChannel.id },
            data: { lastUsedAt: new Date() },
          })
          .catch((error) => {
            this.logger.error(`Failed to update channel lastUsedAt: ${error.message}`);
          });

        return stickyChannel;
      }
    }

    // 4. 没有 Sticky Session 或映射的渠道不可用，选择新渠道
    const newChannel = this.selectLeastRecentlyUsed(candidateChannels);

    // 5. 建立新的会话映射
    if (sessionHash) {
      await this.sessionStorage.setMapping(sessionHash, newChannel.id, apiKey.id);
      this.logger.log(`🆕 Created sticky session: ${sessionHash} → ${newChannel.name}`);
    }

    // 6. 异步更新最后使用时间
    this.prisma.channel
      .update({
        where: { id: newChannel.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((error) => {
        this.logger.error(`Failed to update channel lastUsedAt: ${error.message}`);
      });

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
   * 尝试获取 Sticky Session 对应的渠道（验证是否在候选列表中）
   */
  private async tryGetStickyChannel(
    sessionHash: string,
    apiKeyId: string,
    candidateChannels: Channel[]
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

      // 检查粘性会话的渠道是否在候选列表中
      const stickyChannel = candidateChannels.find(
        (ch) => ch.id === mapping.channelId
      );

      if (!stickyChannel) {
        // 渠道不在候选列表中（可能被移出分组）
        this.logger.warn(`⚠️ Sticky channel not in candidate list: ${mapping.channelId}`);
        await this.sessionStorage.deleteMapping(sessionHash);
        return null;
      }

      // 检查渠道是否可用
      if (!this.isChannelAvailable(stickyChannel)) {
        this.logger.warn(`⚠️ Sticky channel not available: ${stickyChannel.name}`);

        // 如果是限流且已过期，尝试恢复
        if (
          stickyChannel.status === ChannelStatus.RATE_LIMITED &&
          stickyChannel.rateLimitEndAt &&
          new Date() > stickyChannel.rateLimitEndAt
        ) {
          await this.restoreChannel(stickyChannel.id);
          return stickyChannel;
        }

        // 删除映射，让用户使用其他渠道
        await this.sessionStorage.deleteMapping(sessionHash);
        return null;
      }

      return stickyChannel;
    } catch (error) {
      this.logger.error(`❌ Failed to get sticky channel: ${error.message}`);
      return null;
    }
  }


  /**
   * 根据 API Key 的 targetType 获取候选渠道列表
   */
  private async getCandidateChannels(apiKey: ApiKeyInfo): Promise<Channel[]> {
    const targetType = apiKey.channelTargetType || ChannelTargetType.CHANNEL;

    switch (targetType) {
      case ChannelTargetType.CHANNEL:
        return this.getChannelById(apiKey.channelId);

      case ChannelTargetType.PROVIDER:
        // 优先使用专属渠道（如果指定）
        if (apiKey.channelId) {
          this.logger.debug(
            `Using dedicated channel ${apiKey.channelId} for API Key ${apiKey.id} (PROVIDER mode)`
          );
          return this.getChannelById(apiKey.channelId);
        }
        // 否则从供货商渠道池中选择
        return this.getChannelsByProvider(apiKey.providerId);

      default:
        this.logger.error(`Unknown channel target type: ${targetType}`);
        return [];
    }
  }

  /**
   * 获取单个渠道（CHANNEL模式）
   */
  private async getChannelById(channelId?: string): Promise<Channel[]> {
    if (!channelId) {
      // 如果没有指定渠道，从缓存池获取
      const channel = await this.channelPoolCache.getChannel();
      return channel ? [channel] : [];
    }

    // 从缓存池获取指定渠道
    const channel = await this.channelPoolCache.getChannel(channelId);
    return channel ? [channel] : [];
  }

  /**
   * 获取供货商下的所有可用渠道（PROVIDER模式 - 按LRU排序）
   */
  private async getChannelsByProvider(providerId?: string): Promise<Channel[]> {
    if (!providerId) {
      this.logger.warn('Provider ID is required for PROVIDER target type');
      return [];
    }

    try {
      const channels = await this.prisma.channel.findMany({
        where: {
          providerId,
          deletedAt: null,
          isActive: true,
          status: ChannelStatus.ACTIVE,
        },
        orderBy: [
          { lastUsedAt: 'asc' },  // 最久未使用优先
          { priority: 'asc' },    // 次按优先级
        ],
      });

      this.logger.debug(`Found ${channels.length} channels for provider ${providerId}`);
      return channels;
    } catch (error) {
      this.logger.error(`Failed to get channels by provider: ${error.message}`);
      return [];
    }
  }

  /**
   * 选择最久未使用的渠道（LRU策略）
   */
  private selectLeastRecentlyUsed(candidates: Channel[]): Channel {
    // 候选渠道已按 lastUsedAt 升序排列
    // 选择第一个可用的渠道
    for (const channel of candidates) {
      if (this.isChannelAvailable(channel)) {
        this.logger.log(`📍 Selected channel (LRU): ${channel.name}`);
        return channel;
      }
      this.logger.warn(`⚠️ Channel ${channel.name} not available, trying next...`);
    }

    // 如果所有候选渠道都不可用
    throw new BadRequestException(
      `All ${candidates.length} candidate channels are unavailable`
    );
  }

  /**
   * 检查渠道是否可用
   */
  private isChannelAvailable(channel: Channel): boolean {
    // 基本状态检查
    if (!channel.isActive) {
      return false;
    }

    if (channel.status !== ChannelStatus.ACTIVE) {
      // 检查限流是否已过期
      if (
        channel.status === ChannelStatus.RATE_LIMITED &&
        channel.rateLimitEndAt &&
        new Date() > channel.rateLimitEndAt
      ) {
        return true;  // 限流已过期，可以尝试使用
      }
      return false;
    }

    // 检查错误计数（连续错误过多则跳过）
    const MAX_ERROR_COUNT = 5;
    if (channel.errorCount >= MAX_ERROR_COUNT) {
      return false;
    }

    return true;
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
   * 标记渠道为永久性错误状态（401/403）
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
    // 清除错误计数
    this.errorTracker.clearErrors(channelId);
    this.logger.log(`Channel ${channelId} marked as ERROR (permanent) and removed from cache`);
  }

  /**
   * 标记渠道为临时错误状态（5xx）
   * @param channelId 渠道 ID
   * @param errorCount 当前错误次数
   */
  async markChannelTempError(channelId: string, errorCount: number) {
    await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        status: ChannelStatus.TEMP_ERROR,
        lastErrorAt: new Date(),
        errorCount,
      },
    });

    // 从缓存池中移除该渠道
    this.channelPoolCache.markChannelUnavailable(channelId);
    this.logger.warn(
      `Channel ${channelId} marked as TEMP_ERROR (${errorCount} errors) and removed from cache`
    );
  }

  /**
   * 记录 5xx 服务器错误
   * @param channelId 渠道 ID
   * @returns 是否超过阈值需要标记为 TEMP_ERROR
   */
  async recordServerError(channelId: string): Promise<boolean> {
    const errorCount = this.errorTracker.recordServerError(channelId);
    const exceedsThreshold = this.errorTracker.exceedsThreshold(channelId);

    if (exceedsThreshold) {
      await this.markChannelTempError(channelId, errorCount);
      return true;
    }

    return false;
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
