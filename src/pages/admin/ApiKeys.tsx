import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Ban,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { apiKeyApi } from '@/services/apiKeyApi';
import type {
  ApiKey,
  KeyStatus,
  CreateApiKeyDto,
  UpdateApiKeyDto,
  QueryApiKeysDto,
} from '@/types/apiKey';
import CreateApiKeyDialog from './components/CreateApiKeyDialog';
import EditApiKeyDialog from './components/EditApiKeyDialog';
import ApiKeyDetailsDialog from './components/ApiKeyDetailsDialog';

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<KeyStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [viewingApiKey, setViewingApiKey] = useState<ApiKey | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ApiKey | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params: QueryApiKeysDto = {
        page,
        limit,
      };

      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter as KeyStatus;

      const response = await apiKeyApi.list(params);
      setApiKeys(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载 API Key 列表失败');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, limit]);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const handleCreateApiKey = async (data: CreateApiKeyDto) => {
    const newApiKey = await apiKeyApi.create(data);
    setShowCreateDialog(false);
    // 显示完整 API Key（仅此一次）
    alert(
      `API Key 创建成功！\n\n完整 API Key（请妥善保存，仅显示一次）:\n${newApiKey.key}\n\nAPI Key ID: ${newApiKey.id}`
    );
    loadApiKeys();
  };

  const handleUpdateApiKey = async (id: string, data: UpdateApiKeyDto) => {
    await apiKeyApi.update(id, data);
    setEditingApiKey(null);
    loadApiKeys();
  };

  const handleDeleteApiKey = async (apiKey: ApiKey) => {
    try {
      await apiKeyApi.delete(apiKey.id);
      setDeleteConfirm(null);
      loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除 API Key 失败');
    }
  };

  const handleRevokeApiKey = async (apiKey: ApiKey) => {
    try {
      await apiKeyApi.revoke(apiKey.id);
      loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : '撤销 API Key 失败');
    }
  };

  const handleRestoreApiKey = async (apiKey: ApiKey) => {
    try {
      await apiKeyApi.restore(apiKey.id);
      loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复 API Key 失败');
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const getStatusBadge = (status: KeyStatus) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      EXPIRED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      REVOKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      DELETED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };

    const labels = {
      ACTIVE: '激活',
      EXPIRED: '已过期',
      REVOKED: '已撤销',
      DELETED: '已删除',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Key 管理</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">共 {total} 个 API Key</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          创建 API Key
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索 API Key 名称..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as KeyStatus | 'ALL');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">全部状态</option>
            <option value="ACTIVE">激活</option>
            <option value="EXPIRED">已过期</option>
            <option value="REVOKED">已撤销</option>
            <option value="DELETED">已删除</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  每日费用限制
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  最后使用
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    加载中...
                  </td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    暂无 API Key
                  </td>
                </tr>
              ) : (
                apiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {apiKey.name}
                        </div>
                        {apiKey.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {apiKey.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate max-w-xs">
                          {apiKey.token}
                        </code>
                        <button
                          onClick={() => copyToClipboard(apiKey.token, apiKey.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                        >
                          {copiedId === apiKey.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(apiKey.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {apiKey.dailyCostLimit ? (
                        <div>¥{apiKey.dailyCostLimit.toFixed(2)}</div>
                      ) : (
                        <span className="text-gray-400">无限制</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(apiKey.lastUsedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingApiKey(apiKey)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="查看详情"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {apiKey.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => setEditingApiKey(apiKey)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="编辑"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRevokeApiKey(apiKey)}
                              className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                              title="撤销"
                            >
                              <Ban className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {apiKey.status === 'DELETED' && (
                          <button
                            onClick={() => handleRestoreApiKey(apiKey)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="恢复"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(apiKey)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
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
              第 {page} 页，共 {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
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
        <CreateApiKeyDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateApiKey}
        />
      )}

      {editingApiKey && (
        <EditApiKeyDialog
          apiKey={editingApiKey}
          onClose={() => setEditingApiKey(null)}
          onUpdate={handleUpdateApiKey}
        />
      )}

      {viewingApiKey && (
        <ApiKeyDetailsDialog apiKey={viewingApiKey} onClose={() => setViewingApiKey(null)} />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">确认删除</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              确定要删除 API Key "<strong>{deleteConfirm.name}</strong>"
              吗？此操作为软删除，可以恢复。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteApiKey(deleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
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
