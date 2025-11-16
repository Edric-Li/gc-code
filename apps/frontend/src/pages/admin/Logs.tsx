import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Pagination } from '@/components/ui/Pagination';
import { logApi, type LoginLog, type AuditLog, type ApiLog } from '@/services/logApi';
import { apiKeyApi } from '@/services/apiKeyApi';
import type { ApiKey } from '@/types/apiKey';

type LogType = 'login' | 'audit' | 'api' | 'apikey-usage';

export default function Logs() {
  const [activeTab, setActiveTab] = useState<LogType>('login');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">日志查看</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">查看系统各类日志记录</p>
      </div>

      {/* 标签页切换 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'login' as LogType, name: '登录日志' },
            { id: 'audit' as LogType, name: '审计日志' },
            { id: 'api' as LogType, name: 'API 日志' },
            { id: 'apikey-usage' as LogType, name: 'API Key 使用日志' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 内容区域 */}
      <div>
        {activeTab === 'login' && <LoginLogsList />}
        {activeTab === 'audit' && <AuditLogsList />}
        {activeTab === 'api' && <ApiLogsList />}
        {activeTab === 'apikey-usage' && <ApiKeyRequestLogsList />}
      </div>
    </div>
  );
}

// 登录日志列表
function LoginLogsList() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await logApi.getLoginLogs({
        skip: 0,
        take: pageSize,
      });
      setLogs(response.data);
    } catch (err) {
      console.error('加载登录日志失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  if (loading && logs.length === 0) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">加载中...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                用户
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                登录方式
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                IP 地址
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                时间
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  {log.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {log.user?.displayName || log.user?.username || log.email}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{log.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {log.loginMethod}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {log.ipAddress || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(log.createdAt).toLocaleString('zh-CN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 审计日志列表
function AuditLogsList() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await logApi.getAuditLogs({
        skip: 0,
        take: pageSize,
      });
      setLogs(response.data);
    } catch (err) {
      console.error('加载审计日志失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  if (loading && logs.length === 0) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">加载中...</div>;
  }

  const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                操作
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                用户
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                资源
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                描述
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                时间
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      actionColors[log.action] || actionColors.CREATE
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {log.user?.displayName || log.user?.username}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{log.user?.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{log.resource}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {log.description || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(log.createdAt).toLocaleString('zh-CN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// API 日志列表
type MethodFilter = 'all' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type StatusFilter = 'all' | '2' | '3' | '4' | '5';

function ApiLogsList() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pathFilter, setPathFilter] = useState('');
  const [debouncedPath, setDebouncedPath] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const pageSize = 20;

  // 防抖处理路径搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPath(pathFilter);
      setPage(1); // 重置到第一页
    }, 500);
    return () => clearTimeout(timer);
  }, [pathFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await logApi.getApiLogs({
        skip: (page - 1) * pageSize,
        take: pageSize,
        method: methodFilter !== 'all' ? methodFilter : undefined,
        statusCode: statusFilter !== 'all' ? parseInt(statusFilter) : undefined,
        path: debouncedPath || undefined,
      });
      setLogs(response.data);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('加载 API 日志失败:', err);
      setError('加载日志失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, methodFilter, statusFilter, debouncedPath]);

  const totalPages = Math.ceil(total / pageSize);

  const getStatusColor = (status: number) => {
    if (status < 300) return 'text-green-600 dark:text-green-400';
    if (status < 400) return 'text-blue-600 dark:text-blue-400';
    if (status < 500) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      POST: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      PUT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    };
    return colors[method] || colors.GET;
  };

  // 判断是否是慢查询（超过 3 秒）
  const isSlowQuery = (duration: number) => duration >= 3000;

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">筛选条件</span>
            {(methodFilter !== 'all' || statusFilter !== 'all' || pathFilter) && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                {[
                  methodFilter !== 'all' && methodFilter,
                  statusFilter !== 'all' && `状态 ${statusFilter}xx`,
                  pathFilter && `路径: ${pathFilter}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(methodFilter !== 'all' || statusFilter !== 'all' || pathFilter) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMethodFilter('all');
                  setStatusFilter('all');
                  setPathFilter('');
                  setPage(1);
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

        {isFilterExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  HTTP 方法
                </label>
                <select
                  value={methodFilter}
                  onChange={(e) => {
                    setMethodFilter(e.target.value as MethodFilter);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部方法</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  状态码范围
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部状态</option>
                  <option value="2">2xx 成功</option>
                  <option value="3">3xx 重定向</option>
                  <option value="4">4xx 客户端错误</option>
                  <option value="5">5xx 服务器错误</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  路径搜索
                </label>
                <input
                  type="text"
                  value={pathFilter}
                  onChange={(e) => {
                    setPathFilter(e.target.value);
                    setPage(1);
                  }}
                  placeholder="搜索路径..."
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 日志表格 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && logs.length === 0 ? (
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
            <p className="text-gray-600 dark:text-gray-400 font-medium">暂无 API 日志记录</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              API 请求将被自动记录到此处
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
                    方法
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    路径
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    状态码
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    耗时
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    用户
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    IP 地址
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors ${
                      isSlowQuery(log.duration)
                        ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-500'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(
                          log.method
                        )}`}
                      >
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">
                      <span className="truncate block max-w-xs" title={log.path}>
                        {log.path}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-semibold ${getStatusColor(log.statusCode)} ${
                          log.errorMessage
                            ? 'cursor-help border-b-2 border-dotted border-current'
                            : ''
                        }`}
                        title={log.errorMessage || undefined}
                      >
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`font-medium ${
                          isSlowQuery(log.duration)
                            ? 'text-yellow-700 dark:text-yellow-400 font-bold'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {log.duration >= 1000
                          ? `${(log.duration / 1000).toFixed(2)}s`
                          : `${log.duration}ms`}
                        {isSlowQuery(log.duration) && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {log.user ? (
                        <span>{log.user.displayName || log.user.username}</span>
                      ) : (
                        <span className="text-gray-400">匿名</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono text-xs">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// API Key 请求日志接口
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
  apiKey?: { id: string; name: string };
  user?: { id: string; displayName?: string; username?: string; email?: string };
  channel?: { id: string; name: string };
  channelId?: string;
}

// API Key 使用日志列表
function ApiKeyRequestLogsList() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApiKeyIds, setSelectedApiKeyIds] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [successFilter, setSuccessFilter] = useState<string>('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const pageSize = 20;

  // 加载用户的所有 API Keys 和模型列表
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const response = await apiKeyApi.list({ limit: 100 });
        setApiKeys(response.data);
      } catch (err) {
        console.error('加载 API Key 列表失败:', err);
      }
    };
    const loadModels = async () => {
      try {
        const models = await apiKeyApi.getUsedModels();
        setModels(models);
      } catch (err) {
        console.error('加载模型列表失败:', err);
      }
    };
    loadApiKeys();
    loadModels();
  }, []);

  // 加载日志 - 默认加载所有日志
  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await apiKeyApi.getAllRequestLogs({
        page,
        limit: pageSize,
        apiKeyIds: selectedApiKeyIds.length > 0 ? selectedApiKeyIds : undefined,
        models: selectedModels.length > 0 ? selectedModels : undefined,
        success: successFilter === 'all' ? undefined : successFilter === 'true',
      });
      setLogs((response.logs || []) as RequestLog[]);
      setTotal((response.total || 0) as number);
    } catch (err) {
      console.error('加载请求日志失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApiKeyIds, selectedModels, page, successFilter]);

  const totalPages = Math.ceil(total / pageSize);

  // 准备 MultiSelect 的选项数据
  const apiKeyOptions = apiKeys.map((key) => ({
    value: key.id as string,
    label: key.name as string,
  }));

  const modelOptions = models.map((model) => ({
    value: model,
    label: model,
  }));

  // 处理 API Key 选择变化
  const handleApiKeyChange = (selected: string[]) => {
    setSelectedApiKeyIds(selected);
    setPage(1);
  };

  // 处理模型选择变化
  const handleModelChange = (selected: string[]) => {
    setSelectedModels(selected);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* 筛选器标题栏 - 始终可见 */}
        <button
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">筛选条件</span>
            {(selectedApiKeyIds.length > 0 ||
              selectedModels.length > 0 ||
              successFilter !== 'all') && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                {[
                  selectedApiKeyIds.length > 0 && `${selectedApiKeyIds.length} 个 Key`,
                  selectedModels.length > 0 && `${selectedModels.length} 个模型`,
                  successFilter !== 'all' && (successFilter === 'true' ? '仅成功' : '仅失败'),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(selectedApiKeyIds.length > 0 ||
              selectedModels.length > 0 ||
              successFilter !== 'all') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedApiKeyIds([]);
                  setSelectedModels([]);
                  setSuccessFilter('all');
                  setPage(1);
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
                  {selectedApiKeyIds.length > 0 && (
                    <span className="ml-1 text-blue-600 dark:text-blue-400">
                      ({selectedApiKeyIds.length})
                    </span>
                  )}
                </label>
                <MultiSelect
                  options={apiKeyOptions}
                  value={selectedApiKeyIds}
                  onChange={handleApiKeyChange}
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
                  options={modelOptions}
                  value={selectedModels}
                  onChange={handleModelChange}
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
                    setPage(1);
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

      {/* 日志表格 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && logs.length === 0 ? (
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
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">调整筛选条件或稍后再试</p>
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
                    API Key / 用户
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
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {log.apiKey?.name || '-'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {log.user?.displayName || log.user?.username || log.user?.email || '-'}
                        </span>
                      </div>
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
                      $
                      {typeof log.cost === 'string'
                        ? parseFloat(log.cost).toFixed(4)
                        : log.cost.toFixed(4)}
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
                      {log.channel?.name ||
                        (log.channelId ? (
                          <span className="text-xs font-mono">
                            {log.channelId.substring(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        ))}
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

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
