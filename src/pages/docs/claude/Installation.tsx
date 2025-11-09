import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import DocumentLayout from '@/components/docs/DocumentLayout';
import DocNavigation from '@/components/docs/DocNavigation';
import CodeBlock from '@/components/docs/CodeBlock';
import Callout from '@/components/docs/Callout';
import { getDocNavigation } from '@/config/docs';

export default function ClaudeInstallation() {
  const location = useLocation();
  const { prev, next } = getDocNavigation(location.pathname);

  return (
    <DocumentLayout>
      <Helmet>
        <title>环境安装 - GC Code 文档</title>
        <meta name="description" content="安装和配置 Claude 开发环境" />
      </Helmet>

      <div className="prose prose-gray max-w-none dark:prose-invert">
        {/* 面包屑 */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Claude 指南</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100">环境安装</span>
        </div>

        {/* 标题 */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          环境安装
        </h1>

        <p className="lead text-xl text-gray-600 dark:text-gray-400">
          本指南将帮助你快速搭建 Claude 开发环境，开始使用 Claude API。
        </p>

        {/* 前置要求 */}
        <h2 id="prerequisites">前置要求</h2>
        <p>在开始之前，请确保你已经准备好以下内容：</p>

        <ul>
          <li>
            <strong>Anthropic API Key</strong>：从{' '}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600"
            >
              Anthropic Console
            </a>{' '}
            获取
          </li>
          <li>
            <strong>Node.js</strong>：版本 18.x 或更高
          </li>
          <li>
            <strong>包管理器</strong>：npm、yarn 或 pnpm
          </li>
        </ul>

        <Callout type="warning" title="API Key 申请">
          目前 Anthropic API 需要申请才能使用。访问{' '}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600"
          >
            Anthropic Console
          </a>{' '}
          注册账号并申请 API 访问权限。
        </Callout>

        {/* 安装 SDK */}
        <h2 id="install-sdk">安装 SDK</h2>
        <p>Anthropic 提供了官方的 JavaScript/TypeScript SDK，安装非常简单：</p>

        <CodeBlock
          language="bash"
          code={`# 使用 npm
npm install @anthropic-ai/sdk

# 使用 yarn
yarn add @anthropic-ai/sdk

# 使用 pnpm
pnpm add @anthropic-ai/sdk`}
        />

        {/* 配置环境变量 */}
        <h2 id="environment-setup">配置环境变量</h2>
        <p>为了安全地管理 API Key，建议使用环境变量：</p>

        <h3 id="create-env-file">创建 .env 文件</h3>
        <p>
          在项目根目录创建 <code>.env</code> 文件：
        </p>

        <CodeBlock language="bash" filename=".env" code={`ANTHROPIC_API_KEY=your_api_key_here`} />

        <Callout type="error" title="安全提示">
          <strong>永远不要将 API Key 提交到版本控制系统！</strong>
          <br />
          确保 .env 文件已被添加到 .gitignore 中。
        </Callout>

        <h3 id="load-env">加载环境变量</h3>
        <p>
          安装 <code>dotenv</code> 包来加载环境变量：
        </p>

        <CodeBlock language="bash" code={`npm install dotenv`} />

        <p>在你的应用入口文件中加载：</p>

        <CodeBlock
          language="javascript"
          filename="index.js"
          code={`import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});`}
        />

        {/* 验证安装 */}
        <h2 id="verify-installation">验证安装</h2>
        <p>创建一个简单的测试脚本来验证配置是否正确：</p>

        <CodeBlock
          language="javascript"
          filename="test-claude.js"
          code={`import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testClaude() {
  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: '你好，Claude！请做个自我介绍。',
        },
      ],
    });

    console.log('Claude 回复：', message.content[0].text);
  } catch (error) {
    console.error('错误：', error.message);
  }
}

testClaude();`}
        />

        <p>运行测试脚本：</p>

        <CodeBlock language="bash" code={`node test-claude.js`} />

        <p>如果一切正常，你会看到 Claude 的回复！</p>

        <Callout type="success" title="安装成功">
          恭喜！你已经成功配置了 Claude 开发环境。现在可以开始构建你的 AI 应用了。
        </Callout>

        {/* TypeScript 配置 */}
        <h2 id="typescript-setup">TypeScript 配置（可选）</h2>
        <p>如果你使用 TypeScript，SDK 已经包含了类型定义，无需额外配置。</p>

        <CodeBlock
          language="typescript"
          filename="index.ts"
          code={`import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

async function chat(message: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: message }],
  });

  return response.content[0].text;
}

// 使用示例
const answer = await chat('什么是 TypeScript？');
console.log(answer);`}
        />

        {/* 常见问题 */}
        <h2 id="troubleshooting">常见问题</h2>

        <h3 id="api-key-error">API Key 错误</h3>
        <p>如果遇到 API Key 相关错误：</p>
        <ul>
          <li>确认 API Key 正确无误</li>
          <li>检查环境变量是否正确加载</li>
          <li>确认 API Key 有足够的配额</li>
        </ul>

        <h3 id="network-error">网络错误</h3>
        <p>如果遇到网络连接问题：</p>
        <ul>
          <li>确认网络连接正常</li>
          <li>检查是否需要配置代理</li>
          <li>尝试增加超时时间</li>
        </ul>

        <CodeBlock
          language="javascript"
          code={`const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 60000, // 60 秒超时
});`}
        />

        {/* 下一步 */}
        <h2 id="next-steps">下一步</h2>
        <p>环境配置完成后，你可以：</p>

        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <a
            href="/docs/claude/quick-start"
            className="block rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
          >
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">快速开始</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">学习如何发送第一个请求</p>
          </a>

          <a
            href="/docs/claude/api-usage"
            className="block rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
          >
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">API 使用</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              深入了解 Claude API 的各种功能
            </p>
          </a>
        </div>

        {/* 底部导航 */}
        <DocNavigation prev={prev} next={next} />
      </div>
    </DocumentLayout>
  );
}
