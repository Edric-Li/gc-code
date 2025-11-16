import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DocumentLayout from '@/components/docs/DocumentLayout';
import DocNavigation from '@/components/docs/DocNavigation';
import CodeBlock from '@/components/docs/CodeBlock';
import Callout from '@/components/docs/Callout';
import { getDocNavigation } from '@/config/docs';

function detectOS(): 'windows' | 'mac' | 'other' {
  if (typeof window === 'undefined') return 'other';
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();
  if (userAgent.includes('win') || platform.includes('win')) return 'windows';
  if (userAgent.includes('mac') || platform.includes('mac')) return 'mac';
  return 'other';
}

export default function ClaudeInstallation() {
  const location = useLocation();
  const { prev, next } = getDocNavigation(location.pathname);
  const [os, setOs] = useState<'windows' | 'mac' | 'other'>('other');

  useEffect(() => {
    setOs(detectOS());
  }, []);

  return (
    <DocumentLayout>
      <Helmet>
        <title>安装 - GC Code 文档</title>
        <meta name="description" content="安装 Claude Code，开始使用 AI 驱动的编码辅助" />
      </Helmet>

      <div className="prose prose-gray max-w-none dark:prose-invert">
        {/* 面包屑 */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Claude 指南</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100">安装</span>
        </div>

        {/* 标题 */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          安装
        </h1>

        <p className="lead text-xl text-gray-600 dark:text-gray-400">
          本指南将帮助你安装 Claude Code，开始使用 AI 驱动的编码辅助。
        </p>

        {/* 安装 Claude Code */}
        <h2 id="install">安装 Claude Code</h2>
        <p>使用以下方法之一安装 Claude Code：</p>

        <h3 id="native-install">本地安装（推荐）</h3>

        {os === 'windows' ? (
          <>
            <p>
              <strong>Windows PowerShell：</strong>
            </p>
            <CodeBlock language="powershell" code={`irm https://claude.ai/install.ps1 | iex`} />

            <p>
              <strong>Windows CMD：</strong>
            </p>
            <CodeBlock
              language="batch"
              code={`curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd`}
            />

            <p>
              <strong>Homebrew (macOS, Linux)：</strong>
            </p>
            <CodeBlock language="bash" code={`brew install --cask claude-code`} />

            <p>
              <strong>macOS, Linux, WSL：</strong>
            </p>
            <CodeBlock language="bash" code={`curl -fsSL https://claude.ai/install.sh | bash`} />
          </>
        ) : (
          <>
            <p>
              <strong>Homebrew (macOS, Linux)：</strong>
            </p>
            <CodeBlock language="bash" code={`brew install --cask claude-code`} />

            <p>
              <strong>macOS, Linux, WSL：</strong>
            </p>
            <CodeBlock language="bash" code={`curl -fsSL https://claude.ai/install.sh | bash`} />

            <p>
              <strong>Windows PowerShell：</strong>
            </p>
            <CodeBlock language="powershell" code={`irm https://claude.ai/install.ps1 | iex`} />

            <p>
              <strong>Windows CMD：</strong>
            </p>
            <CodeBlock
              language="batch"
              code={`curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd`}
            />
          </>
        )}

        <h3 id="npm-install">NPM</h3>
        <p>
          如果您已安装 <a href="https://nodejs.org/en/download/">Node.js 18 或更高版本</a>：
        </p>
        <CodeBlock language="bash" code={`npm install -g @anthropic-ai/claude-code`} />

        {/* 验证安装 */}
        <h2 id="verify-installation">验证安装</h2>
        <p>安装完成后，运行以下命令验证 Claude Code 是否安装成功：</p>
        <CodeBlock language="bash" code={`claude --version`} />

        <p>如果安装成功，您将看到 Claude Code 的版本号。</p>

        <Callout type="success" title="安装成功">
          现在您可以进入下一步，配置 API 认证信息，开始使用 Claude Code。
        </Callout>

        {/* 底部导航 */}
        <DocNavigation prev={prev} next={next} />
      </div>
    </DocumentLayout>
  );
}
