# GC Code 门户网站产品文档 v1.0

## 一、产品概述

### 1.1 产品定位

GC Code 是一个企业级 AI 服务中转平台，为开发者提供统一的 AI API 接入方案，支持 Claude、Codex 等多种 AI 服务。

### 1.2 产品愿景

打造一个专业、易用、安全的 AI 服务管理平台，降低企业和开发者接入 AI 服务的门槛。

### 1.3 目标用户

- 需要使用 AI API 的开发者
- 需要统一管理 AI 服务的企业团队
- 希望自建 AI 中转服务的技术团队

---

## 二、需求分析

### 2.1 核心需求

#### 第一版（MVP）需求

1. **文档中心**（无需登录）
   - 产品介绍和核心概念说明
   - 快速开始指南
   - API 使用文档
   - 部署教程（基于 claude-relay-service）
   - 常见问题解答
   - 最佳实践和示例代码

2. **基础设施**
   - 响应式设计，支持移动端访问
   - 良好的 SEO 支持
   - 快速的页面加载速度
   - 清晰的导航结构

#### 未来版本需求（预留设计）

1. **用户管理系统**（需登录）
   - 用户注册/登录
   - 账户信息管理
   - 团队协作功能

2. **API Key 管理**（需登录）
   - API Key 生成与管理
   - 使用量统计
   - 速率限制配置
   - 账单管理

3. **服务管理**（需登录）
   - AI 账户配置
   - 服务监控面板
   - 日志查询

### 2.2 非功能性需求

- **性能**：首屏加载时间 < 2s
- **兼容性**：支持主流浏览器（Chrome, Firefox, Safari, Edge）
- **可访问性**：符合 WCAG 2.1 AA 标准
- **安全性**：HTTPS 加密，XSS/CSRF 防护

---

## 三、技术架构

### 3.1 技术栈

#### 前端

- **框架**：React 19
- **构建工具**：Vite 6.x
- **语言**：TypeScript
- **样式方案**：推荐 Tailwind CSS + CSS Modules
- **路由**：React Router v7
- **状态管理**：Zustand（轻量级，适合文档站）
- **UI 组件库**：推荐 Radix UI + 自定义样式
- **文档解析**：react-markdown + rehype/remark 插件
- **代码高亮**：Prism.js 或 Shiki
- **图标**：Lucide React

#### 后端（预留）

- **运行时**：Node.js 18+
- **框架**：Express 或 Fastify
- **数据库**：PostgreSQL
- **缓存**：Redis
- **底层服务**：claude-relay-service

### 3.2 项目结构

```
gc-code-portal/
├── public/                 # 静态资源
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── assets/            # 资源文件
│   │   ├── images/
│   │   └── styles/
│   ├── components/        # 公共组件
│   │   ├── layout/       # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── ui/           # UI 基础组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   └── docs/         # 文档专用组件
│   │       ├── CodeBlock.tsx
│   │       ├── ApiReference.tsx
│   │       └── TableOfContents.tsx
│   ├── pages/            # 页面组件
│   │   ├── Home/         # 首页
│   │   ├── Docs/         # 文档页面
│   │   ├── Guide/        # 指南
│   │   └── NotFound/     # 404 页面
│   ├── content/          # 文档内容（Markdown）
│   │   ├── docs/
│   │   │   ├── introduction.md
│   │   │   ├── quick-start.md
│   │   │   └── ...
│   │   └── guides/
│   ├── hooks/            # 自定义 Hooks
│   ├── utils/            # 工具函数
│   ├── types/            # TypeScript 类型定义
│   ├── config/           # 配置文件
│   ├── router/           # 路由配置
│   ├── App.tsx
│   └── main.tsx
├── docs/                 # 产品文档
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 四、页面结构设计

### 4.1 网站整体布局

#### 导航栏（Header）

- **Logo** + **GC Code** 品牌名称
- **主导航**：
  - 首页 (Home)
  - 文档 (Docs)
  - 指南 (Guides)
  - API 参考 (API Reference)
  - 示例 (Examples)
- **辅助功能**：
  - 搜索框（支持文档全文搜索）
  - 主题切换（Light/Dark Mode）
  - GitHub 链接
  - 登录按钮（预留，暂不可用）

#### 页脚（Footer）

- **公司信息**：GC 公司简介和 Logo
- **快捷链接**：
  - 文档
  - GitHub
  - 联系我们
  - 隐私政策
  - 使用条款
- **版权信息**：Copyright © 2025 GC Inc.
- **社交媒体**：（可选）

### 4.2 首页设计

#### Hero 区域

```
┌─────────────────────────────────────────────┐
│                                             │
│        GC Code - 企业级 AI 服务中转平台      │
│                                             │
│    统一接入 Claude、Codex 等多种 AI 服务     │
│    安全可控 · 私有部署 · 灵活扩展            │
│                                             │
│   [快速开始]  [查看文档]  [GitHub →]         │
│                                             │
└─────────────────────────────────────────────┘
```

#### 核心特性（Features）

采用卡片式布局展示 3-4 个核心特性：

1. **统一 API 接口**
   - 一个 API Key 管理所有 AI 服务
   - 兼容 Claude、OpenAI、Gemini 等多种 API

2. **私有部署**
   - 数据完全私有，不经过第三方
   - 支持本地部署和云端部署

3. **智能管理**
   - 多账户自动轮换
   - 实时用量统计和监控

4. **企业级安全**
   - API Key 权限控制
   - 速率限制和客户端限制

#### 快速开始示例

```javascript
// 简单的代码示例展示如何使用
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  baseURL: 'https://your-gc-code-domain/api',
  apiKey: 'your-api-key',
});

const message = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

#### 技术架构图

简单的流程图展示：

```
用户应用 → GC Code 中转服务 → Claude/OpenAI/Gemini API
          ↓
       统计 & 监控
```

### 4.3 文档页面设计

#### 布局结构

```
┌──────────────────────────────────────────────────┐
│ Header (导航栏)                                   │
├────────┬──────────────────────────┬──────────────┤
│        │                          │              │
│ 侧边栏  │     文档内容区域          │  目录导航     │
│        │                          │  (TOC)       │
│ - 介绍 │  # 快速开始              │              │
│ - 快速 │                          │  - 安装      │
│   开始 │  内容...                 │  - 配置      │
│ - API  │                          │  - 使用      │
│   文档 │                          │              │
│ - ...  │                          │              │
│        │                          │              │
└────────┴──────────────────────────┴──────────────┘
│ Footer (页脚)                                     │
└──────────────────────────────────────────────────┘
```

#### 文档分类

**1. 入门指南**

- 产品介绍
- 核心概念
- 快速开始
- 安装部署

**2. 使用指南**

- 基础配置
- API 使用
- 客户端集成
  - Codex CLI 配置
  - Cursor 配置
  - 其他 IDE 配置

**3. 部署运维**

- 环境要求
- 安装步骤
  - 脚本安装（推荐）
  - 手动安装
  - Docker 部署
- 配置说明
  - 环境变量
  - Redis 配置
  - 代理配置
- 账户管理
  - Claude 账户授权
  - 多账户配置

**4. API 参考**

- Claude API
- OpenAI 兼容 API
- Gemini API
- 错误码说明

**5. 最佳实践**

- 性能优化
- 安全建议
- 故障排查

**6. 常见问题**

- 安装问题
- 配置问题
- 使用问题

#### 文档内容增强功能

- **代码块**：支持语法高亮和一键复制
- **提示框**：Info/Warning/Danger/Success 不同类型
- **API 示例**：支持多语言切换（JavaScript/Python/cURL）
- **交互式示例**：可运行的代码演示
- **版本切换**：支持查看不同版本的文档

### 4.4 其他页面

#### 指南页面

类似博客列表，展示各种使用场景的教程：

- 如何在 VS Code 中使用 GC Code
- 如何在团队中部署 GC Code
- 如何配置速率限制
- 等等...

#### API 参考页面

详细的 API 文档，包括：

- 请求/响应格式
- 参数说明
- 错误处理
- 代码示例

#### 404 页面

友好的 404 页面，提供返回首页和搜索功能。

---

## 五、UI/UX 设计方案

### 5.1 视觉风格

#### 色彩系统

参考专业文档站点，建议采用：

**主色调**（可根据 GC 品牌调整）

- Primary: `#3B82F6` (蓝色，科技感)
- Secondary: `#8B5CF6` (紫色，创新感)
- Accent: `#10B981` (绿色，成功状态)

**中性色**

- Gray-50 ~ Gray-900: 用于文本、边框、背景

**语义色**

- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Info: `#3B82F6`

#### 主题模式

- Light Mode（默认）
- Dark Mode（可切换）

### 5.2 排版系统

#### 字体

- **中文**：Inter、-apple-system、微软雅黑
- **英文/代码**：JetBrains Mono、SF Mono、Consolas

#### 字号层级

- Heading 1: 2.5rem (40px)
- Heading 2: 2rem (32px)
- Heading 3: 1.5rem (24px)
- Heading 4: 1.25rem (20px)
- Body: 1rem (16px)
- Small: 0.875rem (14px)
- Code: 0.875rem (14px)

### 5.3 组件设计规范

#### 按钮

- Primary Button: 主要操作（如"快速开始"）
- Secondary Button: 次要操作（如"了解更多"）
- Ghost Button: 辅助操作（如"查看源码"）

#### 卡片

- 带阴影效果
- 圆角 8px
- Hover 时有轻微上浮效果

#### 代码块

- 深色背景（即使在 Light Mode）
- 支持行号显示
- 复制按钮
- 语言标识

### 5.4 交互设计

#### 导航

- 当前页面高亮
- Sticky Header（滚动时固定在顶部）
- 平滑滚动到锚点

#### 搜索

- 支持快捷键唤起（Cmd/Ctrl + K）
- 实时搜索结果
- 关键词高亮

#### 反馈

- 加载状态（Skeleton Screen）
- 操作成功/失败提示（Toast）
- 表单验证提示

---

## 六、技术实现要点

### 6.1 文档渲染方案

#### Markdown 处理

使用 `react-markdown` + 插件生态：

```typescript
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight, rehypeSlug]}
>
  {content}
</ReactMarkdown>
```

#### 自定义组件

为 Markdown 元素提供自定义渲染：

```typescript
const components = {
  code: CodeBlock,
  a: CustomLink,
  img: OptimizedImage,
  // ...
};
```

### 6.2 搜索功能实现

#### 方案选择

- **静态搜索**：使用 FlexSearch 或 Fuse.js（适合第一版）
- **云端搜索**：Algolia DocSearch（未来可考虑）

#### 实现步骤

1. 构建时提取所有文档内容和元数据
2. 生成搜索索引
3. 前端加载索引并实现搜索

### 6.3 性能优化

#### 代码分割

- 路由级别的代码分割（React.lazy）
- 组件按需加载

#### 资源优化

- 图片使用 WebP 格式
- 代码压缩和 Tree Shaking
- CSS 优化（Critical CSS）

#### 缓存策略

- Service Worker 缓存静态资源
- CDN 加速

### 6.4 SEO 优化

- 使用 `react-helmet-async` 管理 meta 标签
- 生成 sitemap.xml
- 添加结构化数据（JSON-LD）
- 确保良好的语义化 HTML

---

## 七、开发计划

### 7.1 第一阶段：基础框架搭建（Week 1）

**里程碑**：完成项目初始化和基础组件开发

**任务清单**：

- [ ] 项目初始化（Vite + React + TypeScript）
- [ ] 安装和配置依赖（Router、Tailwind、Markdown 等）
- [ ] 搭建基础目录结构
- [ ] 实现基础布局组件
  - [ ] Header
  - [ ] Footer
  - [ ] Container/Layout
- [ ] 实现 UI 基础组件
  - [ ] Button
  - [ ] Card
  - [ ] Link
  - [ ] Icon
- [ ] 配置路由系统
- [ ] 实现主题切换功能

### 7.2 第二阶段：首页开发（Week 2）

**里程碑**：完成首页所有模块

**任务清单**：

- [ ] Hero 区域开发
- [ ] 特性展示区域（Features）
- [ ] 快速开始代码示例
- [ ] 技术架构图展示
- [ ] 响应式适配
- [ ] 动画效果实现

### 7.3 第三阶段：文档系统开发（Week 3-4）

**里程碑**：完成文档中心核心功能

**任务清单**：

- [ ] 文档页面布局
  - [ ] 侧边栏导航
  - [ ] 内容区域
  - [ ] 目录导航（TOC）
- [ ] Markdown 渲染配置
- [ ] 自定义 Markdown 组件
  - [ ] 代码块（带复制功能）
  - [ ] 提示框（Info/Warning/等）
  - [ ] 自定义表格样式
- [ ] 文档路由和导航逻辑
- [ ] 搜索功能实现
- [ ] 文档内容编写
  - [ ] 产品介绍
  - [ ] 快速开始
  - [ ] 部署指南
  - [ ] API 文档
  - [ ] 常见问题

### 7.4 第四阶段：优化和完善（Week 5）

**里程碑**：项目可上线

**任务清单**：

- [ ] 性能优化
  - [ ] 代码分割
  - [ ] 资源优化
  - [ ] 加载速度优化
- [ ] SEO 优化
- [ ] 无障碍适配
- [ ] 浏览器兼容性测试
- [ ] 移动端适配优化
- [ ] 错误处理和边界情况
- [ ] 404 页面开发
- [ ] 文档内容审核和完善

### 7.5 第五阶段：部署和发布（Week 6）

**里程碑**：正式上线

**任务清单**：

- [ ] 构建配置优化
- [ ] 部署到服务器/CDN
- [ ] 域名配置
- [ ] HTTPS 证书配置
- [ ] 监控和日志配置
- [ ] 用户反馈收集机制
- [ ] 发布公告

---

## 八、未来版本规划

### 8.1 第二版：用户系统（预计 3 个月后）

**功能**：

- 用户注册/登录（邮箱 + OAuth）
- 个人中心
- 团队管理
- 权限控制

**技术扩展**：

- 后端 API 开发
- 数据库设计
- JWT 认证
- 集成 claude-relay-service

### 8.2 第三版：服务管理（预计 6 个月后）

**功能**：

- API Key 生成和管理
- 使用量统计和可视化
- 账户配置和管理
- 监控面板
- 日志查询

**技术扩展**：

- 实时数据展示（WebSocket）
- 图表库集成（ECharts/Recharts）
- 复杂表单处理

### 8.3 第四版：高级功能（预计 1 年后）

**功能**：

- 账单系统
- 配额管理
- Webhook 支持
- API 分析
- 自定义规则引擎

---

## 九、风险评估与应对

### 9.1 技术风险

| 风险             | 影响 | 概率 | 应对措施               |
| ---------------- | ---- | ---- | ---------------------- |
| React 19 不稳定  | 中   | 低   | 可降级到 React 18      |
| 文档搜索性能问题 | 中   | 中   | 采用增量加载或云端搜索 |
| 移动端适配困难   | 低   | 低   | 优先设计响应式组件     |

### 9.2 业务风险

| 风险         | 影响 | 概率 | 应对措施                   |
| ------------ | ---- | ---- | -------------------------- |
| 文档内容不足 | 高   | 中   | 提前规划文档大纲，分批编写 |
| 用户反馈不佳 | 中   | 低   | 设置反馈渠道，快速迭代     |
| 竞品压力     | 低   | 中   | 强调私有部署和数据安全优势 |

---

## 十、成功指标

### 10.1 技术指标

- 首屏加载时间 < 2s
- Lighthouse 分数 > 90
- 浏览器兼容性 100%
- 移动端适配良好

### 10.2 用户指标

- 文档完整度：覆盖所有核心功能
- 用户搜索成功率 > 80%
- 页面跳出率 < 40%
- 文档页面停留时间 > 2min

### 10.3 业务指标

- 网站上线后 1 个月内访问量达到目标值
- 用户反馈收集 > 50 条
- GitHub Star 增长

---

## 十一、附录

### 11.1 参考资源

**设计参考**：

- https://docs.grapecity.com.cn/
- https://docs.anthropic.com/
- https://vercel.com/docs
- https://nextjs.org/docs

**技术文档**：

- React 19: https://react.dev/
- Vite: https://vitejs.dev/
- Tailwind CSS: https://tailwindcss.com/
- react-markdown: https://github.com/remarkjs/react-markdown

### 11.2 关键依赖版本

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.0.0",
  "vite": "^6.0.0",
  "typescript": "^5.6.0",
  "tailwindcss": "^3.4.0",
  "react-markdown": "^9.0.0",
  "zustand": "^5.0.0",
  "lucide-react": "^0.460.0"
}
```

### 11.3 文档更新记录

| 版本 | 日期       | 变更说明 | 作者 |
| ---- | ---------- | -------- | ---- |
| v1.0 | 2025-11-09 | 初始版本 | -    |

---

**文档编制**：GC Code 产品团队
**最后更新**：2025-11-09
**文档状态**：待评审
