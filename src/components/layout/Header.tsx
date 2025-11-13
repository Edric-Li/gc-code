import { Link } from 'react-router-dom';
import { User, Home, BookOpen, Sparkles, MessageSquare, BarChart3, LucideIcon } from 'lucide-react';
import Logo from '@/components/common/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { navConfig } from '@/config/site';
import { useAuth } from '@/contexts/AuthContext';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export default function Header() {
  const { user } = useAuth();

  // 图标映射
  const iconMap: Record<string, LucideIcon> = {
    Home,
    BookOpen,
    Sparkles,
    MessageSquare,
    BarChart3,
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Theme Toggle */}
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <Logo />
            </Link>
            <ThemeToggle />
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              {navConfig.mainNav.map((item) => {
                const Icon = item.icon ? iconMap[item.icon] : null;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.title}
                  </Link>
                );
              })}

              {/* 控制台和管理后台链接 - 已隐藏，可通过下拉菜单或直接URL访问 */}
              {/* {user && (
                <>
                  {user.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5"
                    >
                      <Shield className="w-4 h-4" />
                      管理后台
                    </Link>
                  )}
                  <Link
                    to="/console"
                    className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    控制台
                  </Link>
                </>
              )} */}
            </nav>

            {user && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                      {user.displayName || user.username || user.email.split('@')[0]}
                    </span>
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1"
                    sideOffset={5}
                  >
                    <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-default outline-none">
                      <div className="font-medium">{user.displayName || user.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
