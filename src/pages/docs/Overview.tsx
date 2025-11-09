import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import DocumentLayout from '@/components/docs/DocumentLayout';
import DocNavigation from '@/components/docs/DocNavigation';
import CodeBlock from '@/components/docs/CodeBlock';
import Callout from '@/components/docs/Callout';
import { getDocNavigation } from '@/config/docs';

export default function Overview() {
  const location = useLocation();
  const { prev, next } = getDocNavigation(location.pathname);

  return (
    <DocumentLayout>
      <Helmet>
        <title>GC Code 概述 - GC Code 文档</title>
        <meta
          name="description"
          content="了解 GC Code - 支持 Claude、Kimi、GLM 等多种 AI 模型的中转服务平台"
        />
      </Helmet>

      <div className="prose prose-gray max-w-none dark:prose-invert">
        {/* 面包屑 */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <span>快速开始</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100">GC Code 概述</span>
        </div>

        {/* 标题 */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          GC Code 概述
        </h1>

        <p className="lead text-xl text-gray-600 dark:text-gray-400">
          GC Code 是一个强大的 AI 模型中转服务平台，帮助你轻松接入 Claude、Kimi、GLM 等多种主流 AI
          模型。
        </p>

        {/* 什么是 GC Code */}
        <h2 id="what-is-gc-code">什么是 GC Code？</h2>
        <p>
          GC Code 基于开源项目{' '}
          <a
            href="https://github.com/Wei-Shaw/claude-relay-service"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            claude-relay-service
          </a>{' '}
          构建，提供了一个统一的接口来访问多个 AI 模型服务。通过 GC Code，你可以：
        </p>

        <ul>
          <li>
            <strong>统一接口</strong>：使用相同的 API 格式调用不同的 AI 模型
          </li>
          <li>
            <strong>私有部署</strong>：完全掌控你的数据和服务，保障安全性
          </li>
          <li>
            <strong>高性能</strong>：优化的请求处理，提供快速响应
          </li>
          <li>
            <strong>易于扩展</strong>：模块化设计，轻松添加新的模型支持
          </li>
        </ul>

        <Callout type="info" title="适用场景">
          GC Code 特别适合需要在应用中集成多个 AI 模型的开发者，无需为每个模型编写不同的集成代码。
        </Callout>

        {/* 核心特性 */}
        <h2 id="core-features">核心特性</h2>

        <h3 id="model-support">多模型支持</h3>
        <p>目前 GC Code 支持以下 AI 模型：</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 text-lg font-semibold">Claude</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Anthropic 的强大对话模型，擅长复杂任务处理
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 text-lg font-semibold">Kimi</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Moonshot AI 的长文本模型，支持超长上下文
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 text-lg font-semibold">GLM</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              智谱 AI 的中英双语模型，适合多语言场景
            </p>
          </div>
        </div>

        <h3 id="deployment">私有部署</h3>
        <p>
          GC Code 支持完全私有化部署，你可以将服务部署在自己的服务器上，完全掌控数据流向和访问权限。
        </p>

        <CodeBlock
          language="bash"
          code={`# 克隆仓库
git clone https://github.com/Wei-Shaw/claude-relay-service.git

# 安装依赖
cd claude-relay-service
npm install

# 配置环境变量
cp .env.example .env

# 启动服务
npm start`}
        />

        <Callout type="warning" title="注意">
          在生产环境中部署时，请确保正确配置环境变量和安全策略。详见
          <a href="/docs/guides/deployment" className="ml-1 text-primary-600">
            部署指南
          </a>
          。
        </Callout>

        {/* 快速示例 */}
        <h2 id="quick-example">快速示例</h2>
        <p>下面是一个使用 GC Code API 的简单示例：</p>

        <CodeBlock
          language="javascript"
          filename="example.js"
          code={`const response = await fetch('https://your-gc-code-server.com/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'claude-3-sonnet',
    messages: [
      {
        role: 'user',
        content: '你好，请介绍一下你自己'
      }
    ]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`}
        />

        <Callout type="success" title="下一步">
          现在你已经了解了 GC Code 的基本概念，继续阅读
          <a href="/docs/getting-started/installation" className="ml-1 text-primary-600">
            快速安装
          </a>
          来开始使用吧！
        </Callout>

        {/* 架构概览 */}
        <h2 id="architecture">架构概览</h2>
        <p>GC Code 采用简洁的分层架构：</p>

        <div className="my-6 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-4 text-center">
            <div className="rounded-lg bg-primary-100 p-4 dark:bg-primary-900/30">
              <div className="font-semibold text-primary-900 dark:text-primary-100">客户端应用</div>
              <div className="text-sm text-primary-700 dark:text-primary-300">你的应用程序</div>
            </div>
            <div className="text-gray-400">↓</div>
            <div className="rounded-lg bg-accent-100 p-4 dark:bg-accent-900/30">
              <div className="font-semibold text-accent-900 dark:text-accent-100">
                GC Code 中转层
              </div>
              <div className="text-sm text-accent-700 dark:text-accent-300">
                统一接口、认证、负载均衡
              </div>
            </div>
            <div className="text-gray-400">↓</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-gray-200 p-4 dark:bg-gray-700">
                <div className="font-semibold">Claude API</div>
              </div>
              <div className="rounded-lg bg-gray-200 p-4 dark:bg-gray-700">
                <div className="font-semibold">Kimi API</div>
              </div>
              <div className="rounded-lg bg-gray-200 p-4 dark:bg-gray-700">
                <div className="font-semibold">GLM API</div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部导航 */}
        <DocNavigation prev={prev} next={next} />
      </div>
    </DocumentLayout>
  );
}
