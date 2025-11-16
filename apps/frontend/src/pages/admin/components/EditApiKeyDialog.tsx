import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { ApiKey, UpdateApiKeyDto } from '@/types/apiKey';
import { ChannelTargetType } from '@/types/apiKey';
import { channelApi } from '@/services/channelApi';
import type { Channel } from '@/types/channel';
import { ChannelStatus } from '@/types/channel';
import { aiProviderApi } from '@/services/aiProviderApi';
import type { AiProvider } from '@/types/aiProvider';

interface EditApiKeyDialogProps {
  apiKey: ApiKey;
  onClose: () => void;
  onUpdate: (id: string, data: UpdateApiKeyDto) => Promise<void>;
}

export default function EditApiKeyDialog({ apiKey, onClose, onUpdate }: EditApiKeyDialogProps) {
  const [formData, setFormData] = useState<UpdateApiKeyDto>({
    name: apiKey.name,
    description: apiKey.description,
    expiresAt: apiKey.expiresAt ? new Date(apiKey.expiresAt).toISOString().slice(0, 16) : '',
    dailyCostLimit: apiKey.dailyCostLimit,
    channelTargetType: apiKey.channelTargetType || ChannelTargetType.CHANNEL,
    channelId: apiKey.channelId || '',
    providerId: apiKey.providerId || '',
  });
  const [channels, setChannels] = useState<Channel[]>([]);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChannels();
    loadProviders();
  }, []);

  const loadChannels = async () => {
    try {
      setLoadingChannels(true);
      const response = await channelApi.list({ status: ChannelStatus.ACTIVE, limit: 100 });
      setChannels(response.data);
    } catch (_err) {
      // Silently fail - channel selection is optional
    } finally {
      setLoadingChannels(false);
    }
  };

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await aiProviderApi.list({ isActive: true, limit: 100 });
      setProviders(response.data);
    } catch {
      // Silently fail - provider selection is optional
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const cleanData: UpdateApiKeyDto = {};

      if (formData.name && formData.name.trim() !== apiKey.name) {
        cleanData.name = formData.name.trim();
      }

      if (formData.description !== apiKey.description) {
        cleanData.description = formData.description?.trim() || '';
      }

      if (formData.expiresAt) {
        cleanData.expiresAt = new Date(formData.expiresAt).toISOString();
      }

      if (formData.dailyCostLimit !== apiKey.dailyCostLimit) {
        cleanData.dailyCostLimit = formData.dailyCostLimit;
      }

      // 渠道目标类型和相关字段
      if (formData.channelTargetType !== apiKey.channelTargetType) {
        cleanData.channelTargetType = formData.channelTargetType;
      }

      if (formData.channelTargetType === ChannelTargetType.CHANNEL) {
        if (formData.channelId !== apiKey.channelId) {
          cleanData.channelId = formData.channelId || undefined;
        }
      } else if (formData.channelTargetType === ChannelTargetType.PROVIDER) {
        if (formData.providerId !== apiKey.providerId) {
          cleanData.providerId = formData.providerId || undefined;
        }
      }

      await onUpdate(apiKey.id, cleanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新 API Key 失败');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">编辑 API Key</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key 名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key 描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              过期时间
            </label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

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
                setFormData({
                  ...formData,
                  dailyCostLimit: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="留空表示无限制"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Channel Target Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              渠道目标类型
            </label>
            <select
              value={formData.channelTargetType}
              onChange={(e) =>
                setFormData({ ...formData, channelTargetType: e.target.value as ChannelTargetType })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={ChannelTargetType.CHANNEL}>具体渠道</option>
              <option value={ChannelTargetType.PROVIDER}>AI供货商</option>
            </select>
          </div>

          {/* Channel Selection (when CHANNEL is selected) */}
          {formData.channelTargetType === ChannelTargetType.CHANNEL && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                绑定渠道
              </label>
              <select
                value={formData.channelId}
                onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
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
                {apiKey.channel && (
                  <span>
                    当前绑定: {apiKey.channel.name} ({apiKey.channel.provider.name})
                    <br />
                  </span>
                )}
                留空表示自动从可用渠道中选择
              </p>
            </div>
          )}

          {/* Provider Selection (when PROVIDER is selected) */}
          {formData.channelTargetType === ChannelTargetType.PROVIDER && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI供货商
                </label>
                <select
                  value={formData.providerId}
                  onChange={(e) => {
                    const newProviderId = e.target.value;
                    setFormData({ ...formData, providerId: newProviderId, channelId: '' });
                  }}
                  disabled={loadingProviders}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">请选择供货商</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {apiKey.provider && (
                    <span>
                      当前绑定: {apiKey.provider.name}
                      <br />
                    </span>
                  )}
                  系统会使用 LRU 算法从该供货商的渠道中选择
                </p>
              </div>

              {/* Dedicated Channel Selection (optional, only for selected provider) */}
              {formData.providerId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    专属渠道（可选）
                  </label>
                  <select
                    value={formData.channelId}
                    onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                    disabled={loadingChannels}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">使用 LRU 算法自动选择</option>
                    {channels
                      .filter((channel) => channel.provider.id === formData.providerId)
                      .map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {apiKey.channel && apiKey.channelTargetType === ChannelTargetType.PROVIDER && (
                      <span>
                        当前专属渠道: {apiKey.channel.name}
                        <br />
                      </span>
                    )}
                    指定专属渠道将优先使用，留空则使用 LRU 算法从供货商的所有渠道中自动选择
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
