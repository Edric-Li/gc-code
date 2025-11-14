import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Pagination } from '@/components/ui/Pagination';
import { apiKeyApi } from '@/services/apiKeyApi';
import type { ApiKey } from '@/types/apiKey';
import { siteConfig } from '@/config/site';

interface RequestLog {
  id: string;
  requestId: string;
  apiKeyId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  duration: number;
  timeToFirstToken?: number;
  cost: number | string;
  statusCode: number;
  success: boolean;
  errorMessage?: string;
  errorType?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  apiKey?: {
    id: string;
    name: string;
  };
  channel?: {
    id: string;
    name: string;
  };
}

interface LogsResponse {
  logs: RequestLog[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// 类型守卫函数
function isLogsResponse(value: unknown): value is LogsResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return Array.isArray(obj.logs) && typeof obj.total === 'number' && typeof obj.pages === 'number';
}

export default function Logs() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [successFilter, setSuccessFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    loadApiKeys();
    loadModels();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [selectedKeyIds, selectedModels, successFilter, currentPage]);

  const loadApiKeys = async () => {
    try {
      const response = await apiKeyApi.list({ limit: 100 });
      setApiKeys(response.data);
    } catch (error) {
      console.error('加载 API Keys 失败:', error);
    }
  };

  const loadModels = async () => {
    try {
      const models = await apiKeyApi.getUsedModels();
      setModels(models);
    } catch (error) {
      console.error('加载模型列表失败:', error);
    }
  };

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const response = await apiKeyApi.getAllRequestLogs({
        page: currentPage,
        limit: pageSize,
        apiKeyIds: selectedKeyIds.length > 0 ? selectedKeyIds : undefined,
        models: selectedModels.length > 0 ? selectedModels : undefined,
        success: successFilter === 'all' ? undefined : successFilter === 'true',
      });

      // 检查响应格式
      if (isLogsResponse(response)) {
        setLogs(response.logs);
        setTotal(response.total);
        setTotalPages(response.pages);
      } else {
        console.error('无效的响应格式:', response);
        setLogs([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('加载日志失败:', error);
      setLogs([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const getApiKeyName = (log: RequestLog) => {
    if (log.apiKey?.name) return log.apiKey.name;
    const key = apiKeys.find((k) => k.id === log.apiKeyId);
    return key?.name || '-';
  };

  return (
    <>
      <Helmet>
        <title>使用日志 - 用户控制台 - {siteConfig.name}</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            使用日志
          </h1>
          <p className="text-gray-600 dark:text-gray-400">查看你的 API 调用记录</p>
        </div>

        {/* 筛选器 */}
        <div className="card overflow-hidden">
          {/* 筛选器标题栏 - 始终可见 */}
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">筛选条件</span>
              {(selectedKeyIds.length > 0 ||
                selectedModels.length > 0 ||
                successFilter !== 'all') && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  {[
                    selectedKeyIds.length > 0 && `${selectedKeyIds.length} 个 Key`,
                    selectedModels.length > 0 && `${selectedModels.length} 个模型`,
                    successFilter !== 'all' && (successFilter === 'true' ? '仅成功' : '仅失败'),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(selectedKeyIds.length > 0 ||
                selectedModels.length > 0 ||
                successFilter !== 'all') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedKeyIds([]);
                    setSelectedModels([]);
                    setSuccessFilter('all');
                    setCurrentPage(1);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1 px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                  清空
                </button>
              )}
              {isFilterExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </button>

          {/* 筛选器表单 - 可折叠 */}
          {isFilterExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key{' '}
                    {selectedKeyIds.length > 0 && (
                      <span className="ml-1 text-blue-600 dark:text-blue-400">
                        ({selectedKeyIds.length})
                      </span>
                    )}
                  </label>
                  <MultiSelect
                    options={apiKeys.map((key) => ({
                      value: key.id,
                      label: key.name,
                    }))}
                    value={selectedKeyIds}
                    onChange={(values) => {
                      setSelectedKeyIds(values);
                      setCurrentPage(1);
                    }}
                    placeholder="选择 API Key..."
                    emptyText="暂无 API Key"
                    searchPlaceholder="搜索 API Key..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    模型{' '}
                    {selectedModels.length > 0 && (
                      <span className="ml-1 text-blue-600 dark:text-blue-400">
                        ({selectedModels.length})
                      </span>
                    )}
                  </label>
                  <MultiSelect
                    options={models.map((model) => ({
                      value: model,
                      label: model,
                    }))}
                    value={selectedModels}
                    onChange={(values) => {
                      setSelectedModels(values);
                      setCurrentPage(1);
                    }}
                    placeholder="选择模型..."
                    emptyText="暂无模型"
                    searchPlaceholder="搜索模型..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    请求状态
                  </label>
                  <select
                    value={successFilter}
                    onChange={(e) => {
                      setSuccessFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-blue-500 cursor-pointer"
                  >
                    <option value="all">全部状态</option>
                    <option value="true">✓ 成功请求</option>
                    <option value="false">✗ 失败请求</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 日志列表 */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">加载中...</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-3">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">暂无日志记录</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                调整筛选条件或稍后再试
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      API Key
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      模型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      输入 Tokens
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      输出 Tokens
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      首字延迟
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      总耗时
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      花费
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      渠道
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      IP 地址
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      User Agent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                        {getApiKeyName(log)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">
                        {log.model}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{log.inputTokens?.toLocaleString() || 0}</span>
                          {((log.cacheCreationInputTokens || 0) > 0 ||
                            (log.cacheReadInputTokens || 0) > 0) && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {(log.cacheCreationInputTokens || 0) > 0 &&
                                `创建: ${log.cacheCreationInputTokens} `}
                              {(log.cacheReadInputTokens || 0) > 0 &&
                                `读取: ${log.cacheReadInputTokens}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {log.outputTokens?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {log.timeToFirstToken ? (
                          <span>
                            {log.timeToFirstToken >= 1000
                              ? `${(log.timeToFirstToken / 1000).toFixed(2)}s`
                              : `${log.timeToFirstToken}ms`}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {log.duration >= 1000
                          ? `${(log.duration / 1000).toFixed(2)}s`
                          : `${log.duration}ms`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {typeof log.cost === 'string'
                          ? `$${parseFloat(log.cost).toFixed(4)}`
                          : `$${log.cost.toFixed(4)}`}
                      </td>
                      <td className="px-4 py-3">
                        {log.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="text-xs text-green-600 dark:text-green-400">成功</span>
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-2 cursor-help"
                            title={log.errorMessage || '未知错误'}
                          >
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <div className="flex flex-col">
                              <span className="text-xs text-red-600 dark:text-red-400">失败</span>
                              {log.errorType && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {log.errorType}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {log.channel?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono text-xs">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {log.userAgent ? (
                          <span className="truncate block max-w-xs" title={log.userAgent}>
                            {log.userAgent}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分页 */}
        {logs.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </>
  );
}
