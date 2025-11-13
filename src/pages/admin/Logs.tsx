import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { logApi, type LoginLog, type AuditLog, type ApiLog } from '@/services/logApi';
import { apiKeyApi } from '@/services/apiKeyApi';

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
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await logApi.getLoginLogs({
        skip: page * pageSize,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await logApi.getAuditLogs({
        skip: page * pageSize,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
function ApiLogsList() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await logApi.getApiLogs({
        skip: page * pageSize,
        take: pageSize,
      });
      setLogs(response.data);
    } catch (err) {
      console.error('加载 API 日志失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (loading && logs.length === 0) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">加载中...</div>;
  }

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                方法
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                路径
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                耗时
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                用户
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
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(
                      log.method
                    )}`}
                  >
                    {log.method}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-mono">
                  {log.path}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-semibold ${getStatusColor(log.statusCode)}`}>
                    {log.statusCode}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {log.duration}ms
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {log.user?.email || '-'}
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

// API Key 使用日志列表
function ApiKeyRequestLogsList() {
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [apiKeys, setApiKeys] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [successFilter, setSuccessFilter] = useState<string>('all');
  const pageSize = 20;

  // 加载用户的所有 API Keys
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const response = await apiKeyApi.list({ limit: 100 });
        setApiKeys(response.data);
      } catch (err) {
        console.error('加载 API Key 列表失败:', err);
      }
    };
    loadApiKeys();
  }, []);

  // 加载日志 - 默认加载所有日志
  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await apiKeyApi.getAllRequestLogs({
        page,
        limit: pageSize,
        apiKeyId: selectedApiKey || undefined,
        success: successFilter === 'all' ? undefined : successFilter === 'true',
      });
      setLogs(response.logs || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('加载请求日志失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApiKey, page, successFilter]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key
            </label>
            <select
              value={selectedApiKey}
              onChange={(e) => {
                setSelectedApiKey(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">全部 API Key</option>
              {apiKeys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              状态
            </label>
            <select
              value={successFilter}
              onChange={(e) => {
                setSuccessFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">全部</option>
              <option value="true">成功</option>
              <option value="false">失败</option>
            </select>
          </div>
        </div>
      </div>

      {/* 日志表格 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">暂无日志记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
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
                    耗时
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    花费
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    状态码
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    渠道
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    IP / UA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
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
                        {(log.cacheCreationInputTokens > 0 || log.cacheReadInputTokens > 0) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {log.cacheCreationInputTokens > 0 && `创建: ${log.cacheCreationInputTokens} `}
                            {log.cacheReadInputTokens > 0 && `读取: ${log.cacheReadInputTokens}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {log.outputTokens?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.duration}ms
                        </span>
                        {log.timeToFirstToken && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            TTFT: {log.timeToFirstToken}ms
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${parseFloat(log.cost).toFixed(4)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-mono ${
                        log.statusCode >= 200 && log.statusCode < 300
                          ? 'text-green-600 dark:text-green-400'
                          : log.statusCode >= 400
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {log.statusCode}
                      </span>
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
                      {log.channel?.name || (log.channelId ? (
                        <span className="text-xs font-mono">{log.channelId.substring(0, 8)}...</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-white font-mono text-xs">
                          {log.ipAddress || '-'}
                        </span>
                        {log.userAgent && (
                          <span
                            className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs"
                            title={log.userAgent}
                          >
                            {log.userAgent.substring(0, 40)}...
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              显示第 {(page - 1) * pageSize + 1} 到 {Math.min(page * pageSize, total)} 条，共 {total} 条
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
