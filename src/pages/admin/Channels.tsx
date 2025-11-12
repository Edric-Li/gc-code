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
        const responseInfo = result.response
          ? `\n\nAI 响应: "${result.response}"`
          : '';
        alert(
          `✅ 连接测试成功！\n\n` +
          `延迟: ${result.latency}ms\n` +
          `${result.message}` +
          responseInfo
        );
        loadChannels(); // Reload to get updated health status
      } else {
        setError(`连接测试失败: ${result.message}`);
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
