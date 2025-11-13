import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * 请求日志记录
 */
export interface RequestLogRecord {
  apiKeyId: string;
  userId: string;
  channelId?: string;
  requestId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  duration: number;
  timeToFirstToken?: number;
  cost: number;
  statusCode: number;
  success: boolean;
  errorMessage?: string;
  errorType?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * 队列统计
 */
export interface RequestLogQueueStats {
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
 * API Key 详细请求日志批量队列服务
 *
 * 功能:
 * - 内存缓冲区批量写入（不聚合，记录每条详细日志）
 * - 定时刷新（默认 3 秒）
 * - 达到批次大小立即刷新
 * - 服务关闭时自动刷新剩余数据
 * - 失败重试机制
 */
@Injectable()
export class RequestLogQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RequestLogQueueService.name);

  // 内存缓冲区
  private buffer: RequestLogRecord[] = [];

  // 配置参数
  private readonly BATCH_SIZE = 50; // 达到 50 条立即刷新
  private readonly FLUSH_INTERVAL_MS = 3000; // 3 秒定时刷新
  private readonly MAX_BUFFER_SIZE = 500; // 最大缓冲区大小
  private readonly INSERT_BATCH_SIZE = 20; // 每批插入 20 条
  private readonly MAX_RETRIES = 3; // 最大重试次数
  private readonly RETRY_DELAY_MS = 3000; // 重试延迟 3 秒

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
  private failedRecords: RequestLogRecord[] = [];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 模块初始化：启动定时刷新
   */
  onModuleInit() {
    this.logger.log('Request Log Queue Service initialized');
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

    this.logger.log('Request Log Queue Service destroyed');
  }

  /**
   * 入队请求日志记录（不阻塞）
   *
   * @param record - 请求日志记录
   */
  async enqueue(record: RequestLogRecord): Promise<void> {
    // 检查缓冲区是否已满
    if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
      this.logger.warn(`Buffer is full (${this.MAX_BUFFER_SIZE}), triggering async flush`);

      // 异步刷新，不等待（避免阻塞请求）
      this.flush().catch((error) => {
        this.logger.error(`Forced flush failed: ${error.message}`);
      });

      // 如果已经在刷新，则拒绝新记录避免内存溢出
      if (this.isFlushing) {
        throw new Error('Request log queue is full and flushing, please try again later');
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

      this.logger.log(`Flushing ${recordsToFlush.length} request log records...`);

      // 批量插入（分批事务）
      await this.batchInsert(recordsToFlush);

      // 成功后才清空 buffer
      this.buffer.splice(0, recordsToFlush.length);
      this.stats.totalFlushed += recordsToFlush.length;
      this.stats.totalBatches++;
      this.stats.lastFlushTime = new Date();
      this.retryCount = 0; // 重置重试计数

      this.logger.log(`✅ Flushed ${recordsToFlush.length} request log records`);
    } catch (error) {
      this.logger.error(`❌ Failed to flush request log records: ${error.message}`, error.stack);

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
        // this.alertService.sendAlert('Request log queue data loss risk');
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * 批量插入到数据库（分批事务，避免大事务）
   *
   * @param records - 请求日志记录
   */
  private async batchInsert(records: RequestLogRecord[]): Promise<void> {
    // 分批处理，避免单个事务过大
    for (let i = 0; i < records.length; i += this.INSERT_BATCH_SIZE) {
      const batch = records.slice(i, i + this.INSERT_BATCH_SIZE);

      try {
        // 转换为 Prisma 创建格式
        const createData = batch.map((record) => ({
          apiKeyId: record.apiKeyId,
          userId: record.userId,
          channelId: record.channelId,
          requestId: record.requestId,
          model: record.model,
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
          cacheCreationInputTokens: record.cacheCreationInputTokens,
          cacheReadInputTokens: record.cacheReadInputTokens,
          duration: record.duration,
          timeToFirstToken: record.timeToFirstToken,
          cost: new Prisma.Decimal(record.cost),
          statusCode: record.statusCode,
          success: record.success,
          errorMessage: record.errorMessage,
          errorType: record.errorType,
          ipAddress: record.ipAddress,
          userAgent: record.userAgent,
          createdAt: record.timestamp,
          metadata: record.metadata as Prisma.InputJsonValue,
        }));

        // 使用 createMany 批量插入
        await this.prisma.apiKeyRequestLog.createMany({
          data: createData,
          skipDuplicates: true, // 跳过重复的 requestId
        });
      } catch (error) {
        this.logger.error(
          `Failed to insert batch ${i}-${i + this.INSERT_BATCH_SIZE}: ${error.message}`
        );
        // 单个批次失败，重新抛出错误以触发整体重试
        throw error;
      }
    }
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
  getStats(): RequestLogQueueStats {
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
    this.logger.log('Request log queue stats reset');
  }

  /**
   * 清空缓冲区（慎用！会丢失未刷新的数据）
   */
  clearBuffer(): void {
    const size = this.buffer.length;
    this.buffer = [];
    this.logger.warn(`Request log buffer cleared (${size} records discarded)`);
  }
}
