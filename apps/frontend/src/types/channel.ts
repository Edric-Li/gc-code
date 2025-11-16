// Channel 类型定义

export enum ChannelStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE',
}

export interface ChannelModel {
  id: string;
  modelName: string;
  modelKey?: string;
  isEnabled: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Channel {
  id: string;
  providerId: string;
  name: string;
  description?: string;
  baseUrl: string;
  apiKey: string; // 前端显示的是脱敏后的值
  status: ChannelStatus;
  healthStatus?: string;
  lastHealthCheck?: string;
  errorCount: number;
  lastError?: string;
  priority?: number;
  weight?: number;
  metadata?: Record<string, unknown>;
  models?: ChannelModel[];
  provider: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelDto {
  providerId: string;
  name: string;
  description?: string;
  baseUrl: string;
  apiKey: string;
  models?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateChannelDto {
  name?: string;
  description?: string;
  baseUrl?: string;
  apiKey?: string;
  status?: ChannelStatus;
  models?: string[];
  metadata?: Record<string, unknown>;
}

export interface QueryChannelsDto {
  page?: number;
  limit?: number;
  search?: string;
  providerId?: string;
  status?: ChannelStatus;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedChannelsResponse {
  data: Channel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  latency?: number;
  data?: unknown; // API返回的原始响应数据
}
