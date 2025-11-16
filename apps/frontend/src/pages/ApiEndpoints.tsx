import { Helmet } from 'react-helmet-async';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { siteConfig } from '@/config/site';

const DEPARTMENT_ENDPOINTS = [
  {
    name: 'DD1 部门',
    url: 'https://api.dd1.gccode.cn',
  },
  {
    name: 'DD2 部门',
    url: 'https://api.dd2.gccode.cn',
  },
  {
    name: 'DD3 部门',
    url: 'https://api.dd3.gccode.cn',
  },
  {
    name: 'Leyser 部门',
    url: 'https://api.leyser.gccode.cn',
  },
];

const FALLBACK_ENDPOINT = {
  name: '通用地址',
  url: 'https://api.gccode.cn',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title="复制地址"
    >
      {copied ? (
        <Check className="h-5 w-5 text-green-600" />
      ) : (
        <Copy className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      )}
    </button>
  );
}

export default function ApiEndpoints() {
  return (
    <PageLayout>
      <Helmet>
        <title>API 地址 - {siteConfig.name}</title>
        <meta name="description" content="GC Code API 地址列表，根据部门选择合适的地址" />
      </Helmet>

      {/* API Endpoints Section */}
      <section className="relative py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
        {/* 装饰性背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 dark:bg-primary-900/10 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-100 dark:bg-accent-900/10 rounded-full blur-3xl opacity-30"></div>
        </div>

        <div className="container-custom relative">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                API 地址列表
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                请根据您的部门选择对应的 API 地址
              </p>
            </div>

            {/* API 地址列表 - 紧凑样式 */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {DEPARTMENT_ENDPOINTS.map((endpoint) => (
                  <div
                    key={endpoint.url}
                    className="group relative px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* 彩色标记 */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                          {endpoint.name.charAt(0)}
                        </div>
                      </div>

                      {/* 地址信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {endpoint.name}
                          </h3>
                        </div>
                        <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {endpoint.url}
                        </code>
                      </div>

                      {/* 复制按钮 */}
                      <div className="flex-shrink-0">
                        <CopyButton text={endpoint.url} />
                      </div>
                    </div>
                  </div>
                ))}

                {/* 通用地址 */}
                <div className="relative px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                        通
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {FALLBACK_ENDPOINT.name}
                        </h3>
                      </div>
                      <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {FALLBACK_ENDPOINT.url}
                      </code>
                    </div>

                    <div className="flex-shrink-0">
                      <CopyButton text={FALLBACK_ENDPOINT.url} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-6">
              {/* 使用建议 */}
              <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">使用建议</h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>• 如有对应部门请优先使用部门地址</p>
                      <p>• 请勿跨部门使用其他部门的地址</p>
                      <p>• 其他情况请使用通用地址</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 重要提示 */}
              <div className="rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">重要提示</h3>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        <strong className="text-gray-900 dark:text-white">🌏 地域优化：</strong>
                        针对中国大陆优化，国内访问更稳定
                      </p>
                      <p>
                        <strong className="text-gray-900 dark:text-white">🔄 访问流程：</strong>
                        客户端 → API 地址 → 海外节点
                      </p>
                      <p>
                        <strong className="text-gray-900 dark:text-white">🌐 海外限制：</strong>
                        不保证海外服务器可访问，需要海外直连请联系
                        <span className="ml-1 font-mono font-semibold text-amber-700 dark:text-amber-400">
                          Edric.Li
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
