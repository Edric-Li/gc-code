import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { QueryChannelsDto } from './dto/query-channels.dto';
import {
  ChannelResponseEntity,
  PaginatedChannelsResponse,
} from './entities/channel-response.entity';
import { Prisma, ChannelStatus } from '@prisma/client';
import { encryptApiKey, decryptApiKey, maskApiKey } from '../../common/crypto.util';
import { ChannelPoolCacheService } from '../claude-relay/services/channel-pool-cache.service';

// 测试连接配置常量
const TEST_CONNECTION_CONFIG = {
  // 默认测试模型（可通过环境变量覆盖）
  DEFAULT_TEST_MODEL: process.env.DEFAULT_TEST_MODEL || 'claude-3-5-haiku-20241022',
  // 请求超时时间（毫秒）
  TIMEOUT_MS: parseInt(process.env.TEST_CONNECTION_TIMEOUT || '30000', 10),
  // Anthropic API 版本
  ANTHROPIC_VERSION: '2023-06-01',
} as const;

/**
 * 解析 HTTP 响应体（尝试 JSON，失败则尝试文本）
 */
async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
}

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() private channelPoolCache?: ChannelPoolCacheService
  ) {}

  /**
   * 创建渠道
   */
  async create(dto: CreateChannelDto): Promise<ChannelResponseEntity> {
    // 检查 AI 提供商是否存在
    const provider = await this.prisma.aiProvider.findUnique({
      where: { id: dto.providerId },
    });

    if (!provider) {
      throw new NotFoundException(`AI Provider with ID "${dto.providerId}" not found`);
    }

    // 加密 API 密钥
    const encryptedApiKey = encryptApiKey(dto.apiKey);

    // 使用事务创建渠道和模型
    const channel = await this.prisma.$transaction(async (tx) => {
      const newChannel = await tx.channel.create({
        data: {
          providerId: dto.providerId,
          name: dto.name,
          description: dto.description,
          baseUrl: dto.baseUrl,
          apiKey: encryptedApiKey,
          status: ChannelStatus.ACTIVE,
          metadata: dto.metadata ? (dto.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
          models: true,
        },
      });

      // 如果提供了模型列表，创建模型关联
      if (dto.models && dto.models.length > 0) {
        await tx.channelModel.createMany({
          data: dto.models.map((modelName) => ({
            channelId: newChannel.id,
            modelName,
            isEnabled: true,
          })),
        });

        // 重新获取包含models的channel
        return tx.channel.findUnique({
          where: { id: newChannel.id },
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
            models: true,
          },
        });
      }

      return newChannel;
    });

    return this.toResponseEntity(channel, true);
  }

  /**
   * 查询渠道列表（分页）
   */
  async findAll(query: QueryChannelsDto): Promise<PaginatedChannelsResponse> {
    const { page = 1, limit = 10, search, providerId, status, healthStatus } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.ChannelWhereInput = {
      deletedAt: null, // 不查询已删除的
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (providerId) {
      where.providerId = providerId;
    }

    if (status) {
      where.status = status;
    }

    if (healthStatus) {
      where.healthStatus = healthStatus;
    }

    // 查询数据
    const [channels, total] = await Promise.all([
      this.prisma.channel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
          models: true,
        },
      }),
      this.prisma.channel.count({ where }),
    ]);

    return {
      data: channels.map((c) => this.toResponseEntity(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取单个渠道
   */
  async findOne(id: string, includeApiKey = false): Promise<ChannelResponseEntity> {
    const channel = await this.prisma.channel.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        models: true,
      },
    });

    if (!channel) {
      throw new NotFoundException(`Channel with ID "${id}" not found`);
    }

    return this.toResponseEntity(channel, includeApiKey);
  }

  /**
   * 更新渠道
   */
  async update(id: string, dto: UpdateChannelDto): Promise<ChannelResponseEntity> {
    // 检查渠道是否存在
    const existing = await this.prisma.channel.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Channel with ID "${id}" not found`);
    }

    // 更新数据
    const updateData: Prisma.ChannelUpdateInput = {
      name: dto.name,
      description: dto.description,
      baseUrl: dto.baseUrl,
      status: dto.status,
      metadata: dto.metadata !== undefined ? (dto.metadata as Prisma.InputJsonValue) : undefined,
    };

    // 如果更新了 API 密钥，重新加密
    if (dto.apiKey) {
      updateData.apiKey = encryptApiKey(dto.apiKey);
      // 重置错误计数和健康状态
      updateData.errorCount = 0;
      updateData.healthStatus = null;
      updateData.lastError = null;
    }

    // 使用事务更新渠道和模型
    const channel = await this.prisma.$transaction(async (tx) => {
      const updatedChannel = await tx.channel.update({
        where: { id },
        data: updateData,
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
          models: true,
        },
      });

      // 如果提供了模型列表，更新模型关联
      if (dto.models !== undefined) {
        // 删除旧的模型
        await tx.channelModel.deleteMany({
          where: { channelId: id },
        });

        // 创建新的模型
        if (dto.models.length > 0) {
          await tx.channelModel.createMany({
            data: dto.models.map((modelName) => ({
              channelId: id,
              modelName,
              isEnabled: true,
            })),
          });
        }

        // 重新获取包含models的channel
        return tx.channel.findUnique({
          where: { id },
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
            models: true,
          },
        });
      }

      return updatedChannel;
    });

    // 刷新渠道池缓存（异步，不等待）
    if (this.channelPoolCache) {
      this.channelPoolCache.refresh().catch((err) => {
        this.logger.error(`Failed to refresh channel pool cache: ${err.message}`);
      });
      this.logger.debug(
        `Triggered channel pool cache refresh for updated channel: ${channel.name}`
      );
    }

    return this.toResponseEntity(channel);
  }

  /**
   * 删除渠道（软删除）
   */
  async remove(id: string): Promise<void> {
    const existing = await this.prisma.channel.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { apiKeys: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Channel with ID "${id}" not found`);
    }

    // 检查是否有关联的 API Key
    if (existing._count.apiKeys > 0) {
      throw new BadRequestException(
        `Cannot delete channel with ${existing._count.apiKeys} associated API keys`
      );
    }

    // 软删除
    await this.prisma.channel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // 刷新渠道池缓存（异步，不等待）
    if (this.channelPoolCache) {
      this.channelPoolCache.refresh().catch((err) => {
        this.logger.error(`Failed to refresh channel pool cache: ${err.message}`);
      });
      this.logger.debug(
        `Triggered channel pool cache refresh for deleted channel: ${existing.name}`
      );
    }
  }

  /**
   * 测试渠道连接
   */
  async testConnection(
    id: string
  ): Promise<{ success: boolean; message: string; latency?: number; data?: unknown }> {
    const channel = await this.findOne(id, true);

    try {
      // channel.apiKey 已经在 findOne 方法中被解密了
      const apiKey = channel.apiKey;
      const startTime = Date.now();

      // 系统只支持 Anthropic 原生 API 格式
      const endpoint = `${channel.baseUrl}/v1/messages`;
      const headers = {
        'x-api-key': apiKey,
        'anthropic-version': TEST_CONNECTION_CONFIG.ANTHROPIC_VERSION,
        'Content-Type': 'application/json',
      };
      const testMessage = {
        model: TEST_CONNECTION_CONFIG.DEFAULT_TEST_MODEL,
        messages: [
          {
            role: 'user',
            content: 'Hi, just testing the connection.',
          },
        ],
        max_tokens: 10,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(testMessage),
        signal: AbortSignal.timeout(TEST_CONNECTION_CONFIG.TIMEOUT_MS),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        // 尝试获取错误响应内容
        const errorData = await parseResponseBody(response);

        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          latency,
          data: errorData,
        };
      }

      // 获取成功响应的数据
      const responseData = await parseResponseBody(response);

      // 更新健康状态
      await this.prisma.channel.update({
        where: { id },
        data: {
          lastHealthCheck: new Date(),
          healthStatus: 'healthy',
          errorCount: 0,
          lastError: null,
        },
      });

      return {
        success: true,
        message: 'Connection successful',
        latency,
        data: responseData,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // 更新错误状态
      await this.prisma.channel.update({
        where: { id },
        data: {
          lastHealthCheck: new Date(),
          healthStatus: 'unhealthy',
          errorCount: { increment: 1 },
          lastError: errorMessage,
        },
      });

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * 转换为响应实体
   */
  private toResponseEntity(
    channel: {
      id: string;
      providerId: string;
      name: string;
      description: string | null;
      baseUrl: string;
      apiKey: string;
      status: string;
      lastHealthCheck: Date | null;
      healthStatus: string | null;
      errorCount: number;
      lastError: string | null;
      createdAt: Date;
      updatedAt: Date;
      metadata: unknown;
      provider?: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
      };
      models?: Array<{ modelName: string }>;
    },
    includeRawApiKey = false
  ): ChannelResponseEntity {
    // 处理 API 密钥：解密后脱敏或完整返回
    let apiKeyValue: string;
    if (includeRawApiKey) {
      try {
        apiKeyValue = decryptApiKey(channel.apiKey);
      } catch {
        apiKeyValue = '***';
      }
    } else {
      try {
        const decrypted = decryptApiKey(channel.apiKey);
        apiKeyValue = maskApiKey(decrypted);
      } catch {
        apiKeyValue = '***';
      }
    }

    return {
      id: channel.id,
      providerId: channel.providerId,
      name: channel.name,
      description: channel.description,
      baseUrl: channel.baseUrl,
      apiKey: apiKeyValue,
      status: channel.status as ChannelStatus,
      lastHealthCheck: channel.lastHealthCheck,
      healthStatus: channel.healthStatus,
      errorCount: channel.errorCount,
      lastError: channel.lastError,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
      metadata: channel.metadata as Record<string, unknown> | undefined,
      provider: channel.provider,
      models: [],
    };
  }
}
