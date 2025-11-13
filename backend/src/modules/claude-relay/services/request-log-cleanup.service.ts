import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * API Key 请求日志清理服务
 * 定时清理超过保留期限的日志
 */
@Injectable()
export class RequestLogCleanupService implements OnModuleInit {
  private readonly logger = new Logger(RequestLogCleanupService.name);

  // 配置参数
  private readonly RETENTION_DAYS = 90; // 保留90天
  private readonly CLEANUP_BATCH_SIZE = 1000; // 每批删除1000条

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log(
      `Request Log Cleanup Service initialized (retention: ${this.RETENTION_DAYS} days)`
    );
  }

  /**
   * 定时清理任务
   * 每天凌晨3点执行
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLogs(): Promise<void> {
    this.logger.log('Starting request log cleanup task...');

    try {
      const cutoffDate = this.getCutoffDate();
      this.logger.log(`Deleting logs older than: ${cutoffDate.toISOString()}`);

      let totalDeleted = 0;
      let hasMore = true;

      // 分批删除，使用原生 SQL 避免长事务
      while (hasMore) {
        const result = await this.prisma.$executeRaw`
          DELETE FROM api_key_request_logs
          WHERE id IN (
            SELECT id FROM api_key_request_logs
            WHERE created_at < ${cutoffDate}
            LIMIT ${this.CLEANUP_BATCH_SIZE}
          )
        `;

        const deletedCount = Number(result);
        totalDeleted += deletedCount;

        this.logger.log(`Deleted ${deletedCount} logs (total: ${totalDeleted})`);

        // 如果删除的记录少于批次大小，说明已经全部删除
        if (deletedCount < this.CLEANUP_BATCH_SIZE) {
          hasMore = false;
        }

        // 短暂等待，避免数据库压力过大
        if (hasMore) {
          await this.sleep(1000); // 等待1秒
        }
      }

      this.logger.log(
        `✅ Request log cleanup completed: ${totalDeleted} logs deleted`
      );
    } catch (error) {
      this.logger.error(
        `❌ Request log cleanup failed: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * 获取截止日期（90天前）
   */
  private getCutoffDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() - this.RETENTION_DAYS);
    date.setHours(0, 0, 0, 0); // 设置为当天的00:00:00
    return date;
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 手动触发清理（用于管理端点）
   */
  async manualCleanup(): Promise<{ deleted: number }> {
    this.logger.log('Manual cleanup triggered');

    const cutoffDate = this.getCutoffDate();
    const result = await this.prisma.apiKeyRequestLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Manual cleanup completed: ${result.count} logs deleted`);

    return { deleted: result.count };
  }

  /**
   * 获取日志统计信息
   */
  async getLogStats(): Promise<{
    totalLogs: number;
    logsToBeDeleted: number;
    oldestLogDate: Date | null;
    newestLogDate: Date | null;
  }> {
    const cutoffDate = this.getCutoffDate();

    const [totalCount, toDeleteCount, oldest, newest] = await Promise.all([
      // 总日志数
      this.prisma.apiKeyRequestLog.count(),

      // 将被删除的日志数
      this.prisma.apiKeyRequestLog.count({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      }),

      // 最旧的日志
      this.prisma.apiKeyRequestLog.findFirst({
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          createdAt: true,
        },
      }),

      // 最新的日志
      this.prisma.apiKeyRequestLog.findFirst({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

    return {
      totalLogs: totalCount,
      logsToBeDeleted: toDeleteCount,
      oldestLogDate: oldest?.createdAt || null,
      newestLogDate: newest?.createdAt || null,
    };
  }
}
