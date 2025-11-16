import type { UsageStatsRequest, UsageStatsResponse } from '@/types/usage';

const API_BASE_URL = 'https://stats.gccode.cn';

/**
 * 获取用户模型使用统计
 */
export async function fetchUserModelStats(request: UsageStatsRequest): Promise<UsageStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/apiStats/api/user-model-stats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `请求失败: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * 用户统计数据响应类型
 */
interface UserStatsResponse {
  success: boolean;
  data?: {
    name?: string;
    limits?: {
      dailyCostLimit?: number;
    };
  };
}

/**
 * 获取用户统计数据
 */
export async function fetchUserStats(apiKey: string): Promise<UserStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/apiStats/api/user-stats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `请求失败: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
