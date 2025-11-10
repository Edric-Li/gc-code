import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { logApi, type LoginLog, type AuditLog, type ApiLog } from '@/services/logApi';

type LogType = 'login' | 'audit' | 'api';

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
