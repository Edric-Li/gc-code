import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderType } from '@prisma/client';

export class AiProviderResponseEntity {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: '提供商名称' })
  name: string;

  @ApiProperty({ description: 'URL友好标识' })
  slug: string;

  @ApiProperty({ description: '提供商类型', enum: ProviderType })
  type: ProviderType;

  @ApiPropertyOptional({ description: 'Logo 地址' })
  logoUrl?: string;

  @ApiPropertyOptional({ description: '官网地址' })
  website?: string;

  @ApiPropertyOptional({ description: '描述信息' })
  description?: string;

  @ApiProperty({ description: '是否为预置提供商' })
  isBuiltIn: boolean;

  @ApiProperty({ description: '是否启用' })
  isActive: boolean;

  @ApiProperty({ description: '排序' })
  sortOrder: number;

  @ApiPropertyOptional({ description: '扩展元数据' })
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: '渠道数量' })
  channelCount?: number;
}

export class PaginatedAiProvidersResponse {
  @ApiProperty({ type: [AiProviderResponseEntity], description: 'AI 提供商列表' })
  data: AiProviderResponseEntity[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  limit: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}
