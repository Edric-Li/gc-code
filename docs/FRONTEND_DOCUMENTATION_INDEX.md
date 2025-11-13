# 前端文档索引

本索引介绍了三份关于前端菜单和路由配置的详细文档。

## 文档列表

### 1. STRUCTURE_DIAGRAMS.md (推荐首先查看)

**大小:** 17 KB | **用途:** 全面理解整体架构

**包含内容：**

- 整体导航结构图（ASCII 艺术）
- 详细的文件树结构
- 路由决策树流程图
- 菜单项映射表
- 核心功能模块架构（API Key、日志、使用统计）
- 关键文件修改示例
- 权限流程图
- 数据流向示例

**适合场景：**

- 快速了解项目的整体架构
- 理解文件之间的关系
- 查看数据流向和权限控制
- 通过图表理解功能模块

**快速链接：**

- 整体导航结构图 (第 1 节)
- 文件树结构 (第 2 节)
- 路由决策树 (第 3 节)

---

### 2. QUICK_REFERENCE.md (日常使用推荐)

**大小:** 9.6 KB | **用途:** 快速查找和日常参考

**包含内容：**

- Q&A 格式的快速导航问题解答（5个常见问题）
- 关键文件速查表
- 代码示例（3个实用例子）
- 权限模型说明
- API 端点参考
- 常见修改清单
- 文件夹快速导航
- 总结表格

**适合场景：**

- 快速查找功能位置
- 日常开发时的快速参考
- 需要代码示例时
- 修改菜单或添加功能时

**快速链接：**

- Q1: API Keys 在哪个菜单下？
- Q2: 已有使用统计页面吗？
- Q3: 日志查看在哪里？
- Q4: 如何添加新功能？
- 添加新菜单项示例
- 常见修改清单

---

### 3. FRONTEND_MENU_STRUCTURE.md (深入学习)

**大小:** 12.5 KB | **用途:** 详细的完整说明文档

**包含内容：**

- 项目概述和技术栈
- 详细的菜单结构说明
- 路由配置详情
- API Keys 管理功能详解
- 使用统计和日志功能详解
- 管理后台仪表板说明
- 完整的项目目录结构
- 关键代码片段（带行号）
- 权限控制说明
- 现有功能总结
- 添加新功能的建议位置
- 文件对应表

**适合场景：**

- 需要了解每个功能的详细信息
- 查阅代码片段位置
- 理解权限控制机制
- 学习现有功能实现

**快速链接：**

- 菜单结构 (第 2 节)
- API Keys 详情 (第 4 节)
- 日志查看详情 (第 5 节)
- 项目目录结构 (第 7 节)
- 关键代码片段 (第 8 节)

---

## 快速导航

### 需要...

#### 了解项目总体架构？

1. 阅读 **STRUCTURE_DIAGRAMS.md** 第 1-3 节
2. 查看文件树结构
3. 理解路由决策树

#### 找到 API Keys 管理功能？

1. 查看 **QUICK_REFERENCE.md** Q1
2. 或查看 **FRONTEND_MENU_STRUCTURE.md** 第 4 节

#### 了解日志查看功能？

1. 查看 **QUICK_REFERENCE.md** Q3
2. 或查看 **FRONTEND_MENU_STRUCTURE.md** 第 5 节
3. 查看 **STRUCTURE_DIAGRAMS.md** 第 5 节（日志模块架构）

#### 添加新的菜单项？

1. 查看 **QUICK_REFERENCE.md** 第 2 节（关键文件速查表）
2. 查看 **STRUCTURE_DIAGRAMS.md** 第 6 节（修改清单）
3. 参考 **QUICK_REFERENCE.md** 中的代码示例 1

#### 修改现有功能？

1. 查看 **QUICK_REFERENCE.md** 最后的修改清单
2. 查看 **STRUCTURE_DIAGRAMS.md** 第 6 节

#### 理解权限控制？

1. 查看 **STRUCTURE_DIAGRAMS.md** 第 7 节（权限流程图）
2. 查看 **FRONTEND_MENU_STRUCTURE.md** 第 9 节

#### 了解数据流向？

1. 查看 **STRUCTURE_DIAGRAMS.md** 第 8 节（数据流向示例）
2. 查看 **STRUCTURE_DIAGRAMS.md** 第 5 节（模块架构）

---

## 文件对照表

| 文件              | 功能描述           | 路由                 | 权限  | 位置             |
| ----------------- | ------------------ | -------------------- | ----- | ---------------- |
| Home.tsx          | 首页               | /                    | 公开  | /src/pages       |
| Usage.tsx         | 用量查询（用户端） | /usage               | 公开  | /src/pages       |
| Dashboard.tsx     | 仪表板             | /admin               | ADMIN | /src/pages/admin |
| **ApiKeys.tsx**   | **API Key 管理**   | **/admin/api-keys**  | ADMIN | /src/pages/admin |
| **Logs.tsx**      | **日志查看**       | **/admin/logs**      | ADMIN | /src/pages/admin |
| Users.tsx         | 用户管理           | /admin/users         | ADMIN | /src/pages/admin |
| Organizations.tsx | 组织管理           | /admin/organizations | ADMIN | /src/pages/admin |
| AiProviders.tsx   | AI 提供商          | /admin/ai-providers  | ADMIN | /src/pages/admin |
| Channels.tsx      | 渠道管理           | /admin/channels      | ADMIN | /src/pages/admin |

---

## 核心问题速答

### Q1: 当前菜单结构是什么样的？

**A:** 两层结构：

- 主导航菜单：5 项（首页、文档、MCP、经验、用量查询）
- 管理菜单：7 项 + 仪表板（仅 ADMIN 用户）

详见：**QUICK_REFERENCE.md Q4** 或 **STRUCTURE_DIAGRAMS.md 第 4 节**

### Q2: API Keys 管理在哪个菜单下？

**A:** 管理后台 > API Key（`/admin/api-keys`）

- 页面：ApiKeys.tsx
- 服务：apiKeyApi.ts
- 功能：创建、编辑、删除、撤销

详见：**QUICK_REFERENCE.md Q1** 或 **FRONTEND_MENU_STRUCTURE.md 第 4 节**

### Q3: 是否已有使用统计页面？

**A:** 已有两个：

- 用户端：`/usage`（用量查询）
- 管理端：`/admin`（仪表板）

详见：**QUICK_REFERENCE.md Q2** 或 **FRONTEND_MENU_STRUCTURE.md 第 5-6 节**

### Q4: 日志查看功能在哪里？

**A:** 管理后台 > 日志查看（`/admin/logs`）

- 页面：Logs.tsx
- 服务：logApi.ts
- 日志类型：登录、审计、API 三种

详见：**QUICK_REFERENCE.md Q3** 或 **FRONTEND_MENU_STRUCTURE.md 第 5 节**

### Q5: 需要在哪里添加新的日志查看功能？

**A:** 三个关键文件：

1. AdminLayout.tsx（菜单定义）
2. router/index.tsx（路由定义）
3. pages/admin/YourPage.tsx（页面实现）

详见：**QUICK_REFERENCE.md Q5** 或 **STRUCTURE_DIAGRAMS.md 第 6 节**

---

## 关键文件速查

| 文件                                    | 用途         | 查看文档                        |
| --------------------------------------- | ------------ | ------------------------------- |
| `/src/router/index.tsx`                 | 路由定义     | STRUCTURE_DIAGRAMS 第 2 节      |
| `/src/components/admin/AdminLayout.tsx` | 菜单定义     | QUICK_REFERENCE Q1              |
| `/src/config/site.ts`                   | 主导航配置   | FRONTEND_MENU_STRUCTURE 第 2 节 |
| `/src/pages/admin/ApiKeys.tsx`          | API Key 管理 | QUICK_REFERENCE Q1              |
| `/src/pages/admin/Logs.tsx`             | 日志查看     | QUICK_REFERENCE Q3              |
| `/src/pages/Usage.tsx`                  | 使用统计     | QUICK_REFERENCE Q2              |
| `/src/services/logApi.ts`               | 日志 API     | FRONTEND_MENU_STRUCTURE 第 5 节 |
| `/src/services/apiKeyApi.ts`            | API Key API  | FRONTEND_MENU_STRUCTURE 第 4 节 |
| `/src/contexts/AuthContext.ts`          | 权限管理     | STRUCTURE_DIAGRAMS 第 7 节      |

---

## 阅读建议

### 新手开发者

1. 先读：STRUCTURE_DIAGRAMS.md（了解全貌）
2. 再读：QUICK_REFERENCE.md（找到具体位置）
3. 最后：FRONTEND_MENU_STRUCTURE.md（深入理解）

### 快速参考

- 需要找功能位置？→ QUICK_REFERENCE.md
- 需要看代码示例？→ QUICK_REFERENCE.md
- 需要添加新功能？→ STRUCTURE_DIAGRAMS.md 第 6 节

### 深入学习

- 理解权限控制？→ STRUCTURE_DIAGRAMS.md 第 7 节 + FRONTEND_MENU_STRUCTURE.md 第 9 节
- 理解数据流向？→ STRUCTURE_DIAGRAMS.md 第 8 节
- 理解模块设计？→ STRUCTURE_DIAGRAMS.md 第 5 节

---

## 更新时间

- 创建时间：2025-11-13
- 最后更新：2025-11-13
- 前端框架：React + React Router
- 后端框架：Node.js / NestJS

---

## 相关文档

其他相关的项目文档：

- BACKEND_TECH_STACK.md - 后端技术栈
- CLAUDE_RELAY_TECHNICAL_DESIGN.md - Claude Relay 技术设计
- API_KEY_DESIGN.md - API Key 设计文档
- API_KEY_IMPLEMENTATION.md - API Key 实现文档

---

## 联系和反馈

如有问题或需要更新，请参考项目的贡献指南。
