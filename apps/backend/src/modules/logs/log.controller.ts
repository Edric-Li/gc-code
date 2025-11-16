import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { LogService } from './log.service';
import { LogCleanupService } from './log-cleanup.service';
import {
  QueryLoginLogsDto,
  QueryAuditLogsDto,
  QueryApiLogsDto,
  LogStatisticsDto,
} from './dto/query-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN) // 只有管理员可以查看日志
export class LogController {
  constructor(
    private readonly logService: LogService,
    private readonly logCleanupService: LogCleanupService
  ) {}

  @Get('login')
  async getLoginLogs(@Query() query: QueryLoginLogsDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.logService.getLoginLogs({
      skip: query.skip,
      take: query.take,
      userId: query.userId,
      success: query.success,
      loginMethod: query.loginMethod,
      startDate,
      endDate,
    });
  }

  @Get('audit')
  async getAuditLogs(@Query() query: QueryAuditLogsDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.logService.getAuditLogs({
      skip: query.skip,
      take: query.take,
      userId: query.userId,
      action: query.action,
      resource: query.resource,
      startDate,
      endDate,
    });
  }

  @Get('api')
  async getApiLogs(@Query() query: QueryApiLogsDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.logService.getApiLogs({
      skip: query.skip,
      take: query.take,
      userId: query.userId,
      method: query.method,
      path: query.path,
      statusCode: query.statusCode,
      startDate,
      endDate,
    });
  }

  @Get('statistics')
  async getStatistics(@Query() query: LogStatisticsDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.logService.getLogStatistics(startDate, endDate);
  }

  @Get('cleanup/stats')
  async getCleanupStats() {
    return this.logCleanupService.getLogStats();
  }

  @Post('cleanup/manual')
  async manualCleanup() {
    return this.logCleanupService.manualCleanup();
  }
}
