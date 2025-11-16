// AI Provider 类型定义

export enum ProviderType {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  AZURE_OPENAI = 'AZURE_OPENAI',
  GOOGLE_AI = 'GOOGLE_AI',
  KIMI = 'KIMI',
  DEEPSEEK = 'DEEPSEEK',
  BAIDU = 'BAIDU',
  ALIBABA = 'ALIBABA',
  CUSTOM = 'CUSTOM',
}

export interface ProviderModel {
  id: string;
  modelName: string;
  displayName?: string;
  description?: string;
  isEnabled: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderModelDto {
  modelName: string;
  displayName?: string;
  description?: string;
  isEnabled?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface AiProvider {
  id: string;
  name: string;
  slug: string;
  type: ProviderType;
  logoUrl?: string;
  website?: string;
  description?: string;
  isBuiltIn: boolean;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  channelCount?: number;
  models?: ProviderModel[];
}

export interface CreateAiProviderDto {
  name: string;
  slug: string;
  type: ProviderType;
  logoUrl?: string;
  website?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
  models?: ProviderModelDto[];
}

export interface UpdateAiProviderDto {
  name?: string;
  slug?: string;
  type?: ProviderType;
  logoUrl?: string;
  website?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
  models?: ProviderModelDto[];
}

export interface QueryAiProvidersDto {
  page?: number;
  limit?: number;
  search?: string;
  type?: ProviderType;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedAiProvidersResponse {
  data: AiProvider[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
