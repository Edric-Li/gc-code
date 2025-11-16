# GC Code Portal

[![Docker Build & Push](https://github.com/edricli7/gc-code1/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/edricli7/gc-code1/actions/workflows/docker-publish.yml)
[![Auto Release](https://github.com/edricli7/gc-code1/actions/workflows/auto-release.yml/badge.svg)](https://github.com/edricli7/gc-code1/actions/workflows/auto-release.yml)
[![Docker Hub](https://img.shields.io/docker/pulls/edricli7/gc-code-portal?logo=docker)](https://hub.docker.com/r/edricli7/gc-code-portal)
[![Docker Image Size](https://img.shields.io/docker/image-size/edricli7/gc-code-portal/latest?logo=docker)](https://hub.docker.com/r/edricli7/gc-code-portal)

> 统一接入 Claude、Codex 等多种 AI 服务的门户网站

## 🏗️ 架构

本项目采用 **Monorepo** 架构，使用 **pnpm workspace** 管理多个包：

- **Frontend**: React + Vite + TypeScript
- **Backend**: NestJS + Prisma + PostgreSQL

## ✨ 特性

### 前端特性
- 🎨 现代化 UI 设计
- 🌓 深色/浅色主题切换
- 📱 完全响应式布局
- ⚡ 基于 Vite 的快速开发体验
- 📝 TypeScript 类型安全
- 🔍 完整的代码质量保证工具链

### 后端特性
- 🔐 Azure AD 单点登录
- 🔑 API 密钥管理
- 📊 使用统计和日志
- 🚀 渠道池负载均衡
- 💾 Prisma ORM + PostgreSQL
- 📈 实时监控和健康检查

## 🛠️ 技术栈

### 前端 (@gc-code/frontend)
- **框架**: React 19
- **构建工具**: Vite 6
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **路由**: React Router v7
- **状态管理**: Zustand
- **代码质量**: ESLint + Stylelint + Prettier

### 后端 (@gc-code/backend)
- **框架**: NestJS 10
- **数据库**: PostgreSQL + Prisma
- **认证**: JWT + Azure AD (MSAL)
- **API 文档**: Swagger
- **调度**: @nestjs/schedule
- **HTTP 客户端**: Axios

### 工具链
- **包管理器**: pnpm
- **Monorepo 管理**: pnpm workspace
- **Git Hooks**: Husky
- **代码规范**: lint-staged

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL (用于后端)

### 方式 1: 本地开发（推荐）

#### 1. 安装 pnpm

```bash
npm install -g pnpm
```

#### 2. 安装依赖

```bash
pnpm install
```

自动处理：
- ✅ 安装所有 workspace 的依赖
- ✅ 自动构建 bcrypt 等原生模块
- ✅ 自动生成 Prisma Client

#### 3. 配置环境变量

**前端环境变量** (`apps/frontend/.env`):
```bash
cp apps/frontend/.env.example apps/frontend/.env
# 编辑 apps/frontend/.env
```

**后端环境变量** (`apps/backend/.env`):
```bash
cp apps/backend/.env.example apps/backend/.env
# 编辑 apps/backend/.env，配置数据库、JWT、Azure AD 等
```

#### 4. 初始化数据库（仅后端）

```bash
cd apps/backend
pnpm prisma migrate dev
pnpm db:init  # 初始化数据库和种子数据
```

#### 5. 启动开发服务

```bash
# 同时启动前端和后端
pnpm dev

# 或单独启动
pnpm dev:frontend  # 前端 http://localhost:3000
pnpm dev:backend   # 后端 http://localhost:5555
```

访问：
- **前端**: http://localhost:3000
- **后端 API**: http://localhost:5555
- **API 文档**: http://localhost:5555/api/docs

### 方式 2: 使用 Docker

```bash
# 拉取最新镜像
docker pull edricli7/gc-code-portal:latest

# 运行容器
docker run -d -p 80:80 edricli7/gc-code-portal:latest

# 或使用 docker-compose
docker-compose up -d
```

访问 http://localhost

## 📦 项目结构

```
gc-code-monorepo/
├── apps/
│   ├── frontend/              # @gc-code/frontend
│   │   ├── src/
│   │   │   ├── components/   # React 组件
│   │   │   ├── pages/        # 页面组件
│   │   │   ├── contexts/     # React Context
│   │   │   ├── hooks/        # 自定义 Hooks
│   │   │   ├── services/     # API 服务
│   │   │   └── types/        # TypeScript 类型
│   │   └── package.json
│   │
│   └── backend/               # @gc-code/backend
│       ├── src/
│       │   ├── modules/      # NestJS 模块
│       │   │   ├── auth/     # 认证模块
│       │   │   ├── users/    # 用户管理
│       │   │   ├── api-keys/ # API 密钥
│       │   │   └── ...
│       │   ├── common/       # 公共模块
│       │   └── main.ts
│       ├── prisma/           # 数据库 schema 和迁移
│       └── package.json
│
├── scripts/                   # 通用脚本
│   ├── start-dev.sh
│   ├── start-frontend.sh
│   ├── start-backend.sh
│   └── kill-port.sh
│
├── pnpm-workspace.yaml        # Workspace 配置
├── package.json               # Root package (workspace 控制器)
├── .npmrc                     # pnpm 配置
└── README.md
```

## 🔧 开发指南

### Workspace 命令

```bash
# 在特定包中运行命令
pnpm --filter @gc-code/frontend <command>
pnpm --filter @gc-code/backend <command>

# 示例
pnpm --filter @gc-code/frontend lint
pnpm --filter @gc-code/backend test
```

### 代码质量检查

```bash
# 前端 lint
pnpm lint

# 前端格式化
pnpm format

# 前端类型检查
pnpm type-check

# 后端 lint
pnpm --filter @gc-code/backend lint
```

### 构建

```bash
# 构建所有应用
pnpm build

# 单独构建
pnpm build:frontend
pnpm build:backend
```

### 添加依赖

```bash
# 添加到前端
pnpm --filter @gc-code/frontend add <package>

# 添加到后端
pnpm --filter @gc-code/backend add <package>

# 添加到 root（工具依赖）
pnpm add -w <package>
```

### 数据库操作（后端）

```bash
cd apps/backend

# 创建迁移
pnpm prisma migrate dev --name <migration-name>

# 应用迁移
pnpm prisma migrate deploy

# 生成 Prisma Client
pnpm prisma generate

# 打开 Prisma Studio
pnpm prisma studio

# 初始化数据库
pnpm db:init

# 重置数据库
pnpm db:reset
```

### Git 提交

项目配置了 Git hooks，会在提交前自动检查代码质量：

```bash
git add .
git commit -m "feat: your feature"  # 自动运行 lint-staged
git push
```

## 📜 可用脚本

### Root 脚本

| 脚本                  | 说明                         |
| --------------------- | ---------------------------- |
| `pnpm dev`            | 同时启动前端和后端           |
| `pnpm dev:frontend`   | 仅启动前端                   |
| `pnpm dev:backend`    | 仅启动后端                   |
| `pnpm build`          | 构建所有应用                 |
| `pnpm build:frontend` | 仅构建前端                   |
| `pnpm build:backend`  | 仅构建后端                   |
| `pnpm lint`           | 前端代码检查                 |
| `pnpm format`         | 前端代码格式化               |
| `pnpm type-check`     | 前端类型检查                 |
| `pnpm kill-port`      | 清理端口（使用脚本）         |

### Frontend 脚本

```bash
cd apps/frontend

pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm preview      # 预览生产版本
pnpm lint         # 代码检查
pnpm format       # 代码格式化
pnpm type-check   # TypeScript 类型检查
```

### Backend 脚本

```bash
cd apps/backend

pnpm start:dev    # 启动开发服务器（热重载）
pnpm start        # 启动生产服务器
pnpm build        # 构建生产版本
pnpm test         # 运行测试
pnpm db:init      # 初始化数据库
pnpm db:reset     # 重置数据库
```

## 📚 文档

- [Monorepo 迁移指南](./MIGRATION.md) - **必读！**了解如何从旧架构迁移
- [代码质量](./CODE_QUALITY.md)
- [GitHub Actions 使用指南](./.github/WORKFLOW_USAGE.md)
- [Docker 部署](./docker-compose.yml)

## 🔍 常见问题

### bcrypt 构建失败

**问题**: `Cannot find module 'bcrypt_lib.node'`

**解决方案**:
```bash
pnpm rebuild bcrypt
```

这个问题已经在 `postinstall` 脚本中自动处理，通常不需要手动操作。

### Prisma Client 未生成

**解决方案**:
```bash
cd apps/backend
pnpm prisma generate
```

### 端口被占用

```bash
# 使用提供的脚本
bash scripts/kill-port.sh 3000  # 前端
bash scripts/kill-port.sh 5555  # 后端
```

更多问题请查看 [MIGRATION.md](./MIGRATION.md)

## 🤝 贡献

欢迎贡献！请确保：

1. 代码通过 `pnpm lint` 和 `pnpm type-check`
2. 遵循现有的代码风格
3. 添加必要的测试和文档
4. 提交前运行所有检查

## 📄 许可证

MIT

---

**注意**: 本项目已从分离式架构迁移到 Monorepo。如果你是从旧版本升级，请查看 [MIGRATION.md](./MIGRATION.md) 了解详细的迁移指南。
