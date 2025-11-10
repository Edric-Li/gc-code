// API 基础配置
const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface ApiResponse<T> {
  data: T;
  total?: number;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // 尝试解析错误响应
    let errorMessage = `HTTP ${response.status}`;
    let errorDetails: {
      message?: string;
      error?: string;
      errors?: Array<{ message?: string } | string>;
    } | null = null;

    try {
      errorDetails = await response.json();
      errorMessage = errorDetails.message || errorDetails.error || errorMessage;

      // 如果有验证错误，提取详细信息
      if (errorDetails.errors && Array.isArray(errorDetails.errors)) {
        errorMessage = errorDetails.errors
          .map((e) => (typeof e === 'string' ? e : e.message || ''))
          .join(', ');
      }
    } catch (parseError) {
      // 如果无法解析JSON，尝试获取文本
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // 使用默认错误消息
      }
    }

    // 对特定状态码提供友好的错误消息
    if (response.status === 401) {
      errorMessage = '未授权，请重新登录';
      // 清除token
      localStorage.removeItem('token');
    } else if (response.status === 403) {
      errorMessage = '权限不足，无法访问该资源';
    } else if (response.status === 404) {
      errorMessage = errorDetails?.message || '请求的资源不存在';
    } else if (response.status === 500) {
      errorMessage = '服务器内部错误，请稍后重试';
    }

    const error = new Error(errorMessage) as Error & {
      status?: number;
      details?: typeof errorDetails;
    };
    // 附加额外的错误信息
    error.status = response.status;
    error.details = errorDetails;
    throw error;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
