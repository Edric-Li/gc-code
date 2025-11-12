import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * API Key 用量追踪服务
 * 负责记录和聚合 API Key 的使用情况
 */
@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 记录API请求用量
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
      // 计算当前时间的周期（按天聚合）
      const now = new Date();
      const periodStart = this.getDayStart(now);
      const periodEnd = this.getDayEnd(now);

      const totalTokens = inputTokens + outputTokens;

      // 使用 upsert 来原子更新或创建记录
      await this.prisma.apiKeyUsage.upsert({
        where: {
          keyId_periodStart: {
            keyId: apiKeyId,
            periodStart,
          },
        },
        update: {
          requestCount: { increment: 1 },
          successCount: success ? { increment: 1 } : undefined,
          failureCount: !success ? { increment: 1 } : undefined,
          tokensUsed: { increment: totalTokens },
          cost: { increment: new Prisma.Decimal(cost) },
          updatedAt: new Date(),
        },
        create: {
          keyId: apiKeyId,
          userId,
          requestCount: 1,
          successCount: success ? 1 : 0,
          failureCount: !success ? 1 : 0,
          tokensUsed: totalTokens,
          cost: new Prisma.Decimal(cost),
          periodStart,
          periodEnd,
          metadata: {
            firstRequest: now.toISOString(),
          },
        },
      });

      this.logger.log(
        `Recorded usage for API Key ${apiKeyId}: ${totalTokens} tokens (${inputTokens} in + ${outputTokens} out), success: ${success}`
      );
    } catch (error) {
      // 记录失败不应该影响主流程
      this.logger.error(`Failed to record usage: ${error.message}`, error.stack);
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
   * 计算费用（基于 Claude 定价）
   * 价格参考：https://www.anthropic.com/pricing
   */
  calculateCost(params: { model: string; inputTokens: number; outputTokens: number }): number {
    const { model, inputTokens, outputTokens } = params;

    // Claude 3.5 Sonnet (2024-10-22)
    if (model.includes('claude-3-5-sonnet')) {
      const inputCost = (inputTokens / 1_000_000) * 3.0; // $3 per MTok
      const outputCost = (outputTokens / 1_000_000) * 15.0; // $15 per MTok
      return inputCost + outputCost;
    }

    // Claude 3.5 Haiku (2024-10-22)
    if (model.includes('claude-3-5-haiku')) {
      const inputCost = (inputTokens / 1_000_000) * 0.8; // $0.8 per MTok
      const outputCost = (outputTokens / 1_000_000) * 4.0; // $4 per MTok
      return inputCost + outputCost;
    }

    // Claude 3 Opus
    if (model.includes('claude-3-opus')) {
      const inputCost = (inputTokens / 1_000_000) * 15.0; // $15 per MTok
      const outputCost = (outputTokens / 1_000_000) * 75.0; // $75 per MTok
      return inputCost + outputCost;
    }

    // Claude 3 Sonnet
    if (model.includes('claude-3-sonnet')) {
      const inputCost = (inputTokens / 1_000_000) * 3.0; // $3 per MTok
      const outputCost = (outputTokens / 1_000_000) * 15.0; // $15 per MTok
      return inputCost + outputCost;
    }

    // Claude 3 Haiku
    if (model.includes('claude-3-haiku')) {
      const inputCost = (inputTokens / 1_000_000) * 0.25; // $0.25 per MTok
      const outputCost = (outputTokens / 1_000_000) * 1.25; // $1.25 per MTok
      return inputCost + outputCost;
    }

    // 默认按 Haiku 计价
    this.logger.warn(`Unknown model ${model}, using Haiku pricing`);
    const inputCost = (inputTokens / 1_000_000) * 0.8;
    const outputCost = (outputTokens / 1_000_000) * 4.0;
    return inputCost + outputCost;
  }
}
