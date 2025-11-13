import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KeyStatus } from '@prisma/client';
import type { User, ApiKey } from '@prisma/client';

/**
 * API Key 验证结果
 */
export interface ValidateKeyResult {
  user: User;
  apiKey: ApiKey & { user: User };
}

export class UsageSummary {
  @ApiProperty({ description: '总请求数' })
  totalRequests: number;

  @ApiProperty({ description: '成功次数' })
  successCount: number;

  @ApiProperty({ description: '失败次数' })
  failureCount: number;

  @ApiProperty({ description: '成功率（百分比）' })
  successRate: number;

  @ApiProperty({ description: '总费用' })
  totalCost: number;

  @ApiProperty({ description: '平均每次请求费用' })
  avgCostPerRequest: number;

  @ApiProperty({ description: '最近 7 天请求数' })
  last7DaysRequests: number;

  @ApiProperty({ description: '最近 30 天请求数' })
  last30DaysRequests: number;
}

/**
 * API Key 列表统计数据（轻量级）
 */
export class ApiKeyStatsDto {
  @ApiProperty({ description: '总请求数' })
  totalRequests: number;

  @ApiProperty({ description: '成功次数' })
  successCount: number;

  @ApiProperty({ description: '失败次数' })
  failureCount: number;

  @ApiProperty({ description: '成功率（百分比）' })
  successRate: number;

  @ApiProperty({ description: '消耗的 Token 数量' })
  tokensUsed: number;

  @ApiProperty({ description: '总费用' })
  totalCost: number;

  @ApiProperty({ description: '最近 30 天费用' })
  last30DaysCost: number;
}

export class ApiKeyResponseEntity {
  @ApiProperty({ description: 'API Key ID' })
  id: string;

  @ApiProperty({ description: '用户 ID' })
  userId: string;

  @ApiPropertyOptional({ description: '渠道 ID' })
  channelId?: string;

  @ApiProperty({ description: 'API Key 名称' })
  name: string;

  @ApiPropertyOptional({ description: 'API Key 描述' })
  description?: string;

  @ApiProperty({
    description: '完整 API Key（明文）',
    example: 'sk-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f',
  })
  key: string;

  @ApiProperty({ description: 'API Key 状态', enum: KeyStatus })
  status: KeyStatus;

  @ApiPropertyOptional({ description: '每日费用限制' })
  dailyCostLimit?: number;

  @ApiPropertyOptional({ description: '过期时间' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: '最后使用时间' })
  lastUsedAt?: Date;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: '使用统计摘要' })
  usageSummary?: UsageSummary;

  @ApiPropertyOptional({ description: '列表统计数据', type: ApiKeyStatsDto })
  stats?: ApiKeyStatsDto;

  @ApiPropertyOptional({
    description: '关联的渠道信息',
    type: 'object',
  })
  channel?: {
    id: string;
    name: string;
    provider: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string;
    };
  };
}

export class PaginatedApiKeysResponse {
  @ApiProperty({ type: [ApiKeyResponseEntity], description: 'API Key 列表' })
  data: ApiKeyResponseEntity[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  limit: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}

export class ApiKeyUsageDataPoint {
  @ApiProperty({ description: '统计周期开始' })
  periodStart: Date;

  @ApiProperty({ description: '统计周期结束' })
  periodEnd: Date;

  @ApiProperty({ description: '请求次数' })
  requestCount: number;

  @ApiProperty({ description: '成功次数' })
  successCount: number;

  @ApiProperty({ description: '失败次数' })
  failureCount: number;

  @ApiProperty({ description: '消耗的 Token 数量' })
  tokensUsed: number;

  @ApiProperty({ description: '产生的费用' })
  cost: number;
}

export class ApiKeyUsageResponse {
  @ApiProperty({ description: 'API Key ID' })
  apiKeyId: string;

  @ApiProperty({ description: 'API Key 名称' })
  apiKeyName: string;

  @ApiProperty({ description: '聚合粒度' })
  granularity: string;

  @ApiProperty({ description: '统计周期开始' })
  periodStart: Date;

  @ApiProperty({ description: '统计周期结束' })
  periodEnd: Date;

  @ApiProperty({ type: [ApiKeyUsageDataPoint], description: '使用数据' })
  data: ApiKeyUsageDataPoint[];

  @ApiProperty({ description: '统计摘要' })
  summary: {
    totalRequests: number;
    avgDailyRequests: number;
    totalCost: number;
    avgDailyCost: number;
  };
}

export class ApiKeyStatsOverview {
  @ApiProperty({ description: '总 API Key 数' })
  totalApiKeys: number;

  @ApiProperty({ description: '激活 API Key 数' })
  activeApiKeys: number;

  @ApiProperty({ description: '过期 API Key 数' })
  expiredApiKeys: number;

  @ApiProperty({ description: '已撤销 API Key 数' })
  revokedApiKeys: number;

  @ApiProperty({ description: '总请求数' })
  totalRequests: number;

  @ApiProperty({ description: '成功次数' })
  successCount: number;

  @ApiProperty({ description: '失败次数' })
  failureCount: number;

  @ApiProperty({ description: '成功率（百分比）' })
  successRate: number;

  @ApiProperty({ description: '总费用' })
  totalCost: number;

  @ApiProperty({ description: '平均每次请求费用' })
  avgCostPerRequest: number;

  @ApiProperty({ description: '统计周期开始' })
  periodStart: Date;

  @ApiProperty({ description: '统计周期结束' })
  periodEnd: Date;
}

export class ApiKeyRankingItem {
  @ApiProperty({ description: '排名' })
  rank: number;

  @ApiProperty({ description: 'API Key ID' })
  apiKeyId: string;

  @ApiProperty({ description: 'API Key 名称' })
  apiKeyName: string;

  @ApiProperty({ description: '请求次数' })
  requestCount: number;

  @ApiProperty({ description: '费用' })
  cost: number;

  @ApiProperty({ description: '成功率（百分比）' })
  successRate: number;
}

export class ApiKeyRankingResponse {
  @ApiProperty({ description: '排序字段' })
  orderBy: string;

  @ApiProperty({ description: '统计周期开始' })
  periodStart: Date;

  @ApiProperty({ description: '统计周期结束' })
  periodEnd: Date;

  @ApiProperty({ type: [ApiKeyRankingItem], description: '排行榜数据' })
  data: ApiKeyRankingItem[];
}
