import { Helmet } from 'react-helmet-async';
import PageLayout from '@/components/layout/PageLayout';
import { Lightbulb } from 'lucide-react';

export default function Experience() {
  return (
    <PageLayout>
      <Helmet>
        <title>经验分享 - GC Code</title>
        <meta name="description" content="探索 AI 编程的最佳实践和经验分享" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container-custom py-24">
          <div className="flex flex-col items-center justify-center">
            {/* 图标 */}
            <div className="rounded-full bg-gradient-to-br from-primary-500 to-primary-600 p-6 shadow-lg dark:from-primary-600 dark:to-primary-700">
              <Lightbulb className="h-16 w-16 text-white" />
            </div>

            {/* 标题 */}
            <h1 className="mt-8 text-4xl font-bold text-gray-900 dark:text-white">经验分享</h1>

            {/* 副标题 */}
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">敬请期待</p>

            {/* 描述文字 */}
            <p className="mt-6 max-w-md text-center text-gray-500 dark:text-gray-500">
              我们正在整理精彩的 AI 编程经验和最佳实践，即将与您分享
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
