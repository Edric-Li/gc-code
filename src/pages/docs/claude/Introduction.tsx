import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import DocumentLayout from '@/components/docs/DocumentLayout';
import DocNavigation from '@/components/docs/DocNavigation';
import Callout from '@/components/docs/Callout';
import { getDocNavigation } from '@/config/docs';

export default function ClaudeIntroduction() {
  const location = useLocation();
  const { prev, next } = getDocNavigation(location.pathname);

  return (
    <DocumentLayout>
      <Helmet>
        <title>Claude 介绍 - GC Code 文档</title>
        <meta name="description" content="了解 Claude AI 模型及其强大功能" />
      </Helmet>

      <div className="prose prose-gray max-w-none dark:prose-invert">
        {/* 面包屑 */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Claude 指南</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100">Claude 介绍</span>
        </div>

        {/* 标题 */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Claude 介绍
        </h1>

        <p className="lead text-xl text-gray-600 dark:text-gray-400">
          Claude 是 Anthropic 开发的先进 AI 助手，以安全、准确和有用著称。
        </p>

        {/* 什么是 Claude */}
        <h2 id="what-is-claude">什么是 Claude？</h2>
        <p>
          Claude 是由 Anthropic 公司开发的大型语言模型（LLM），专注于提供安全、准确且有帮助的 AI
          交互体验。Claude
          经过精心训练，能够理解复杂的指令，生成高质量的内容，并在各种任务中表现出色。
        </p>

        {/* 核心特点 */}
        <h2 id="core-features">核心特点</h2>

        <h3 id="safety-and-reliability">安全可靠</h3>
        <p>
          Claude 经过严格的安全训练，采用 Constitutional AI
          技术，能够拒绝有害请求，并提供负责任的回复。这使得 Claude 特别适合企业和生产环境。
        </p>

        <h3 id="long-context">超长上下文窗口</h3>
        <p>
          Claude 支持高达 200K tokens 的上下文窗口，相当于约 150,000 个英文单词或 500 页文档。这使得
          Claude 能够：
        </p>
        <ul>
          <li>分析长篇文档和代码库</li>
          <li>保持长时间对话的上下文</li>
          <li>处理复杂的多轮交互任务</li>
        </ul>

        <h3 id="multilingual">多语言能力</h3>
        <p>Claude 对中文有出色的理解和生成能力，能够准确理解中文语境，生成地道的中文内容。</p>

        <Callout type="info" title="提示">
          Claude 在编程、写作、分析、数学等多个领域都表现出色，是一个真正的通用 AI 助手。
        </Callout>

        {/* Claude 模型版本 */}
        <h2 id="model-versions">Claude 模型版本</h2>
        <p>Claude 提供多个模型版本，适用于不同的场景：</p>

        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 text-lg font-semibold">Claude 3.5 Sonnet</h4>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              最新一代模型，在智能和速度之间达到最佳平衡
            </p>
            <ul className="space-y-1 text-sm">
              <li>✅ 推荐用于大多数应用</li>
              <li>✅ 代码生成和分析能力强</li>
              <li>✅ 性价比最高</li>
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 text-lg font-semibold">Claude 3 Opus</h4>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              最强大的模型，适合复杂任务
            </p>
            <ul className="space-y-1 text-sm">
              <li>✅ 最高的智能水平</li>
              <li>✅ 适合复杂推理任务</li>
              <li>✅ 更高的准确性</li>
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 text-lg font-semibold">Claude 3 Haiku</h4>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              最快速的模型，适合高频调用
            </p>
            <ul className="space-y-1 text-sm">
              <li>✅ 响应速度最快</li>
              <li>✅ 成本最低</li>
              <li>✅ 适合简单任务</li>
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 className="mb-2 text-lg font-semibold">如何选择？</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">根据你的需求选择：</p>
            <ul className="space-y-1 text-sm">
              <li>💡 复杂任务 → Opus</li>
              <li>⚖️ 平衡需求 → Sonnet</li>
              <li>⚡ 快速响应 → Haiku</li>
            </ul>
          </div>
        </div>

        {/* 应用场景 */}
        <h2 id="use-cases">应用场景</h2>
        <p>Claude 可以应用于多种场景：</p>

        <h3 id="coding">编程助手</h3>
        <ul>
          <li>代码生成和重构</li>
          <li>Bug 调试和修复</li>
          <li>代码审查和优化</li>
          <li>技术文档撰写</li>
        </ul>

        <h3 id="content-creation">内容创作</h3>
        <ul>
          <li>文章和博客写作</li>
          <li>营销文案生成</li>
          <li>翻译和本地化</li>
          <li>内容总结和提炼</li>
        </ul>

        <h3 id="data-analysis">数据分析</h3>
        <ul>
          <li>文档分析和总结</li>
          <li>数据提取和整理</li>
          <li>报告生成</li>
          <li>趋势分析</li>
        </ul>

        <Callout type="success" title="开始使用">
          准备好开始使用 Claude 了吗？继续阅读
          <a href="/docs/claude/installation" className="ml-1 text-primary-600">
            环境安装
          </a>
          ，了解如何配置和使用 Claude。
        </Callout>

        {/* 底部导航 */}
        <DocNavigation prev={prev} next={next} />
      </div>
    </DocumentLayout>
  );
}
