import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Optional,
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
  ValidateKeyResult,
} from './entities/api-key-response.entity';
import { KeyStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { ApiKeyCacheService } from '../claude-relay/services/api-key-cache.service';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() private apiKeyCache?: ApiKeyCacheService
  ) {}

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

    // 检查该用户下是否已存在同名 API Key（排除已删除的）
    const existingKey = await this.prisma.apiKey.findFirst({
      where: {
        userId: targetUserId,
        name: createApiKeyDto.name,
        status: {
          not: KeyStatus.DELETED,
        },
        deletedAt: null,
      },
    });

    if (existingKey) {
      throw new BadRequestException(
        `API key with name "${createApiKeyDto.name}" already exists for this user`
      );
    }

    // 生成 API Key（明文存储）
    const key = this.generateKey();

    // 转换日期字符串
    const expiresAt = createApiKeyDto.expiresAt ? new Date(createApiKeyDto.expiresAt) : null;

    // 如果指定了channelId，验证渠道是否存在
    if (createApiKeyDto.channelId) {
      const channel = await this.prisma.channel.findFirst({
        where: {
          id: createApiKeyDto.channelId,
          deletedAt: null,
        },
      });

      if (!channel) {
        throw new NotFoundException(`Channel with ID ${createApiKeyDto.channelId} not found`);
      }
    }

    // 创建 API Key 记录
    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId: targetUserId,
        channelId: createApiKeyDto.channelId || null,
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
   * 为普通用户创建 API Key（限制每个用户最多20个）
   */
  async createForUser(
    currentUserId: string,
    createApiKeyDto: CreateApiKeyDto
  ): Promise<ApiKeyResponseEntity> {
    const targetUserId = createApiKeyDto.userId;

    // 确保用户只能为自己创建 API Key
    if (currentUserId !== targetUserId) {
      throw new UnauthorizedException('You can only create API keys for yourself');
    }

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

    // 检查用户当前的 API Key 数量（排除已删除的）
    const existingKeysCount = await this.prisma.apiKey.count({
      where: {
        userId: targetUserId,
        deletedAt: null,
        status: {
          not: KeyStatus.DELETED,
        },
      },
    });

    // 限制每个用户最多创建 20 个 API Key
    const MAX_KEYS_PER_USER = 20;
    if (existingKeysCount >= MAX_KEYS_PER_USER) {
      throw new BadRequestException(
        `You have reached the maximum limit of ${MAX_KEYS_PER_USER} API keys. Please delete unused keys before creating new ones.`
      );
    }

    // 检查该用户下是否已存在同名 API Key（排除已删除的）
    const existingKey = await this.prisma.apiKey.findFirst({
      where: {
        userId: targetUserId,
        name: createApiKeyDto.name,
        status: {
          not: KeyStatus.DELETED,
        },
        deletedAt: null,
      },
    });

    if (existingKey) {
      throw new BadRequestException(
        `API key with name "${createApiKeyDto.name}" already exists for this user`
      );
    }

    // 生成 API Key（明文存储）
    const key = this.generateKey();

    // 转换日期字符串
    const expiresAt = createApiKeyDto.expiresAt ? new Date(createApiKeyDto.expiresAt) : null;

    // 如果指定了channelId，验证渠道是否存在
    if (createApiKeyDto.channelId) {
      const channel = await this.prisma.channel.findFirst({
        where: {
          id: createApiKeyDto.channelId,
          deletedAt: null,
        },
      });

      if (!channel) {
        throw new NotFoundException(`Channel with ID ${createApiKeyDto.channelId} not found`);
      }
    }

    // 创建 API Key 记录
    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId: targetUserId,
        channelId: createApiKeyDto.channelId || null,
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

    this.logger.log(
      `User ${currentUserId} created API key ${apiKey.id} (${existingKeysCount + 1}/${MAX_KEYS_PER_USER})`
    );

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
      include: {
        channel: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    // 批量查询所有 API Key 的统计数据
    const apiKeyIds = apiKeys.map((k) => k.id);

    // 查询总统计
    const usageStats = await this.prisma.apiKeyUsage.groupBy({
      by: ['keyId'],
      where: {
        keyId: { in: apiKeyIds },
      },
      _sum: {
        requestCount: true,
        successCount: true,
        failureCount: true,
        tokensUsed: true,
        cost: true,
      },
    });

    // 查询最近30天统计
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recent30DaysStats = await this.prisma.apiKeyUsage.groupBy({
      by: ['keyId'],
      where: {
        keyId: { in: apiKeyIds },
        periodStart: { gte: thirtyDaysAgo },
      },
      _sum: {
        cost: true,
      },
    });

    // 转换响应格式
    const data: ApiKeyResponseEntity[] = apiKeys.map((apiKey) => {
      const stats = usageStats.find((s) => s.keyId === apiKey.id);
      const recentStats = recent30DaysStats.find((s) => s.keyId === apiKey.id);

      const totalRequests = stats?._sum.requestCount || 0;
      const successCount = stats?._sum.successCount || 0;

      return {
        id: apiKey.id,
        userId: apiKey.userId,
        channelId: apiKey.channelId,
        name: apiKey.name,
        description: apiKey.description,
        key: apiKey.key,
        status: apiKey.status,
        dailyCostLimit: apiKey.dailyCostLimit ? parseFloat(apiKey.dailyCostLimit.toString()) : null,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        channel: apiKey.channel
          ? {
              id: apiKey.channel.id,
              name: apiKey.channel.name,
              provider: apiKey.channel.provider,
            }
          : undefined,
        stats: {
          totalRequests,
          successCount,
          failureCount: stats?._sum.failureCount || 0,
          successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
          tokensUsed: stats?._sum.tokensUsed || 0,
          totalCost: stats?._sum.cost ? parseFloat(stats._sum.cost.toString()) : 0,
          last30DaysCost: recentStats?._sum.cost ? parseFloat(recentStats._sum.cost.toString()) : 0,
        },
      };
    });

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
      include: {
        channel: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
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
      channelId: apiKey.channelId,
      name: apiKey.name,
      description: apiKey.description,
      key: apiKey.key,
      status: apiKey.status,
      dailyCostLimit: apiKey.dailyCostLimit ? parseFloat(apiKey.dailyCostLimit.toString()) : null,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      channel: apiKey.channel
        ? {
            id: apiKey.channel.id,
            name: apiKey.channel.name,
            provider: apiKey.channel.provider,
          }
        : undefined,
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
    if (updateApiKeyDto.channelId !== undefined) {
      // 如果指定了channelId，验证渠道是否存在
      if (updateApiKeyDto.channelId) {
        const channel = await this.prisma.channel.findFirst({
          where: {
            id: updateApiKeyDto.channelId,
            deletedAt: null,
          },
        });

        if (!channel) {
          throw new NotFoundException(`Channel with ID ${updateApiKeyDto.channelId} not found`);
        }
      }
      // Use Prisma's relation syntax for updating foreign keys
      if (updateApiKeyDto.channelId) {
        updateData.channel = { connect: { id: updateApiKeyDto.channelId } };
      } else {
        updateData.channel = { disconnect: true };
      }
    }

    const updatedApiKey = await this.prisma.apiKey.update({
      where: { id },
      data: updateData,
      include: {
        channel: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    // 使更新后的 API Key 缓存失效
    if (this.apiKeyCache) {
      this.apiKeyCache.invalidate(updatedApiKey.key);
      this.logger.debug(`Invalidated cache for updated API Key: ${updatedApiKey.name}`);
    }

    return {
      id: updatedApiKey.id,
      userId: updatedApiKey.userId,
      channelId: updatedApiKey.channelId,
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
      channel: updatedApiKey.channel
        ? {
            id: updatedApiKey.channel.id,
            name: updatedApiKey.channel.name,
            provider: updatedApiKey.channel.provider,
          }
        : undefined,
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

    // 立即使缓存失效（关键安全修复）
    if (this.apiKeyCache) {
      this.apiKeyCache.invalidate(apiKey.key);
      this.logger.log(`Invalidated cache for deleted API Key: ${apiKey.name}`);
    }

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

    // 立即使缓存失效（关键安全修复）
    if (this.apiKeyCache) {
      this.apiKeyCache.invalidate(apiKey.key);
      this.logger.log(`Invalidated cache for revoked API Key: ${apiKey.name}`);
    }

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

    // 使恢复后的 API Key 缓存失效，强制重新加载
    if (this.apiKeyCache) {
      this.apiKeyCache.invalidate(apiKey.key);
      this.logger.log(`Invalidated cache for restored API Key: ${apiKey.name}`);
    }

    return {
      message: 'API Key restored successfully',
      id,
      status: KeyStatus.ACTIVE,
    };
  }

  /**
   * 验证 API Key 有效性
   */
  async validateKey(key: string): Promise<ValidateKeyResult | null> {
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
    let endDate = query.endDate ? new Date(query.endDate) : new Date();
    let startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 将 endDate 设置为当天的结束时间（23:59:59.999）
    endDate = new Date(endDate);
    endDate.setHours(23, 59, 59, 999);

    // 将 startDate 设置为当天的开始时间（00:00:00.000）
    startDate = new Date(startDate);
    startDate.setHours(0, 0, 0, 0);

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

    // 从 ApiKeyRequestLog 获取统计数据（统一数据源以保证一致性）
    const requestLogStats = await this.prisma.apiKeyRequestLog.aggregate({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: {
        id: true,
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
    });

    // 统计成功和失败的请求
    // @ts-expect-error - Prisma groupBy type inference issue
    const successFailureStats = await this.prisma.apiKeyRequestLog.groupBy({
      by: ['status'],
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: {
        id: true,
      },
    });

    const totalRequests = requestLogStats._count.id || 0;
    const successCount = successFailureStats.find((s) => s.status === 200)?._count.id || 0;
    const failureCount = totalRequests - successCount;
    const totalCost = requestLogStats._sum.cost
      ? parseFloat(requestLogStats._sum.cost.toString())
      : 0;

    const inputTokens = requestLogStats._sum.inputTokens || 0;
    const outputTokens = requestLogStats._sum.outputTokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // 获取模型使用分布
    const modelDistributionData = await this.prisma.apiKeyRequestLog.groupBy({
      by: ['model'],
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: {
        id: true,
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        cost: true,
      },
    });

    const modelDistribution = modelDistributionData.map((item) => ({
      model: item.model,
      requests: item._count.id,
      tokens: (item._sum.inputTokens || 0) + (item._sum.outputTokens || 0),
      cost: item._sum.cost ? parseFloat(item._sum.cost.toString()) : 0,
    }));

    // 验证数据一致性
    const modelTotalRequests = modelDistribution.reduce((sum, m) => sum + m.requests, 0);
    const modelTotalCost = modelDistribution.reduce((sum, m) => sum + m.cost, 0);
    const modelTotalTokens = modelDistribution.reduce((sum, m) => sum + m.tokens, 0);

    this.logger.log('📊 Overview Stats Verification:', {
      userId,
      period: { startDate, endDate },
      totals: {
        requests: totalRequests,
        cost: totalCost,
        tokens: totalTokens,
      },
      modelTotals: {
        requests: modelTotalRequests,
        cost: modelTotalCost,
        tokens: modelTotalTokens,
      },
      difference: {
        requests: totalRequests - modelTotalRequests,
        cost: (totalCost - modelTotalCost).toFixed(4),
        tokens: totalTokens - modelTotalTokens,
      },
      modelDistribution,
    });

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
      totalTokens,
      inputTokens,
      outputTokens,
      modelDistribution: modelDistribution.length > 0 ? modelDistribution : undefined,
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

  /**
   * 获取 API Key 的详细请求日志
   */
  async getRequestLogs(
    keyId: string,
    userId: string,
    query: {
      page: number;
      limit: number;
      startDate?: Date;
      endDate?: Date;
      success?: boolean;
    }
  ) {
    // 1. 验证权限
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
        deletedAt: null,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key 不存在');
    }

    // 2. 构建查询条件
    const where: {
      apiKeyId: string;
      createdAt?: { gte?: Date; lte?: Date };
      success?: boolean;
    } = {
      apiKeyId: keyId,
    };

    if (query.startDate) {
      where.createdAt = { ...where.createdAt, gte: query.startDate };
    }

    if (query.endDate) {
      where.createdAt = { ...where.createdAt, lte: query.endDate };
    }

    if (query.success !== undefined) {
      where.success = query.success;
    }

    // 3. 查询总数
    const total = await this.prisma.apiKeyRequestLog.count({ where });

    // 4. 查询列表
    const logs = await this.prisma.apiKeyRequestLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        requestId: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        cacheCreationInputTokens: true,
        cacheReadInputTokens: true,
        duration: true,
        timeToFirstToken: true,
        cost: true,
        statusCode: true,
        success: true,
        errorMessage: true,
        errorType: true,
        ipAddress: true,
        userAgent: true,
        channelId: true,
        createdAt: true,
        metadata: true,
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      data: logs,
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    };
  }

  /**
   * 获取所有 API Key 的详细请求日志
   */
  async getAllRequestLogs(
    userId: string,
    query: {
      page: number;
      limit: number;
      apiKeyIds?: string[];
      models?: string[];
      startDate?: Date;
      endDate?: Date;
      success?: boolean;
    }
  ) {
    // 1. 构建查询条件 - 只查询当前用户的 API Keys
    const where: {
      userId: string;
      apiKeyId?: { in: string[] };
      model?: { in: string[] };
      createdAt?: { gte?: Date; lte?: Date };
      success?: boolean;
    } = {
      userId, // 确保只查询当前用户的数据
    };

    // 按 API Key 筛选（支持多选）
    if (query.apiKeyIds && query.apiKeyIds.length > 0) {
      where.apiKeyId = { in: query.apiKeyIds };
    }

    // 按模型筛选（支持多选）
    if (query.models && query.models.length > 0) {
      where.model = { in: query.models };
    }

    // 按时间筛选
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    // 按成功状态筛选
    if (query.success !== undefined) {
      where.success = query.success;
    }

    // 2. 查询总数
    const total = await this.prisma.apiKeyRequestLog.count({ where });

    // 3. 查询列表
    const logs = await this.prisma.apiKeyRequestLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: {
        id: true,
        requestId: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        cacheCreationInputTokens: true,
        cacheReadInputTokens: true,
        duration: true,
        timeToFirstToken: true,
        cost: true,
        statusCode: true,
        success: true,
        errorMessage: true,
        errorType: true,
        ipAddress: true,
        userAgent: true,
        channelId: true,
        createdAt: true,
        metadata: true,
        apiKey: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      logs: logs,
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    };
  }

  /**
   * 获取所有使用过的模型列表
   */
  async getUsedModels(userId: string): Promise<string[]> {
    const models = await this.prisma.apiKeyRequestLog.findMany({
      where: {
        userId,
      },
      select: {
        model: true,
      },
      distinct: ['model'],
      orderBy: {
        model: 'asc',
      },
    });

    return models.map((m) => m.model);
  }

  /**
   * 检查 API Key 名称是否可用
   * 用于前端实时验证，避免传输大量数据
   */
  async checkNameAvailable(
    userId: string,
    name: string
  ): Promise<{ available: boolean; message?: string }> {
    const existingKey = await this.prisma.apiKey.findFirst({
      where: {
        userId,
        name,
        status: {
          not: KeyStatus.DELETED,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (existingKey) {
      return {
        available: false,
        message: `API key with name "${name}" already exists for this user`,
      };
    }

    return {
      available: true,
    };
  }
}
