import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, Ban, Check } from 'lucide-react';
import { apiKeyApi } from '@/services/apiKeyApi';
import type { ApiKey } from '@/types/apiKey';
import { KeyStatus } from '@/types/apiKey';
import { siteConfig } from '@/config/site';
import { checkMyApiKeyNameAvailable } from '@/utils/apiKeyValidation';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await apiKeyApi.list({ limit: 100 });
      setApiKeys(response.data);
    } catch (error) {
      console.error('加载 API Keys 失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const name = (formData.get('name') as string)?.trim() || 'default';

      // 检查名称是否重复（使用优化的 API）
      const checkResult = await checkMyApiKeyNameAvailable(name);
      if (!checkResult.available) {
        alert(`API Key 名称 "${name}" 已存在，请使用其他名称`);
        return;
      }

      const newKey = await apiKeyApi.createMyKey({
        name: name,
        description: formData.get('description') as string,
        dailyCostLimit: formData.get('dailyCostLimit')
          ? Number(formData.get('dailyCostLimit'))
          : undefined,
        expiresAt: formData.get('expiresAt') ? (formData.get('expiresAt') as string) : undefined,
      });

      setNewKeyValue(newKey.key);
      setShowKeyDialog(true);
      setShowCreateDialog(false);
      loadApiKeys();
    } catch (error) {
      console.error('创建 API Key 失败:', error);
      const errorMsg =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        '创建失败，请重试';
      alert(errorMsg);
    }
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const maskKey = (key: string) => {
    if (key.length <= 10) return key;
    return `${key.slice(0, 8)}...${key.slice(-6)}`;
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('确定要删除这个 API Key 吗？')) return;

    try {
      await apiKeyApi.delete(id);
      loadApiKeys();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('确定要撤销这个 API Key 吗？撤销后将无法使用。')) return;

    try {
      await apiKeyApi.revoke(id);
      loadApiKeys();
    } catch (error) {
      console.error('撤销失败:', error);
      alert('撤销失败，请重试');
    }
  };

  const getStatusBadge = (status: KeyStatus) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      EXPIRED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      REVOKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      DELETED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };
    return badges[status] || badges.ACTIVE;
  };

  return (
    <>
      <Helmet>
        <title>API Key 管理 - 用户控制台 - {siteConfig.name}</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              API Key 管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              管理你的 API 令牌 ({apiKeys.filter((k) => k.status !== 'DELETED').length}/20)
            </p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            disabled={apiKeys.filter((k) => k.status !== 'DELETED').length >= 20}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-sm"
            title={
              apiKeys.filter((k) => k.status !== 'DELETED').length >= 20
                ? '已达到创建上限（20个），请先删除不用的密钥'
                : '创建新的 API Key'
            }
          >
            <Plus className="w-4 h-4" />
            创建 API Key
          </button>
        </div>

        {/* API Keys 列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
              <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              还没有 API Key
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              创建你的第一个 API Key 来开始使用服务
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              创建 API Key
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      名称
                    </th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      密钥
                    </th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      最后活跃
                    </th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      过期时间
                    </th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {apiKeys.map((key) => (
                    <tr
                      key={key.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors"
                    >
                      {/* 名称 */}
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {key.name}
                        </span>
                      </td>

                      {/* 状态 */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(key.status)}`}
                        >
                          {key.status === 'ACTIVE' && '活跃'}
                          {key.status === 'EXPIRED' && '已过期'}
                          {key.status === 'REVOKED' && '已撤销'}
                          {key.status === 'DELETED' && '已删除'}
                        </span>
                      </td>

                      {/* API Key */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <code className="inline-flex items-center px-2.5 py-1 bg-gray-50 dark:bg-gray-900/50 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                            {maskKey(key.key)}
                          </code>
                          <button
                            onClick={() => handleCopyKey(key.key, key.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="复制密钥"
                          >
                            {copiedId === key.id ? (
                              <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 创建时间 */}
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(key.createdAt).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* 最后活跃 */}
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {key.lastUsedAt
                            ? new Date(key.lastUsedAt).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })
                            : '-'}
                        </span>
                      </td>

                      {/* 过期时间 */}
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {key.expiresAt
                            ? new Date(key.expiresAt).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })
                            : '永不过期'}
                        </span>
                      </td>

                      {/* 操作 */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {key.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleRevokeKey(key.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-full transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              撤销
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteKey(key.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 创建 API Key 对话框 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">创建 API Key</h2>
            <form onSubmit={handleCreateKey} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
                  名称
                </label>
                <input
                  type="text"
                  name="name"
                  className="input"
                  placeholder="留空将使用默认名称 'default'"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
                  描述
                </label>
                <textarea
                  name="description"
                  className="input"
                  rows={3}
                  placeholder="描述这个 API Key 的用途"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
                  每日费用限制 ($)
                </label>
                <input
                  type="number"
                  name="dailyCostLimit"
                  step="0.01"
                  min="0"
                  className="input"
                  placeholder="例如：10.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
                  过期时间
                </label>
                <input type="date" name="expiresAt" className="input" />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 btn-primary py-2.5">
                  创建
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1 btn-secondary py-2.5"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 显示新创建的 API Key */}
      {showKeyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              API Key 创建成功
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-5 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                API Key 已创建成功！建议立即复制并妥善保存，以便在应用程序中使用。
              </p>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                你的 API Key
              </label>
              <div className="flex gap-3">
                <code className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono break-all leading-relaxed">
                  {newKeyValue}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newKeyValue);
                    alert('已复制到剪贴板');
                  }}
                  className="btn-primary px-4 py-3 flex-shrink-0"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setShowKeyDialog(false);
                setNewKeyValue('');
              }}
              className="w-full btn-primary py-3"
            >
              我已保存，关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
