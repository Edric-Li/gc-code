import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { siteConfig } from '@/config/site';

export default function Home() {
  return (
    <PageLayout>
      <Helmet>
        <title>{siteConfig.name}</title>
        <meta name="description" content={siteConfig.description} />
      </Helmet>

      {/* Hero Section */}
      <section className="gradient-bg min-h-[85vh] flex items-center py-24 md:py-32">
        <div className="container-custom w-full">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="animate-fade-in text-6xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-7xl md:text-8xl lg:text-9xl">
              <span className="block bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                GC Code
              </span>
            </h1>

            <p className="animate-slide-up mt-10 text-xl text-gray-600 dark:text-gray-300 sm:text-2xl md:text-3xl">
              统一接入 Claude、Codex 等多种 AI 服务
            </p>

            <p className="animate-slide-up mt-6 text-base text-gray-500 dark:text-gray-400 sm:text-lg md:text-xl">
              🔒 私有部署 · ⚡ 高性能 · 🛡️ 安全可控
            </p>

            <div className="animate-slide-up mt-14 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <Link to="/docs" className="btn-primary btn-lg w-full sm:w-auto px-8 py-4 text-lg">
                快速开始
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
              <Link to="/docs" className="btn-secondary btn-lg w-full sm:w-auto px-8 py-4 text-lg">
                查看文档
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
