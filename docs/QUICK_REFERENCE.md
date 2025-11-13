# 前端路由和菜单快速参考指南

## 快速导航问题解答

### Q1: API Keys 管理在哪个菜单下？

**A:** 在管理后台（需要 ADMIN 权限）

- 菜单项：**API Key**
- 路由：`/admin/api-keys`
- 页面文件：`/src/pages/admin/ApiKeys.tsx`
- 在侧边菜单的第4位（仪表板 > 用户管理 > 组织管理 > **API Key**)

---

### Q2: 是否已有使用统计页面？

**A:** 已有两个使用统计页面

**1. 用户端使用统计（公开页面）**

- 菜单项：**用量查询**
- 路由：`/usage`
- 路径：主导航菜单 > 用量查询
- 文件：`/src/pages/Usage.tsx`
- 功能：用户输入 API Key 查询使用情况

**2. 管理端统计看板（需要 ADMIN 权限）**

- 菜单项：**仪表板**
- 路由：`/admin`
- 路径：管理后台首页
- 文件：`/src/pages/admin/Dashboard.tsx`
- 功能：展示用户统计和系统活动统计

---

### Q3: 日志查看功能在哪里？

**A:** 在管理后台

- 菜单项：**日志查看**
- 路由：`/admin/logs`
- 页面文件：`/src/pages/admin/Logs.tsx`
- 权限：需要 ADMIN 角色
- **包含3种日志：**
  - 登录日志（用户登录记录）
  - 审计日志（系统操作记录）
  - API 日志（API 请求记录）

---

### Q4: 当前的菜单结构是怎样的？

**A:** 分为两部分

**主导航菜单（所有用户可见）：**

```
首页 /
文档中心 /docs
MCP 精选 /mcp
经验分享 /experience
用量查询 /usage
```

**管理后台菜单（仅 ADMIN 用户）：**

```
仪表板 /admin
用户管理 /admin/users
组织管理 /admin/organizations
API Key /admin/api-keys ⭐
AI 提供商 /admin/ai-providers
渠道管理 /admin/channels
日志查看 /admin/logs ⭐
```

---

### Q5: 在哪里添加新的日志查看功能？

**A:** 取决于功能类型

**场景1: 增强现有的日志查看（添加过滤、导出等）**

- 修改文件：`/src/pages/admin/Logs.tsx`
- 修改组件：`/src/pages/admin/components/`
- 修改服务：`/src/services/logApi.ts`

**场景2: 添加新的日志相关页面（如日志分析）**

- 新增页面：`/src/pages/admin/LogAnalytics.tsx`
- 新增路由：`/admin/logs/analytics`
- 新增菜单项（可选）：在 `AdminLayout.tsx` 的 navigation 数组中添加

**场景3: 在现有菜单下添加子页面**

- 修改路由：`/src/router/index.tsx` 中添加 `<Route>`
- 修改菜单：`/src/components/admin/AdminLayout.tsx` 中添加菜单项
- 创建页面：`/src/pages/admin/YourNewPage.tsx`

---

## 关键文件速查表

### 必改的 3 个文件（添加新菜单项时）

| 文件                                   | 用途     | 修改内容                         |
| -------------------------------------- | -------- | -------------------------------- |
| `src/components/admin/AdminLayout.tsx` | 菜单定义 | navigation 数组中添加新项        |
| `src/router/index.tsx`                 | 路由定义 | 在 `/admin` 路由中添加 `<Route>` |
| `src/pages/admin/YourPage.tsx`         | 页面实现 | 创建新的页面组件                 |

### 相关配置文件

| 文件                           | 用途                            |
| ------------------------------ | ------------------------------- |
| `src/config/site.ts`           | 主导航和侧边栏配置（navConfig） |
| `src/router/index.tsx`         | 所有路由配置                    |
| `src/contexts/AuthContext.tsx` | 认证和用户信息                  |

### 服务层文件

| 文件                        | 用途                  |
| --------------------------- | --------------------- |
| `src/services/logApi.ts`    | 日志相关 API 调用     |
| `src/services/apiKeyApi.ts` | API Key 相关 API 调用 |
| `src/services/usageApi.ts`  | 使用统计 API 调用     |
| `src/services/userApi.ts`   | 用户相关 API 调用     |

### 组件层文件

| 目录                     | 用途             |
| ------------------------ | ---------------- |
| `src/components/admin/`  | 管理后台通用组件 |
| `src/components/usage/`  | 使用统计专用组件 |
| `src/components/layout/` | 页面布局组件     |
| `src/components/common/` | 通用 UI 组件     |

---

## 代码示例

### 例子 1: 添加一个新的管理菜单项

**步骤 1: 修改菜单定义** (`src/components/admin/AdminLayout.tsx`)

在 `navigation` 数组中添加：

```typescript
import { BarChart3 } from 'lucide-react'; // 新增 icon 导入

const navigation = [
  // ... 现有项
  { name: '日志分析', href: '/admin/logs/analytics', icon: BarChart3 },
];
```

**步骤 2: 修改路由** (`src/router/index.tsx`)

在 `/admin` 路由的子路由中添加：

```typescript
<Route path="logs/analytics" element={<LogAnalytics />} />
```

同时在顶部导入：

```typescript
const LogAnalytics = lazy(() => import('@/pages/admin/LogAnalytics'));
```

**步骤 3: 创建页面组件** (`src/pages/admin/LogAnalytics.tsx`)

```typescript
export default function LogAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          日志分析
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          查看日志统计和分析
        </p>
      </div>
      {/* 页面内容 */}
    </div>
  );
}
```

---

### 例子 2: 调用日志 API

**使用日志服务：**

```typescript
import { logApi } from '@/services/logApi';

// 获取登录日志
const response = await logApi.getLoginLogs({
  skip: 0,
  take: 20,
});

// 获取审计日志
const auditLogs = await logApi.getAuditLogs({
  skip: 0,
  take: 20,
});

// 获取 API 日志
const apiLogs = await logApi.getApiLogs({
  skip: 0,
  take: 20,
});

// 获取统计数据
const stats = await logApi.getStatistics();
```

---

### 例子 3: 在日志页面添加过滤功能

现有 `Logs.tsx` 已有基础结构，可以在日志列表上方添加：

```typescript
// 在 LoginLogsList 组件中添加
const [dateFrom, setDateFrom] = useState('');
const [dateTo, setDateTo] = useState('');
const [userFilter, setUserFilter] = useState('');

const loadLogs = async () => {
  const response = await logApi.getLoginLogs({
    skip: page * pageSize,
    take: pageSize,
    // 添加过滤参数
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    email: userFilter || undefined,
  });
  setLogs(response.data);
};
```

---

## 当前权限模型

**管理后台访问权限：**

- 需要用户角色为 `ADMIN`
- 权限检查在 `AdminLayout.tsx` 中执行
- 无权限用户会看到"权限不足"提示，返回首页

**使用统计访问权限：**

- `/usage` 页面所有用户可访问
- 用户需输入自己的 API Key 查询
- 用户端使用统计由前端处理，后端提供 API

---

## API 端点参考（前端调用）

### 日志相关

- `GET /api/logs/login` - 获取登录日志
- `GET /api/logs/audit` - 获取审计日志
- `GET /api/logs/api` - 获取 API 日志
- `GET /api/logs/statistics` - 获取日志统计

### API Key 相关

- `GET /api/api-keys` - 获取 API Key 列表
- `POST /api/api-keys` - 创建 API Key
- `PUT /api/api-keys/:id` - 更新 API Key
- `DELETE /api/api-keys/:id` - 删除 API Key
- `POST /api/api-keys/:id/revoke` - 撤销 API Key

### 使用统计相关

- `POST /api/usage/stats` - 获取使用统计

---

## 常见修改清单

如果需要：

- [ ] 添加新的管理菜单项
  - 修改：`AdminLayout.tsx` (菜单)
  - 修改：`router/index.tsx` (路由)
  - 创建：新页面文件

- [ ] 增强日志功能（过滤、导出等）
  - 修改：`pages/admin/Logs.tsx`
  - 修改：`services/logApi.ts` (如需新 API)
  - 新增：组件文件（如 LogFilter.tsx）

- [ ] 添加日志分析功能
  - 创建：`pages/admin/LogAnalytics.tsx`
  - 修改：`router/index.tsx`
  - 修改：`AdminLayout.tsx` (可选)
  - 修改：`services/logApi.ts` (如需新 API)

- [ ] 修改现有菜单项顺序或名称
  - 修改：`AdminLayout.tsx` 中的 navigation 数组

- [ ] 添加新的用户页面（非管理员可访问）
  - 修改：`router/index.tsx` (主路由)
  - 修改：`config/site.ts` (如需显示在导航)
  - 创建：新页面文件

---

## 文件夹结构快速导航

```
src/
├── pages/                       # 页面组件
│   ├── admin/                   # 管理后台页面
│   │   ├── ApiKeys.tsx         # API Key 管理 ⭐
│   │   ├── Logs.tsx            # 日志查看 ⭐
│   │   ├── Dashboard.tsx        # 仪表板
│   │   └── components/          # 管理页面的对话框等
│   ├── Usage.tsx               # 使用统计 ⭐
│   ├── Home.tsx                # 首页
│   ├── Docs.tsx                # 文档
│   └── ...
│
├── components/                  # 可复用组件
│   ├── admin/                   # 管理组件
│   │   └── AdminLayout.tsx     # 菜单定义 ⭐
│   ├── layout/                  # 布局组件
│   ├── usage/                   # 使用统计组件
│   └── ...
│
├── services/                    # API 调用层
│   ├── logApi.ts               # 日志 API ⭐
│   ├── apiKeyApi.ts            # API Key API ⭐
│   ├── usageApi.ts             # 使用统计 API ⭐
│   └── ...
│
├── router/
│   └── index.tsx               # 路由配置 ⭐
│
├── config/
│   └── site.ts                 # 网站配置 ⭐
│
└── types/                       # TypeScript 类型定义
    ├── apiKey.ts
    ├── usage.ts
    └── ...
```

---

## 总结

**三个核心问题的答案：**

1. **API Keys 管理在哪个菜单下？**
   - 答：管理后台 > API Key（`/admin/api-keys`）

2. **是否已有使用统计页面？**
   - 答：已有。用户端（`/usage`）和管理端仪表板（`/admin`）

3. **日志查看在哪里？**
   - 答：管理后台 > 日志查看（`/admin/logs`），包含登录/审计/API 三种日志

**添加新功能的三个关键文件：**

1. `src/components/admin/AdminLayout.tsx` - 菜单
2. `src/router/index.tsx` - 路由
3. `src/pages/admin/YourPage.tsx` - 页面
