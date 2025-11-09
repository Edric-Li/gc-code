import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { RefreshCw } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import ApiKeyManager from '@/components/usage/ApiKeyManager';
import UsageStatsOverview from '@/components/usage/UsageStatsOverview';
import TokenDistribution from '@/components/usage/TokenDistribution';
import ModelDistributionChart from '@/components/usage/ModelDistributionChart';
import { useApiKey } from '@/hooks/useApiKey';
import { useUsageStats } from '@/hooks/useUsageStats';
import type { Period } from '@/types/usage';

export default function Usage() {
  const [period, setPeriod] = useState<Period>('daily');
  const [showSettings, setShowSettings] = useState(false);

  const { apiKey, hasApiKey, saveApiKey, clearApiKey, getMaskedApiKey } = useApiKey();

  const { data, overview, userName, isLoading, error, refetch } = useUsageStats({
    apiKey,
    period,
  });

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };

  const handleSaveApiKey = (key: string) => {
    saveApiKey(key);
    setShowSettings(false);
  };

  const handleClearApiKey = () => {
    clearApiKey();
    setShowSettings(false);
  };

  return (
    <PageLayout>
      <Helmet>
        <title>用量查询 - GC Code</title>
        <meta name="description" content="查看您的 API 使用统计和费用详情" />
      </Helmet>

      {/* API Key 管理对话框 */}
      {showSettings && (
        <ApiKeyManager
          apiKey={apiKey}
          maskedApiKey={getMaskedApiKey()}
          onSave={handleSaveApiKey}
          onClear={handleClearApiKey}
          onCancel={() => setShowSettings(false)}
        />
      )}

      {/* 主内容区域 */}
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container-custom py-12">
          {/* 主要内容 */}
          {hasApiKey ? (
            <>
              {/* 顶部控制栏 */}
              <div className="mb-12 flex flex-wrap items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Hi, {userName || '访客'}
                  </h1>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">API Key:</span>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="cursor-pointer border-b border-dashed border-gray-400 text-sm font-mono text-gray-700 transition-colors hover:border-primary-600 hover:text-primary-600 dark:border-gray-500 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:text-primary-400"
                    >
                      {getMaskedApiKey()}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* 周期选择器 */}
                  <div className="flex rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800/50">
                    <button
                      onClick={() => handlePeriodChange('daily')}
                      className={`rounded-md px-6 py-2.5 text-sm font-medium transition-all ${
                        period === 'daily'
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      今日
                    </button>
                    <button
                      onClick={() => handlePeriodChange('monthly')}
                      className={`rounded-md px-6 py-2.5 text-sm font-medium transition-all ${
                        period === 'monthly'
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      本月
                    </button>
                  </div>

                  {/* 刷新按钮 */}
                  <button
                    onClick={refetch}
                    disabled={isLoading}
                    className="rounded-lg border border-gray-300 bg-white p-2.5 text-gray-600 transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700/50 dark:hover:text-white"
                    title="刷新数据"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mb-8 rounded-xl border border-red-300 bg-red-50 p-6 backdrop-blur-sm dark:border-red-500/50 dark:bg-red-500/10">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* 数据展示区域 */}
              <div className="space-y-8">
                {/* 使用统计概览 */}
                <UsageStatsOverview
                  overview={overview}
                  data={data}
                  isLoading={false}
                  period={period}
                />

                {/* 模型使用分布 */}
                <ModelDistributionChart data={data} isLoading={false} />

                {/* Token 使用分布 */}
                <TokenDistribution data={data} isLoading={false} period={period} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="rounded-full bg-gradient-to-br from-primary-500 to-primary-600 p-6 shadow-lg dark:from-primary-600 dark:to-primary-700">
                <svg
                  className="h-16 w-16 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <h2 className="mt-8 text-3xl font-bold text-gray-900 dark:text-white">
                欢迎使用用量查询
              </h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                请设置 API Key 开始查看统计数据
              </p>
              <button
                onClick={() => setShowSettings(true)}
                className="mt-8 rounded-lg bg-primary-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                设置 API Key
              </button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
