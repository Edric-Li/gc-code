import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { UsageQueueService, UsageRecord } from './usage-queue.service';
import { RequestLogQueueService, RequestLogRecord } from './request-log-queue.service';
import { PricingService, UsageData } from './pricing.service';

/**
 * API Key 用量追踪服务
 * 负责记录和聚合 API Key 的使用情况
 * 使用批量队列优化性能
 */
@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(
    private prisma: PrismaService,
    private usageQueue: UsageQueueService,
    private requestLogQueue: RequestLogQueueService,
    private pricingService: PricingService
  ) {}

  /**
   * 记录API请求用量（使用批量队列）
   * @param apiKeyId API Key ID
   * @param userId 用户 ID
   * @param inputTokens 输入Token数
   * @param outputTokens 输出Token数
   * @param success 是否成功
   * @param cost 费用（可选）
   */
  async recordUsage(params: {
    apiKeyId: string;
    userId: string;
    inputTokens: number;
    outputTokens: number;
    success: boolean;
    cost?: number;
  }): Promise<void> {
    const { apiKeyId, userId, inputTokens, outputTokens, success, cost = 0 } = params;

    try {
      const totalTokens = inputTokens + outputTokens;

      // 构建用量记录
      const usageRecord: UsageRecord = {
        apiKeyId,
        userId,
        inputTokens,
        outputTokens,
        success,
        cost,
        timestamp: new Date(),
      };

      // 入队（异步批量写入，不阻塞）
      await this.usageQueue.enqueue(usageRecord);

      this.logger.debug(
        `Enqueued usage for API Key ${apiKeyId.substring(0, 8)}...: ${totalTokens} tokens, success: ${success}`
      );
    } catch (error) {
      // 记录失败不应该影响主流程
      this.logger.error(`Failed to enqueue usage: ${error.message}`);
    }
  }

  /**
   * 记录详细的请求日志（使用批量队列）
   * @param params 请求日志参数
   */
  async recordRequestLog(params: {
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
  }): Promise<void> {
    try {
      // 验证 cost 参数
      let validatedCost = params.cost;
      if (!isFinite(validatedCost) || validatedCost < 0) {
        this.logger.warn(
          `Invalid cost value: ${params.cost} for request ${params.requestId}, using 0`
        );
        validatedCost = 0;
      }

      // 构建请求日志记录
      const logRecord: RequestLogRecord = {
        ...params,
        cost: validatedCost,
        timestamp: new Date(),
      };

      // 入队（异步批量写入，不阻塞）
      await this.requestLogQueue.enqueue(logRecord);

      this.logger.debug(
        `Enqueued request log for API Key ${params.apiKeyId.substring(0, 8)}...: ` +
          `model=${params.model}, tokens=${params.inputTokens + params.outputTokens}, ` +
          `duration=${params.duration}ms, success=${params.success}`
      );
    } catch (error) {
      // 记录失败不应该影响主流程
      this.logger.error(`Failed to enqueue request log: ${error.message}`);
    }
  }

  /**
   * 获取某天的开始时间 (00:00:00.000)
   */
  private getDayStart(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * 获取某天的结束时间 (23:59:59.999)
   */
  private getDayEnd(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * 计算费用（使用动态定价服务）
   * 支持 Prompt Caching、长上下文定价等高级特性
   * 价格自动从 LiteLLM 仓库同步
   */
  calculateCost(params: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens?: number;
    cacheReadTokens?: number;
    cacheCreation?: {
      ephemeral_5m_input_tokens?: number;
      ephemeral_1h_input_tokens?: number;
    };
  }): number {
    const {
      model,
      inputTokens,
      outputTokens,
      cacheCreationTokens,
      cacheReadTokens,
      cacheCreation,
    } = params;

    // 构建用量数据
    const usage: UsageData = {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cache_creation_input_tokens: cacheCreationTokens,
      cache_read_input_tokens: cacheReadTokens,
      cache_creation: cacheCreation,
    };

    // 使用 PricingService 计算费用
    const costCalc = this.pricingService.calculateCost(usage, model);

    if (!costCalc.hasPricing) {
      this.logger.warn(`No pricing data for model: ${model}, cost calculation may be inaccurate`);
    }

    // 记录详细费用信息（仅在 debug 模式）
    if (costCalc.cacheCreateCost > 0 || costCalc.cacheReadCost > 0) {
      this.logger.debug(
        `Cost breakdown for ${model}: ` +
          `input=$${costCalc.inputCost.toFixed(6)}, ` +
          `output=$${costCalc.outputCost.toFixed(6)}, ` +
          `cache_write=$${costCalc.cacheCreateCost.toFixed(6)}, ` +
          `cache_read=$${costCalc.cacheReadCost.toFixed(6)}, ` +
          `total=$${costCalc.totalCost.toFixed(6)}`
      );
    }

    return costCalc.totalCost;
  }
}
