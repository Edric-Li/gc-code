import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import DocumentLayout from '@/components/docs/DocumentLayout';
import DocNavigation from '@/components/docs/DocNavigation';
import Callout from '@/components/docs/Callout';
import ProhibitedCard from '@/components/docs/ProhibitedCard';
import { getDocNavigation } from '@/config/docs';

export default function UsageGuidelines() {
  const location = useLocation();
  const { prev, next } = getDocNavigation(location.pathname);

  return (
    <DocumentLayout>
      <Helmet>
        <title>使用须知 - GC Code 文档</title>
        <meta name="description" content="Claude API 使用注意事项和限制" />
      </Helmet>

      <div className="prose prose-gray max-w-none dark:prose-invert">
        {/* 面包屑 */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <span className="text-gray-900 dark:text-gray-100">使用须知</span>
        </div>

        {/* 标题 */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          使用须知
        </h1>

        <p className="lead text-xl text-gray-600 dark:text-gray-400">
          请仔细阅读以下使用规范和注意事项。
        </p>

        {/* 使用范围与限制 */}
        <h2 id="usage-scope">使用范围与限制</h2>

        <p>
          服务主要用于工作相关的开发、测试和学习。由于公司资源有限，还请大家优先将额度用在工作项目上，尽量避免用于个人娱乐或业余项目。
        </p>

        <h3 id="quota-limits">配额说明</h3>

        <div className="my-6 flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">每日费用上限</span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">$100</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">并发请求限制</span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">3</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          为了保障系统的稳定运行，我们设置了每日 $100 的费用上限，以防止因意外情况（如代码
          bug、无限循环等）影响整体服务。请合理使用资源，无需刻意达到上限。
        </p>

        <Callout type="info" title="配额调整">
          如果限制不够用，欢迎联系管理员说明情况，我们会根据实际需要适当调整。
        </Callout>

        {/* 严格禁止 */}
        <h2 id="prohibited-operations">严格禁止</h2>

        <div className="my-6 rounded-xl border-2 border-red-500/20 gradient-red-warning p-6 dark:border-red-500/30">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 dark:bg-red-600">
              <span className="text-xl">⚠️</span>
            </div>
            <p className="text-sm font-semibold text-red-900 dark:text-red-100">
              以下操作严禁执行，违反规定可能导致 API 访问受限
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ProhibitedCard title="压力测试" description="禁止性能基准测试" />
            <ProhibitedCard title="高频并发" description="遵守 3 并发及频率限制" />
            <ProhibitedCard title="商业转售" description="禁止转售或二次分发" />
            <ProhibitedCard title="非开发活动" description="禁止用于非公司开发任务" />
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/50 px-3 py-2 dark:bg-gray-800/50">
            <span className="text-sm flex-shrink-0">💡</span>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-0">
              如需进行高负载测试，请提前联系管理员申请专用测试环境
            </p>
          </div>
        </div>

        {/* 安全 */}
        <h2 id="security">安全</h2>

        <p>API Key 是访问服务的重要凭证，请注意保管：</p>

        <h3 id="key-management">密钥管理</h3>
        <ul>
          <li>
            <strong>妥善保管</strong>：建议将 API Key 存储在安全的地方，使用环境变量管理
          </li>
          <li>
            <strong>避免泄露</strong>：注意不要将 API Key 提交到公开代码仓库
          </li>
          <li>
            <strong>及时上报</strong>：若发现密钥泄漏或异常使用，请联系管理员重置
          </li>
        </ul>

        <Callout type="warning" title="安全提醒">
          为了保障服务安全和项目稳定运行，请注意保护好您的 API
          Key。如发现异常情况，请及时联系管理员处理。
        </Callout>

        {/* 网络访问 */}
        <h2 id="network-access">网络访问</h2>

        <p>服务的网络访问特点：</p>

        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
            <h4 className="mb-2 flex items-center gap-2 font-semibold text-green-900 dark:text-green-100">
              <span className="text-xl">🏢</span>
              <span>公司网络</span>
            </h4>
            <p className="mb-0 text-sm text-green-800 dark:text-green-200">
              在公司所有网络环境下可直接使用，无需任何配置
            </p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
            <h4 className="mb-2 flex items-center gap-2 font-semibold text-green-900 dark:text-green-100">
              <span className="text-xl">🏠</span>
              <span>居家办公</span>
            </h4>
            <p className="mb-0 text-sm text-green-800 dark:text-green-200">
              在家办公时也可正常访问，无需科学上网或 VPN
            </p>
          </div>
        </div>

        <Callout type="success" title="便捷访问">
          服务已针对国内网络环境优化，无论在公司还是居家办公，都可以稳定快速地访问。
        </Callout>

        <Callout type="warning" title="注意事项">
          服务不支持海外访问，如果您开启了全局代理或
          VPN，可能会导致无法正常连接，请在使用时关闭代理。
        </Callout>

        {/* 联系方式 */}
        <h2 id="contact">需要帮助？</h2>

        <p>遇到以下情况时，欢迎随时联系我们：</p>

        <div className="my-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                需要调整额度或并发限制
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <span>🔬</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">计划进行高负载测试</span>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <span>🔐</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">发现 API Key 泄露</span>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <span>❓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">对使用有任何疑问</span>
            </div>
          </div>
        </div>

        <Callout type="info" title="联系我们">
          可以通过 Teams、微信等通讯工具联系 Edric.Li，我们会尽快为您解答。
        </Callout>

        {/* 底部导航 */}
        <DocNavigation prev={prev} next={next} />
      </div>
    </DocumentLayout>
  );
}
