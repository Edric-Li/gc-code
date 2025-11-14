import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  Sparkles,
  Bug,
  Lightbulb,
  TrendingUp,
  Clock,
  LayoutDashboard,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { siteConfig } from '@/config/site';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user } = useAuth();

  const useCases = [
    {
      icon: Code2,
      title: '快速开发',
      description: '提升编码效率，减少重复劳动',
      items: ['根据需求生成代码框架', '自动补全复杂逻辑', '快速实现常见功能模块'],
    },
    {
      icon: Bug,
      title: '调试排错',
      description: '快速定位问题根源',
      items: ['分析错误堆栈信息', '提供修复方案和建议', '解释复杂的报错原因'],
    },
    {
      icon: Sparkles,
      title: '代码优化',
      description: '提升代码质量和性能',
      items: ['重构冗余代码', '优化算法性能', '应用最佳实践和设计模式'],
    },
    {
      icon: Lightbulb,
      title: '学习助手',
      description: '理解新技术和代码逻辑',
      items: ['解释陌生代码的工作原理', '学习新框架和工具', '获取技术方案建议'],
    },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: '提升开发效率',
      value: '30-50%',
      description: '减少重复性工作，专注核心业务逻辑',
    },
    {
      icon: Clock,
      title: '节省学习时间',
      value: '快速上手',
      description: '快速理解新技术和陌生代码',
    },
    {
      icon: Lightbulb,
      title: '降低开发门槛',
      value: '即学即用',
      description: '不熟悉的技术栈也能快速产出',
    },
  ];

  return (
    <PageLayout>
      <Helmet>
        <title>{siteConfig.name}</title>
        <meta name="description" content={siteConfig.description} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 dark:bg-primary-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-accent-200 dark:bg-accent-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        <div className="container-custom w-full relative z-10">
          <div className="mx-auto max-w-6xl text-center py-20 md:py-28 lg:py-36">
            {/* Main Title with enhanced animation */}
            <div className="relative mb-12 md:mb-16">
              <h1 className="animate-fade-in text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-7xl md:text-8xl lg:text-9xl leading-none">
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-flow bg-[length:200%_auto]">
                  GC Code
                </span>
              </h1>
            </div>

            <p className="animate-slide-up text-xl text-gray-700 dark:text-gray-200 sm:text-2xl md:text-3xl font-semibold mb-4 leading-tight">
              面向 GC 内部人员的 Claude Code 中转服务
            </p>

            <p className="animate-slide-up text-base text-gray-500 dark:text-gray-400 sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              为开发者提供强大的 AI 编程助手 · 提升开发效率 · 释放创意潜能
            </p>

            {/* CTA Buttons */}
            <div className="animate-slide-up mt-12 md:mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {user ? (
                <>
                  <Link
                    to="/console"
                    className="group btn-primary btn-lg w-full sm:w-auto px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    用户控制台
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/docs/quick-start/installation"
                    className="btn-secondary btn-lg w-full sm:w-auto px-8 py-4 text-lg font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    查看文档
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/docs/quick-start/installation"
                    className="group btn-primary btn-lg w-full sm:w-auto px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    快速开始
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/usage"
                    className="btn-secondary btn-lg w-full sm:w-auto px-8 py-4 text-lg font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    用量查询
                  </Link>
                </>
              )}
            </div>

            {/* Use Cases Section */}
            <div className="mt-24 md:mt-32 mb-16 md:mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
                使用场景
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-12 md:mb-16 max-w-2xl mx-auto">
                覆盖开发全流程，让 AI 成为你的编程伙伴
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {useCases.map((useCase, index) => {
                  const Icon = useCase.icon;
                  return (
                    <div
                      key={useCase.title}
                      className="group relative card overflow-hidden transform hover:scale-[1.02] transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50" />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-950/10 dark:to-accent-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative z-10 p-6 md:p-8">
                        {/* Icon and Title Row */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="inline-flex p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 group-hover:scale-110 transition-transform duration-300">
                              <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                              {useCase.title}
                            </h3>
                          </div>
                          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">
                            {useCase.description}
                          </p>
                        </div>

                        {/* Items List */}
                        <ul className="space-y-2">
                          {useCase.items.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300"
                            >
                              <span className="inline-block w-1 h-1 rounded-full bg-primary-500 dark:bg-primary-400 mt-1.5 flex-shrink-0" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Benefits Section */}
            <div className="mt-24 md:mt-32 mb-16 md:mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
                开发效益
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-12 md:mb-16 max-w-2xl mx-auto">
                使用 Claude Code 带来的实际好处
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={benefit.title}
                      className="group relative card overflow-hidden text-center p-6 md:p-8 transform hover:scale-105 transition-all duration-300 animate-slide-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50" />
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-accent-50/50 dark:from-primary-950/10 dark:to-accent-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative z-10">
                        {/* Icon */}
                        <div className="inline-flex p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>

                        {/* Value */}
                        <div className="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                          {benefit.value}
                        </div>

                        {/* Title */}
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {benefit.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
