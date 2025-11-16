import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { LoginMethod, AuditAction, HttpMethod, Prisma } from '@prisma/client';

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 记录登录日志
   */
  async logLogin(data: {
    userId?: string;
    email: string;
    loginMethod: LoginMethod;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
  }) {
    try {
      return await this.prisma.loginLog.create({
        data: {
          userId: data.userId,
          email: data.email,
          loginMethod: data.loginMethod,
          success: data.success,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log login', error);
    }
  }

  /**
   * 记录操作审计日志
   */
  async logAudit(data: {
    userId: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    description?: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          description: data.description,
          changes: data.changes as Prisma.InputJsonValue,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log audit', error);
    }
  }

  /**
   * 记录 API 访问日志
   */
  async logApi(data: {
    userId?: string;
    method: HttpMethod;
    path: string;
    statusCode: number;
    duration: number;
    ipAddress?: string;
    userAgent?: string;
    requestHeaders?: Record<string, unknown>;
    requestBody?: Record<string, unknown>;
    errorMessage?: string;
  }) {
    try {
      return await this.prisma.apiLog.create({
        data: {
          userId: data.userId,
          method: data.method,
          path: data.path,
          statusCode: data.statusCode,
          duration: data.duration,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          requestHeaders: data.requestHeaders as Prisma.InputJsonValue,
          requestBody: data.requestBody as Prisma.InputJsonValue,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log API', error);
    }
  }

  /**
   * 查询登录日志
   */
  async getLoginLogs(params: {
    skip?: number;
    take?: number;
    userId?: string;
    success?: boolean;
    loginMethod?: LoginMethod;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.LoginLogWhereInput = {};

    if (params.userId) where.userId = params.userId;
    if (params.success !== undefined) where.success = params.success;
    if (params.loginMethod) where.loginMethod = params.loginMethod;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.loginLog.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      this.prisma.loginLog.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * 查询操作审计日志
   */
  async getAuditLogs(params: {
    skip?: number;
    take?: number;
    userId?: string;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.AuditLogWhereInput = {};

    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = params.action;
    if (params.resource) where.resource = params.resource;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * 查询 API 访问日志
   */
  async getApiLogs(params: {
    skip?: number;
    take?: number;
    userId?: string;
    method?: HttpMethod;
    path?: string;
    statusCode?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.ApiLogWhereInput = {};

    if (params.userId) where.userId = params.userId;
    if (params.method) where.method = params.method;
    if (params.path) where.path = { contains: params.path };
    // 支持状态码范围查询（如 2 代表 200-299，4 代表 400-499）
    if (params.statusCode) {
      if (params.statusCode < 10) {
        // 如果是单个数字，表示范围查询
        const rangeStart = params.statusCode * 100;
        const rangeEnd = rangeStart + 99;
        where.statusCode = { gte: rangeStart, lte: rangeEnd };
      } else {
        // 精确匹配
        where.statusCode = params.statusCode;
      }
    }
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.apiLog.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      this.prisma.apiLog.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * 获取日志统计信息
   */
  async getLogStatistics(startDate?: Date, endDate?: Date) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const whereDate = startDate || endDate ? { createdAt: dateFilter } : {};

    const [totalLogins, successfulLogins, failedLogins, totalAudits, totalApiCalls, apiErrors] =
      await Promise.all([
        this.prisma.loginLog.count({ where: whereDate }),
        this.prisma.loginLog.count({ where: { success: true, ...whereDate } }),
        this.prisma.loginLog.count({ where: { success: false, ...whereDate } }),
        this.prisma.auditLog.count({ where: whereDate }),
        this.prisma.apiLog.count({ where: whereDate }),
        this.prisma.apiLog.count({ where: { statusCode: { gte: 400 }, ...whereDate } }),
      ]);

    return {
      totalLogins,
      successfulLogins,
      failedLogins,
      loginSuccessRate:
        totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(2) + '%' : '0%',
      totalAudits,
      totalApiCalls,
      apiErrors,
      apiErrorRate: totalApiCalls > 0 ? ((apiErrors / totalApiCalls) * 100).toFixed(2) + '%' : '0%',
    };
  }
}
