import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { CreateApiKeyDto } from '@/types/apiKey';
import { userApi, type SimpleUser } from '@/services/userApi';
import { channelApi } from '@/services/channelApi';
import type { Channel } from '@/types/channel';
import { ChannelStatus } from '@/types/channel';
import { checkApiKeyNameAvailable } from '@/utils/apiKeyValidation';

interface CreateApiKeyDialogProps {
  onClose: () => void;
  onCreate: (data: CreateApiKeyDto) => Promise<void>;
}

export default function CreateApiKeyDialog({ onClose, onCreate }: CreateApiKeyDialogProps) {
  const [formData, setFormData] = useState<CreateApiKeyDto>({
    name: '',
    description: '',
    expiresAt: '',
    dailyCostLimit: undefined,
    userId: '',
    channelId: '',
  });
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
    loadChannels();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const userList = await userApi.getSimpleList();
      setUsers(userList);
    } catch {
      setError('加载用户列表失败');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadChannels = async () => {
    try {
      setLoadingChannels(true);
      const response = await channelApi.list({ status: ChannelStatus.ACTIVE, limit: 100 });
      setChannels(response.data);
    } catch {
      // Silently fail - channel selection is optional
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const name = formData.name.trim() || 'default';

      // 检查该用户下是否已存在同名 API Key（使用优化的 API）
      if (formData.userId) {
        const checkResult = await checkApiKeyNameAvailable(formData.userId, name);
        if (!checkResult.available) {
          setError(`该用户已存在名为 "${name}" 的 API Key，请使用其他名称`);
          setLoading(false);
          return;
        }
      }

      // 清理数据
      const cleanData: CreateApiKeyDto = {
        name: name,
        userId: formData.userId,
      };

      if (formData.description?.trim()) {
        cleanData.description = formData.description.trim();
      }

      if (formData.expiresAt) {
        cleanData.expiresAt = new Date(formData.expiresAt).toISOString();
      }

      if (formData.dailyCostLimit && formData.dailyCostLimit > 0) {
        cleanData.dailyCostLimit = formData.dailyCostLimit;
      }

      if (formData.channelId) {
        cleanData.channelId = formData.channelId;
      }

      await onCreate(cleanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建 API Key 失败');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateApiKeyDto, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">创建 API Key</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              关联用户 <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.userId}
              onChange={(e) => handleChange('userId', e.target.value)}
              disabled={loadingUsers}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">请选择用户</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName || user.username} ({user.email})
                </option>
              ))}
            </select>
            {loadingUsers && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">加载用户列表中...</p>
            )}
          </div>

          {/* API Key Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key 名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="留空将使用默认名称 'default'"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key 描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="API Key 用途说明"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              过期时间
            </label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => handleChange('expiresAt', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">留空表示永不过期</p>
          </div>

          {/* Daily Cost Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              每日费用限制
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.dailyCostLimit || ''}
              onChange={(e) =>
                handleChange(
                  'dailyCostLimit',
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              placeholder="例如: 100.00"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">留空表示无限制</p>
          </div>

          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              绑定渠道
            </label>
            <select
              value={formData.channelId}
              onChange={(e) => handleChange('channelId', e.target.value)}
              disabled={loadingChannels}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">自动选择可用渠道</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name} ({channel.provider.name})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              留空表示自动从可用渠道中选择，或选择特定渠道进行绑定
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !formData.userId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
