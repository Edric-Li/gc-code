// API Key 类型定义

export enum KeyStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  DELETED = 'DELETED',
}

export enum ChannelTargetType {
  CHANNEL = 'CHANNEL',
  PROVIDER = 'PROVIDER',
}

export interface ApiKeyStats {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  tokensUsed: number;
  totalCost: number;
  last30DaysCost: number;
}

export interface ApiKey {
  id: string;
  userId: string;
  channelId?: string;
  channelTargetType?: ChannelTargetType;
  providerId?: string;
  name: string;
  description?: string;
  key: string; // 完整 API Key（明文）
  token?: string; // 用于列表展示的脱敏 token
  status: KeyStatus;
  dailyCostLimit?: number;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  usageSummary?: UsageSummary;
  stats?: ApiKeyStats;
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
  provider?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
}

export interface UsageSummary {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  totalCost: number;
  avgCostPerRequest: number;
  last7DaysRequests: number;
  last30DaysRequests: number;
}

export interface PaginatedApiKeysResponse {
  data: ApiKey[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateApiKeyDto {
  name: string;
  description?: string;
  expiresAt?: string;
  dailyCostLimit?: number;
  userId: string; // 管理员创建 API Key 时必须指定用户
  channelTargetType?: ChannelTargetType; // 渠道目标类型
  channelId?: string; // 绑定的渠道ID（当 targetType 为 CHANNEL 时）
  providerId?: string; // 绑定的供货商ID（当 targetType 为 PROVIDER 时）
}

export interface UpdateApiKeyDto {
  name?: string;
  description?: string;
  expiresAt?: string;
  dailyCostLimit?: number;
  channelTargetType?: ChannelTargetType; // 渠道目标类型
  channelId?: string; // 绑定的渠道ID（当 targetType 为 CHANNEL 时）
  providerId?: string; // 绑定的供货商ID（当 targetType 为 PROVIDER 时）
}

export interface QueryApiKeysDto {
  page?: number;
  limit?: number;
  status?: KeyStatus;
  search?: string;
  userId?: string; // 按用户ID筛选
  includeDeleted?: boolean;
}

export interface ApiKeyStatsOverview {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  activeTokens: number;
  expiredTokens: number;
  revokedTokens: number;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  totalCost: number;
  avgCostPerRequest: number;
  periodStart: string;
  periodEnd: string;
  modelDistribution?: Array<{
    model: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

export interface ApiKeyUsageDataPoint {
  periodStart: string;
  periodEnd: string;
  requestCount: number;
  successCount: number;
  failureCount: number;
  tokensUsed: number;
  cost: number;
}

export interface ApiKeyUsageResponse {
  tokenId: string;
  tokenName: string;
  granularity: string;
  periodStart: string;
  periodEnd: string;
  data: ApiKeyUsageDataPoint[];
  summary: {
    totalRequests: number;
    avgDailyRequests: number;
    totalCost: number;
    avgDailyCost: number;
  };
}

export interface ApiKeyRankingItem {
  rank: number;
  tokenId: string;
  tokenName: string;
  requestCount: number;
  cost: number;
  successRate: number;
}

export interface ApiKeyRankingResponse {
  orderBy: string;
  periodStart: string;
  periodEnd: string;
  data: ApiKeyRankingItem[];
}
