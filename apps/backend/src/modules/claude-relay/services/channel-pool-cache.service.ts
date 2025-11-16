import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { Channel, ChannelStatus } from '@prisma/client';

/**
 * 渠道池统计
 */
export interface PoolStats {
  totalChannels: number;
  activeChannels: number;
  lastRefreshTime: Date | null;
  cacheHits: number;
  cacheRefreshes: number;
}

/**
 * 渠道池内存缓存服务
 *
 * 功能:
 * - 缓存所有可用渠道，避免每次请求都查数据库
 * - 定时刷新渠道池（默认 1 分钟）
 * - 支持主动失效特定渠道
 * - 本地负载均衡（按优先级和最后使用时间）
 * - 支持渠道状态变更时的实时更新
 */
@Injectable()
export class ChannelPoolCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChannelPoolCacheService.name);

  // 缓存的可用渠道池
  private availableChannels: Channel[] = [];

  // 配置参数
  private readonly REFRESH_INTERVAL_MS = 60 * 1000; // 1 分钟刷新一次
  private readonly FORCE_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 分钟强制刷新

  // 统计数据
  private lastRefreshTime: number | null = null;
  private stats = {
    cacheHits: 0,
    cacheRefreshes: 0,
  };

  // 定时刷新任务
  private refreshTimer?: NodeJS.Timeout;

  // 轮询索引（用于负载均衡）
  private roundRobinIndex = 0;

  // 刷新锁和 Promise（防止并发刷新）
  private isRefreshing = false;
  private refreshPromise?: Promise<void>;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 模块初始化：立即加载渠道池并启动定时刷新
   */
  async onModuleInit() {
    this.logger.log('Channel Pool Cache Service initializing...');
    await this.refresh();
    this.startRefreshTimer();
  }

  /**
   * 模块销毁：停止定时刷新任务
   */
  onModuleDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    this.logger.log('Channel Pool Cache Service destroyed');
  }

  /**
   * 获取一个可用渠道（带负载均衡）
   *
   * @param bindChannelId - 如果指定，则返回绑定的渠道（不进行负载均衡）
   * @returns 可用渠道，如果没有可用渠道则返回 null
   */
  async getChannel(bindChannelId?: string): Promise<Channel | null> {
    // 如果缓存过期或为空，强制刷新
    if (this.shouldForceRefresh()) {
      await this.refresh();
    }

    // 如果指定了绑定渠道，直接返回
    if (bindChannelId) {
      const channel = this.availableChannels.find((c) => c.id === bindChannelId);
      if (channel) {
        this.stats.cacheHits++;
        return channel;
      }
      // 绑定渠道不在缓存中，从数据库查询
      return await this.getChannelFromDb(bindChannelId);
    }

    // 从池中选择渠道
    if (this.availableChannels.length === 0) {
      this.logger.warn('No available channels in pool');
      return null;
    }

    this.stats.cacheHits++;
    return this.selectChannelWithLoadBalancing();
  }

  /**
   * 获取所有可用渠道
   */
  getAvailableChannels(): Channel[] {
    return [...this.availableChannels];
  }

  /**
   * 从数据库查询指定渠道（用于绑定渠道场景）
   */
  private async getChannelFromDb(channelId: string): Promise<Channel | null> {
    try {
      return await this.prisma.channel.findFirst({
        where: {
          id: channelId,
          isActive: true,
          status: ChannelStatus.ACTIVE,
          deletedAt: null,
          OR: [{ rateLimitEndAt: null }, { rateLimitEndAt: { lte: new Date() } }],
        },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch channel ${channelId} from database: ${error.message}`);
      return null;
    }
  }

  /**
   * 负载均衡选择渠道
   *
   * 策略：
   * 1. 按优先级分组
   * 2. 优先级最高的组内使用 Round-robin
   */
  private selectChannelWithLoadBalancing(): Channel {
    if (this.availableChannels.length === 1) {
      return this.availableChannels[0];
    }

    // 按优先级分组
    const priorityGroups = new Map<number, Channel[]>();
    for (const channel of this.availableChannels) {
      const priority = channel.priority;
      if (!priorityGroups.has(priority)) {
        priorityGroups.set(priority, []);
      }
      priorityGroups.get(priority)!.push(channel);
    }

    // 获取最高优先级组（priority 值最小）
    const minPriority = Math.min(...Array.from(priorityGroups.keys()));
    const topPriorityChannels = priorityGroups.get(minPriority)!;

    // 在最高优先级组内 Round-robin（周期性重置索引，避免溢出）
    const selectedChannel = topPriorityChannels[this.roundRobinIndex % topPriorityChannels.length];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % topPriorityChannels.length;

    return selectedChannel;
  }

  /**
   * 刷新渠道池（从数据库加载，防止并发刷新）
   */
  async refresh(): Promise<void> {
    // 如果已经在刷新，等待现有的刷新完成
    if (this.isRefreshing && this.refreshPromise) {
      this.logger.debug('Waiting for existing refresh to complete');
      return this.refreshPromise;
    }

    // 标记为正在刷新
    this.isRefreshing = true;

    // 创建刷新 Promise
    this.refreshPromise = this._doRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = undefined;
    }
  }

  /**
   * 执行实际的刷新操作
   */
  private async _doRefresh(): Promise<void> {
    try {
      const channels = await this.prisma.channel.findMany({
        where: {
          isActive: true,
          status: ChannelStatus.ACTIVE,
          deletedAt: null,
          OR: [{ rateLimitEndAt: null }, { rateLimitEndAt: { lte: new Date() } }],
        },
        orderBy: [{ priority: 'asc' }, { lastUsedAt: 'asc' }],
      });

      this.availableChannels = channels;
      this.lastRefreshTime = Date.now();
      this.stats.cacheRefreshes++;

      this.logger.log(`Channel pool refreshed: ${channels.length} channels available`);
    } catch (error) {
      this.logger.error(`Failed to refresh channel pool: ${error.message}`);
      throw error; // 重新抛出错误，让调用者知道刷新失败
    }
  }

  /**
   * 标记渠道为不可用（从池中移除）
   *
   * @param channelId - 渠道 ID
   */
  markChannelUnavailable(channelId: string): void {
    const beforeSize = this.availableChannels.length;
    this.availableChannels = this.availableChannels.filter((c) => c.id !== channelId);

    if (this.availableChannels.length < beforeSize) {
      this.logger.log(`Channel ${channelId} marked as unavailable and removed from pool`);
    }
  }

  /**
   * 主动添加或更新渠道
   *
   * @param channel - 渠道对象
   */
  upsertChannel(channel: Channel): void {
    const index = this.availableChannels.findIndex((c) => c.id === channel.id);

    if (index >= 0) {
      // 更新现有渠道
      this.availableChannels[index] = channel;
      this.logger.debug(`Channel ${channel.id} updated in pool`);
    } else {
      // 添加新渠道
      this.availableChannels.push(channel);
      // 重新排序
      this.availableChannels.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.lastUsedAt.getTime() - b.lastUsedAt.getTime();
      });
      this.logger.debug(`Channel ${channel.id} added to pool`);
    }
  }

  /**
   * 判断是否需要强制刷新
   */
  private shouldForceRefresh(): boolean {
    // 如果从未刷新过
    if (this.lastRefreshTime === null) {
      return true;
    }

    // 如果池为空
    if (this.availableChannels.length === 0) {
      return true;
    }

    // 如果超过强制刷新阈值
    const now = Date.now();
    if (now - this.lastRefreshTime > this.FORCE_REFRESH_THRESHOLD_MS) {
      this.logger.warn('Channel pool cache expired, forcing refresh');
      return true;
    }

    return false;
  }

  /**
   * 启动定时刷新任务
   */
  private startRefreshTimer(): void {
    this.refreshTimer = setInterval(async () => {
      await this.refresh();
    }, this.REFRESH_INTERVAL_MS);

    this.logger.log(`Refresh timer started (interval: ${this.REFRESH_INTERVAL_MS}ms)`);
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): PoolStats {
    return {
      totalChannels: this.availableChannels.length,
      activeChannels: this.availableChannels.filter((c) => c.status === ChannelStatus.ACTIVE)
        .length,
      lastRefreshTime: this.lastRefreshTime ? new Date(this.lastRefreshTime) : null,
      cacheHits: this.stats.cacheHits,
      cacheRefreshes: this.stats.cacheRefreshes,
    };
  }

  /**
   * 重置统计数据
   */
  resetStats(): void {
    this.stats = {
      cacheHits: 0,
      cacheRefreshes: 0,
    };
    this.logger.log('Pool stats reset');
  }

  /**
   * 清空渠道池
   */
  clear(): void {
    const size = this.availableChannels.length;
    this.availableChannels = [];
    this.logger.log(`Channel pool cleared (${size} channels removed)`);
  }
}
