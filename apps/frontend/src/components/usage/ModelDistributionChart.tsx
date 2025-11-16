import { useState } from 'react';
import { PieChart, ArrowUpDown, ArrowUp, ArrowDown, Info } from 'lucide-react';
import type { ModelUsageStats } from '@/types/usage';
import { formatNumber } from '@/utils/format';
import { CHART_COLORS, PIE_CHART_CONFIG } from '@/constants/chart';

interface ModelDistributionChartProps {
  data: ModelUsageStats[];
  isLoading: boolean;
}

type ViewMode = 'token' | 'cost';
type SortField = 'model' | 'requests' | 'allTokens' | 'cost';
type SortOrder = 'asc' | 'desc';

export default function ModelDistributionChart({ data, isLoading }: ModelDistributionChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('token');
  const [sortField, setSortField] = useState<SortField>('cost');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [detailModel, setDetailModel] = useState<ModelUsageStats | null>(null);

  // 处理排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 如果点击的是当前排序字段，切换排序顺序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果点击的是新字段，设置为降序
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 获取排序图标
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  // 计算总量和占比
  const total = data.reduce((sum, item) => {
    return sum + (viewMode === 'token' ? item.allTokens : item.costs.total);
  }, 0);

  // 图表数据 - 不排序，保持原始顺序
  const chartData = data.map((item, index) => {
    const value = viewMode === 'token' ? item.allTokens : item.costs.total;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return {
      ...item,
      value,
      percentage,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });

  // 表格数据 - 应用排序
  const tableData = [...chartData].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'model':
        comparison = a.model.localeCompare(b.model);
        break;
      case 'requests':
        comparison = a.requests - b.requests;
        break;
      case 'allTokens':
        comparison = a.allTokens - b.allTokens;
        break;
      case 'cost':
        comparison = a.costs.total - b.costs.total;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // 生成饼图 SVG 路径
  const generatePieSlices = () => {
    let currentAngle = -90; // 从顶部开始
    const { radius, centerX, centerY } = PIE_CHART_CONFIG;

    return chartData.map((item, index) => {
      const sliceAngle = (item.percentage / 100) * 360;
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

      return (
        <path
          key={index}
          d={pathData}
          fill={item.color.fill}
          className="transition-opacity hover:opacity-80 cursor-pointer"
        />
      );
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:backdrop-blur-sm">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
            <PieChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Token使用分布
          </h3>
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:backdrop-blur-sm">
        <h3 className="mb-8 flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
          <PieChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          Token使用分布
        </h3>
        <div className="py-16 text-center text-gray-600 dark:text-gray-400">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:backdrop-blur-sm">
      {/* 标题和切换按钮 */}
      <div className="mb-8 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
          <PieChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          模型使用分布
        </h3>

        <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900/30">
          <button
            onClick={() => setViewMode('token')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              viewMode === 'token'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Token
          </button>
          <button
            onClick={() => setViewMode('cost')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              viewMode === 'cost'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            费用
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="space-y-8">
        {/* 饼图 */}
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 200 200" className="h-64 w-64">
            {generatePieSlices()}
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
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${item.color.bg}`} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{item.model}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 详细数据表格 */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="w-auto pb-3 pr-4 text-left">
                  <button
                    onClick={() => handleSort('model')}
                    className="flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    模型
                    {getSortIcon('model')}
                  </button>
                </th>
                <th className="w-24 pb-3 text-right">
                  <button
                    onClick={() => handleSort('requests')}
                    className="ml-auto flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    请求数
                    {getSortIcon('requests')}
                  </button>
                </th>
                <th className="w-32 pb-3 text-right">
                  <button
                    onClick={() => handleSort('allTokens')}
                    className="ml-auto flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    总Token
                    {getSortIcon('allTokens')}
                  </button>
                </th>
                <th className="w-24 pb-3 text-right">
                  <button
                    onClick={() => handleSort('cost')}
                    className="ml-auto flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    费用
                    {getSortIcon('cost')}
                  </button>
                </th>
                <th className="w-20 pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                  占比
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tableData.map((item, index) => (
                <tr
                  key={index}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${item.color.bg}`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.model}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                    {formatNumber(item.requests)}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setDetailModel(item)}
                      className="inline-flex items-center gap-1 text-sm text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                    >
                      {formatNumber(item.allTokens)}
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      ${item.costs.total.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Token 详情弹窗 */}
      {detailModel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDetailModel(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {detailModel.model} - Token 详情
              </h4>
              <button
                onClick={() => setDetailModel(null)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                <span className="text-sm text-gray-600 dark:text-gray-400">输入 Token</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(detailModel.inputTokens)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                <span className="text-sm text-gray-600 dark:text-gray-400">输出 Token</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(detailModel.outputTokens)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                <span className="text-sm text-gray-600 dark:text-gray-400">缓存创建 Token</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(detailModel.cacheCreateTokens)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                <span className="text-sm text-gray-600 dark:text-gray-400">缓存读取 Token</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatNumber(detailModel.cacheReadTokens)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white">总计</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatNumber(detailModel.allTokens)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
