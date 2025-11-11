import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import {
  QueryApiKeysDto,
  ApiKeyUsageQueryDto,
  ApiKeyStatsQueryDto,
  ApiKeyRankingQueryDto,
} from './dto/query-api-keys.dto';
import {
  ApiKeyResponseEntity,
  PaginatedApiKeysResponse,
  ApiKeyUsageResponse,
  ApiKeyStatsOverview,
  ApiKeyRankingResponse,
} from './entities/api-key-response.entity';
import { KeyStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成随机 API Key
   * 格式: sk-{64位随机hex字符}
   */
  private generateKey(): string {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `sk-${randomBytes}`;
  }

  /**
   * 创建新的 API Key
   */
  async create(
    currentUserId: string,
    createApiKeyDto: CreateApiKeyDto
  ): Promise<ApiKeyResponseEntity> {
    const targetUserId = createApiKeyDto.userId;

    // 验证目标用户是否存在
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    if (!targetUser.isActive) {
      throw new BadRequestException('Cannot create API key for inactive user');
    }

    // 生成 API Key（明文存储）
    const key = this.generateKey();

    // 转换日期字符串
    const expiresAt = createApiKeyDto.expiresAt ? new Date(createApiKeyDto.expiresAt) : null;

    // 创建 API Key 记录
    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId: targetUserId,
        name: createApiKeyDto.name,
        description: createApiKeyDto.description,
        key,
        dailyCostLimit: createApiKeyDto.dailyCostLimit
          ? new Prisma.Decimal(createApiKeyDto.dailyCostLimit)
          : null,
        expiresAt,
        status: KeyStatus.ACTIVE,
      },
    });

    // 返回响应
    return {
      id: apiKey.id,
      userId: apiKey.userId,
      name: apiKey.name,
      description: apiKey.description,
      key: apiKey.key,
      status: apiKey.status,
      dailyCostLimit: apiKey.dailyCostLimit ? parseFloat(apiKey.dailyCostLimit.toString()) : null,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    };
  }

  /**
   * 查询 API Key 列表（分页）
   */
  async findAll(currentUserId: string, query: QueryApiKeysDto): Promise<PaginatedApiKeysResponse> {
    const { page = 1, limit = 20, status, search, userId, includeDeleted = false } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.ApiKeyWhereInput = {};

    // 如果提供了 userId 参数，按该用户筛选（管理员功能），否则只查询当前用户
    if (userId) {
      where.userId = userId;
    } else {
      where.userId = currentUserId;
    }

    // 默认排除已删除的 API Key
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    // 状态过滤
    if (status) {
      where.status = status;
    }

    // 名称模糊搜索
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // 查询总数
    const total = await this.prisma.apiKey.count({ where });

    // 查询数据
    const apiKeys = await this.prisma.apiKey.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // 转换响应格式
    const data: ApiKeyResponseEntity[] = apiKeys.map((apiKey) => ({
      id: apiKey.id,
      userId: apiKey.userId,
      name: apiKey.name,
      description: apiKey.description,
      key: apiKey.key,
      status: apiKey.status,
      dailyCostLimit: apiKey.dailyCostLimit ? parseFloat(apiKey.dailyCostLimit.toString()) : null,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询单个 API Key 详情
   */
  async findOne(id: string, userId: string): Promise<ApiKeyResponseEntity> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    // 计算使用统计摘要
    const usageSummary = await this.calculateUsageSummary(id);

    return {
      id: apiKey.id,
      userId: apiKey.userId,
      name: apiKey.name,
      description: apiKey.description,
      key: apiKey.key,
      status: apiKey.status,
      dailyCostLimit: apiKey.dailyCostLimit ? parseFloat(apiKey.dailyCostLimit.toString()) : null,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
      usageSummary,
    };
  }

  /**
   * 更新 API Key
   */
  async update(
    id: string,
    userId: string,
    updateApiKeyDto: UpdateApiKeyDto
  ): Promise<ApiKeyResponseEntity> {
    // 检查 API Key 是否存在且属于该用户
    const existingApiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!existingApiKey) {
      throw new NotFoundException('API Key not found');
    }

    // 更新数据
    const updateData: Prisma.ApiKeyUpdateInput = {};

    if (updateApiKeyDto.name !== undefined) {
      updateData.name = updateApiKeyDto.name;
    }
    if (updateApiKeyDto.description !== undefined) {
      updateData.description = updateApiKeyDto.description;
    }
    if (updateApiKeyDto.expiresAt !== undefined) {
      updateData.expiresAt = new Date(updateApiKeyDto.expiresAt);
    }
    if (updateApiKeyDto.dailyCostLimit !== undefined) {
      updateData.dailyCostLimit = new Prisma.Decimal(updateApiKeyDto.dailyCostLimit);
    }

    const updatedApiKey = await this.prisma.apiKey.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updatedApiKey.id,
      userId: updatedApiKey.userId,
      name: updatedApiKey.name,
      description: updatedApiKey.description,
      key: updatedApiKey.key,
      status: updatedApiKey.status,
      dailyCostLimit: updatedApiKey.dailyCostLimit
        ? parseFloat(updatedApiKey.dailyCostLimit.toString())
        : null,
      lastUsedAt: updatedApiKey.lastUsedAt,
      expiresAt: updatedApiKey.expiresAt,
      createdAt: updatedApiKey.createdAt,
      updatedAt: updatedApiKey.updatedAt,
    };
  }

  /**
   * 软删除 API Key
   */
  async softDelete(
    id: string,
    userId: string
  ): Promise<{ message: string; id: string; deletedAt: Date }> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    const deletedAt = new Date();

    await this.prisma.apiKey.update({
      where: { id },
      data: {
        deletedAt,
        status: KeyStatus.DELETED,
      },
    });

    return {
      message: 'API Key deleted successfully',
      id,
      deletedAt,
    };
  }

  /**
   * 撤销 API Key
   */
  async revoke(
    id: string,
    userId: string
  ): Promise<{ message: string; id: string; status: KeyStatus; revokedAt: Date }> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    const revokedAt = new Date();

    await this.prisma.apiKey.update({
      where: { id },
      data: {
        status: KeyStatus.REVOKED,
        updatedAt: revokedAt,
      },
    });

    return {
      message: 'API Key revoked successfully',
      id,
      status: KeyStatus.REVOKED,
      revokedAt,
    };
  }

  /**
   * 恢复已删除的 API Key
   */
  async restore(
    id: string,
    userId: string
  ): Promise<{ message: string; id: string; status: KeyStatus }> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    if (!apiKey.deletedAt) {
      throw new BadRequestException('API Key is not deleted');
    }

    await this.prisma.apiKey.update({
      where: { id },
      data: {
        deletedAt: null,
        status: KeyStatus.ACTIVE,
      },
    });

    return {
      message: 'API Key restored successfully',
      id,
      status: KeyStatus.ACTIVE,
    };
  }

  /**
   * 验证 API Key 有效性
   */
  async validateKey(key: string): Promise<ApiKeyResponseEntity | null> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key },
      include: { user: true },
    });

    // API Key 不存在
    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // 已删除
    if (apiKey.deletedAt) {
      throw new UnauthorizedException('API key has been deleted');
    }

    // 状态检查
    if (apiKey.status !== KeyStatus.ACTIVE) {
      throw new UnauthorizedException(`API key is ${apiKey.status.toLowerCase()}`);
    }

    // 过期检查
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      // 更新状态为 EXPIRED
      await this.prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { status: KeyStatus.EXPIRED },
      });
      throw new UnauthorizedException('API key has expired');
    }

    // TODO: 在实际使用时，这里应该检查每日费用限制
    // 需要根据当天的使用情况来判断是否超过 dailyCostLimit

    // 更新使用信息
    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
      },
    });

    return {
      user: apiKey.user,
      apiKey: apiKey,
    };
  }

  /**
   * 计算使用统计摘要
   */
  private async calculateUsageSummary(keyId: string) {
    // 获取总统计
    const totalStats = await this.prisma.apiKeyUsage.aggregate({
      where: { keyId },
      _sum: {
        requestCount: true,
        successCount: true,
        failureCount: true,
        cost: true,
      },
    });

    // 获取最近 7 天统计
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7DaysStats = await this.prisma.apiKeyUsage.aggregate({
      where: {
        keyId,
        periodStart: { gte: sevenDaysAgo },
      },
      _sum: {
        requestCount: true,
      },
    });

    // 获取最近 30 天统计
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30DaysStats = await this.prisma.apiKeyUsage.aggregate({
      where: {
        keyId,
        periodStart: { gte: thirtyDaysAgo },
      },
      _sum: {
        requestCount: true,
      },
    });

    const totalRequests = totalStats._sum.requestCount || 0;
    const successCount = totalStats._sum.successCount || 0;
    const failureCount = totalStats._sum.failureCount || 0;
    const totalCost = totalStats._sum.cost ? parseFloat(totalStats._sum.cost.toString()) : 0;

    return {
      totalRequests,
      successCount,
      failureCount,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      totalCost,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      last7DaysRequests: last7DaysStats._sum.requestCount || 0,
      last30DaysRequests: last30DaysStats._sum.requestCount || 0,
    };
  }

  /**
   * 获取用户总体统计
   */
  async getOverview(userId: string, query: ApiKeyStatsQueryDto): Promise<ApiKeyStatsOverview> {
    // 设置默认时间范围（最近 30 天）
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 获取用户所有 API Key 的统计
    const apiKeyStats = await this.prisma.apiKey.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    });

    const totalApiKeys = apiKeyStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const activeApiKeys = apiKeyStats.find((s) => s.status === KeyStatus.ACTIVE)?._count.id || 0;
    const expiredApiKeys = apiKeyStats.find((s) => s.status === KeyStatus.EXPIRED)?._count.id || 0;
    const revokedApiKeys = apiKeyStats.find((s) => s.status === KeyStatus.REVOKED)?._count.id || 0;

    // 获取用量统计
    const usageStats = await this.prisma.apiKeyUsage.aggregate({
      where: {
        userId,
        periodStart: { gte: startDate, lte: endDate },
      },
      _sum: {
        requestCount: true,
        successCount: true,
        failureCount: true,
        cost: true,
      },
    });

    const totalRequests = usageStats._sum.requestCount || 0;
    const successCount = usageStats._sum.successCount || 0;
    const failureCount = usageStats._sum.failureCount || 0;
    const totalCost = usageStats._sum.cost ? parseFloat(usageStats._sum.cost.toString()) : 0;

    return {
      totalApiKeys,
      activeApiKeys,
      expiredApiKeys,
      revokedApiKeys,
      totalRequests,
      successCount,
      failureCount,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      totalCost,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * 获取单个 API Key 的使用趋势
   */
  async getApiKeyUsage(
    id: string,
    userId: string,
    query: ApiKeyUsageQueryDto
  ): Promise<ApiKeyUsageResponse> {
    // 检查 API Key 是否存在
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    // 设置默认时间范围（最近 30 天）
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 查询使用数据
    const usageData = await this.prisma.apiKeyUsage.findMany({
      where: {
        keyId: id,
        periodStart: { gte: startDate, lte: endDate },
      },
      orderBy: { periodStart: 'asc' },
    });

    // 计算统计摘要
    const summary = usageData.reduce(
      (acc, data) => ({
        totalRequests: acc.totalRequests + data.requestCount,
        totalCost: acc.totalCost + parseFloat(data.cost.toString()),
      }),
      { totalRequests: 0, totalCost: 0 }
    );

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      apiKeyId: id,
      apiKeyName: apiKey.name,
      granularity: query.granularity || 'day',
      periodStart: startDate,
      periodEnd: endDate,
      data: usageData.map((d) => ({
        periodStart: d.periodStart,
        periodEnd: d.periodEnd,
        requestCount: d.requestCount,
        successCount: d.successCount,
        failureCount: d.failureCount,
        tokensUsed: d.tokensUsed,
        cost: parseFloat(d.cost.toString()),
      })),
      summary: {
        totalRequests: summary.totalRequests,
        avgDailyRequests: days > 0 ? Math.round(summary.totalRequests / days) : 0,
        totalCost: summary.totalCost,
        avgDailyCost: days > 0 ? summary.totalCost / days : 0,
      },
    };
  }

  /**
   * 获取用量排行榜
   */
  async getRanking(userId: string, query: ApiKeyRankingQueryDto): Promise<ApiKeyRankingResponse> {
    // 设置默认时间范围（最近 30 天）
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const orderBy = query.orderBy || 'requests';
    const top = query.top || 10;

    // 获取用户的所有 API Key
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { userId, deletedAt: null },
      select: { id: true, name: true },
    });

    // 获取每个 API Key 的统计数据
    const rankingData = await Promise.all(
      apiKeys.map(async (apiKey) => {
        const stats = await this.prisma.apiKeyUsage.aggregate({
          where: {
            keyId: apiKey.id,
            periodStart: { gte: startDate, lte: endDate },
          },
          _sum: {
            requestCount: true,
            successCount: true,
            failureCount: true,
            cost: true,
          },
        });

        const requestCount = stats._sum.requestCount || 0;
        const successCount = stats._sum.successCount || 0;
        const _failureCount = stats._sum.failureCount || 0;
        const cost = stats._sum.cost ? parseFloat(stats._sum.cost.toString()) : 0;

        return {
          apiKeyId: apiKey.id,
          apiKeyName: apiKey.name,
          requestCount,
          cost,
          successRate: requestCount > 0 ? (successCount / requestCount) * 100 : 0,
        };
      })
    );

    // 排序
    rankingData.sort((a, b) => {
      if (orderBy === 'requests') {
        return b.requestCount - a.requestCount;
      } else if (orderBy === 'cost') {
        return b.cost - a.cost;
      }
      return 0;
    });

    // 取前 N 个
    const topRanking = rankingData.slice(0, top).map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return {
      orderBy,
      periodStart: startDate,
      periodEnd: endDate,
      data: topRanking,
    };
  }
}
