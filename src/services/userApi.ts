import { api, ApiResponse } from './api';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
}

export interface QueryUsersParams {
  skip?: number;
  take?: number;
  search?: string;
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
}

export interface UpdateUserData {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
}

export interface SimpleUser {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export const userApi = {
  getAll: (params: QueryUsersParams = {}) => {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set('skip', params.skip.toString());
    if (params.take !== undefined) query.set('take', params.take.toString());
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.isActive !== undefined) query.set('isActive', params.isActive.toString());

    return api.get<ApiResponse<User[]>>(`/users?${query.toString()}`);
  },

  getOne: (id: string) => api.get<User>(`/users/${id}`),

  update: (id: string, data: UpdateUserData) => api.put<User>(`/users/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/users/${id}`),

  getStatistics: () => api.get<UserStatistics>('/users/statistics'),

  getSimpleList: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get<SimpleUser[]>(`/users/simple-list${query}`);
  },
};
