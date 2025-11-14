import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Building2, Plus, Trash2, UserPlus, ChevronRight, ChevronDown } from 'lucide-react';
import * as organizationApi from '@/services/organizationApi';
import type {
  Organization,
  OrganizationMember,
  OrganizationType,
} from '@/services/organizationApi';
import { userApi, type User } from '@/services/userApi';

export default function Organizations() {
  const { token } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOrgDetail, setLoadingOrgDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const MAX_DEPTH = 10; // 最大层级深度

  // 用户列表和选择状态
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'DEPARTMENT' as OrganizationType,
    parentId: undefined as string | undefined,
  });

  useEffect(() => {
    loadOrganizations();
    loadUsers();
  }, [token]);

  const loadOrganizations = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await organizationApi.getOrganizationTree(token);
      setOrganizations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载组织失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!token) return;
    try {
      const response = await userApi.getAll({ take: 100 });
      setAllUsers(response.data || []);
    } catch (err) {
      console.error('加载用户列表失败:', err);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const newOrg = await organizationApi.createOrganization(token, formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        type: 'DEPARTMENT',
        parentId: undefined,
      });
      await loadOrganizations();
      // 自动选中新创建的组织
      handleSelectOrg(newOrg);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建组织失败');
    }
  };

  const handleDeleteOrganization = async (id: string) => {
    if (!token || !confirm('确定要删除这个组织吗？')) return;

    try {
      await organizationApi.deleteOrganization(token, id);
      loadOrganizations();
      if (selectedOrg?.id === id) {
        setSelectedOrg(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除组织失败');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedOrg || selectedUserIds.size === 0) return;

    try {
      // 批量添加成员（所有成员都是普通成员，由系统管理员管理）
      const userIdsArray = Array.from(selectedUserIds);
      let successCount = 0;
      const failedUsers: string[] = [];

      for (const userId of userIdsArray) {
        try {
          await organizationApi.addMember(token, selectedOrg.id, { userId });
          successCount++;
        } catch (err) {
          // 如果是已存在错误，记录但继续
          const user = allUsers.find((u) => u.id === userId);
          failedUsers.push(user?.username || userId);
        }
      }

      setShowAddMemberModal(false);
      setSelectedUserIds(new Set());

      // 重新加载组织详情
      const updated = await organizationApi.getOrganization(token, selectedOrg.id);
      setSelectedOrg(updated);

      // 显示结果提示
      if (successCount > 0 && failedUsers.length > 0) {
        setError(`成功添加 ${successCount} 个成员，${failedUsers.length} 个用户已是成员`);
      } else if (failedUsers.length > 0) {
        setError('所选用户都已是组织成员');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加成员失败');
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const handleSelectOrg = async (org: Organization) => {
    if (!token) return;
    try {
      setLoadingOrgDetail(true);
      // 加载完整的组织详情（包含成员列表）
      const fullOrg = await organizationApi.getOrganization(token, org.id);
      setSelectedOrg(fullOrg);
    } catch (err) {
      console.error('加载组织详情失败:', err);
      setSelectedOrg(org); // 降级：使用树形数据
    } finally {
      setLoadingOrgDetail(false);
    }
  };

  const getAvailableUsers = () => {
    if (!selectedOrg) return allUsers;
    const memberIds = new Set(selectedOrg.members?.map((m) => m.userId) || []);
    return allUsers.filter((user) => !memberIds.has(user.id));
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!token || !selectedOrg || !confirm('确定要移除这个成员吗？')) return;

    try {
      await organizationApi.removeMember(token, selectedOrg.id, memberId);
      const updated = await organizationApi.getOrganization(token, selectedOrg.id);
      setSelectedOrg(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除成员失败');
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getTypeLabel = (type: OrganizationType) => {
    const labels: Record<OrganizationType, string> = {
      DEPARTMENT: '部门',
      PROJECT_GROUP: '项目组',
      TEAM: '小组',
      OTHER: '其他',
    };
    return labels[type];
  };

  const getTypeBadgeColor = (type: OrganizationType) => {
    const colors: Record<OrganizationType, string> = {
      DEPARTMENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      PROJECT_GROUP: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      TEAM: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[type];
  };

  // 使用 useMemo 缓存扁平化的组织列表
  const allOrganizations = useMemo(() => {
    const result: Organization[] = [];
    const traverse = (orgs: Organization[]) => {
      for (const org of orgs) {
        result.push(org);
        if (org.children) {
          traverse(org.children);
        }
      }
    };
    traverse(organizations);
    return result;
  }, [organizations]);

  const renderOrganizationTree = (orgs: Organization[], level = 0) => {
    // 防止无限递归
    if (level >= MAX_DEPTH) {
      return null;
    }

    return orgs.map((org) => {
      const hasChildren = org.children && org.children.length > 0;
      const isExpanded = expandedIds.has(org.id);
      const isSelected = selectedOrg?.id === org.id;

      return (
        <div key={org.id}>
          <div
            onClick={() => handleSelectOrg(org)}
            className={`px-2 py-2 cursor-pointer transition-all rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
              isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
          >
            <div className="flex items-center gap-1.5">
              {/* 展开/折叠按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasChildren) toggleExpand(org.id);
                }}
                className={`flex-shrink-0 ${hasChildren ? 'hover:bg-gray-200 dark:hover:bg-gray-700 rounded' : 'invisible'}`}
              >
                {hasChildren &&
                  (isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                  ))}
                {!hasChildren && <div className="w-3.5 h-3.5" />}
              </button>

              {/* 组织图标 */}
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />

              {/* 组织名称和信息 */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                  {org.name}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getTypeBadgeColor(org.type)}`}
                >
                  {getTypeLabel(org.type)}
                </span>
              </div>

              {/* 成员数和操作按钮 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  {org._count?.members || org.members?.length || 0}
                </span>
                {hasChildren && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({org._count?.children || org.children?.length || 0})
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteOrganization(org.id);
                  }}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-0.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="删除组织"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {hasChildren && isExpanded && org.children && (
            <div>{renderOrganizationTree(org.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">组织管理</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">管理组织和成员</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          创建组织
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 组织树形列表 */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">组织列表</h3>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {organizations.length > 0 ? (
                <div className="py-1">{renderOrganizationTree(organizations)}</div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>还没有组织</p>
                  <p className="text-sm">点击"创建组织"开始</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 组织详情 */}
        <div className="lg:col-span-2">
          {loadingOrgDetail ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">加载组织详情...</p>
            </div>
          ) : selectedOrg ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedOrg.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">@{selectedOrg.slug}</p>
                  {selectedOrg.description && (
                    <p className="mt-2 text-gray-700 dark:text-gray-300">
                      {selectedOrg.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">成员列表</h3>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    添加成员
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedOrg.members?.map((member: OrganizationMember) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.user.displayName?.charAt(0) ||
                            member.user.username?.charAt(0) ||
                            'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {member.user.displayName || member.user.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">请从左侧选择一个组织查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 创建组织模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">创建组织</h2>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  组织名称
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  组织标识 (slug)
                </label>
                <input
                  type="text"
                  required
                  pattern="[a-z0-9-]+"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="only-lowercase-and-hyphens"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  组织类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as OrganizationType })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="DEPARTMENT">部门</option>
                  <option value="PROJECT_GROUP">项目组</option>
                  <option value="TEAM">小组</option>
                  <option value="OTHER">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  父组织（可选）
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, parentId: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">无（顶层组织）</option>
                  {allOrganizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.parent ? `  └─ ${org.name}` : org.name} ({getTypeLabel(org.type)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  描述（可选）
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 添加成员模态框 */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">添加成员</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              {/* 用户列表 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  选择用户（可多选）
                </label>
                <div className="max-h-96 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                  {getAvailableUsers().length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      没有可添加的用户
                    </div>
                  ) : (
                    getAvailableUsers().map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <div className="ml-3 flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.displayName || user.username}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSelectedUserIds(new Set());
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={selectedUserIds.size === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  添加 {selectedUserIds.size > 0 && `(${selectedUserIds.size})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
