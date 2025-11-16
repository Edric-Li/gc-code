// ChannelGroup 类型定义

import type { Channel } from './channel';

export interface ChannelGroup {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelGroupChannel extends Channel {
  groupId?: string;
  joinedAt?: string;
  priority?: number;
  lastUsedAt?: string | null;
  isActive?: boolean;
}

export interface ChannelGroupChannelsResponse {
  channels: ChannelGroupChannel[];
  total: number;
}

export interface CreateChannelGroupDto {
  name: string;
  description?: string;
  isActive?: boolean;
  priority?: number;
}

export interface UpdateChannelGroupDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  priority?: number;
}

export interface AddChannelsDto {
  channelIds: string[];
}

export interface PaginatedChannelGroupsResponse {
  data: ChannelGroup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
