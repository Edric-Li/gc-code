# 前端菜单结构和路由可视化

## 一、整体导航结构图

```
┌─────────────────────────────────────────────────────────────┐
│                     应用主导航菜单                            │
│  [首页] [文档中心] [MCP精选] [经验分享] [用量查询]            │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ 首页 (/) → Home.tsx
         │
         ├─ 文档中心 (/docs/*) → Docs.tsx
         │
         ├─ MCP 精选 (/mcp) → McpServers.tsx
         │
         ├─ 经验分享 (/experience) → Experience.tsx
         │
         └─ 用量查询 (/usage) ⭐
            └─ Usage.tsx (用户查询使用统计)

┌─────────────────────────────────────────────────────────────┐
│         需要 ADMIN 权限：管理后台                             │
│                    /admin                                    │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ 仪表板 (/admin)
         │  └─ Dashboard.tsx
         │     ├─ 用户统计卡片
         │     ├─ 系统活动统计
         │     └─ 快速操作链接
         │
         ├─ 用户管理 (/admin/users)
         │  └─ Users.tsx
         │
         ├─ 组织管理 (/admin/organizations)
         │  └─ Organizations.tsx
         │
         ├─ API Key (/admin/api-keys) ⭐⭐⭐
         │  └─ ApiKeys.tsx
         │     ├─ CreateApiKeyDialog.tsx
         │     ├─ EditApiKeyDialog.tsx
         │     └─ ApiKeyDetailsDialog.tsx
         │
         ├─ AI 提供商 (/admin/ai-providers)
         │  └─ AiProviders.tsx
         │
         ├─ 渠道管理 (/admin/channels)
         │  └─ Channels.tsx
         │
         └─ 日志查看 (/admin/logs) ⭐⭐⭐
            └─ Logs.tsx
               ├─ 登录日志 Tab
               │  └─ LoginLogsList 组件
               ├─ 审计日志 Tab
               │  └─ AuditLogsList 组件
               └─ API 日志 Tab
                  └─ ApiLogsList 组件
```

---

## 二、文件树结构

```
/src
│
├── router/
│   └── index.tsx ◄─── 主路由配置文件（所有路由定义）
│       ├─ 公开路由
│       └─ 管理后台路由（需要 ADMIN）
│
├── pages/
│   ├── Home.tsx                      ← 首页
│   ├── Docs.tsx                      ← 文档中心
│   ├── Usage.tsx              ⭐⭐⭐ ← 用量查询（用户端）
│   ├── McpServers.tsx                ← MCP 精选
│   ├── Experience.tsx                ← 经验分享
│   ├── Login.tsx                     ← 登录页
│   ├── AuthCallback.tsx              ← 认证回调
│   ├── NotFound.tsx                  ← 404 页面
│   │
│   ├── docs/
│   │   ├── quick-start/
│   │   ├── core/
│   │   ├── advanced/
│   │   └── tools/
│   │
│   └── admin/                         ◄─ 管理后台页面
│       ├── Dashboard.tsx              ← 仪表板
│       ├── ApiKeys.tsx        ⭐⭐⭐  ← API Key 管理
│       ├── Users.tsx                  ← 用户管理
│       ├── Organizations.tsx          ← 组织管理
│       ├── Logs.tsx          ⭐⭐⭐   ← 日志查看（3 种日志）
│       ├── AiProviders.tsx            ← AI 提供商
│       ├── Channels.tsx               ← 渠道管理
│       └── components/                ◄─ 管理页面的对话框和组件
│           ├── CreateApiKeyDialog.tsx
│           ├── EditApiKeyDialog.tsx
│           ├── ApiKeyDetailsDialog.tsx
│           ├── CreateAiProviderDialog.tsx
│           ├── EditAiProviderDialog.tsx
│           ├── CreateChannelDialog.tsx
│           └── EditChannelDialog.tsx
│
├── components/
│   │
│   ├── admin/
│   │   └── AdminLayout.tsx    ◄─── 菜单定义文件（重要！）
│   │       定义 navigation 数组，包含所有管理菜单项
│   │
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── PageLayout.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   │
│   ├── usage/                 ◄─── 使用统计组件
│   │   ├── ApiKeyManager.tsx        (API Key 输入对话框)
│   │   ├── UsageStatsOverview.tsx   (统计概览)
│   │   ├── TokenDistribution.tsx    (Token 分布图)
│   │   └── ModelDistributionChart.tsx (模型分布图)
│   │
│   ├── common/
│   │   ├── Loading.tsx
│   │   ├── Logo.tsx
│   │   └── ...
│   │
│   ├── docs/
│   ├── home/
│   └── ui/
│
├── services/                  ◄─── API 调用层
│   ├── logApi.ts      ⭐⭐⭐ (日志相关 API)
│   │   ├── getLoginLogs()
│   │   ├── getAuditLogs()
│   │   ├── getApiLogs()
│   │   └── getStatistics()
│   │
│   ├── apiKeyApi.ts   ⭐⭐⭐ (API Key 相关 API)
│   │   ├── list()
│   │   ├── create()
│   │   ├── update()
│   │   ├── delete()
│   │   └── revoke()
│   │
│   ├── usageApi.ts    ⭐⭐⭐ (使用统计 API)
│   │
│   ├── userApi.ts (用户相关)
│   │   ├── getStatistics()
│   │   └── ...
│   │
│   └── ...其他 API 服务
│
├── hooks/
│   ├── useUsageStats.ts    ⭐ (使用统计 Hook)
│   ├── useApiKey.ts         (API Key 本地存储)
│   └── ...其他 Hooks
│
├── types/
│   ├── usage.ts             (使用统计类型定义)
│   ├── apiKey.ts            (API Key 类型定义)
│   └── ...其他类型定义
│
├── config/
│   └── site.ts      ◄─── 网站配置（主导航定义）
│       包含 navConfig：mainNav 和 sidebarNav
│
├── contexts/
│   └── AuthContext.ts       (认证上下文，包含用户信息)
│       ├─ user (用户信息，含 role)
│       └─ logout (登出函数)
│
└── utils/
    ├── format.ts
    └── ...
```

---

## 三、路由决策树

```
访问 URL
  │
  ├─ / (首页)
  │  └─ ✓ 所有用户可访问 → Home.tsx
  │
  ├─ /docs/* (文档)
  │  └─ ✓ 所有用户可访问 → Docs.tsx
  │
  ├─ /usage (用量查询)
  │  └─ ✓ 所有用户可访问 → Usage.tsx
  │     └─ 需要输入 API Key
  │
  ├─ /mcp (MCP 精选)
  │  └─ ✓ 所有用户可访问 → McpServers.tsx
  │
  ├─ /experience (经验分享)
  │  └─ ✓ 所有用户可访问 → Experience.tsx
  │
  ├─ /login (登录页)
  │  └─ ✓ 所有用户可访问 → Login.tsx
  │
  ├─ /auth/callback (认证回调)
  │  └─ ✓ 所有用户可访问 → AuthCallback.tsx
  │
  ├─ /admin* (管理后台)
  │  └─ 权限检查 (AdminLayout.tsx)
  │     ├─ ✓ user.role === 'ADMIN'
  │     │  ├─ /admin → Dashboard.tsx
  │     │  ├─ /admin/users → Users.tsx
  │     │  ├─ /admin/organizations → Organizations.tsx
  │     │  ├─ /admin/api-keys → ApiKeys.tsx ⭐⭐⭐
  │     │  ├─ /admin/ai-providers → AiProviders.tsx
  │     │  ├─ /admin/channels → Channels.tsx
  │     │  └─ /admin/logs → Logs.tsx ⭐⭐⭐
  │     │
  │     └─ ✗ user.role !== 'ADMIN'
  │        └─ 显示"权限不足"提示，返回首页
  │
  └─ /* (其他路径)
     └─ NotFound.tsx (404 页面)
```

---

## 四、菜单项映射表

### 主导航菜单（在 site.ts 中定义）

| #   | 菜单项   | 路由        | 页面文件       | 权限 |
| --- | -------- | ----------- | -------------- | ---- |
| 1   | 首页     | /           | Home.tsx       | 公开 |
| 2   | 文档中心 | /docs       | Docs.tsx       | 公开 |
| 3   | MCP 精选 | /mcp        | McpServers.tsx | 公开 |
| 4   | 经验分享 | /experience | Experience.tsx | 公开 |
| 5   | 用量查询 | /usage      | Usage.tsx      | 公开 |

### 管理后台菜单（在 AdminLayout.tsx 的 navigation 数组中定义）

| #   | 菜单项    | 路由                 | 页面文件          | 权限  | Icon            |
| --- | --------- | -------------------- | ----------------- | ----- | --------------- |
| 1   | 仪表板    | /admin               | Dashboard.tsx     | ADMIN | LayoutDashboard |
| 2   | 用户管理  | /admin/users         | Users.tsx         | ADMIN | Users           |
| 3   | 组织管理  | /admin/organizations | Organizations.tsx | ADMIN | Building2       |
| 4   | API Key   | /admin/api-keys      | ApiKeys.tsx       | ADMIN | Key ⭐          |
| 5   | AI 提供商 | /admin/ai-providers  | AiProviders.tsx   | ADMIN | Brain           |
| 6   | 渠道管理  | /admin/channels      | Channels.tsx      | ADMIN | Network         |
| 7   | 日志查看  | /admin/logs          | Logs.tsx          | ADMIN | FileText ⭐     |

---

## 五、核心功能模块架构

### 模块 1: API Key 管理（⭐ 重点关注）

```
用户交互                   组件层                    页面层          服务层
   │
   ├─ 创建 API Key  ─────> CreateApiKeyDialog  ┐
   │                                            ├─> ApiKeys.tsx ────> apiKeyApi.ts
   ├─ 查看详情     ─────> ApiKeyDetailsDialog ├─>   (主页面)        ├─ list()
   │                                            │                     ├─ create()
   ├─ 编辑         ─────> EditApiKeyDialog    ├─>                   ├─ update()
   │                                            │                     ├─ delete()
   ├─ 删除         ─────> 确认对话框          │                     └─ revoke()
   │                                            │
   ├─ 撤销         ─────> 确认对话框          │
   │                                            │
   ├─ 复制 ID      ─────> 剪贴板             │
   │                                            │
   └─ 搜索/过滤   ─────> 搜索框、状态过滤    │
                                               │
数据显示                                       │
  └─ 表格列表 ◄──────────────────────────────┘
```

### 模块 2: 日志查看（⭐ 重点关注）

```
用户交互                组件层                  页面层        服务层        API
   │
   ├─ 选择标签页  ──────────────────────────┐
   │ (登录/审计/API)                        │
   │                                         ├─> Logs.tsx ───> logApi.ts
   ├─ 分页       ──────────────────────────┤              ├─ getLoginLogs()
   │                                         │              ├─ getAuditLogs()
   ├─ 查看日志   ──────────────────────────┤              ├─ getApiLogs()
   │  ├─ 登录日志                          │              └─ getStatistics()
   │  │  └─ LoginLogsList 组件           │
   │  │  └─ 显示：状态、用户、方式、IP  │
   │  │                                    │
   │  ├─ 审计日志                          │
   │  │  └─ AuditLogsList 组件            │
   │  │  └─ 显示：操作、用户、资源、时间  │
   │  │                                    │
   │  └─ API 日志                          │
   │     └─ ApiLogsList 组件              │
   │     └─ 显示：方法、路径、状态、耗时  │
   │                                      │
   └─ 实时更新  ◄─────────────────────────┘
```

### 模块 3: 使用统计（用户端和管理端）

```
┌─── 用户端使用统计 (/usage)
│    │
│    ├─ Usage.tsx (主页面)
│    │   │
│    │   ├─ ApiKeyManager (API Key 输入)
│    │   │   └─ useApiKey Hook (本地存储)
│    │   │
│    │   ├─ UsageStatsOverview (概览卡片)
│    │   │
│    │   ├─ ModelDistributionChart (模型分布)
│    │   │
│    │   └─ TokenDistribution (Token 分布)
│    │
│    └─ useUsageStats Hook
│        └─ usageApi.ts
│            └─ /api/usage/stats
│
└─── 管理端统计看板 (/admin)
     │
     └─ Dashboard.tsx (仪表板)
         │
         ├─ 用户统计卡片
         │  └─ userApi.getStatistics()
         │
         ├─ 系统活动卡片
         │  └─ logApi.getStatistics()
         │
         └─ 快速操作链接
            └─ 链接到 /admin/users、/admin/logs 等
```

---

## 六、关键文件修改清单

### 如果需要...

#### 1. 添加新的管理菜单项 (例如：日志分析)

```diff
// 文件 1: src/components/admin/AdminLayout.tsx
+ import { BarChart3 } from 'lucide-react';

const navigation = [
  // ... 现有项
+ { name: '日志分析', href: '/admin/logs/analytics', icon: BarChart3 },
];
```

```diff
// 文件 2: src/router/index.tsx
+ const LogAnalytics = lazy(() => import('@/pages/admin/LogAnalytics'));

<Route path="/admin" element={<AdminLayout />}>
  // ... 现有路由
+ <Route path="logs/analytics" element={<LogAnalytics />} />
</Route>
```

```
// 文件 3: src/pages/admin/LogAnalytics.tsx (新建)
export default function LogAnalytics() {
  return (
    <div className="space-y-6">
      {/* 页面内容 */}
    </div>
  );
}
```

#### 2. 修改现有菜单项名称

```diff
// 文件: src/components/admin/AdminLayout.tsx
const navigation = [
- { name: '日志查看', href: '/admin/logs', icon: FileText },
+ { name: '系统日志', href: '/admin/logs', icon: FileText },
];
```

#### 3. 修改菜单项顺序

```diff
// 文件: src/components/admin/AdminLayout.tsx
const navigation = [
  { name: '仪表板', href: '/admin', icon: LayoutDashboard },
  { name: '用户管理', href: '/admin/users', icon: Users },
+ { name: '日志查看', href: '/admin/logs', icon: FileText },
  { name: '组织管理', href: '/admin/organizations', icon: Building2 },
  { name: 'API Key', href: '/admin/api-keys', icon: Key },
  { name: 'AI 提供商', href: '/admin/ai-providers', icon: Brain },
  { name: '渠道管理', href: '/admin/channels', icon: Network },
- { name: '日志查看', href: '/admin/logs', icon: FileText },
];
```

#### 4. 修改主导航菜单项

```diff
// 文件: src/config/site.ts
export const navConfig = {
  mainNav: [
    { title: '首页', href: '/' },
    { title: '文档中心', href: '/docs' },
    { title: 'MCP 精选', href: '/mcp' },
    { title: '经验分享', href: '/experience' },
    { title: '用量查询', href: '/usage' },
+   { title: '新功能', href: '/new-feature' },
  ],
};
```

---

## 七、权限流程图

```
用户访问 /admin
  │
  ├─ 检查认证上下文 (AuthContext)
  │  ├─ 未登录 → 重定向到 /login
  │  └─ 已登录 → 检查角色
  │
  └─ 检查用户角色 (AdminLayout.tsx)
     │
     ├─ user.role === 'ADMIN'
     │  └─ ✓ 显示管理后台菜单和内容
     │     ├─ 侧边栏菜单
     │     └─ 页面内容
     │
     └─ user.role !== 'ADMIN'
        └─ ✗ 显示"权限不足"提示
           └─ 返回首页按钮
```

---

## 八、数据流向示例

### 场景: 查看日志

```
用户点击"日志查看" 菜单
   │
   ├─ 路由导航 → /admin/logs
   │
   ├─ Logs.tsx 页面加载
   │  ├─ 初始状态：activeTab = 'login'
   │  └─ 显示三个标签页按钮
   │
   ├─ 用户点击"登录日志"标签（或默认选中）
   │  │
   │  └─ 渲染 LoginLogsList 组件
   │     │
   │     ├─ useEffect 触发 loadLogs()
   │     │
   │     ├─ logApi.getLoginLogs({skip: 0, take: 20})
   │     │  │
   │     │  ├─ 前端发送 GET /api/logs/login?skip=0&take=20
   │     │  │
   │     │  └─ 后端返回日志数据
   │     │
   │     ├─ setLogs(response.data)
   │     │
   │     └─ 渲染表格
   │        ├─ 表头：状态、用户、登录方式、IP、时间
   │        └─ 表体：日志行列表
   │
   └─ 用户分页或选择其他标签
      └─ 重复上述流程
```

### 场景: 创建 API Key

```
用户点击"创建"按钮
   │
   ├─ 打开 CreateApiKeyDialog
   │  └─ 显示表单字段
   │
   ├─ 用户填写表单和点击"创建"
   │  │
   │  └─ apiKeyApi.create(data)
   │     │
   │     ├─ 前端发送 POST /api/api-keys {data}
   │     │
   │     └─ 后端返回新的 API Key
   │
   ├─ 弹出 alert 显示完整 Key（仅此一次）
   │
   ├─ 关闭对话框
   │
   └─ 调用 loadApiKeys() 刷新列表
      └─ 显示新创建的 API Key
```
