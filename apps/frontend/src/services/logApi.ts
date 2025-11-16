import { api, ApiResponse } from './api';

export interface LoginLog {
  id: string;
  userId?: string;
  email: string;
  loginMethod: 'LOCAL' | 'AZURE_AD' | 'GOOGLE' | 'GITHUB';
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    username: string;
    displayName?: string;
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
  resource: string;
  resourceId?: string;
  description?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    displayName?: string;
  };
}

export interface ApiLog {
  id: string;
  userId?: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  path: string;
  statusCode: number;
  duration: number;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    username: string;
    displayName?: string;
  };
}

export interface LogStatistics {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  loginSuccessRate: string;
  totalAudits: number;
  totalApiCalls: number;
  apiErrors: number;
  apiErrorRate: string;
}

export interface QueryLogsParams {
  skip?: number;
  take?: number;
  startDate?: string;
  endDate?: string;
}

export const logApi = {
  getLoginLogs: (
    params: QueryLogsParams & { userId?: string; success?: boolean; loginMethod?: string } = {}
  ) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, value.toString());
    });
    return api.get<ApiResponse<LoginLog[]>>(`/logs/login?${query.toString()}`);
  },

  getAuditLogs: (
    params: QueryLogsParams & { userId?: string; action?: string; resource?: string } = {}
  ) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, value.toString());
    });
    return api.get<ApiResponse<AuditLog[]>>(`/logs/audit?${query.toString()}`);
  },

  getApiLogs: (
    params: QueryLogsParams & {
      userId?: string;
      method?: string;
      path?: string;
      statusCode?: number;
    } = {}
  ) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, value.toString());
    });
    return api.get<ApiResponse<ApiLog[]>>(`/logs/api?${query.toString()}`);
  },

  getStatistics: (params: { startDate?: string; endDate?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    return api.get<LogStatistics>(`/logs/statistics?${query.toString()}`);
  },
};
