import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData, loginWithAzure } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // 防止 React 严格模式导致的重复执行
    if (hasProcessed.current) {
      console.log('⏭️ [AuthCallback] Already processed, skipping...');
      return;
    }

    hasProcessed.current = true;
    console.log('📍 [AuthCallback] Component mounted - First time');
    console.log(
      '📍 [AuthCallback] localStorage.redirectAfterLogin:',
      localStorage.getItem('redirectAfterLogin')
    );
    console.log(
      '📍 [AuthCallback] sessionStorage.redirectAfterLogin:',
      sessionStorage.getItem('redirectAfterLogin')
    );

    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      // 如果认证失败，重新尝试登录
      console.error('Azure auth failed:', error);
      setTimeout(() => loginWithAzure(), 1000);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        setAuthData(token, user);

        // 立即读取并清除重定向路径（在 setTimeout 之前，避免被重复执行清空）
        const redirectPath =
          sessionStorage.getItem('redirectAfterLogin') ||
          localStorage.getItem('redirectAfterLogin');

        // 立即清理存储，防止重复读取
        localStorage.removeItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');

        console.log('🔄 [AuthCallback] Redirect path from storage:', redirectPath);

        // 短暂延迟，让用户看到成功提示
        setTimeout(() => {
          // 如果有保存的路径且不是根路径，跳转到该路径
          if (redirectPath && redirectPath !== '/' && redirectPath !== '') {
            console.log('✅ [AuthCallback] Navigating to saved path:', redirectPath);
            navigate(redirectPath, { replace: true });
          } else {
            console.log('🏠 [AuthCallback] No saved path, navigating to home');
            navigate('/', { replace: true });
          }
        }, 800);
      } catch (err) {
        console.error('Failed to parse user data:', err);
        // 数据解析失败，重新登录
        setTimeout(() => loginWithAzure(), 1000);
      }
    } else {
      // 没有token和user数据，重新登录
      loginWithAzure();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-8">
          {searchParams.get('token') ? (
            <CheckCircle className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-scale-in" />
          ) : (
            <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
          )}
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          {searchParams.get('token') ? '登录成功' : '正在完成登录'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {searchParams.get('token') ? '即将跳转...' : '正在验证 Microsoft 账户...'}
        </p>
      </div>
    </div>
  );
}
