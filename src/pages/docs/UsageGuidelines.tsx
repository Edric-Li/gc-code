import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import DocumentLayout from '@/components/docs/DocumentLayout';
import DocNavigation from '@/components/docs/DocNavigation';
import Callout from '@/components/docs/Callout';
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
          在使用 Claude API 之前，请仔细阅读以下注意事项和使用限制。
        </p>

        <Callout type="warning" title="重要提示">
          以下规则为强制性要求，违反可能导致服务暂停或 API Key 被撤销。请务必遵守。
        </Callout>

        {/* 额度与限制 */}
        <h2 id="quota-and-limits">额度与限制</h2>

        <div className="my-6 rounded-lg border-l-4 border-primary-500 bg-primary-50 p-6 dark:bg-primary-950/30">
          <h3 className="mt-0 text-lg font-semibold text-primary-900 dark:text-primary-100">
            默认配置
          </h3>
          <ul className="mb-0">
            <li>
              <strong>每日费用上限</strong>：100 美元 / Key
            </li>
            <li>
              <strong>并发请求限制</strong>：3 个并发
            </li>
          </ul>
        </div>

        <p>以上为系统稳定运行的默认配置。如遇额度不足或并发受限，可联系管理员调整配额。</p>

        <Callout type="info" title="配额调整">
          如果你的业务需要更高的额度或并发限制，请提前联系管理员说明使用场景，我们会根据实际需求进行评估和调整。
        </Callout>

        {/* 禁止高负载操作 */}
        <h2 id="prohibited-operations">禁止高负载操作</h2>

        <p className="font-semibold text-red-600 dark:text-red-400">⚠️ 严格禁止以下行为：</p>

        <div className="my-6 space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <h4 className="mb-2 flex items-center gap-2 text-red-900 dark:text-red-100">
              <span className="text-xl">🚫</span>
              <span className="font-semibold">压力测试</span>
            </h4>
            <p className="mb-0 text-sm text-red-800 dark:text-red-200">
              禁止对服务进行压力测试或性能基准测试
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <h4 className="mb-2 flex items-center gap-2 text-red-900 dark:text-red-100">
              <span className="text-xl">🚫</span>
              <span className="font-semibold">多线程并发</span>
            </h4>
            <p className="mb-0 text-sm text-red-800 dark:text-red-200">
              禁止使用多线程或异步方式进行大量并发请求
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <h4 className="mb-2 flex items-center gap-2 text-red-900 dark:text-red-100">
              <span className="text-xl">🚫</span>
              <span className="font-semibold">短时间大量请求</span>
            </h4>
            <p className="mb-0 text-sm text-red-800 dark:text-red-200">
              禁止在短时间内发送大批量请求，避免对系统造成冲击
            </p>
          </div>
        </div>

        <p>
          <strong>如有特殊需求：</strong>
          如确实需要进行高负载测试或有大规模请求需求，请提前与管理员沟通，以便申请更高配额与专用资源。
        </p>

        {/* 使用范围 */}
        <h2 id="usage-scope">使用范围</h2>

        <div className="my-6 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/30">
          <h3 className="mt-0 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
            <span className="text-xl">✅</span>
            <span>允许的使用场景</span>
          </h3>
          <ul className="mb-0">
            <li>公司内部的开发和测试</li>
            <li>工作相关的研究和实验</li>
            <li>生产环境的业务应用</li>
          </ul>
        </div>

        <div className="my-6 rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/30">
          <h3 className="mt-0 flex items-center gap-2 text-lg font-semibold text-red-900 dark:text-red-100">
            <span className="text-xl">❌</span>
            <span>禁止的使用场景</span>
          </h3>
          <ul className="mb-0">
            <li>个人项目或个人用途</li>
            <li>与工作无关的业余项目</li>
            <li>商业转售或二次分发</li>
          </ul>
        </div>

        <Callout type="warning" title="使用范围限制">
          API 资源仅限公司内部使用，请勿将其用于个人项目或与工作无关的用途。如有疑问，请咨询管理员。
        </Callout>

        {/* 安全与保密 */}
        <h2 id="security">安全与保密</h2>

        <p>API Key 是访问服务的凭证，必须严格保密：</p>

        <h3 id="key-management">密钥管理</h3>
        <ul>
          <li>
            <strong>妥善保管</strong>：请将 API Key 存储在安全的地方，使用环境变量管理
          </li>
          <li>
            <strong>禁止泄露</strong>：不得将 API Key 提交到公开代码仓库或与他人分享
          </li>
          <li>
            <strong>及时上报</strong>：若发现密钥泄漏或异常使用，请立即联系管理员重置
          </li>
        </ul>

        <h3 id="confidentiality">保密要求</h3>
        <ul>
          <li>服务地址、配置信息等仅限公司内部使用</li>
          <li>禁止将服务相关信息外传或公开</li>
          <li>遵守公司信息安全管理规定</li>
        </ul>

        <Callout type="error" title="安全警告">
          <strong>一旦发现 API Key 泄露或滥用：</strong>
          <ul className="mb-0 mt-2">
            <li>管理员将立即撤销该 Key</li>
            <li>可能影响相关项目的正常运行</li>
            <li>严重情况可能承担相应责任</li>
          </ul>
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

        {/* 违规处理 */}
        <h2 id="violations">违规处理</h2>

        <p>如违反上述使用规则，可能面临以下处理措施：</p>

        <ol>
          <li>
            <strong>警告</strong>：首次轻微违规，会收到警告通知
          </li>
          <li>
            <strong>限制额度</strong>：降低 API 调用额度或并发限制
          </li>
          <li>
            <strong>暂停服务</strong>：暂时停用 API Key，直至问题解决
          </li>
          <li>
            <strong>撤销权限</strong>：严重违规或屡次违规，将撤销 API 访问权限
          </li>
        </ol>

        {/* 联系方式 */}
        <h2 id="contact">需要帮助？</h2>

        <p>如有以下情况，请及时联系管理员：</p>

        <ul>
          <li>需要调整额度或并发限制</li>
          <li>计划进行高负载测试</li>
          <li>发现 API Key 泄露</li>
          <li>遇到异常使用情况</li>
          <li>对使用规则有疑问</li>
        </ul>

        <Callout type="info" title="联系管理员">
          请通过公司内部通讯工具（企业微信、钉钉等）联系管理员，或发送邮件至指定邮箱。
        </Callout>

        {/* 底部导航 */}
        <DocNavigation prev={prev} next={next} />
      </div>
    </DocumentLayout>
  );
}
