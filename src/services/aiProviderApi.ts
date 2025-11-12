import { api } from './api';
import type {
  AiProvider,
  CreateAiProviderDto,
  UpdateAiProviderDto,
  QueryAiProvidersDto,
  PaginatedAiProvidersResponse,
} from '../types/aiProvider';

export const aiProviderApi = {
  // 创建 AI Provider（仅管理员）
  create: (data: CreateAiProviderDto) => api.post<AiProvider>('/ai-providers', data),

  // 查询 AI Provider 列表（支持分页、搜索、筛选）
  list: (params: QueryAiProvidersDto = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.type) queryParams.append('type', params.type);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    return api.get<PaginatedAiProvidersResponse>(`/ai-providers${query ? `?${query}` : ''}`);
  },

  // 查询 AI Provider 详情
  getById: (id: string) => api.get<AiProvider>(`/ai-providers/${id}`),

  // 更新 AI Provider（仅管理员）
  update: (id: string, data: UpdateAiProviderDto) =>
    api.put<AiProvider>(`/ai-providers/${id}`, data),

  // 删除 AI Provider（仅管理员）
  delete: (id: string) => api.delete<{ message: string; id: string }>(`/ai-providers/${id}`),
};
