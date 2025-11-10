// 使用相对路径以便通过 Vite 代理访问后端
const API_URL = import.meta.env.VITE_API_URL || '/api';

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    username?: string;
    displayName?: string;
    avatar?: string;
  };
}

export async function login(data: LoginDto): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '登录失败');
  }

  return response.json();
}

export async function register(
  data: RegisterDto
): Promise<{ id: string; email: string; username: string; displayName?: string }> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '注册失败');
  }

  return response.json();
}

export async function getProfile(
  token: string
): Promise<{
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
}> {
  const response = await fetch(`${API_URL}/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('获取用户信息失败');
  }

  return response.json();
}
