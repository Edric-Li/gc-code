import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/common/Loading';
import { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading, loginWithAzure } = useAuth();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  // 未登录，直接跳转到 Azure 登录 (必须在顶层调用 useEffect)
  useEffect(() => {
    if (!isLoading && !user && !redirecting) {
      setRedirecting(true);
      // 保存原始路径到 localStorage 和 sessionStorage（双保险）
      const pathToSave = location.pathname + location.search;
      console.log('🔐 [ProtectedRoute] Saving redirect path:', pathToSave);
      localStorage.setItem('redirectAfterLogin', pathToSave);
      sessionStorage.setItem('redirectAfterLogin', pathToSave);

      // 稍微延迟一下，让用户看到提示信息
      setTimeout(() => {
        loginWithAzure();
      }, 1500);
    }
  }, [user, isLoading, loginWithAzure, location.pathname, location.search, redirecting]);

  // 正在加载用户信息
  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-8">
            <LogIn className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">未登录</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">即将跳转到 Microsoft 登录页面...</p>

          <div className="flex justify-center">
            <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full animate-progress"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 需要管理员权限但用户不是管理员
  if (requireAdmin && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">权限不足</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">您没有权限访问此页面</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
