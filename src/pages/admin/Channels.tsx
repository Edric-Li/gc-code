import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { channelApi } from '@/services/channelApi';
import type {
  Channel,
  ChannelStatus,
  CreateChannelDto,
  UpdateChannelDto,
  QueryChannelsDto,
} from '@/types/channel';
import CreateChannelDialog from './components/CreateChannelDialog';
import EditChannelDialog from './components/EditChannelDialog';

export default function Channels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChannelStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Channel | null>(null);
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency?: number;
    data?: unknown;
  } | null>(null);

  const loadChannels = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params: QueryChannelsDto = {
        page,
        limit,
      };

      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter as ChannelStatus;

      const response = await channelApi.list(params);
      setChannels(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载渠道列表失败');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, limit]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const handleCreateChannel = async (data: CreateChannelDto) => {
    await channelApi.create(data);
    setShowCreateDialog(false);
    setSuccess('渠道创建成功');
    setTimeout(() => setSuccess(''), 3000);
    loadChannels();
  };

  const handleUpdateChannel = async (id: string, data: UpdateChannelDto) => {
    await channelApi.update(id, data);
    setEditingChannel(null);
    setSuccess('渠道更新成功');
    setTimeout(() => setSuccess(''), 3000);
    loadChannels();
  };

  const handleDeleteChannel = async (channel: Channel) => {
    try {
      await channelApi.delete(channel.id);
      setDeleteConfirm(null);
      setSuccess('渠道删除成功');
      setTimeout(() => setSuccess(''), 3000);
      loadChannels();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除渠道失败');
    }
  };

  const handleTestConnection = async (channelId: string) => {
    try {
      setTestingChannelId(channelId);
      setError('');
      const result = await channelApi.testConnection(channelId);

      if (result.success) {
        setTestResult(result);
        loadChannels(); // Reload to get updated health status
      } else {
        // 如果失败，也显示错误响应数据
        let errorInfo = '';
        if (result.data) {
          try {
            if (typeof result.data === 'object') {
              // 检查是否有错误消息
              if (result.data.error) {
                const errorMsg = result.data.error.message || result.data.error;
                const errorType = result.data.error.type || '';
                errorInfo = `\n\n错误详情: ${errorMsg}`;
                if (errorType) {
                  errorInfo += ` (类型: ${errorType})`;
                }
              } else {
                errorInfo = `\n\n错误详情:\n${JSON.stringify(result.data, null, 2)}`;
              }
            } else {
              errorInfo = `\n\n错误详情: ${result.data}`;
            }
          } catch {
            errorInfo = '';
          }
        }
        setError(`连接测试失败: ${result.message}${errorInfo}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接测试失败');
    } finally {
      setTestingChannelId(null);
    }
  };

  const getStatusColor = (status: ChannelStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'DISABLED':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
      case 'ERROR':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'MAINTENANCE':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
    }
  };

  const getHealthIcon = (healthStatus?: string) => {
    if (!healthStatus) return null;

    switch (healthStatus) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">渠道管理</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            管理 AI 服务渠道配置和连接
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加渠道
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索渠道名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ChannelStatus | 'ALL')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="ALL">所有状态</option>
            <option value="ACTIVE">正常使用</option>
            <option value="DISABLED">已禁用</option>
            <option value="ERROR">出现错误</option>
            <option value="MAINTENANCE">维护中</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Channels Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  渠道
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  提供商
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  健康状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  优先级/权重
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    加载中...
                  </td>
                </tr>
              ) : channels.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    暂无渠道
                  </td>
                </tr>
              ) : (
                channels.map((channel) => (
                  <tr key={channel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {channel.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {channel.baseUrl}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {channel.provider.logoUrl && (
                          <img
                            src={channel.provider.logoUrl}
                            alt={channel.provider.name}
                            className="w-5 h-5 rounded"
                          />
                        )}
                        <span className="text-sm text-gray-900 dark:text-white">
                          {channel.provider.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs rounded ${getStatusColor(channel.status)}`}
                      >
                        {channel.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getHealthIcon(channel.healthStatus)}
                        {channel.errorCount > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            错误: {channel.errorCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {channel.priority} / {channel.weight}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleTestConnection(channel.id)}
                        disabled={testingChannelId === channel.id}
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
                        title="测试连接"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingChannel(channel)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(channel)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              共 {total} 个渠道，第 {page} / {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                上一页
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateChannelDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateChannel}
        />
      )}

      {editingChannel && (
        <EditChannelDialog
          channel={editingChannel}
          onClose={() => setEditingChannel(null)}
          onUpdate={handleUpdateChannel}
        />
      )}

      {testResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div
              className={`px-6 py-4 border-b ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {testResult.success ? (
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                  <div>
                    <h3
                      className={`text-lg font-semibold ${testResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}
                    >
                      {testResult.success ? '连接测试成功' : '连接测试失败'}
                    </h3>
                    <p
                      className={`text-sm ${testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                    >
                      {testResult.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTestResult(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Latency */}
              {testResult.latency !== undefined && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    响应延迟
                  </span>
                  <span
                    className={`text-sm font-semibold ${testResult.latency < 1000 ? 'text-green-600 dark:text-green-400' : testResult.latency < 3000 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {testResult.latency}ms
                  </span>
                </div>
              )}

              {/* Response Data */}
              {testResult.data && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    API 响应数据
                  </h4>

                  {/* Anthropic format */}
                  {testResult.data.content && testResult.data.content[0]?.text && (
                    <div className="space-y-3">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          AI 响应
                        </div>
                        <div className="text-sm text-blue-800 dark:text-blue-200 font-mono whitespace-pre-wrap">
                          "{testResult.data.content[0].text}"
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">模型</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {testResult.data.model}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            停止原因
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {testResult.data.stop_reason}
                          </div>
                        </div>
                      </div>

                      {testResult.data.usage && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">
                            Token 使用统计
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                              <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                                输入
                              </div>
                              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                {testResult.data.usage.input_tokens}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                                输出
                              </div>
                              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                {testResult.data.usage.output_tokens}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                                总计
                              </div>
                              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                {(testResult.data.usage.input_tokens || 0) +
                                  (testResult.data.usage.output_tokens || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw JSON fallback - 当不是 Anthropic 格式时显示原始 JSON */}
                  {!testResult.data.content && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-x-auto">
                      <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setTestResult(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">确认删除</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              确定要删除渠道 "{deleteConfirm.name}" 吗？此操作不可恢复。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteChannel(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
