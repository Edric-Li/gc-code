import { useState, useEffect, useCallback } from 'react';
import { fetchUserModelStats, fetchUserStats } from '@/services/usageApi';
import type { Period, ModelUsageStats, UsageOverview } from '@/types/usage';

interface UseUsageStatsOptions {
  apiKey: string | null;
  period: Period;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * 用量统计数据获取 Hook
 */
export function useUsageStats({
  apiKey,
  period,
  autoRefresh = false,
  refreshInterval = 60000, // 默认 60 秒
}: UseUsageStatsOptions) {
  const [data, setData] = useState<ModelUsageStats[]>([]);
  const [overview, setOverview] = useState<UsageOverview | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 计算统计概览
  const calculateOverview = useCallback(
    (stats: ModelUsageStats[], dailyLimit?: number): UsageOverview => {
      const totalRequests = stats.reduce((sum, item) => sum + item.requests, 0);
      const totalTokens = stats.reduce((sum, item) => sum + item.allTokens, 0);
      const totalCost = stats.reduce((sum, item) => sum + item.costs.total, 0);

      return {
        totalRequests,
        totalTokens,
        totalCost,
        totalCostFormatted: `$${totalCost.toFixed(2)}`,
        dailyLimit,
      };
    },
    []
  );

  // 获取数据
  const fetchData = useCallback(async () => {
    if (!apiKey) {
      setData([]);
      setOverview(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 并行获取模型统计数据和用户信息
      const [modelStatsResponse, userStatsResponse] = await Promise.all([
        fetchUserModelStats({ apiKey, period }),
        fetchUserStats(apiKey),
      ]);

      if (modelStatsResponse.success && modelStatsResponse.data) {
        const dailyLimit = userStatsResponse?.data?.limits?.dailyCostLimit || 0;
        const name = userStatsResponse?.data?.name || '';
        setData(modelStatsResponse.data);
        setOverview(calculateOverview(modelStatsResponse.data, dailyLimit));
        setUserName(name);
      } else {
        throw new Error('获取数据失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      setData([]);
      setOverview(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, period, calculateOverview]);

  // 初始加载和周期变化时重新获取
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh || !apiKey) return;

    const timer = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [autoRefresh, apiKey, refreshInterval, fetchData]);

  return {
    data,
    overview,
    userName,
    isLoading,
    error,
    refetch: fetchData,
  };
}
