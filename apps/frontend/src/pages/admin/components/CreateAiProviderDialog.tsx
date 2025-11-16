import { useState } from 'react';
import { X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import type { CreateAiProviderDto, ProviderType, ProviderModelDto } from '@/types/aiProvider';

interface CreateAiProviderDialogProps {
  onClose: () => void;
  onCreate: (data: CreateAiProviderDto) => Promise<void>;
}

export default function CreateAiProviderDialog({ onClose, onCreate }: CreateAiProviderDialogProps) {
  const [formData, setFormData] = useState<CreateAiProviderDto>({
    name: '',
    slug: '',
    type: 'OPENAI' as ProviderType,
    logoUrl: '',
    website: '',
    description: '',
    isActive: true,
    sortOrder: 0,
    models: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // 数据验证
      if (!formData.name.trim()) {
        setError('请输入提供商名称');
        return;
      }
      if (!formData.slug.trim()) {
        setError('请输入 Slug');
        return;
      }

      // 清理数据
      const cleanData: CreateAiProviderDto = {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        type: formData.type,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder || 0,
      };

      if (formData.logoUrl?.trim()) {
        cleanData.logoUrl = formData.logoUrl.trim();
      }

      if (formData.website?.trim()) {
        cleanData.website = formData.website.trim();
      }

      if (formData.description?.trim()) {
        cleanData.description = formData.description.trim();
      }

      // 清理并包含模型数据
      if (formData.models && formData.models.length > 0) {
        cleanData.models = formData.models
          .filter((model) => model.modelName.trim()) // 只包含有模型名称的
          .map((model) => ({
            modelName: model.modelName.trim(),
            displayName: model.displayName?.trim() || undefined,
            description: model.description?.trim() || undefined,
            isEnabled: model.isEnabled ?? true,
            sortOrder: model.sortOrder ?? 0,
          }));
      }

      await onCreate(cleanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建提供商失败');
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateAiProviderDto, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addModel = () => {
    const newModel: ProviderModelDto = {
      modelName: '',
      displayName: '',
      description: '',
      isEnabled: true,
      sortOrder: formData.models?.length || 0,
    };
    setFormData((prev) => ({
      ...prev,
      models: [...(prev.models || []), newModel],
    }));
  };

  const removeModel = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      models: prev.models?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateModel = (index: number, field: keyof ProviderModelDto, value: string | boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      models: prev.models?.map((model, i) =>
        i === index ? { ...model, [field]: value } : model
      ) || [],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">创建 AI 提供商</h3>
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

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              提供商名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="例如: OpenAI"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value.toLowerCase())}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="例如: openai"
              pattern="[a-z0-9-]+"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              仅支持小写字母、数字和连字符
            </p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              提供商类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as ProviderType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="OPENAI">OpenAI</option>
              <option value="ANTHROPIC">Anthropic</option>
              <option value="AZURE_OPENAI">Azure OpenAI</option>
              <option value="GOOGLE_AI">Google AI</option>
              <option value="KIMI">Kimi</option>
              <option value="DEEPSEEK">DeepSeek</option>
              <option value="BAIDU">百度</option>
              <option value="ALIBABA">阿里巴巴</option>
              <option value="CUSTOM">自定义</option>
            </select>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => handleChange('logoUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="https://example.com/logo.png"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              官方网站
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="https://example.com"
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
              rows={3}
              placeholder="提供商的简短描述"
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              排序顺序
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="0"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">数字越小，排序越靠前</p>
          </div>

          {/* Models */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                支持的模型
              </label>
              <button
                type="button"
                onClick={addModel}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                添加模型
              </button>
            </div>

            {formData.models && formData.models.length > 0 ? (
              <div className="space-y-3">
                {formData.models.map((model, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        模型 #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeModel(index)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          模型名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={model.modelName}
                          onChange={(e) => updateModel(index, 'modelName', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="例如: gpt-4"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          显示名称
                        </label>
                        <input
                          type="text"
                          value={model.displayName}
                          onChange={(e) => updateModel(index, 'displayName', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="例如: GPT-4"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        描述
                      </label>
                      <input
                        type="text"
                        value={model.description}
                        onChange={(e) => updateModel(index, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="模型描述"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`model-enabled-${index}`}
                          checked={model.isEnabled ?? true}
                          onChange={(e) => updateModel(index, 'isEnabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label
                          htmlFor={`model-enabled-${index}`}
                          className="text-xs text-gray-700 dark:text-gray-300"
                        >
                          启用
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 dark:text-gray-400">
                          排序:
                        </label>
                        <input
                          type="number"
                          value={model.sortOrder}
                          onChange={(e) => updateModel(index, 'sortOrder', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                暂无模型，点击"添加模型"按钮添加支持的模型
              </p>
            )}
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              启用此提供商
            </label>
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
