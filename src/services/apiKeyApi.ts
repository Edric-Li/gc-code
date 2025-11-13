import { api } from './api';
import type {
  ApiKey,
  CreateApiKeyDto,
  UpdateApiKeyDto,
  QueryApiKeysDto,
  PaginatedApiKeysResponse,
  ApiKeyStatsOverview,
  ApiKeyUsageResponse,
  ApiKeyRankingResponse,
} from '../types/apiKey';

export const apiKeyApi = {
  // 创建 API Key
  create: (data: CreateApiKeyDto) => api.post<ApiKey>('/api-keys', data),

  // 查询 API Key 列表（分页）
  list: async (params: QueryApiKeysDto = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.includeDeleted) queryParams.append('includeDeleted', 'true');

    const query = queryParams.toString();
    const response = await api.get<PaginatedApiKeysResponse>(
      `/api-keys${query ? `?${query}` : ''}`
    );

    // 为每个 API Key 添加 token 字段（用于列表展示）
    response.data = response.data.map((apiKey) => ({
      ...apiKey,
      token: apiKey.key, // 将 key 映射到 token
    }));

    return response;
  },

  // 查询 API Key 详情
  getById: (id: string) => api.get<ApiKey>(`/api-keys/${id}`),

  // 更新 API Key
  update: (id: string, data: UpdateApiKeyDto) => api.patch<ApiKey>(`/api-keys/${id}`, data),

  // 删除 API Key（软删除）
  delete: (id: string) =>
    api.delete<{ message: string; id: string; deletedAt: string }>(`/api-keys/${id}`),

  // 撤销 API Key
  revoke: (id: string) =>
    api.post<{ message: string; id: string; status: string; revokedAt: string }>(
      `/api-keys/${id}/revoke`
    ),

  // 恢复已删除的 API Key
  restore: (id: string) =>
    api.post<{ message: string; id: string; status: string }>(`/api-keys/${id}/restore`),

  // 获取用户总体统计
  getOverview: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return api.get<ApiKeyStatsOverview>(`/api-keys/stats/overview${query ? `?${query}` : ''}`);
  },

  // 获取单个 API Key 的使用趋势
  getUsage: (
    id: string,
    params?: {
      granularity?: 'hour' | 'day' | 'week' | 'month';
      startDate?: string;
      endDate?: string;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.granularity) queryParams.append('granularity', params.granularity);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    return api.get<ApiKeyUsageResponse>(`/api-keys/${id}/usage${query ? `?${query}` : ''}`);
  },

  // 获取用量排行榜
  getRanking: (params?: {
    orderBy?: 'requests' | 'cost' | 'quota';
    startDate?: string;
    endDate?: string;
    top?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.top) queryParams.append('top', params.top.toString());

    const query = queryParams.toString();
    return api.get<ApiKeyRankingResponse>(`/api-keys/stats/ranking${query ? `?${query}` : ''}`);
  },

  // 获取详细请求日志
  getRequestLogs: (
    id: string,
    params?: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      success?: boolean;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.success !== undefined)
      queryParams.append('success', params.success.toString());

    const query = queryParams.toString();
    return api.get<Record<string, unknown>>(`/api-keys/${id}/request-logs${query ? `?${query}` : ''}`);
  },

  // 获取所有 API Key 的详细请求日志
  getAllRequestLogs: (params?: {
    page?: number;
    limit?: number;
    apiKeyId?: string;
    startDate?: string;
    endDate?: string;
    success?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.apiKeyId) queryParams.append('apiKeyId', params.apiKeyId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.success !== undefined)
      queryParams.append('success', params.success.toString());

    const query = queryParams.toString();
    return api.get<Record<string, unknown>>(`/api-keys/request-logs/all${query ? `?${query}` : ''}`);
  },
};
