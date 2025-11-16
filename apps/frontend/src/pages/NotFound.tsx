import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { siteConfig } from '@/config/site';

export default function NotFound() {
  return (
    <PageLayout>
      <Helmet>
        <title>404 - 页面未找到 - {siteConfig.name}</title>
      </Helmet>

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-base font-semibold text-primary-600 dark:text-primary-400">404</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            页面未找到
          </h1>
          <p className="mt-6 text-base text-gray-600 dark:text-gray-400">
            抱歉，我们找不到您要查找的页面。
          </p>
          <div className="mt-10">
            <Link to="/" className="btn-primary btn-md">
              <Home className="mr-2 h-5 w-5" />
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
