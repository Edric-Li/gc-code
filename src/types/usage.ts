// 用量查询相关类型定义

export type Period = 'daily' | 'monthly';

export interface ModelCosts {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  total: number;
}

export interface ModelCostsFormatted {
  input: string;
  output: string;
  cacheWrite: string;
  cacheRead: string;
  total: string;
}

export interface ModelPricing {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

export interface ModelUsageStats {
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreateTokens: number;
  cacheReadTokens: number;
  allTokens: number;
  costs: ModelCosts;
  formatted: ModelCostsFormatted;
  pricing: ModelPricing;
}

export interface UsageStatsResponse {
  success: boolean;
  data: ModelUsageStats[];
  period: Period;
  dailyLimit?: number; // 日限制（可选）
}

export interface UsageStatsRequest {
  apiKey: string;
  period: Period;
}

export interface UsageOverview {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  totalCostFormatted: string;
  dailyLimit?: number; // 日限制（可选）
}
