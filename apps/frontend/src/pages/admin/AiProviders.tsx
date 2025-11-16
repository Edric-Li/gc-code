import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Globe, Package } from 'lucide-react';
import { aiProviderApi } from '@/services/aiProviderApi';
import type {
  AiProvider,
  ProviderType,
  CreateAiProviderDto,
  UpdateAiProviderDto,
  QueryAiProvidersDto,
} from '@/types/aiProvider';
import CreateAiProviderDialog from './components/CreateAiProviderDialog';
import EditAiProviderDialog from './components/EditAiProviderDialog';

export default function AiProviders() {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ProviderType | 'ALL'>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AiProvider | null>(null);

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params: QueryAiProvidersDto = {
        page,
        limit,
      };

      if (search) params.search = search;
      if (typeFilter !== 'ALL') params.type = typeFilter as ProviderType;
      if (activeFilter !== 'ALL') params.isActive = activeFilter === 'true';

      const response = await aiProviderApi.list(params);
      setProviders(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载提供商列表失败');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, activeFilter, page, limit]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleCreateProvider = async (data: CreateAiProviderDto) => {
    await aiProviderApi.create(data);
    setShowCreateDialog(false);
    loadProviders();
  };

  const handleUpdateProvider = async (id: string, data: UpdateAiProviderDto) => {
    await aiProviderApi.update(id, data);
    setEditingProvider(null);
    loadProviders();
  };

  const handleDeleteProvider = async (provider: AiProvider) => {
    try {
      await aiProviderApi.delete(provider.id);
      setDeleteConfirm(null);
      loadProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除提供商失败');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI 提供商管理</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">管理 AI 模型提供商配置</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加提供商
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
                placeholder="搜索提供商名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ProviderType | 'ALL')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="ALL">所有类型</option>
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

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as 'ALL' | 'true' | 'false')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="ALL">所有状态</option>
            <option value="true">已启用</option>
            <option value="false">已禁用</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Providers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  提供商
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  排序
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  网站
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
              ) : providers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    暂无提供商
                  </td>
                </tr>
              ) : (
                providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {provider.logoUrl && (
                          <img
                            src={provider.logoUrl}
                            alt={provider.name}
                            className="w-8 h-8 rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {provider.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {provider.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded">
                        <Package className="w-3 h-3" />
                        {provider.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {provider.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded">
                          已启用
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400 text-xs rounded">
                          已禁用
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {provider.sortOrder}
                    </td>
                    <td className="px-6 py-4">
                      {provider.website && (
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          <Globe className="w-3 h-3" />
                          访问
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setEditingProvider(provider)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!provider.isBuiltIn && (
                        <button
                          onClick={() => setDeleteConfirm(provider)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
              共 {total} 个提供商，第 {page} / {totalPages} 页
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
        <CreateAiProviderDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateProvider}
        />
      )}

      {editingProvider && (
        <EditAiProviderDialog
          provider={editingProvider}
          onClose={() => setEditingProvider(null)}
          onUpdate={handleUpdateProvider}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">确认删除</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              确定要删除提供商 "{deleteConfirm.name}" 吗？此操作不可恢复。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteProvider(deleteConfirm)}
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
