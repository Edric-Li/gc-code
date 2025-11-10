import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import DocumentLayout from '@/components/docs/DocumentLayout';
import DocNavigation from '@/components/docs/DocNavigation';
import CodeBlock from '@/components/docs/CodeBlock';
import Callout from '@/components/docs/Callout';
import { getDocNavigation } from '@/config/docs';

// 检测操作系统
function detectOS(): 'windows' | 'mac' | 'other' {
  if (typeof window === 'undefined') return 'other';

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();

  if (userAgent.includes('win') || platform.includes('win')) {
    return 'windows';
  }
  if (userAgent.includes('mac') || platform.includes('mac')) {
    return 'mac';
  }
  return 'other';
}

interface ApiAddressRowProps {
  label: string;
  url: string;
  icon: string;
  highlight?: boolean;
}

function ApiAddressRow({ label, url, icon, highlight = false }: ApiAddressRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`w-full text-left px-4 py-3 transition-all ${
        highlight
          ? 'bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-750'
      }`}
      title={`点击复制：${url}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs">
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">{label}</div>
          <code className="text-xs text-gray-600 dark:text-gray-400 font-mono">{url}</code>
        </div>
        <div className="flex-shrink-0">
          <div className="rounded-md p-2">
            {copied ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ClaudeAuthentication() {
  const location = useLocation();
  const { prev, next } = getDocNavigation(location.pathname);
  const [currentOS, setCurrentOS] = useState<'windows' | 'mac' | 'other'>('other');

  useEffect(() => {
    setCurrentOS(detectOS());
  }, []);

  return (
    <DocumentLayout>
      <Helmet>
        <title>认证配置 - GC Code 文档</title>
        <meta name="description" content="配置 Claude Code 环境变量和密钥认证" />
      </Helmet>

      <div className="prose prose-gray max-w-none dark:prose-invert">
        {/* 面包屑 */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Claude 指南</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100">认证配置</span>
        </div>

        {/* 标题 */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          认证配置
        </h1>

        <p className="lead text-xl text-gray-600 dark:text-gray-400">
          使用 Claude Code 前需要配置环境变量和 API 密钥，本指南将帮助你完成认证配置。
        </p>

        {/* 获取 API 密钥 */}
        <h2 id="get-api-key">获取 API 密钥</h2>
        <p>使用 Claude Code 前需要配置密钥（API Key），可通过以下地址获取：</p>

        <div className="not-prose my-6">
          <div className="space-y-3">
            <a
              href="http://xa-office-mgmt/claudemanagement"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                  内
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  内网地址
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
                <code className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  http://xa-office-mgmt/claudemanagement
                </code>
              </div>
            </a>

            <a
              href="https://xaoa.grapecity.com.cn/claudemanagement"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all group"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                  外
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  外网地址
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
                <code className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  https://xaoa.grapecity.com.cn/claudemanagement
                </code>
              </div>
            </a>
          </div>
        </div>

        <Callout type="info" title="登录说明">
          请使用 <strong>Windows 域账号</strong> 登录后即可查看专属密钥。
        </Callout>

        {/* 选择 API 地址 */}
        <h2 id="choose-api-url">选择 API 地址</h2>
        <p>根据所在部门选择对应的 API 地址：</p>

        <div className="not-prose my-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              <ApiAddressRow label="DD1 部门" url="https://api.dd1.gccode.cn" icon="D1" />
              <ApiAddressRow label="DD2 部门" url="https://api.dd2.gccode.cn" icon="D2" />
              <ApiAddressRow label="DD3 部门" url="https://api.dd3.gccode.cn" icon="D3" />
              <ApiAddressRow label="Leyser 部门" url="https://api.leyser.gccode.cn" icon="L" />
              <ApiAddressRow label="通用地址" url="https://api.gccode.cn" icon="通" />
            </div>
          </div>
        </div>

        <Callout type="info" title="使用建议">
          如有对应部门请优先选择部门地址，其他情况请使用通用地址。
        </Callout>

        {/* 配置环境变量 */}
        <h2 id="configure-env">配置环境变量</h2>
        <p>需要配置以下两个环境变量：</p>

        <ul>
          <li>
            <code>ANTHROPIC_BASE_URL</code>：API 地址
          </li>
          <li>
            <code>ANTHROPIC_AUTH_TOKEN</code>：API 密钥
          </li>
        </ul>

        {/* 根据操作系统优先显示对应配置 */}
        {currentOS === 'windows' ? (
          <>
            {/* Windows 配置 */}
            <h3 id="windows">Windows</h3>

            <p>
              <strong>方法一：临时配置（当前命令行窗口有效）</strong>
            </p>

            <p>PowerShell：</p>

            <CodeBlock
              language="powershell"
              code={`# 设置 API 地址
$env:ANTHROPIC_BASE_URL="https://api.gccode.cn"

# 设置 API 密钥
$env:ANTHROPIC_AUTH_TOKEN="your_api_key_here"`}
            />

            <p>CMD：</p>

            <CodeBlock
              language="batch"
              code={`REM 设置 API 地址
set ANTHROPIC_BASE_URL=https://api.gccode.cn

REM 设置 API 密钥
set ANTHROPIC_AUTH_TOKEN=your_api_key_here`}
            />

            <p>
              <strong>方法二：永久配置（推荐）</strong>
            </p>

            <p>通过系统设置配置环境变量：</p>

            <ol>
              <li>右键"此电脑" → "属性"</li>
              <li>点击"高级系统设置"</li>
              <li>点击"环境变量"按钮</li>
              <li>
                在"用户变量"区域点击"新建"
                <ul>
                  <li>
                    变量名：<code>ANTHROPIC_BASE_URL</code>
                  </li>
                  <li>
                    变量值：<code>https://api.gccode.cn</code>（或对应部门地址）
                  </li>
                </ul>
              </li>
              <li>
                再次点击"新建"
                <ul>
                  <li>
                    变量名：<code>ANTHROPIC_AUTH_TOKEN</code>
                  </li>
                  <li>变量值：你的 API 密钥</li>
                </ul>
              </li>
              <li>点击"确定"保存</li>
              <li>重新打开命令行窗口使配置生效</li>
            </ol>

            {/* macOS/Linux 配置 */}
            <h3 id="macos-linux">macOS / Linux</h3>

            <p>
              <strong>方法一：临时配置（当前终端会话有效）</strong>
            </p>

            <CodeBlock
              language="bash"
              code={`# 设置 API 地址（选择对应部门地址或通用地址）
export ANTHROPIC_BASE_URL="https://api.gccode.cn"

# 设置 API 密钥（替换为你的密钥）
export ANTHROPIC_AUTH_TOKEN="your_api_key_here"`}
            />

            <p>
              <strong>方法二：永久配置（推荐）</strong>
            </p>

            <p>编辑 shell 配置文件（根据使用的 shell 选择对应文件）：</p>

            <ul>
              <li>
                Bash：<code>~/.bashrc</code> 或 <code>~/.bash_profile</code>
              </li>
              <li>
                Zsh：<code>~/.zshrc</code>
              </li>
            </ul>

            <p>在文件末尾添加以下内容：</p>

            <CodeBlock
              language="bash"
              filename="~/.zshrc"
              code={`# Claude Code 配置
export ANTHROPIC_BASE_URL="https://api.gccode.cn"
export ANTHROPIC_AUTH_TOKEN="your_api_key_here"`}
            />

            <p>保存后重新加载配置：</p>

            <CodeBlock
              language="bash"
              code={`# Bash
source ~/.bashrc

# Zsh
source ~/.zshrc`}
            />
          </>
        ) : (
          <>
            {/* macOS/Linux 配置 */}
            <h3 id="macos-linux">macOS / Linux</h3>

            <p>
              <strong>方法一：临时配置（当前终端会话有效）</strong>
            </p>

            <CodeBlock
              language="bash"
              code={`# 设置 API 地址（选择对应部门地址或通用地址）
export ANTHROPIC_BASE_URL="https://api.gccode.cn"

# 设置 API 密钥（替换为你的密钥）
export ANTHROPIC_AUTH_TOKEN="your_api_key_here"`}
            />

            <p>
              <strong>方法二：永久配置（推荐）</strong>
            </p>

            <p>编辑 shell 配置文件（根据使用的 shell 选择对应文件）：</p>

            <ul>
              <li>
                Bash：<code>~/.bashrc</code> 或 <code>~/.bash_profile</code>
              </li>
              <li>
                Zsh：<code>~/.zshrc</code>
              </li>
            </ul>

            <p>在文件末尾添加以下内容：</p>

            <CodeBlock
              language="bash"
              filename="~/.zshrc"
              code={`# Claude Code 配置
export ANTHROPIC_BASE_URL="https://api.gccode.cn"
export ANTHROPIC_AUTH_TOKEN="your_api_key_here"`}
            />

            <p>保存后重新加载配置：</p>

            <CodeBlock
              language="bash"
              code={`# Bash
source ~/.bashrc

# Zsh
source ~/.zshrc`}
            />

            {/* Windows 配置 */}
            <h3 id="windows">Windows</h3>

            <p>
              <strong>方法一：临时配置（当前命令行窗口有效）</strong>
            </p>

            <p>PowerShell：</p>

            <CodeBlock
              language="powershell"
              code={`# 设置 API 地址
$env:ANTHROPIC_BASE_URL="https://api.gccode.cn"

# 设置 API 密钥
$env:ANTHROPIC_AUTH_TOKEN="your_api_key_here"`}
            />

            <p>CMD：</p>

            <CodeBlock
              language="batch"
              code={`REM 设置 API 地址
set ANTHROPIC_BASE_URL=https://api.gccode.cn

REM 设置 API 密钥
set ANTHROPIC_AUTH_TOKEN=your_api_key_here`}
            />

            <p>
              <strong>方法二：永久配置（推荐）</strong>
            </p>

            <p>通过系统设置配置环境变量：</p>

            <ol>
              <li>右键"此电脑" → "属性"</li>
              <li>点击"高级系统设置"</li>
              <li>点击"环境变量"按钮</li>
              <li>
                在"用户变量"区域点击"新建"
                <ul>
                  <li>
                    变量名：<code>ANTHROPIC_BASE_URL</code>
                  </li>
                  <li>
                    变量值：<code>https://api.gccode.cn</code>（或对应部门地址）
                  </li>
                </ul>
              </li>
              <li>
                再次点击"新建"
                <ul>
                  <li>
                    变量名：<code>ANTHROPIC_AUTH_TOKEN</code>
                  </li>
                  <li>变量值：你的 API 密钥</li>
                </ul>
              </li>
              <li>点击"确定"保存</li>
              <li>重新打开命令行窗口使配置生效</li>
            </ol>
          </>
        )}

        {/* 验证配置 */}
        <h2 id="verify">验证配置</h2>
        <p>配置完成后，可以通过以下命令验证环境变量是否设置成功：</p>

        {currentOS === 'windows' ? (
          <>
            <p>
              <strong>Windows PowerShell：</strong>
            </p>

            <CodeBlock
              language="powershell"
              code={`echo $env:ANTHROPIC_BASE_URL
echo $env:ANTHROPIC_AUTH_TOKEN`}
            />

            <p>
              <strong>Windows CMD：</strong>
            </p>

            <CodeBlock
              language="batch"
              code={`echo %ANTHROPIC_BASE_URL%
echo %ANTHROPIC_AUTH_TOKEN%`}
            />

            <p>
              <strong>macOS / Linux：</strong>
            </p>

            <CodeBlock
              language="bash"
              code={`echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_AUTH_TOKEN`}
            />
          </>
        ) : (
          <>
            <p>
              <strong>macOS / Linux：</strong>
            </p>

            <CodeBlock
              language="bash"
              code={`echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_AUTH_TOKEN`}
            />

            <p>
              <strong>Windows PowerShell：</strong>
            </p>

            <CodeBlock
              language="powershell"
              code={`echo $env:ANTHROPIC_BASE_URL
echo $env:ANTHROPIC_AUTH_TOKEN`}
            />

            <p>
              <strong>Windows CMD：</strong>
            </p>

            <CodeBlock
              language="batch"
              code={`echo %ANTHROPIC_BASE_URL%
echo %ANTHROPIC_AUTH_TOKEN%`}
            />
          </>
        )}

        <p>如果输出正确的地址和密钥，说明配置成功！</p>

        <Callout type="success" title="配置完成">
          恭喜！你已经成功完成认证配置。现在可以开始使用 Claude Code 了。
        </Callout>

        {/* 底部导航 */}
        <DocNavigation prev={prev} next={next} />
      </div>
    </DocumentLayout>
  );
}
