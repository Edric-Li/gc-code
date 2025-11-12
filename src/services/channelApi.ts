import { api } from './api';
import type {
  Channel,
  CreateChannelDto,
  UpdateChannelDto,
  QueryChannelsDto,
  PaginatedChannelsResponse,
  TestConnectionResponse,
} from '../types/channel';

export const channelApi = {
  // 创建渠道（仅管理员）
  create: (data: CreateChannelDto) => api.post<Channel>('/channels', data),

  // 查询渠道列表（支持分页、搜索、筛选）
  list: (params: QueryChannelsDto = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.providerId) queryParams.append('providerId', params.providerId);
    if (params.status) queryParams.append('status', params.status);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const query = queryParams.toString();
    return api.get<PaginatedChannelsResponse>(`/channels${query ? `?${query}` : ''}`);
  },

  // 查询渠道详情
  getById: (id: string) => api.get<Channel>(`/channels/${id}`),

  // 更新渠道（仅管理员）
  update: (id: string, data: UpdateChannelDto) => api.put<Channel>(`/channels/${id}`, data),

  // 删除渠道（仅管理员）
  delete: (id: string) => api.delete<{ message: string; id: string }>(`/channels/${id}`),

  // 测试渠道连接（仅管理员）
  testConnection: (id: string) =>
    api.post<TestConnectionResponse>(`/channels/${id}/test`, undefined),
};
