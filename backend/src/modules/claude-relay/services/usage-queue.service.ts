import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * 用量记录
 */
export interface UsageRecord {
  apiKeyId: string;
  userId: string;
  inputTokens: number;
  outputTokens: number;
  success: boolean;
  cost: number;
  model?: string;
  timestamp: Date;
}

/**
 * 聚合后的用量记录（按 keyId + periodStart 分组）
 */
interface AggregatedUsage {
  keyId: string;
  userId: string;
  periodStart: Date;
  requestCount: number;
  successCount: number;
  failureCount: number;
  tokensUsed: number;
  cost: number;
  firstRequestAt: Date;
}

/**
 * 队列统计
 */
export interface QueueStats {
  bufferSize: number;
  maxBufferSize: number;
  totalEnqueued: number;
  totalFlushed: number;
  totalBatches: number;
  lastFlushTime: Date | null;
  failedRecordsCount: number;
  retryCount: number;
}

/**
 * 用量统计批量队列服务
 *
 * 功能:
 * - 内存缓冲区批量写入
 * - 按 (keyId, periodStart) 聚合，减少数据库冲突
 * - 定时刷新（默认 5 秒）
 * - 达到批次大小立即刷新
 * - 服务关闭时自动刷新剩余数据
 */
@Injectable()
export class UsageQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsageQueueService.name);

  // 内存缓冲区
  private buffer: UsageRecord[] = [];

  // 配置参数
  private readonly BATCH_SIZE = 100; // 达到 100 条立即刷新
  private readonly FLUSH_INTERVAL_MS = 5000; // 5 秒定时刷新
  private readonly MAX_BUFFER_SIZE = 1000; // 最大缓冲区大小（防止内存溢出）
  private readonly UPSERT_BATCH_SIZE = 10; // 每批 upsert 10 条（分批事务）
  private readonly MAX_RETRIES = 3; // 最大重试次数
  private readonly RETRY_DELAY_MS = 5000; // 重试延迟 5 秒

  // 统计数据
  private stats = {
    totalEnqueued: 0,
    totalFlushed: 0,
    totalBatches: 0,
    lastFlushTime: null as Date | null,
  };

  // 定时刷新任务
  private flushTimer?: NodeJS.Timeout;

  // 刷新锁（防止并发刷新）
  private isFlushing = false;

  // 重试计数
  private retryCount = 0;

  // 失败记录队列
  private failedRecords: UsageRecord[] = [];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 模块初始化：启动定时刷新
   */
  onModuleInit() {
    this.logger.log('Usage Queue Service initialized');
    this.startFlushTimer();
  }

  /**
   * 模块销毁：刷新剩余数据并停止定时器
   */
  async onModuleDestroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // 刷新剩余数据
    await this.flush();

    this.logger.log('Usage Queue Service destroyed');
  }

  /**
   * 入队用量记录（不阻塞）
   *
   * @param record - 用量记录
   */
  async enqueue(record: UsageRecord): Promise<void> {
    // 检查缓冲区是否已满
    if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
      this.logger.warn(`Buffer is full (${this.MAX_BUFFER_SIZE}), triggering async flush`);

      // 异步刷新，不等待（避免阻塞请求）
      this.flush().catch((error) => {
        this.logger.error(`Forced flush failed: ${error.message}`);
      });

      // 如果已经在刷新，则拒绝新记录避免内存溢出
      if (this.isFlushing) {
        throw new Error('Usage queue is full and flushing, please try again later');
      }
    }

    this.buffer.push(record);
    this.stats.totalEnqueued++;

    // 达到批次大小，立即刷新
    if (this.buffer.length >= this.BATCH_SIZE) {
      // 异步刷新，不等待
      this.flush().catch((error) => {
        this.logger.error(`Failed to flush on batch size: ${error.message}`);
      });
    }
  }

  /**
   * 批量刷新到数据库（带失败重试）
   */
  async flush(): Promise<void> {
    // 如果正在刷新或缓冲区为空，跳过
    if (this.isFlushing || this.buffer.length === 0) {
      return;
    }

    this.isFlushing = true;

    try {
      // 复制记录而不是移除（防止失败时数据丢失）
      const recordsToFlush = [...this.buffer];

      if (recordsToFlush.length === 0) {
        return;
      }

      this.logger.log(`Flushing ${recordsToFlush.length} usage records...`);

      // 聚合记录（按 keyId + periodStart）
      const aggregated = this.aggregateRecords(recordsToFlush);

      // 批量 upsert（分批事务）
      await this.batchUpsert(aggregated);

      // 成功后才清空 buffer
      this.buffer.splice(0, recordsToFlush.length);
      this.stats.totalFlushed += recordsToFlush.length;
      this.stats.totalBatches++;
      this.stats.lastFlushTime = new Date();
      this.retryCount = 0; // 重置重试计数

      this.logger.log(
        `✅ Flushed ${recordsToFlush.length} records (${aggregated.length} aggregated entries)`
      );
    } catch (error) {
      this.logger.error(`❌ Failed to flush usage records: ${error.message}`, error.stack);

      // 重试逻辑
      this.retryCount++;
      if (this.retryCount < this.MAX_RETRIES) {
        this.logger.warn(
          `Retry ${this.retryCount}/${this.MAX_RETRIES} in ${this.RETRY_DELAY_MS}ms`
        );
        setTimeout(() => {
          this.flush().catch((err) => {
            this.logger.error(`Retry flush failed: ${err.message}`);
          });
        }, this.RETRY_DELAY_MS);
      } else {
        // 达到最大重试次数，移动到失败队列
        const recordsToFail = this.buffer.splice(0, this.buffer.length);
        this.failedRecords.push(...recordsToFail);

        this.logger.fatal(
          `Max retries (${this.MAX_RETRIES}) reached, ${recordsToFail.length} records moved to failed queue (total failed: ${this.failedRecords.length})`
        );

        // 重置重试计数，允许处理新数据
        this.retryCount = 0;

        // TODO: 可以在这里发送告警通知
        // this.alertService.sendAlert('Usage queue data loss risk');
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * 聚合用量记录（按 keyId + periodStart 分组）
   *
   * @param records - 原始用量记录
   * @returns 聚合后的用量记录
   */
  private aggregateRecords(records: UsageRecord[]): AggregatedUsage[] {
    const map = new Map<string, AggregatedUsage>();

    for (const record of records) {
      // 获取当天的 00:00:00 作为 periodStart
      const periodStart = this.getDayStart(record.timestamp);
      const key = `${record.apiKeyId}-${periodStart.toISOString()}`;

      if (!map.has(key)) {
        // 初始化聚合记录
        map.set(key, {
          keyId: record.apiKeyId,
          userId: record.userId,
          periodStart,
          requestCount: 0,
          successCount: 0,
          failureCount: 0,
          tokensUsed: 0,
          cost: 0,
          firstRequestAt: record.timestamp,
        });
      }

      const aggregated = map.get(key)!;

      // 累加统计
      aggregated.requestCount++;
      if (record.success) {
        aggregated.successCount++;
      } else {
        aggregated.failureCount++;
      }
      aggregated.tokensUsed += record.inputTokens + record.outputTokens;
      aggregated.cost += record.cost;

      // 更新第一次请求时间（取最早）
      if (record.timestamp < aggregated.firstRequestAt) {
        aggregated.firstRequestAt = record.timestamp;
      }
    }

    return Array.from(map.values());
  }

  /**
   * 批量 upsert 到数据库（分批事务，避免大事务）
   *
   * @param aggregatedRecords - 聚合后的用量记录
   */
  private async batchUpsert(aggregatedRecords: AggregatedUsage[]): Promise<void> {
    // 分批处理，避免单个事务过大
    for (let i = 0; i < aggregatedRecords.length; i += this.UPSERT_BATCH_SIZE) {
      const batch = aggregatedRecords.slice(i, i + this.UPSERT_BATCH_SIZE);

      try {
        await this.prisma.$transaction(
          batch.map((record) =>
            this.prisma.apiKeyUsage.upsert({
              where: {
                keyId_periodStart: {
                  keyId: record.keyId,
                  periodStart: record.periodStart,
                },
              },
              update: {
                requestCount: { increment: record.requestCount },
                successCount: { increment: record.successCount },
                failureCount: { increment: record.failureCount },
                tokensUsed: { increment: record.tokensUsed },
                cost: { increment: new Prisma.Decimal(record.cost) },
                periodEnd: new Date(), // 更新结束时间
                updatedAt: new Date(),
              },
              create: {
                keyId: record.keyId,
                userId: record.userId,
                periodStart: record.periodStart,
                periodEnd: new Date(),
                requestCount: record.requestCount,
                successCount: record.successCount,
                failureCount: record.failureCount,
                tokensUsed: record.tokensUsed,
                cost: new Prisma.Decimal(record.cost),
                metadata: {
                  firstRequestAt: record.firstRequestAt.toISOString(),
                },
              },
            })
          )
        );
      } catch (error) {
        this.logger.error(
          `Failed to upsert batch ${i}-${i + this.UPSERT_BATCH_SIZE}: ${error.message}`
        );
        // 单个批次失败，重新抛出错误以触发整体重试
        throw error;
      }
    }
  }

  /**
   * 获取指定日期的当天 00:00:00
   */
  private getDayStart(date: Date): Date {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    return dayStart;
  }

  /**
   * 启动定时刷新任务
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      await this.flush();
    }, this.FLUSH_INTERVAL_MS);

    this.logger.log(`Flush timer started (interval: ${this.FLUSH_INTERVAL_MS}ms)`);
  }

  /**
   * 获取队列统计信息
   */
  getStats(): QueueStats {
    return {
      bufferSize: this.buffer.length,
      maxBufferSize: this.MAX_BUFFER_SIZE,
      totalEnqueued: this.stats.totalEnqueued,
      totalFlushed: this.stats.totalFlushed,
      totalBatches: this.stats.totalBatches,
      lastFlushTime: this.stats.lastFlushTime,
      failedRecordsCount: this.failedRecords.length,
      retryCount: this.retryCount,
    };
  }

  /**
   * 重置统计数据
   */
  resetStats(): void {
    this.stats = {
      totalEnqueued: 0,
      totalFlushed: 0,
      totalBatches: 0,
      lastFlushTime: null,
    };
    this.logger.log('Queue stats reset');
  }

  /**
   * 清空缓冲区（慎用！会丢失未刷新的数据）
   */
  clearBuffer(): void {
    const size = this.buffer.length;
    this.buffer = [];
    this.logger.warn(`Buffer cleared (${size} records discarded)`);
  }
}
