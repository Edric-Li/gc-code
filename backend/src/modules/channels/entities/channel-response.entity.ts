import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelStatus } from '@prisma/client';

export class ChannelModelEntity {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: '模型名称' })
  modelName: string;

  @ApiPropertyOptional({ description: '模型映射键' })
  modelKey?: string;

  @ApiProperty({ description: '是否启用' })
  isEnabled: boolean;

  @ApiPropertyOptional({ description: '模型元数据' })
  metadata?: Record<string, unknown>;
}

export class ChannelResponseEntity {
  @ApiProperty({ description: 'ID' })
  id: string;

  @ApiProperty({ description: '所属 AI 提供商 ID' })
  providerId: string;

  @ApiProperty({ description: '渠道名称' })
  name: string;

  @ApiPropertyOptional({ description: '渠道描述' })
  description?: string;

  @ApiProperty({ description: 'API 基础地址' })
  baseUrl: string;

  @ApiProperty({ description: 'API 密钥（脱敏）' })
  apiKey: string;

  @ApiProperty({ description: '渠道状态', enum: ChannelStatus })
  status: ChannelStatus;

  @ApiPropertyOptional({ description: '最后健康检查时间' })
  lastHealthCheck?: Date;

  @ApiPropertyOptional({ description: '健康状态' })
  healthStatus?: string;

  @ApiProperty({ description: '连续错误次数' })
  errorCount: number;

  @ApiPropertyOptional({ description: '最后错误信息' })
  lastError?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: '扩展元数据' })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'AI 提供商信息' })
  provider?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };

  @ApiPropertyOptional({ description: '支持的模型列表', type: [ChannelModelEntity] })
  models?: ChannelModelEntity[];
}

export class PaginatedChannelsResponse {
  @ApiProperty({ type: [ChannelResponseEntity], description: '渠道列表' })
  data: ChannelResponseEntity[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  limit: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}
