import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import DocumentLayout from '@/components/docs/DocumentLayout';
import DocNavigation from '@/components/docs/DocNavigation';
import CodeBlock from '@/components/docs/CodeBlock';
import Callout from '@/components/docs/Callout';
import { getDocNavigation } from '@/config/docs';

export default function Installation() {
  const location = useLocation();
  const { prev, next } = getDocNavigation(location.pathname);

  return (
    <DocumentLayout>
      <Helmet>
        <title>快速安装 - GC Code 文档</title>
        <meta name="description" content="快速安装和配置 GC Code" />
      </Helmet>

      <div className="prose prose-gray max-w-none dark:prose-invert">
        {/* 面包屑 */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <span>快速开始</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100">快速安装</span>
        </div>

        {/* 标题 */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          快速安装
        </h1>

        <p className="lead text-xl text-gray-600 dark:text-gray-400">
          本指南将帮助你在几分钟内快速安装并运行 GC Code。
        </p>

        {/* 系统要求 */}
        <h2 id="requirements">系统要求</h2>
        <p>在开始之前，请确保你的系统满足以下要求：</p>

        <ul>
          <li>
            <strong>Node.js</strong>：版本 18.x 或更高
          </li>
          <li>
            <strong>npm</strong> 或 <strong>yarn</strong>：最新版本
          </li>
          <li>
            <strong>Git</strong>：用于克隆仓库
          </li>
        </ul>

        <Callout type="info" title="检查 Node.js 版本">
          运行 <code>node --version</code> 检查你的 Node.js 版本。如果版本过低，请访问{' '}
          <a
            href="https://nodejs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600"
          >
            nodejs.org
          </a>{' '}
          下载最新版本。
        </Callout>

        {/* 安装步骤 */}
        <h2 id="installation-steps">安装步骤</h2>

        <h3 id="step-1">步骤 1：克隆仓库</h3>
        <p>首先，从 GitHub 克隆 GC Code 仓库：</p>

        <CodeBlock
          language="bash"
          code={`git clone https://github.com/Wei-Shaw/claude-relay-service.git
cd claude-relay-service`}
        />

        <h3 id="step-2">步骤 2：安装依赖</h3>
        <p>使用 npm 或 yarn 安装项目依赖：</p>

        <CodeBlock
          language="bash"
          code={`# 使用 npm
npm install

# 或使用 yarn
yarn install`}
        />

        <Callout type="warning" title="依赖安装时间">
          首次安装可能需要几分钟时间，具体取决于你的网络速度。
        </Callout>

        <h3 id="step-3">步骤 3：配置环境变量</h3>
        <p>复制示例环境变量文件并根据需要进行配置：</p>

        <CodeBlock
          language="bash"
          code={`# 复制环境变量模板
cp .env.example .env

# 使用你喜欢的编辑器编辑 .env 文件
nano .env`}
        />

        <p>主要需要配置的环境变量：</p>

        <CodeBlock
          language="bash"
          filename=".env"
          code={`# 服务端口
PORT=3000

# Claude API Key
CLAUDE_API_KEY=your_claude_api_key_here

# Kimi API Key
KIMI_API_KEY=your_kimi_api_key_here

# GLM API Key
GLM_API_KEY=your_glm_api_key_here

# 日志级别
LOG_LEVEL=info`}
        />

        <Callout type="error" title="API 密钥安全">
          <strong>请勿将包含真实 API 密钥的 .env 文件提交到版本控制系统！</strong>
          <br />
          确保 .env 文件已被添加到 .gitignore 中。
        </Callout>

        <h3 id="step-4">步骤 4：启动服务</h3>
        <p>配置完成后，启动 GC Code 服务：</p>

        <CodeBlock
          language="bash"
          code={`# 开发模式
npm run dev

# 生产模式
npm start`}
        />

        <p>如果一切顺利，你会看到类似以下的输出：</p>

        <CodeBlock
          language="bash"
          code={`✓ Server is running on http://localhost:3000
✓ Claude API connected
✓ Kimi API connected
✓ GLM API connected`}
        />

        <Callout type="success" title="安装成功！">
          恭喜！GC Code 已经成功启动。你现在可以通过 http://localhost:3000 访问服务。
        </Callout>

        {/* 验证安装 */}
        <h2 id="verify-installation">验证安装</h2>
        <p>通过发送一个简单的测试请求来验证安装是否成功：</p>

        <CodeBlock
          language="bash"
          code={`curl -X POST http://localhost:3000/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "claude-3-sonnet",
    "messages": [
      {
        "role": "user",
        "content": "Hello, GC Code!"
      }
    ]
  }'`}
        />

        <p>你应该会收到来自 Claude 模型的响应。</p>

        {/* 常见问题 */}
        <h2 id="troubleshooting">常见问题</h2>

        <h3 id="port-in-use">端口已被占用</h3>
        <p>如果端口 3000 已被占用，你可以在 .env 文件中修改端口号：</p>

        <CodeBlock language="bash" code={`PORT=3001`} />

        <h3 id="api-key-error">API 密钥错误</h3>
        <p>如果遇到 API 密钥相关的错误：</p>
        <ul>
          <li>确认你的 API 密钥正确无误</li>
          <li>检查 API 密钥是否有足够的权限</li>
          <li>验证 API 密钥没有过期</li>
        </ul>

        <h3 id="dependency-issues">依赖安装失败</h3>
        <p>如果依赖安装失败，尝试以下方法：</p>

        <CodeBlock
          language="bash"
          code={`# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install`}
        />

        <Callout type="info" title="需要帮助？">
          如果你遇到其他问题，请查看{' '}
          <a href="/docs/faq/installation" className="text-primary-600">
            安装常见问题
          </a>{' '}
          或在 GitHub 上提交 Issue。
        </Callout>

        {/* 下一步 */}
        <h2 id="next-steps">下一步</h2>
        <p>现在你已经成功安装了 GC Code，接下来可以：</p>

        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <a
            href="/docs/getting-started/configuration"
            className="block rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
          >
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">基础配置</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              了解如何配置 GC Code 以满足你的需求
            </p>
          </a>

          <a
            href="/docs/getting-started/first-request"
            className="block rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
          >
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">第一个请求</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              学习如何使用 GC Code API 发送请求
            </p>
          </a>
        </div>

        {/* 底部导航 */}
        <DocNavigation prev={prev} next={next} />
      </div>
    </DocumentLayout>
  );
}
