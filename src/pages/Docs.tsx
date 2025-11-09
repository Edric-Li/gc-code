import { Helmet } from 'react-helmet-async';
import PageLayout from '@/components/layout/PageLayout';
import { siteConfig } from '@/config/site';

export default function Docs() {
  return (
    <PageLayout>
      <Helmet>
        <title>文档 - {siteConfig.name}</title>
        <meta name="description" content="GC Code 文档中心" />
      </Helmet>

      <div className="container-custom py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">文档中心</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            欢迎来到 GC Code 文档中心，文档内容正在编写中...
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="card card-hover p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">快速开始</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                了解如何快速安装和配置 GC Code
              </p>
            </div>

            <div className="card card-hover p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">部署指南</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                学习如何部署 GC Code 到生产环境
              </p>
            </div>

            <div className="card card-hover p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">API 参考</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">查看详细的 API 文档和示例</p>
            </div>

            <div className="card card-hover p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">常见问题</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">查找常见问题的解决方案</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
