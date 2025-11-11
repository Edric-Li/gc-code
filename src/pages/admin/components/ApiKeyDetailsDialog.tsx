import { X, TrendingUp, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import type { ApiKey } from '@/types/apiKey';

interface ApiKeyDetailsDialogProps {
  apiKey: ApiKey;
  onClose: () => void;
}

export default function ApiKeyDetailsDialog({ apiKey, onClose }: ApiKeyDetailsDialogProps) {
  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN');
  };

  const summary = apiKey.usageSummary;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{apiKey.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ID: {apiKey.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">基本信息</h4>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">描述</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {apiKey.description || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">状态</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">{apiKey.status}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">完整 API Key</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded break-all">
                    {apiKey.token}
                  </code>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">每日费用限制</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {apiKey.dailyCostLimit ? `¥${apiKey.dailyCostLimit.toFixed(2)}` : '无限制'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">创建时间</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatDate(apiKey.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">最后使用</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatDate(apiKey.lastUsedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">过期时间</dt>
                <dd className="text-sm text-gray-900 dark:text-white mt-1">
                  {formatDate(apiKey.expiresAt)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Usage Summary */}
          {summary && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                使用统计
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">总请求</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.totalRequests}
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">成功</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.successCount}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {summary.successRate.toFixed(1)}%
                  </div>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">失败</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.failureCount}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-medium">总费用</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    ¥{summary.totalCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    平均 ¥{summary.avgCostPerRequest.toFixed(4)}/次
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">最近 7 天请求</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {summary.last7DaysRequests}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">最近 30 天请求</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {summary.last30DaysRequests}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
