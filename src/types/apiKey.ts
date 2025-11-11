// API Key 类型定义

export enum KeyStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  DELETED = 'DELETED',
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  description?: string;
  key: string; // 完整 API Key（明文）
  status: KeyStatus;
  dailyCostLimit?: number;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  usageSummary?: UsageSummary;
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
}

export interface UpdateApiKeyDto {
  name?: string;
  description?: string;
  expiresAt?: string;
  dailyCostLimit?: number;
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
