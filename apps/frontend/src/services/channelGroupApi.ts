import { api } from './api';
import type {
  ChannelGroup,
  CreateChannelGroupDto,
  UpdateChannelGroupDto,
  AddChannelsDto,
  ChannelGroupChannelsResponse,
  PaginatedChannelGroupsResponse,
} from '../types/channelGroup';

export const channelGroupApi = {
  // 创建渠道分组（仅管理员）
  create: (data: CreateChannelGroupDto) => api.post<ChannelGroup>('/channel-groups', data),

  // 查询渠道分组列表
  list: (params: { page?: number; limit?: number; search?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return api.get<PaginatedChannelGroupsResponse>(`/channel-groups${query ? `?${query}` : ''}`);
  },

  // 查询渠道分组详情
  getById: (id: string) => api.get<ChannelGroup>(`/channel-groups/${id}`),

  // 更新渠道分组（仅管理员）
  update: (id: string, data: UpdateChannelGroupDto) =>
    api.put<ChannelGroup>(`/channel-groups/${id}`, data),

  // 删除渠道分组（仅管理员）
  delete: (id: string) => api.delete<{ message: string; id: string }>(`/channel-groups/${id}`),

  // 获取分组下的渠道列表
  getChannels: (groupId: string) =>
    api.get<ChannelGroupChannelsResponse>(`/channel-groups/${groupId}/channels`),

  // 添加渠道到分组
  addChannels: (groupId: string, data: AddChannelsDto) =>
    api.post<{ message: string; added: number }>(`/channel-groups/${groupId}/channels`, data),

  // 从分组移除渠道
  removeChannel: (groupId: string, channelId: string) =>
    api.delete<{ message: string }>(`/channel-groups/${groupId}/channels/${channelId}`),
};
