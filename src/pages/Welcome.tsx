import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function Welcome() {
  const { user, loginWithAzure, isLoading: authLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const location = useLocation();

  // 如果已登录，重定向到目标页面或首页
  if (user && !authLoading) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const handleAzureLogin = () => {
    setIsRedirecting(true);

    // 保存原始目标路径到 localStorage，以便登录后跳转
    const from = (location.state as { from?: { pathname: string; search?: string; hash?: string } })
      ?.from;
    if (from?.pathname && from.pathname !== '/welcome') {
      // 保存完整路径，包括 search 和 hash
      const fullPath = from.pathname + (from.search || '') + (from.hash || '');
      localStorage.setItem('redirectAfterLogin', fullPath);
    }

    // 设置一个短暂延迟，让用户看到加载状态
    setTimeout(() => {
      loginWithAzure();
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="relative max-w-5xl w-full">
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 px-12 py-20 md:px-24 md:py-28 text-center">
          {/* Main Title */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-12 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              GC Code
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white mb-8 font-medium">
            面向 GC 内部人员的 Claude Code 中转服务
          </p>

          {/* Description */}
          <p className="text-base md:text-lg text-slate-300 mb-16 max-w-3xl mx-auto leading-relaxed">
            为开发者提供强大的 AI 编程助手 · 提升开发效率 · 释放创意潜能
          </p>

          {/* Azure Login Button */}
          <div>
            <button
              onClick={handleAzureLogin}
              disabled={isRedirecting || authLoading}
              className="group w-full max-w-md mx-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-base font-semibold rounded-xl shadow-lg hover:shadow-blue-500/50 hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>正在跳转到 Microsoft 登录...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-300"
                    viewBox="0 0 23 23"
                  >
                    <path fill="#f35325" d="M0 0h11v11H0z" />
                    <path fill="#81bc06" d="M12 0h11v11H12z" />
                    <path fill="#05a6f0" d="M0 12h11v11H0z" />
                    <path fill="#ffba08" d="M12 12h11v11H12z" />
                  </svg>
                  <span>使用 Microsoft 账户登录</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
