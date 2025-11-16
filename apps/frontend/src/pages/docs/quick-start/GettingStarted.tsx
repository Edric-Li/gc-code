import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import DocumentLayout from '@/components/docs/DocumentLayout';
import DocNavigation from '@/components/docs/DocNavigation';
import CodeBlock from '@/components/docs/CodeBlock';
import Callout from '@/components/docs/Callout';
import { getDocNavigation } from '@/config/docs';

export default function GettingStarted() {
  const location = useLocation();
  const { prev, next } = getDocNavigation(location.pathname);

  return (
    <DocumentLayout>
      <Helmet>
        <title>启动 - GC Code 文档</title>
        <meta name="description" content="启动 Claude Code 并创建你的第一个项目" />
      </Helmet>

      <div className="prose prose-gray max-w-none dark:prose-invert">
        {/* 面包屑 */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          <span>Claude 指南</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100">启动</span>
        </div>

        {/* 标题 */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          启动
        </h1>

        <p className="lead text-xl text-gray-600 dark:text-gray-400">
          学习如何启动 Claude Code 并创建你的第一个项目。
        </p>

        {/* 启动第一个会话 */}
        <h2 id="start-session">启动您的第一个会话</h2>
        <p>在任何项目目录中打开您的终端并启动 Claude Code：</p>

        <CodeBlock
          language="bash"
          code={`cd /path/to/your/project
claude`}
        />

        <p>您将看到 Claude Code 欢迎屏幕，其中包含您的会话信息、最近的对话和最新更新。</p>

        <Callout type="info" title="提示">
          如果这是您第一次启动 Claude Code，系统会引导您完成初始设置。
        </Callout>

        {/* 创建第一个项目 */}
        <h2 id="first-project">创建第一个项目</h2>
        <p>让我们通过创建一个五子棋游戏来体验 Claude Code 的强大功能。</p>

        <h3 id="step1">1. 创建项目目录</h3>
        <p>首先，创建一个新的项目目录：</p>

        <CodeBlock
          language="bash"
          code={`mkdir gomoku-game
cd gomoku-game
claude`}
        />

        <h3 id="step2">2. 开始对话</h3>
        <p>启动 Claude Code 后，输入以下提示：</p>

        <CodeBlock
          language="text"
          code={`> 帮我创建一个五子棋游戏，要求：
> 1. 使用 HTML + CSS + JavaScript 实现
> 2. 支持双人对战
> 3. 有胜负判断逻辑
> 4. 界面美观、响应式设计`}
        />

        <h3 id="step3">3. Claude Code 会做什么</h3>
        <p>Claude Code 将会：</p>

        <ul>
          <li>
            <strong>理解需求</strong>：分析您的要求，规划项目结构
          </li>
          <li>
            <strong>创建文件</strong>：自动创建 HTML、CSS、JavaScript 文件
          </li>
          <li>
            <strong>编写代码</strong>：实现完整的五子棋游戏逻辑
          </li>
          <li>
            <strong>美化界面</strong>：添加样式，确保界面美观
          </li>
          <li>
            <strong>请求确认</strong>：在创建或修改文件前会请求您的许可
          </li>
        </ul>

        <Callout type="warning" title="注意">
          Claude Code
          在修改文件前总是请求许可。您可以选择批准单个更改或为整个会话启用"全部接受"模式。
        </Callout>

        <h3 id="step4">4. 运行项目</h3>
        <p>项目创建完成后，您可以在浏览器中打开 HTML 文件来体验游戏：</p>

        <CodeBlock
          language="bash"
          code={`# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html`}
        />

        <p>或者使用简单的 HTTP 服务器：</p>

        <CodeBlock
          language="bash"
          code={`# Python 3
python -m http.server 8000

# Node.js (需要安装 http-server)
npx http-server`}
        />

        <p>然后在浏览器中访问 http://localhost:8000</p>

        {/* 进一步优化 */}
        <h2 id="optimize">进一步优化</h2>
        <p>创建基础版本后，您可以继续让 Claude Code 优化项目：</p>

        <h3>添加新功能</h3>
        <CodeBlock
          language="text"
          code={`> 增加以下功能：
> 1. 悔棋功能
> 2. 重新开始按钮
> 3. 显示当前玩家提示
> 4. 添加音效`}
        />

        <h3>改进样式</h3>
        <CodeBlock
          language="text"
          code={`> 优化界面设计：
> 1. 添加深色模式
> 2. 使用渐变色背景
> 3. 添加棋子落下的动画效果`}
        />

        <h3>增强体验</h3>
        <CodeBlock language="text" code={`> 添加单人模式，实现一个简单的 AI 对手`} />

        <Callout type="success" title="恭喜">
          您已经掌握了如何使用 Claude Code 创建项目！现在可以尝试创建更多有趣的项目了。
        </Callout>

        {/* 示例项目建议 */}
        <h2 id="project-ideas">更多项目建议</h2>
        <p>除了五子棋，您还可以尝试创建：</p>

        <div className="grid gap-4 sm:grid-cols-2 my-6">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">待办事项应用</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              练习 CRUD 操作，学习数据持久化
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">天气预报应用</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">学习 API 调用和数据展示</p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">计算器</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">熟悉基础逻辑和界面设计</p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">音乐播放器</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">学习媒体控制和交互设计</p>
          </div>
        </div>

        {/* 底部导航 */}
        <DocNavigation prev={prev} next={next} />
      </div>
    </DocumentLayout>
  );
}
