import { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import type { CreateChannelDto } from '@/types/channel';
import type { AiProvider } from '@/types/aiProvider';
import { aiProviderApi } from '@/services/aiProviderApi';

interface CreateChannelDialogProps {
  onClose: () => void;
  onCreate: (data: CreateChannelDto) => Promise<void>;
}

export default function CreateChannelDialog({ onClose, onCreate }: CreateChannelDialogProps) {
  const [formData, setFormData] = useState<CreateChannelDto>({
    providerId: '',
    name: '',
    description: '',
    baseUrl: '',
    apiKey: '',
    models: [],
  });
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelInput, setModelInput] = useState('');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await aiProviderApi.list({ isActive: true, limit: 100 });
      setProviders(response.data);
    } catch (_err) {
      setError('加载提供商列表失败');
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // 数据验证
      if (!formData.providerId) {
        setError('请选择提供商');
        return;
      }
      if (!formData.name.trim()) {
        setError('请输入渠道名称');
        return;
      }
      if (!formData.baseUrl.trim()) {
        setError('请输入 Base URL');
        return;
      }
      if (!formData.apiKey.trim()) {
        setError('请输入 API Key');
        return;
      }

      // 清理数据
      const cleanData: CreateChannelDto = {
        providerId: formData.providerId,
        name: formData.name.trim(),
        baseUrl: formData.baseUrl.trim(),
        apiKey: formData.apiKey.trim(),
      };

      if (formData.description?.trim()) {
        cleanData.description = formData.description.trim();
      }

      if (formData.models && formData.models.length > 0) {
        cleanData.models = formData.models;
      }

      await onCreate(cleanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建渠道失败');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateChannelDto, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProviderChange = async (providerId: string) => {
    handleChange('providerId', providerId);

    if (providerId) {
      try {
        // 获取选中提供商的详细信息（包括模型列表）
        const providerDetails = await aiProviderApi.getById(providerId);
        setSelectedProvider(providerDetails);
        // 清空之前选择的模型
        handleChange('models', []);
      } catch (err) {
        console.error('Failed to load provider details:', err);
        setSelectedProvider(null);
      }
    } else {
      setSelectedProvider(null);
      handleChange('models', []);
    }
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
    if (modelInput.trim() && !formData.models?.includes(modelInput.trim())) {
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">创建渠道</h3>
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

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI 提供商 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.providerId}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={loadingProviders}
              required
            >
              <option value="">请选择提供商</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
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
              placeholder="例如: OpenAI 官方渠道"
              required
            />
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
              placeholder="渠道的简短描述"
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
              placeholder="https://api.openai.com"
              required
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="sk-..."
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">API Key 将被加密存储</p>
          </div>

          {/* Models */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              支持的模型
            </label>

            {/* Provider Models (Checkboxes) */}
            {selectedProvider && selectedProvider.models && selectedProvider.models.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  从提供商预配置的模型中选择：
                </p>
                <div className="grid grid-cols-2 gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  {selectedProvider.models
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
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
