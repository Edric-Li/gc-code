import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * 日志清理服务
 * 定时清理超过保留期限的各类日志
 */
@Injectable()
export class LogCleanupService implements OnModuleInit {
  private readonly logger = new Logger(LogCleanupService.name);

  // 配置参数
  private readonly API_LOG_RETENTION_DAYS = 30; // API 日志保留30天
  private readonly LOGIN_LOG_RETENTION_DAYS = 90; // 登录日志保留90天
  private readonly AUDIT_LOG_RETENTION_DAYS = 180; // 审计日志保留180天
  private readonly CLEANUP_BATCH_SIZE = 1000; // 每批删除1000条

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log(
      `Log Cleanup Service initialized (API: ${this.API_LOG_RETENTION_DAYS}d, Login: ${this.LOGIN_LOG_RETENTION_DAYS}d, Audit: ${this.AUDIT_LOG_RETENTION_DAYS}d)`
    );
  }

  /**
   * 定时清理任务
   * 每天凌晨2点执行
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldLogs(): Promise<void> {
    this.logger.log('Starting log cleanup task...');

    try {
      // 清理 API 日志
      const apiDeleted = await this.cleanupApiLogs();
      this.logger.log(`✅ API logs cleanup completed: ${apiDeleted} logs deleted`);

      // 清理登录日志
      const loginDeleted = await this.cleanupLoginLogs();
      this.logger.log(`✅ Login logs cleanup completed: ${loginDeleted} logs deleted`);

      // 清理审计日志
      const auditDeleted = await this.cleanupAuditLogs();
      this.logger.log(`✅ Audit logs cleanup completed: ${auditDeleted} logs deleted`);

      this.logger.log(
        `✅ All logs cleanup completed: Total ${apiDeleted + loginDeleted + auditDeleted} logs deleted`
      );
    } catch (error) {
      this.logger.error(`❌ Log cleanup failed: ${error.message}`, error.stack);
    }
  }

  /**
   * 清理 API 日志
   */
  private async cleanupApiLogs(): Promise<number> {
    const cutoffDate = this.getCutoffDate(this.API_LOG_RETENTION_DAYS);
    this.logger.log(`Cleaning API logs older than: ${cutoffDate.toISOString()}`);

    let totalDeleted = 0;
    let hasMore = true;

    // 分批删除，避免长事务
    while (hasMore) {
      const result = await this.prisma.$executeRaw`
        DELETE FROM api_logs
        WHERE id IN (
          SELECT id FROM api_logs
          WHERE created_at < ${cutoffDate}
          LIMIT ${this.CLEANUP_BATCH_SIZE}
        )
      `;

      const deletedCount = Number(result);
      totalDeleted += deletedCount;

      if (deletedCount < this.CLEANUP_BATCH_SIZE) {
        hasMore = false;
      }

      if (hasMore) {
        await this.sleep(1000); // 等待1秒，避免数据库压力过大
      }
    }

    return totalDeleted;
  }

  /**
   * 清理登录日志
   */
  private async cleanupLoginLogs(): Promise<number> {
    const cutoffDate = this.getCutoffDate(this.LOGIN_LOG_RETENTION_DAYS);
    this.logger.log(`Cleaning login logs older than: ${cutoffDate.toISOString()}`);

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await this.prisma.$executeRaw`
        DELETE FROM login_logs
        WHERE id IN (
          SELECT id FROM login_logs
          WHERE created_at < ${cutoffDate}
          LIMIT ${this.CLEANUP_BATCH_SIZE}
        )
      `;

      const deletedCount = Number(result);
      totalDeleted += deletedCount;

      if (deletedCount < this.CLEANUP_BATCH_SIZE) {
        hasMore = false;
      }

      if (hasMore) {
        await this.sleep(1000);
      }
    }

    return totalDeleted;
  }

  /**
   * 清理审计日志
   */
  private async cleanupAuditLogs(): Promise<number> {
    const cutoffDate = this.getCutoffDate(this.AUDIT_LOG_RETENTION_DAYS);
    this.logger.log(`Cleaning audit logs older than: ${cutoffDate.toISOString()}`);

    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await this.prisma.$executeRaw`
        DELETE FROM audit_logs
        WHERE id IN (
          SELECT id FROM audit_logs
          WHERE created_at < ${cutoffDate}
          LIMIT ${this.CLEANUP_BATCH_SIZE}
        )
      `;

      const deletedCount = Number(result);
      totalDeleted += deletedCount;

      if (deletedCount < this.CLEANUP_BATCH_SIZE) {
        hasMore = false;
      }

      if (hasMore) {
        await this.sleep(1000);
      }
    }

    return totalDeleted;
  }

  /**
   * 获取截止日期
   */
  private getCutoffDate(retentionDays: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - retentionDays);
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
  async manualCleanup(): Promise<{
    apiLogs: number;
    loginLogs: number;
    auditLogs: number;
    total: number;
  }> {
    this.logger.log('Manual cleanup triggered');

    const apiDeleted = await this.cleanupApiLogs();
    const loginDeleted = await this.cleanupLoginLogs();
    const auditDeleted = await this.cleanupAuditLogs();

    const total = apiDeleted + loginDeleted + auditDeleted;
    this.logger.log(`Manual cleanup completed: ${total} logs deleted`);

    return {
      apiLogs: apiDeleted,
      loginLogs: loginDeleted,
      auditLogs: auditDeleted,
      total,
    };
  }

  /**
   * 获取日志统计信息
   */
  async getLogStats(): Promise<{
    apiLogs: {
      total: number;
      toBeDeleted: number;
      oldestDate: Date | null;
      retentionDays: number;
    };
    loginLogs: {
      total: number;
      toBeDeleted: number;
      oldestDate: Date | null;
      retentionDays: number;
    };
    auditLogs: {
      total: number;
      toBeDeleted: number;
      oldestDate: Date | null;
      retentionDays: number;
    };
  }> {
    const apiCutoffDate = this.getCutoffDate(this.API_LOG_RETENTION_DAYS);
    const loginCutoffDate = this.getCutoffDate(this.LOGIN_LOG_RETENTION_DAYS);
    const auditCutoffDate = this.getCutoffDate(this.AUDIT_LOG_RETENTION_DAYS);

    const [
      apiTotal,
      apiToDelete,
      apiOldest,
      loginTotal,
      loginToDelete,
      loginOldest,
      auditTotal,
      auditToDelete,
      auditOldest,
    ] = await Promise.all([
      // API 日志
      this.prisma.apiLog.count(),
      this.prisma.apiLog.count({ where: { createdAt: { lt: apiCutoffDate } } }),
      this.prisma.apiLog.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),

      // 登录日志
      this.prisma.loginLog.count(),
      this.prisma.loginLog.count({ where: { createdAt: { lt: loginCutoffDate } } }),
      this.prisma.loginLog.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),

      // 审计日志
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { createdAt: { lt: auditCutoffDate } } }),
      this.prisma.auditLog.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      apiLogs: {
        total: apiTotal,
        toBeDeleted: apiToDelete,
        oldestDate: apiOldest?.createdAt || null,
        retentionDays: this.API_LOG_RETENTION_DAYS,
      },
      loginLogs: {
        total: loginTotal,
        toBeDeleted: loginToDelete,
        oldestDate: loginOldest?.createdAt || null,
        retentionDays: this.LOGIN_LOG_RETENTION_DAYS,
      },
      auditLogs: {
        total: auditTotal,
        toBeDeleted: auditToDelete,
        oldestDate: auditOldest?.createdAt || null,
        retentionDays: this.AUDIT_LOG_RETENTION_DAYS,
      },
    };
  }
}
