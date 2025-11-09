import { ArrowRight, ArrowLeft, Database, Zap } from 'lucide-react';
import type { ModelUsageStats } from '@/types/usage';
import { formatNumber } from '@/utils/format';

interface TokenDistributionProps {
  data: ModelUsageStats[];
  isLoading: boolean;
  period: 'daily' | 'monthly';
}

export default function TokenDistribution({ data, isLoading, period }: TokenDistributionProps) {
  // 计算各项 token 总和
  const inputTokens = data.reduce((sum, item) => sum + item.inputTokens, 0);
  const outputTokens = data.reduce((sum, item) => sum + item.outputTokens, 0);
  const cacheCreateTokens = data.reduce((sum, item) => sum + item.cacheCreateTokens, 0);
  const cacheReadTokens = data.reduce((sum, item) => sum + item.cacheReadTokens, 0);
  const totalTokens = data.reduce((sum, item) => sum + item.allTokens, 0);

  const periodText = period === 'daily' ? '今日' : '本月';

  const tokenItems = [
    {
      label: '输入 Token',
      value: inputTokens,
      icon: ArrowRight,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: '输出 Token',
      value: outputTokens,
      icon: ArrowLeft,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: '缓存创建 Token',
      value: cacheCreateTokens,
      icon: Database,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: '缓存读取 Token',
      value: cacheReadTokens,
      icon: Zap,
      color: 'text-amber-600 dark:text-amber-400',
    },
  ];

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:backdrop-blur-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-6 w-6 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
          <div className="h-6 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-5 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
              <div className="h-5 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:backdrop-blur-sm">
        <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
          <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          Token 使用分布 ({periodText})
        </h3>
        <div className="py-8 text-center text-gray-600 dark:text-gray-400">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:backdrop-blur-sm">
      <h3 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
        <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        Token 使用分布 ({periodText})
      </h3>

      <div className="space-y-4">
        {tokenItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-gray-200 hover:bg-gray-100 dark:border-gray-700/50 dark:bg-gray-900/30 dark:hover:border-gray-600 dark:hover:bg-gray-900/50"
          >
            <div className="flex items-center gap-3">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatNumber(item.value)}
            </span>
          </div>
        ))}

        {/* 总计 */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
          <span className="text-base font-semibold text-gray-900 dark:text-white">
            {periodText}总计
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(totalTokens)}
          </span>
        </div>
      </div>
    </div>
  );
}
