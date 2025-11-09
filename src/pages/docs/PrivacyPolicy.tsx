import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import DocumentLayout from '@/components/docs/DocumentLayout';
import DocNavigation from '@/components/docs/DocNavigation';
import Callout from '@/components/docs/Callout';
import { getDocNavigation } from '@/config/docs';

export default function PrivacyPolicy() {
  const location = useLocation();
  const { prev, next } = getDocNavigation(location.pathname);

  return (
    <DocumentLayout>
      <Helmet>
        <title>隐私策略 - GC Code 文档</title>
        <meta name="description" content="了解我们如何处理和保护您的数据" />
      </Helmet>

      <div className="prose prose-gray max-w-none dark:prose-invert">
        {/* 面包屑 */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <span className="text-gray-900 dark:text-gray-100">隐私策略</span>
        </div>

        {/* 标题 */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          隐私策略
        </h1>

        <p className="lead text-xl text-gray-600 dark:text-gray-400">
          我们重视您的隐私，本文档说明我们如何处理和保护您的数据。
        </p>

        {/* 数据收集 */}
        <h2 id="data-collection">数据收集</h2>

        <p>为了维护服务正常运行和优化使用体验，我们会收集以下必要数据：</p>

        <h3 id="collected-data">收集的数据</h3>
        <ul>
          <li>
            <strong>使用统计</strong>：API 调用次数、请求频率、使用时长等统计信息
          </li>
          <li>
            <strong>技术信息</strong>：IP 地址、请求头信息、错误日志等技术数据
          </li>
          <li>
            <strong>账户信息</strong>：用户标识、API Key 使用记录等账户相关数据
          </li>
        </ul>

        <Callout type="info" title="数据用途">
          收集的数据仅用于服务监控、故障排查、用量统计和服务优化。
        </Callout>

        {/* 不收集的数据 */}
        <h2 id="not-collected">隐私保护</h2>

        <p>我们充分尊重您的隐私，以下数据不会被收集或存储：</p>

        <div className="my-6 rounded-xl border border-green-200 gradient-green-success p-5 dark:border-green-800">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500 dark:bg-green-600">
              <span className="text-base">🔒</span>
            </div>
            <h3 className="m-0 text-base font-semibold text-green-900 dark:text-green-100">
              对话内容不会被收集
            </h3>
          </div>
          <ul className="mb-0 space-y-1.5 text-sm text-green-800 dark:text-green-200">
            <li>您与 Claude 的对话内容不会被记录或存储</li>
            <li>输入的提示词（Prompt）不会被保存</li>
            <li>Claude 的回复内容不会被收集</li>
            <li>上传的文件和附件不会被留存</li>
          </ul>
        </div>

        <Callout type="success" title="隐私承诺">
          我们承诺不会收集、存储或分析您的对话内容，确保您的交流隐私得到充分保护。
        </Callout>

        {/* 数据安全 */}
        <h2 id="data-security">数据安全</h2>

        <p>我们采取以下措施保护您的数据安全：</p>

        <ul>
          <li>
            <strong>传输加密</strong>：所有数据传输均采用 HTTPS 加密
          </li>
          <li>
            <strong>访问控制</strong>：严格限制数据访问权限，仅授权人员可查看
          </li>
          <li>
            <strong>定期审计</strong>：定期进行安全审计和数据清理
          </li>
          <li>
            <strong>最小化原则</strong>：仅收集必要的最少数据
          </li>
        </ul>

        <div className="my-8 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:border-blue-600 dark:bg-blue-950/30">
          <p className="mb-0 text-sm text-gray-700 dark:text-gray-300">
            我们仅收集必要的技术和统计数据以维护服务运行，您的对话内容始终保持私密。
          </p>
        </div>

        {/* 底部导航 */}
        <DocNavigation prev={prev} next={next} />
      </div>
    </DocumentLayout>
  );
}
