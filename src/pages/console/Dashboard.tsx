import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useRef } from 'react';
import {
  DollarSign,
  Activity,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  X,
  Clock,
  PieChart,
} from 'lucide-react';
import { apiKeyApi } from '@/services/apiKeyApi';
import type { ApiKeyStatsOverview } from '@/types/apiKey';
import { siteConfig } from '@/config/site';
import { formatCurrency, formatNumber } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { CHART_COLORS, PIE_CHART_CONFIG } from '@/constants/chart';

type DateRangeType = 'today' | '7d' | '30d' | 'custom';
type RefreshInterval = 10 | 20 | 30 | 60;

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<ApiKeyStatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeType>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(30);
  const [showRefreshSettings, setShowRefreshSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨好';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  const getUserName = () => {
    return user?.displayName || user?.username || user?.email || '用户';
  };

  useEffect(() => {
    loadData();
  }, [dateRange, customStartDate, customEndDate]);

  // 自动刷新
  useEffect(() => {
    // 清除之前的定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 如果开启自动刷新，设置新的定时器
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadData();
      }, refreshInterval * 1000);
    }

    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // 计算日期范围
      let startDate = '';
      let endDate = new Date().toISOString().split('T')[0];

      if (dateRange === 'today') {
        startDate = endDate;
      } else if (dateRange === '7d') {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        startDate = date.toISOString().split('T')[0];
      } else if (dateRange === '30d') {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        startDate = date.toISOString().split('T')[0];
      } else if (dateRange === 'custom') {
        if (customStartDate && customEndDate) {
          startDate = customStartDate;
          endDate = customEndDate;
        } else {
          // 如果自定义日期未设置，默认使用今天
          startDate = endDate;
        }
      }

      console.log('📊 Dashboard API Request:', { startDate, endDate, dateRange });
      const overviewData = await apiKeyApi.getOverview({ startDate, endDate });
      console.log('📊 Dashboard API Response:', overviewData);
      setOverview(overviewData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodText = () => {
    if (dateRange === 'today') return '今天';
    if (dateRange === '7d') return '最近7天';
    if (dateRange === '30d') return '最近30天';
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return `${customStartDate} 至 ${customEndDate}`;
    }
    return '自定义';
  };

  const periodText = getPeriodText();

  const handleDateRangeChange = (range: DateRangeType) => {
    if (range === 'custom') {
      setShowCustomPicker(true);
      // 设置默认的自定义日期范围（最近7天）
      if (!customStartDate || !customEndDate) {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        setCustomStartDate(weekAgo.toISOString().split('T')[0]);
        setCustomEndDate(today);
      }
    } else {
      setDateRange(range);
      setShowCustomPicker(false);
    }
  };

  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setDateRange('custom');
      setShowCustomPicker(false);
    }
  };

  const cancelCustomDateRange = () => {
    setShowCustomPicker(false);
    // 如果当前是custom模式，切换回today
    if (dateRange === 'custom') {
      setDateRange('today');
    }
  };

  const statCards = [
    {
      title: '总费用',
      value: overview ? formatCurrency(overview.totalCost || 0) : '$0.00',
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: '请求次数',
      value: overview ? formatNumber(overview.totalRequests || 0) : '0',
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: '总 Token',
      value: overview ? formatNumber(overview.totalTokens || 0) : '0',
      icon: Zap,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      title: '输入 Token',
      value: overview ? formatNumber(overview.inputTokens || 0) : '0',
      icon: ArrowUpRight,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <>
      <Helmet>
        <title>数据看板 - 用户控制台 - {siteConfig.name}</title>
      </Helmet>

      <div className="space-y-6">
        {/* 问候语 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {getGreeting()}，{getUserName()}
          </h1>
          <p className="text-blue-100">欢迎来到你的控制台，在这里查看使用统计和管理 API Keys</p>
        </div>

        {/* 顶部控制栏 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">数据看板</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              查看你的 API Key 使用统计和费用概览
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 时间范围选择器 */}
            <div className="flex rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800/50">
              <button
                onClick={() => handleDateRangeChange('today')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  dateRange === 'today'
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                今天
              </button>
              <button
                onClick={() => handleDateRangeChange('7d')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  dateRange === '7d'
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                最近7天
              </button>
              <button
                onClick={() => handleDateRangeChange('30d')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  dateRange === '30d'
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                最近30天
              </button>
              <button
                onClick={() => handleDateRangeChange('custom')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all flex items-center gap-1 ${
                  dateRange === 'custom'
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                自定义
              </button>
            </div>

            {/* 自动刷新设置按钮 */}
            <div className="relative">
              <button
                onClick={() => setShowRefreshSettings(!showRefreshSettings)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  autoRefresh
                    ? 'border-primary-500 bg-primary-50 text-primary-600 shadow-sm dark:border-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700/50 dark:hover:text-white'
                }`}
                title={autoRefresh ? `自动刷新: ${refreshInterval}秒` : '自动刷新已关闭'}
              >
                <Clock className="h-4 w-4" />
                {autoRefresh && <span className="text-xs">{refreshInterval}s</span>}
              </button>

              {/* 自动刷新设置下拉菜单 */}
              {showRefreshSettings && (
                <>
                  {/* 背景遮罩 */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowRefreshSettings(false)}
                  />
                  {/* 下拉菜单 */}
                  <div className="absolute right-0 top-full mt-2 z-20 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                      自动刷新设置
                    </h4>

                    {/* 开关 */}
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">启用自动刷新</span>
                      <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          autoRefresh ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoRefresh ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 间隔选择 */}
                    {autoRefresh && (
                      <div>
                        <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
                          刷新间隔
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {([10, 20, 30, 60] as RefreshInterval[]).map((interval) => (
                            <button
                              key={interval}
                              onClick={() => setRefreshInterval(interval)}
                              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                refreshInterval === interval
                                  ? 'bg-primary-600 text-white shadow-lg'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                              }`}
                            >
                              {interval}秒
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 手动刷新按钮 */}
            <button
              onClick={loadData}
              disabled={isLoading}
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-600 transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700/50 dark:hover:text-white"
              title="刷新数据"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* 基础信息卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </span>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 模型使用分布 */}
            {overview?.modelDistribution && overview.modelDistribution.length > 0 && (
              <div className="card p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  模型使用分布
                </h3>

                {/* 饼图 */}
                <div className="flex flex-col items-center justify-center mb-8">
                  <svg viewBox="0 0 200 200" className="h-64 w-64">
                    {(() => {
                      let currentAngle = -90;
                      const { radius, centerX, centerY } = PIE_CHART_CONFIG;

                      // 计算总费用
                      const total = overview.modelDistribution.reduce((sum, m) => sum + m.cost, 0);

                      // 过滤掉费用为0的模型
                      const validModels = overview.modelDistribution.filter((m) => m.cost > 0);

                      console.log('🥧 Pie Chart Data:', {
                        total,
                        validModels,
                        distribution: validModels.map((m) => ({
                          model: m.model,
                          cost: m.cost,
                          percentage: total > 0 ? (m.cost / total) * 100 : 0,
                        })),
                      });

                      return validModels.map((model, index: number) => {
                        const percentage = total > 0 ? (model.cost / total) * 100 : 0;
                        const sliceAngle = (percentage / 100) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + sliceAngle;

                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;

                        const x1 = centerX + radius * Math.cos(startRad);
                        const y1 = centerY + radius * Math.sin(startRad);
                        const x2 = centerX + radius * Math.cos(endRad);
                        const y2 = centerY + radius * Math.sin(endRad);

                        const largeArcFlag = sliceAngle > 180 ? 1 : 0;

                        const pathData = [
                          `M ${centerX} ${centerY}`,
                          `L ${x1} ${y1}`,
                          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          'Z',
                        ].join(' ');

                        currentAngle = endAngle;

                        const color = CHART_COLORS[index % CHART_COLORS.length];

                        return (
                          <path
                            key={index}
                            d={pathData}
                            fill={color.fill}
                            className="transition-opacity hover:opacity-80 cursor-pointer"
                            title={`${model.model}: ${percentage.toFixed(1)}%`}
                          />
                        );
                      });
                    })()}
                    {/* 中心白色圆圈 */}
                    <circle
                      cx={PIE_CHART_CONFIG.centerX}
                      cy={PIE_CHART_CONFIG.centerY}
                      r={PIE_CHART_CONFIG.innerRadius}
                      className="fill-white dark:fill-gray-800"
                    />
                  </svg>

                  {/* 图例 */}
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {overview.modelDistribution.map((model, index: number) => {
                      const color = CHART_COLORS[index % CHART_COLORS.length];
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${color.bg}`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {model.model}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 详细数据表格 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                          模型
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                          请求数
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                          总Token
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                          费用
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                          占比
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.modelDistribution.map((model, index: number) => {
                        const percentage =
                          overview.totalCost > 0 ? (model.cost / overview.totalCost) * 100 : 0;
                        const color = CHART_COLORS[index % CHART_COLORS.length];
                        return (
                          <tr
                            key={index}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${color.bg}`} />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {model.model}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                              {formatNumber(model.requests)}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                              {formatNumber(model.tokens)}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(model.cost)}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                              {percentage.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Token 使用分布 */}
            {overview && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Token 使用分布
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-700/50 dark:bg-gray-900/30">
                    <div className="flex items-center gap-3">
                      <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        输入 Token
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatNumber(overview.inputTokens || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-700/50 dark:bg-gray-900/30">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        输出 Token
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatNumber(overview.outputTokens || 0)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                    <span className="font-semibold text-gray-900 dark:text-white">总计</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(overview.totalTokens || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 自定义日期范围弹出层 */}
      {showCustomPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            {/* 关闭按钮 */}
            <button
              onClick={cancelCustomDateRange}
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>

            {/* 标题 */}
            <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
              选择日期范围
            </h3>

            {/* 日期选择器 */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  开始日期
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  结束日期
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* 按钮 */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={cancelCustomDateRange}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={applyCustomDateRange}
                disabled={!customStartDate || !customEndDate}
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                应用
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
