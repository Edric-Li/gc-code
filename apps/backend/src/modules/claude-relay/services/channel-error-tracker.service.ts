import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * 渠道错误追踪服务（内存实现，优化版）
 *
 * 功能:
 * - 追踪渠道的 5xx 错误次数（5分钟滑动窗口）
 * - 定时批量清理过期数据（避免大量 setTimeout）
 * - 用于判断是否需要将渠道标记为临时错误状态
 *
 * 性能优化:
 * - 使用 Cron 定时任务批量清理，替代为每个错误创建 setTimeout
 * - 减少内存占用和 CPU 开销
 */
@Injectable()
export class ChannelErrorTrackerService {
  private readonly logger = new Logger(ChannelErrorTrackerService.name);

  // 错误计数存储：Map<channelId, { count: number, expiresAt: number }>
  private errorCounts = new Map<
    string,
    {
      count: number;
      expiresAt: number;
    }
  >();

  // 配置参数
  private readonly ERROR_WINDOW_MS = 5 * 60 * 1000; // 5分钟时间窗口
  private readonly ERROR_THRESHOLD = 3; // 错误阈值
  private readonly CLEANUP_INTERVAL = CronExpression.EVERY_MINUTE; // 每分钟清理一次

  /**
   * 记录一次 5xx 错误
   * @param channelId 渠道 ID
   * @returns 当前错误次数
   */
  recordServerError(channelId: string): number {
    const now = Date.now();
    const existing = this.errorCounts.get(channelId);

    if (existing && existing.expiresAt > now) {
      // 时间窗口内，累加计数
      existing.count++;
      this.logger.debug(
        `Channel ${channelId} server error count: ${existing.count}/${this.ERROR_THRESHOLD}`
      );
      return existing.count;
    } else {
      // 新的时间窗口，重置计数
      this.errorCounts.set(channelId, {
        count: 1,
        expiresAt: now + this.ERROR_WINDOW_MS,
      });
      this.logger.debug(`Channel ${channelId} server error count: 1/${this.ERROR_THRESHOLD}`);

      return 1;
    }
  }

  /**
   * 获取当前错误次数
   * @param channelId 渠道 ID
   * @returns 错误次数（如果已过期或不存在则返回 0）
   */
  getServerErrorCount(channelId: string): number {
    const now = Date.now();
    const existing = this.errorCounts.get(channelId);

    if (existing && existing.expiresAt > now) {
      return existing.count;
    }

    return 0;
  }

  /**
   * 检查是否超过错误阈值
   * @param channelId 渠道 ID
   * @returns 是否超过阈值
   */
  exceedsThreshold(channelId: string): boolean {
    return this.getServerErrorCount(channelId) >= this.ERROR_THRESHOLD;
  }

  /**
   * 清除渠道的错误计数
   * @param channelId 渠道 ID
   */
  clearErrors(channelId: string): void {
    if (this.errorCounts.delete(channelId)) {
      this.logger.debug(`Cleared error count for channel ${channelId}`);
    }
  }

  /**
   * 定时任务：批量清理已过期的错误计数
   * 每分钟执行一次，避免使用大量 setTimeout
   */
  @Cron(CronExpression.EVERY_MINUTE)
  private cleanupExpiredErrors(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // 遍历所有错误计数，删除已过期的
    for (const [channelId, data] of this.errorCounts.entries()) {
      if (data.expiresAt <= now) {
        this.errorCounts.delete(channelId);
        cleanedCount++;
        this.logger.debug(`Auto-cleaned expired error count for channel ${channelId}`);
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(
        `Cleaned ${cleanedCount} expired error records (total tracked: ${this.errorCounts.size})`
      );
    }
  }

  /**
   * 获取所有错误统计（用于监控）
   */
  getStats() {
    const now = Date.now();
    const activeErrors: Array<{ channelId: string; count: number; expiresIn: number }> = [];

    for (const [channelId, data] of this.errorCounts.entries()) {
      if (data.expiresAt > now) {
        activeErrors.push({
          channelId,
          count: data.count,
          expiresIn: Math.round((data.expiresAt - now) / 1000), // 秒
        });
      }
    }

    return {
      totalTrackedChannels: activeErrors.length,
      errorThreshold: this.ERROR_THRESHOLD,
      errorWindowSeconds: this.ERROR_WINDOW_MS / 1000,
      activeErrors,
    };
  }

  /**
   * 清除所有错误计数（用于测试或重置）
   */
  clearAll(): void {
    const size = this.errorCounts.size;
    this.errorCounts.clear();
    this.logger.log(`Cleared all error counts (${size} channels)`);
  }
}
