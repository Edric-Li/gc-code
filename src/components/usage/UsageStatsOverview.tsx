import { Activity, Zap, DollarSign, ArrowUpRight } from 'lucide-react';
import type { UsageOverview, ModelUsageStats } from '@/types/usage';
import { formatNumber } from '@/utils/format';

interface UsageStatsOverviewProps {
  overview: UsageOverview | null;
  data: ModelUsageStats[];
  isLoading: boolean;
  period: 'daily' | 'monthly';
}

export default function UsageStatsOverview({
  overview,
  data,
  isLoading,
  period,
}: UsageStatsOverviewProps) {
  // 计算输入 token
  const inputTokens = data.reduce((sum, item) => sum + item.inputTokens, 0);

  const periodText = period === 'daily' ? '今日' : '本月';

  // 计算费用使用百分比
  const costPercentage =
    overview?.dailyLimit && overview.dailyLimit > 0
      ? (overview.totalCost / overview.dailyLimit) * 100
      : 0;

  // 根据使用百分比确定颜色
  const getCostColor = () => {
    if (costPercentage >= 90)
      return { text: 'text-red-400', bg: 'bg-red-500/10', progress: 'bg-red-500' };
    if (costPercentage >= 80)
      return { text: 'text-amber-400', bg: 'bg-amber-500/10', progress: 'bg-amber-500' };
    return { text: 'text-green-400', bg: 'bg-green-500/10', progress: 'bg-green-500' };
  };

  const costColor = getCostColor();

  const stats = [
    {
      label: `${periodText}请求数`,
      value: overview ? overview.totalRequests.toLocaleString() : '0',
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: `${periodText}Token数`,
      value: overview ? formatNumber(overview.totalTokens) : '0',
      icon: Zap,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: `${periodText}输入Token`,
      value: formatNumber(inputTokens),
      icon: ArrowUpRight,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:backdrop-blur-sm">
      <h3 className="mb-8 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
        <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
        使用统计概览
      </h3>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {/* 费用卡片 - 带限制和进度条 */}
        <div
          className={`rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700/50 dark:bg-gray-900/30 dark:hover:border-gray-600 dark:hover:bg-gray-900/50`}
        >
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
              <div className="h-10 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {periodText}费用
                </span>
                <div className={`rounded-lg p-2 ${costColor.bg}`}>
                  <DollarSign className={`h-5 w-5 ${costColor.text}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {overview ? overview.totalCostFormatted : '$0.00'}
                </div>
                {/* 只在有日限制时显示限制信息 */}
                {overview?.dailyLimit && overview.dailyLimit > 0 && period === 'daily' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    / ${overview.dailyLimit.toFixed(0)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* 常规统计卡片 */}
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700/50 dark:bg-gray-900/30 dark:hover:border-gray-600 dark:hover:bg-gray-900/50"
          >
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
                <div className="h-10 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </span>
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
