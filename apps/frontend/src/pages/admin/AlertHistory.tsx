import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  notificationApi,
  type AlertLog,
  AlertType,
  NotificationStatus,
} from '@/services/notificationApi';

export default function AlertHistory() {
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // 筛选条件
  const [filters, setFilters] = useState<{
    alertType?: AlertType;
    status?: NotificationStatus;
  }>({});

  useEffect(() => {
    loadAlerts();
  }, [page, filters]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const response = await notificationApi.getAlertHistory({
        ...filters,
        limit,
        offset,
      });
      setAlerts(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error('加载告警历史失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAlerts();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
    setPage(1); // 重置到第一页
  };

  const totalPages = Math.ceil(total / limit);

  const alertTypeLabels: Record<AlertType, { label: string; color: string; icon: string }> = {
    [AlertType.ERROR]: { label: '认证失败', color: 'red', icon: '🚨' },
    [AlertType.TEMP_ERROR]: { label: '临时错误', color: 'orange', icon: '⚠️' },
    [AlertType.RATE_LIMITED]: { label: '限流', color: 'blue', icon: '⏱️' },
    [AlertType.RECOVERED]: { label: '已恢复', color: 'green', icon: '✅' },
  };

  const statusLabels: Record<NotificationStatus, { label: string; color: string }> = {
    [NotificationStatus.PENDING]: { label: '待发送', color: 'gray' },
    [NotificationStatus.SENT]: { label: '已发送', color: 'green' },
    [NotificationStatus.FAILED]: { label: '失败', color: 'red' },
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">告警历史</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">查看渠道告警通知的发送记录和状态</p>
      </div>

      {/* 筛选和操作栏 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 告警类型筛选 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.alertType || ''}
              onChange={(e) => handleFilterChange('alertType', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部类型</option>
              {Object.entries(alertTypeLabels).map(([type, info]) => (
                <option key={type} value={type}>
                  {info.icon} {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              {Object.entries(statusLabels).map(([status, info]) => (
                <option key={status} value={status}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1"></div>

          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="总告警数" value={total} icon={Bell} color="blue" />
        <StatCard
          title="成功发送"
          value={alerts.filter((a) => a.status === NotificationStatus.SENT).length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="发送失败"
          value={alerts.filter((a) => a.status === NotificationStatus.FAILED).length}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="待发送"
          value={alerts.filter((a) => a.status === NotificationStatus.PENDING).length}
          icon={Clock}
          color="gray"
        />
      </div>

      {/* 告警列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600 dark:text-gray-400">加载中...</div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">暂无告警记录</p>
            <p className="text-sm mt-2">符合筛选条件的告警记录将显示在这里</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      告警类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      渠道
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      主题
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      收件人
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      发送时间
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {alerts.map((alert) => {
                    const typeInfo = alertTypeLabels[alert.alertType];
                    const statusInfo = statusLabels[alert.status];
                    return (
                      <tr key={alert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${typeInfo.color}-100 dark:bg-${typeInfo.color}-900/20 text-${typeInfo.color}-800 dark:text-${typeInfo.color}-300`}
                          >
                            <span>{typeInfo.icon}</span>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {alert.channel.name}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">
                              {alert.channel.status}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            {alert.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {alert.recipients.length === 1 ? (
                              alert.recipients[0]
                            ) : (
                              <span>{alert.recipients.length} 位收件人</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusInfo.color}-100 dark:bg-${statusInfo.color}-900/20 text-${statusInfo.color}-800 dark:text-${statusInfo.color}-300`}
                          >
                            {alert.status === NotificationStatus.SENT && (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {alert.status === NotificationStatus.FAILED && (
                              <XCircle className="w-3 h-3" />
                            )}
                            {alert.status === NotificationStatus.PENDING && (
                              <Clock className="w-3 h-3" />
                            )}
                            {statusInfo.label}
                          </span>
                          {alert.errorMessage && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {alert.errorMessage}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {new Date(alert.sentAt).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  显示第 <span className="font-medium">{(page - 1) * limit + 1}</span> 到{' '}
                  <span className="font-medium">{Math.min(page * limit, total)}</span> 条，共{' '}
                  <span className="font-medium">{total}</span> 条记录
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    第 {page} / {totalPages} 页
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'gray';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    gray: 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
