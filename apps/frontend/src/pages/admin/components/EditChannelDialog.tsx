import { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import type { Channel, UpdateChannelDto, ChannelStatus } from '@/types/channel';
import type { AiProvider } from '@/types/aiProvider';
import { aiProviderApi } from '@/services/aiProviderApi';

interface EditChannelDialogProps {
  channel: Channel;
  onClose: () => void;
  onUpdate: (id: string, data: UpdateChannelDto) => Promise<void>;
}

export default function EditChannelDialog({ channel, onClose, onUpdate }: EditChannelDialogProps) {
  // 将 ChannelModel[] 转换为 string[] 用于编辑
  const modelNames = channel.models?.map((m) => m.modelName) || [];

  const [formData, setFormData] = useState<UpdateChannelDto>({
    name: channel.name,
    description: channel.description || '',
    baseUrl: channel.baseUrl,
    apiKey: '', // Don't pre-fill for security
    status: channel.status,
    models: modelNames,
  });
  const [provider, setProvider] = useState<AiProvider | null>(null);
  const [loadingProvider, setLoadingProvider] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [updateApiKey, setUpdateApiKey] = useState(false);

  useEffect(() => {
    loadProviderDetails();
  }, []);

  const loadProviderDetails = async () => {
    try {
      setLoadingProvider(true);
      const providerDetails = await aiProviderApi.getById(channel.providerId);
      setProvider(providerDetails);
    } catch (err) {
      console.error('Failed to load provider details:', err);
    } finally {
      setLoadingProvider(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // 清理数据 - 只发送有变化的字段
      const cleanData: UpdateChannelDto = {};

      if (formData.name && formData.name !== channel.name) {
        cleanData.name = formData.name.trim();
      }

      if (formData.description !== channel.description) {
        cleanData.description = formData.description?.trim() || '';
      }

      if (formData.baseUrl && formData.baseUrl !== channel.baseUrl) {
        cleanData.baseUrl = formData.baseUrl.trim();
      }

      if (updateApiKey && formData.apiKey?.trim()) {
        cleanData.apiKey = formData.apiKey.trim();
      }

      if (formData.status && formData.status !== channel.status) {
        cleanData.status = formData.status;
      }

      // 比较models数组（将 ChannelModel[] 转换为 string[] 进行比较）
      const currentModelNames = channel.models?.map((m) => m.modelName) || [];
      const newModelNames = formData.models || [];
      const currentModelsStr = JSON.stringify(currentModelNames.sort());
      const newModelsStr = JSON.stringify(newModelNames.sort());
      if (newModelsStr !== currentModelsStr) {
        cleanData.models = formData.models || [];
      }

      await onUpdate(channel.id, cleanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新渠道失败');
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof UpdateChannelDto,
    value: string | number | string[] | ChannelStatus
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProviderModel = (modelName: string) => {
    const currentModels = formData.models || [];
    if (currentModels.includes(modelName)) {
      handleChange('models', currentModels.filter((m) => m !== modelName));
    } else {
      handleChange('models', [...currentModels, modelName]);
    }
  };

  const addModel = () => {
    if (modelInput.trim() && !(formData.models || []).includes(modelInput.trim())) {
      const newModels = [...(formData.models || []), modelInput.trim()];
      handleChange('models', newModels);
      setModelInput('');
    }
  };

  const removeModel = (model: string) => {
    const newModels = (formData.models || []).filter((m) => m !== model);
    handleChange('models', newModels);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">编辑渠道</h3>
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

          {/* Provider Info (read-only) */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">提供商</p>
            <div className="flex items-center gap-2">
              {channel.provider.logoUrl && (
                <img
                  src={channel.provider.logoUrl}
                  alt={channel.provider.name}
                  className="w-6 h-6 rounded"
                />
              )}
              <span className="font-medium text-gray-900 dark:text-white">
                {channel.provider.name}
              </span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              渠道名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              状态
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as ChannelStatus)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="ACTIVE">正常使用</option>
              <option value="DISABLED">已禁用</option>
              <option value="ERROR">出现错误</option>
              <option value="MAINTENANCE">维护中</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
            />
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.baseUrl}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* API Key Update */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="updateApiKey"
                checked={updateApiKey}
                onChange={(e) => setUpdateApiKey(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label
                htmlFor="updateApiKey"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                更新 API Key
              </label>
            </div>
            {updateApiKey && (
              <>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="输入新的 API Key"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  当前 API Key: {channel.apiKey}
                </p>
              </>
            )}
          </div>

          {/* Models */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              支持的模型
            </label>

            {loadingProvider ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                加载提供商信息中...
              </div>
            ) : provider && provider.models && provider.models.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  从提供商预配置的模型中选择：
                </p>
                <div className="grid grid-cols-2 gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  {provider.models
                    .filter((m) => m.isEnabled)
                    .map((model) => (
                      <div key={model.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id={`model-${model.id}`}
                          checked={formData.models?.includes(model.modelName) || false}
                          onChange={() => toggleProviderModel(model.modelName)}
                          className="w-4 h-4 mt-0.5 text-blue-600 rounded"
                        />
                        <label
                          htmlFor={`model-${model.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {model.displayName || model.modelName}
                          </div>
                          {model.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {model.description}
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                </div>

                {/* Manual Input Option */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    或手动添加其他模型：
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modelInput}
                      onChange={(e) => setModelInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addModel())}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="输入模型名称，如 gpt-4-turbo"
                    />
                    <button
                      type="button"
                      onClick={addModel}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Selected Models Display */}
                {formData.models && formData.models.length > 0 && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      已选择的模型：
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.models.map((model) => (
                        <div
                          key={model}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm"
                        >
                          <span className="text-blue-700 dark:text-blue-300">{model}</span>
                          <button
                            type="button"
                            onClick={() => removeModel(model)}
                            className="text-blue-600 hover:text-red-600 dark:text-blue-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Manual Input Only (No Provider Models) */
              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addModel())}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="输入模型名称，如 gpt-4"
                  />
                  <button
                    type="button"
                    onClick={addModel}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.models && formData.models.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.models.map((model) => (
                      <div
                        key={model}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                      >
                        <span>{model}</span>
                        <button
                          type="button"
                          onClick={() => removeModel(model)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? '保存中...' : '保存更改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
