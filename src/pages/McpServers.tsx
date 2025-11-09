import { Helmet } from 'react-helmet-async';
import { Github, Globe, Chrome, Sparkles, ExternalLink, Trello } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

interface McpServer {
  name: string;
  description: string;
  icon: typeof Github;
  features: string[];
  documentUrl: string;
  recommended?: boolean;
}

export default function McpServers() {
  const mcpServers: McpServer[] = [
    {
      name: 'Playwright',
      description: '浏览器自动化测试工具，支持截图、交互和数据抓取',
      icon: Chrome,
      features: ['网页截图', '自动化测试', '表单填写', '数据抓取'],
      documentUrl: 'https://github.com/executeautomation/mcp-playwright',
      recommended: true,
    },
    {
      name: 'Chrome MCP',
      description: '基于 Chrome DevTools Protocol 的浏览器控制工具',
      icon: Chrome,
      features: ['浏览器控制', '页面交互', '性能分析', '调试辅助'],
      documentUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
      recommended: true,
    },
    {
      name: 'Atlassian',
      description: '集成 Jira 和 Confluence，管理任务和文档',
      icon: Trello,
      features: ['Jira 集成', 'Confluence 文档', '任务管理', '团队协作'],
      documentUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/atlassian',
      recommended: true,
    },
    {
      name: 'Sequential Thinking',
      description: '结构化思维辅助，帮助 AI 进行深度推理',
      icon: Sparkles,
      features: ['逐步推理', '问题分解', '思维链'],
      documentUrl:
        'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking',
      recommended: true,
    },
  ];

  return (
    <PageLayout>
      <Helmet>
        <title>MCP 精选 - GC Code</title>
        <meta name="description" content="精选优质 MCP 服务器，增强 Claude Code 功能" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container-custom py-16 md:py-20">
          {/* 页面标题 */}
          <div className="mb-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              MCP 精选推荐
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              精选实用的 MCP，增强 Claude Code 的能力
            </p>
          </div>

          {/* MCP 服务器列表 */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {mcpServers.map((server, index) => {
              const Icon = server.icon;
              return (
                <div
                  key={server.name}
                  className="group relative card p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* 推荐标签 */}
                  {server.recommended && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        推荐
                      </span>
                    </div>
                  )}

                  {/* 图标和标题 */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                        {server.name}
                      </h3>
                      <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                        {server.description}
                      </p>
                    </div>
                  </div>

                  {/* 特性列表 */}
                  <div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      主要功能
                    </div>
                    <ul className="grid grid-cols-2 gap-2">
                      {server.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
