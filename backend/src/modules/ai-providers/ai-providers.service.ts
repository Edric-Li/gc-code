import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateAiProviderDto } from './dto/create-ai-provider.dto';
import { UpdateAiProviderDto } from './dto/update-ai-provider.dto';
import { QueryAiProvidersDto } from './dto/query-ai-providers.dto';
import {
  AiProviderResponseEntity,
  PaginatedAiProvidersResponse,
} from './entities/ai-provider-response.entity';
import { Prisma, ProviderType } from '@prisma/client';

@Injectable()
export class AiProvidersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建 AI 提供商
   */
  async create(dto: CreateAiProviderDto): Promise<AiProviderResponseEntity> {
    // 检查 slug 是否已存在
    const existing = await this.prisma.aiProvider.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" already exists`);
    }

    // 使用事务创建提供商和模型
    const provider = await this.prisma.$transaction(async (tx) => {
      const newProvider = await tx.aiProvider.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          type: dto.type,
          logoUrl: dto.logoUrl,
          website: dto.website,
          description: dto.description,
          isBuiltIn: false, // 用户创建的提供商不是预置的
          isActive: dto.isActive ?? true,
          sortOrder: dto.sortOrder ?? 0,
          metadata: (dto.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
        },
        include: {
          models: true,
        },
      });

      // 如果提供了模型列表，创建模型
      if (dto.models && dto.models.length > 0) {
        await tx.providerModel.createMany({
          data: dto.models.map((model, index) => ({
            providerId: newProvider.id,
            modelName: model.modelName,
            displayName: model.displayName,
            description: model.description,
            isEnabled: model.isEnabled ?? true,
            sortOrder: model.sortOrder ?? index,
            metadata: (model.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
          })),
        });

        // 重新获取包含 models 的 provider
        return tx.aiProvider.findUnique({
          where: { id: newProvider.id },
          include: {
            models: true,
          },
        });
      }

      return newProvider;
    });

    return this.toResponseEntity(provider);
  }

  /**
   * 查询 AI 提供商列表（分页）
   */
  async findAll(query: QueryAiProvidersDto): Promise<PaginatedAiProvidersResponse> {
    const { page = 1, limit = 10, search, type, isActive, isBuiltIn } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.AiProviderWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type !== undefined) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isBuiltIn !== undefined) {
      where.isBuiltIn = isBuiltIn;
    }

    // 查询数据
    const [providers, total] = await Promise.all([
      this.prisma.aiProvider.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: {
            select: { channels: true },
          },
          models: {
            orderBy: [{ sortOrder: 'asc' }, { modelName: 'asc' }],
          },
        },
      }),
      this.prisma.aiProvider.count({ where }),
    ]);

    return {
      data: providers.map((p) => ({
        ...this.toResponseEntity(p),
        channelCount: p._count.channels,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取单个 AI 提供商
   */
  async findOne(id: string): Promise<AiProviderResponseEntity> {
    const provider = await this.prisma.aiProvider.findUnique({
      where: { id },
      include: {
        _count: {
          select: { channels: true },
        },
        models: {
          orderBy: [{ sortOrder: 'asc' }, { modelName: 'asc' }],
        },
      },
    });

    if (!provider) {
      throw new NotFoundException(`AI Provider with ID "${id}" not found`);
    }

    return {
      ...this.toResponseEntity(provider),
      channelCount: provider._count.channels,
    };
  }

  /**
   * 更新 AI 提供商
   */
  async update(id: string, dto: UpdateAiProviderDto): Promise<AiProviderResponseEntity> {
    // 检查是否存在
    const existing = await this.prisma.aiProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`AI Provider with ID "${id}" not found`);
    }

    // 如果是预置提供商，不允许修改某些字段
    if (existing.isBuiltIn) {
      if (dto.slug !== undefined && dto.slug !== existing.slug) {
        throw new BadRequestException('Cannot modify slug of built-in provider');
      }
      if (dto.type !== undefined && dto.type !== existing.type) {
        throw new BadRequestException('Cannot modify type of built-in provider');
      }
    }

    // 如果要修改 slug，检查是否冲突
    if (dto.slug && dto.slug !== existing.slug) {
      const conflict = await this.prisma.aiProvider.findUnique({
        where: { slug: dto.slug },
      });

      if (conflict) {
        throw new ConflictException(`Slug "${dto.slug}" already exists`);
      }
    }

    // 使用事务更新提供商和模型
    const provider = await this.prisma.$transaction(async (tx) => {
      const updatedProvider = await tx.aiProvider.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          type: dto.type,
          logoUrl: dto.logoUrl,
          website: dto.website,
          description: dto.description,
          isActive: dto.isActive,
          sortOrder: dto.sortOrder,
          metadata: dto.metadata !== undefined ? (dto.metadata as Prisma.InputJsonValue) : undefined,
        },
        include: {
          models: true,
        },
      });

      // 如果提供了模型列表，更新模型
      if (dto.models !== undefined) {
        // 删除旧的模型
        await tx.providerModel.deleteMany({
          where: { providerId: id },
        });

        // 创建新的模型
        if (dto.models.length > 0) {
          await tx.providerModel.createMany({
            data: dto.models.map((model, index) => ({
              providerId: id,
              modelName: model.modelName,
              displayName: model.displayName,
              description: model.description,
              isEnabled: model.isEnabled ?? true,
              sortOrder: model.sortOrder ?? index,
              metadata: (model.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
            })),
          });
        }

        // 重新获取包含 models 的 provider
        return tx.aiProvider.findUnique({
          where: { id },
          include: {
            models: {
              orderBy: [{ sortOrder: 'asc' }, { modelName: 'asc' }],
            },
          },
        });
      }

      return updatedProvider;
    });

    return this.toResponseEntity(provider);
  }

  /**
   * 删除 AI 提供商
   */
  async remove(id: string): Promise<void> {
    const existing = await this.prisma.aiProvider.findUnique({
      where: { id },
      include: {
        _count: {
          select: { channels: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`AI Provider with ID "${id}" not found`);
    }

    // 不允许删除预置提供商
    if (existing.isBuiltIn) {
      throw new BadRequestException('Cannot delete built-in provider');
    }

    // 检查是否有关联的渠道
    if (existing._count.channels > 0) {
      throw new BadRequestException(
        `Cannot delete provider with ${existing._count.channels} active channels`
      );
    }

    await this.prisma.aiProvider.delete({
      where: { id },
    });
  }

  /**
   * 转换为响应实体
   */
  private toResponseEntity(provider: {
    id: string;
    name: string;
    slug: string;
    type: ProviderType;
    logoUrl: string | null;
    website: string | null;
    description: string | null;
    isBuiltIn: boolean;
    isActive: boolean;
    sortOrder: number;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
    models?: Array<{
      id: string;
      modelName: string;
      displayName: string | null;
      description: string | null;
      isEnabled: boolean;
      sortOrder: number;
      metadata: unknown;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }): AiProviderResponseEntity {
    return {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      type: provider.type,
      logoUrl: provider.logoUrl,
      website: provider.website,
      description: provider.description,
      isBuiltIn: provider.isBuiltIn,
      isActive: provider.isActive,
      sortOrder: provider.sortOrder,
      metadata: provider.metadata as Record<string, unknown> | undefined,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
      models: provider.models?.map((model) => ({
        id: model.id,
        modelName: model.modelName,
        displayName: model.displayName,
        description: model.description,
        isEnabled: model.isEnabled,
        sortOrder: model.sortOrder,
        metadata: model.metadata as Record<string, unknown> | undefined,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      })),
    };
  }
}
