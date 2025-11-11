const API_URL = import.meta.env.VITE_API_URL || '/api';

export type OrganizationType = 'DEPARTMENT' | 'PROJECT_GROUP' | 'TEAM' | 'OTHER';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  parentId?: string;
  description?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
    type: OrganizationType;
  };
  children?: Organization[];
  members: OrganizationMember[];
  _count?: {
    members: number;
    children: number;
  };
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  type?: OrganizationType;
  parentId?: string;
  description?: string;
  avatarUrl?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  type?: OrganizationType;
  parentId?: string;
  description?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface AddMemberDto {
  userId: string;
  isAdmin?: boolean;
}

export interface UpdateMemberRoleDto {
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export async function getOrganizations(token: string, mine?: boolean): Promise<Organization[]> {
  const url = mine ? `${API_URL}/organizations?mine=true` : `${API_URL}/organizations`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch organizations');
  }

  return response.json();
}

export async function getOrganization(token: string, id: string): Promise<Organization> {
  const response = await fetch(`${API_URL}/organizations/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch organization');
  }

  return response.json();
}

export async function getOrganizationBySlug(token: string, slug: string): Promise<Organization> {
  const response = await fetch(`${API_URL}/organizations/slug/${slug}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch organization');
  }

  return response.json();
}

export async function createOrganization(
  token: string,
  data: CreateOrganizationDto
): Promise<Organization> {
  const response = await fetch(`${API_URL}/organizations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '创建组织失败');
  }

  return response.json();
}

export async function updateOrganization(
  token: string,
  id: string,
  data: UpdateOrganizationDto
): Promise<Organization> {
  const response = await fetch(`${API_URL}/organizations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '更新组织失败');
  }

  return response.json();
}

export async function deleteOrganization(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_URL}/organizations/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '删除组织失败');
  }
}

export async function addMember(
  token: string,
  organizationId: string,
  data: AddMemberDto
): Promise<OrganizationMember> {
  const response = await fetch(`${API_URL}/organizations/${organizationId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '添加成员失败');
  }

  return response.json();
}

export async function updateMemberRole(
  token: string,
  organizationId: string,
  memberId: string,
  data: UpdateMemberRoleDto
): Promise<OrganizationMember> {
  const response = await fetch(`${API_URL}/organizations/${organizationId}/members/${memberId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '更新成员角色失败');
  }

  return response.json();
}

export async function removeMember(
  token: string,
  organizationId: string,
  memberId: string
): Promise<void> {
  const response = await fetch(`${API_URL}/organizations/${organizationId}/members/${memberId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '移除成员失败');
  }
}

export async function getOrganizationTree(token: string): Promise<Organization[]> {
  const response = await fetch(`${API_URL}/organizations/tree`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch organization tree');
  }

  return response.json();
}
