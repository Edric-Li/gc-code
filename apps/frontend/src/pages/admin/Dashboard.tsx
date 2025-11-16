import { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { userApi, type UserStatistics } from '@/services/userApi';
import { logApi, type LogStatistics } from '@/services/logApi';

export default function Dashboard() {
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [logStats, setLogStats] = useState<LogStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const [userStatsData, logStatsData] = await Promise.all([
        userApi.getStatistics(),
        logApi.getStatistics(),
      ]);
      setUserStats(userStatsData);
      setLogStats(logStatsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">仪表板</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">系统概览和统计信息</p>
      </div>

      {/* 用户统计 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">用户统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="总用户数" value={userStats?.totalUsers || 0} icon={Users} color="blue" />
          <StatCard
            title="活跃用户"
            value={userStats?.activeUsers || 0}
            icon={UserCheck}
            color="green"
          />
          <StatCard
            title="停用用户"
            value={userStats?.inactiveUsers || 0}
            icon={UserX}
            color="gray"
          />
          <StatCard
            title="管理员"
            value={userStats?.adminUsers || 0}
            icon={Shield}
            color="purple"
          />
        </div>
      </div>

      {/* 日志统计 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">系统活动</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="总登录次数"
            value={logStats?.totalLogins || 0}
            icon={Activity}
            color="blue"
          />
          <StatCard
            title="成功登录"
            value={logStats?.successfulLogins || 0}
            icon={CheckCircle}
            color="green"
            subtitle={`成功率: ${logStats?.loginSuccessRate || '0%'}`}
          />
          <StatCard
            title="失败登录"
            value={logStats?.failedLogins || 0}
            icon={XCircle}
            color="red"
          />
          <StatCard
            title="API 错误"
            value={logStats?.apiErrors || 0}
            icon={AlertCircle}
            color="orange"
            subtitle={`错误率: ${logStats?.apiErrorRate || '0%'}`}
          />
        </div>
      </div>

      {/* 快速操作 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard title="用户管理" description="管理系统用户和权限" link="/admin/users" />
          <ActionCard title="登录日志" description="查看用户登录记录" link="/admin/logs/login" />
          <ActionCard title="审计日志" description="查看系统操作记录" link="/admin/logs/audit" />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'purple' | 'gray' | 'orange';
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    gray: 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {value.toLocaleString()}
          </p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  link: string;
}

function ActionCard({ title, description, link }: ActionCardProps) {
  return (
    <a
      href={link}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
    >
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{description}</p>
    </a>
  );
}
