import { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import type { ChannelGroup, ChannelGroupChannelsResponse } from '@/types/channelGroup';
import { channelGroupApi } from '@/services/channelGroupApi';
import { channelApi } from '@/services/channelApi';
import type { Channel } from '@/types/channel';

interface ManageChannelsDialogProps {
  group: ChannelGroup;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ManageChannelsDialog({
  group,
  onClose,
  onUpdate,
}: ManageChannelsDialogProps) {
  const [groupChannels, setGroupChannels] = useState<ChannelGroupChannelsResponse['channels']>([]);
  const [availableChannels, setAvailableChannels] = useState<Channel[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadGroupChannels();
    loadAvailableChannels();
  }, [group.id]);

  const loadGroupChannels = async () => {
    try {
      const response = await channelGroupApi.getChannels(group.id);
      setGroupChannels(response.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载分组渠道失败');
    }
  };

  const loadAvailableChannels = async () => {
    try {
      const response = await channelApi.list({ page: 1, limit: 1000 });
      setAvailableChannels(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载可用渠道失败');
    }
  };

  const handleAddChannels = async () => {
    if (selectedChannelIds.length === 0) {
      setError('请选择至少一个渠道');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await channelGroupApi.addChannels(group.id, { channelIds: selectedChannelIds });
      setSuccess(`成功添加 ${selectedChannelIds.length} 个渠道`);
      setSelectedChannelIds([]);
      setShowAddDialog(false);
      setTimeout(() => setSuccess(''), 3000);
      loadGroupChannels();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加渠道失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveChannel = async (channelId: string) => {
    try {
      setLoading(true);
      setError('');
      await channelGroupApi.removeChannel(group.id, channelId);
      setSuccess('渠道已从分组中移除');
      setTimeout(() => setSuccess(''), 3000);
      loadGroupChannels();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除渠道失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleChannelSelection = (channelId: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    );
  };

  // 过滤掉已在分组中的渠道
  const channelsNotInGroup = availableChannels.filter(
    (channel) => !groupChannels.some((gc) => gc.id === channel.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">管理渠道</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              分组：{group.name} ({groupChannels.length} 个渠道)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Add Channel Button */}
          <div className="mb-4">
            <button
              onClick={() => setShowAddDialog(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              disabled={loading}
            >
              <Plus className="w-5 h-5" />
              添加渠道
            </button>
          </div>

          {/* Channels Table */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      渠道名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      供货商
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      优先级
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      最后使用
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {groupChannels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        暂无渠道，点击上方按钮添加
                      </td>
                    </tr>
                  ) : (
                    groupChannels.map((channel) => (
                      <tr key={channel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {channel.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {channel.provider.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {channel.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              启用
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400">
                              <XCircle className="w-3 h-3" />
                              禁用
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {channel.priority}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {channel.lastUsedAt
                            ? new Date(channel.lastUsedAt).toLocaleString('zh-CN')
                            : '未使用'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveChannel(channel.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            disabled={loading}
                            title="移除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            关闭
          </button>
        </div>
      </div>

      {/* Add Channels Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">选择要添加的渠道</h3>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setSelectedChannelIds([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {channelsNotInGroup.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  所有渠道都已添加到此分组
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {channelsNotInGroup.map((channel) => (
                    <label
                      key={channel.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChannelIds.includes(channel.id)}
                        onChange={() => toggleChannelSelection(channel.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{channel.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          供货商：{channel.provider?.name || '未知'}
                        </div>
                      </div>
                      {channel.status === 'ACTIVE' ? (
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded">
                          启用
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400 rounded">
                          禁用
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddDialog(false);
                    setSelectedChannelIds([]);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  onClick={handleAddChannels}
                  disabled={loading || selectedChannelIds.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '添加中...' : `添加 ${selectedChannelIds.length} 个渠道`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
