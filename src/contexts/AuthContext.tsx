import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as authApi from '@/services/authApi';

interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    username?: string;
    displayName?: string;
  }) => Promise<void>;
  logout: () => void;
  loginWithAzure: () => void;
  setAuthData: (token: string, user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 恢复登录状态
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));

        try {
          // 验证 token 是否有效
          const profile = await authApi.getProfile(savedToken);
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } catch (error) {
          // Token 无效，清除登录状态
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setToken(response.access_token);
    setUser(response.user);
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; username?: string; displayName?: string }) => {
      await authApi.register(data);
      // 注册后自动登录
      await login(data.email, data.password);
    },
    [login]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const loginWithAzure = useCallback(() => {
    // Azure 登录需要完整 URL 进行重定向，因此使用绝对路径
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555/api';
    window.location.href = `${apiUrl}/auth/azure`;
  }, []);

  const setAuthData = useCallback((token: string, user: User) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loginWithAzure,
        setAuthData,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
