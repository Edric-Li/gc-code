# Monorepo 迁移指南

本文档说明从旧的分离式项目结构迁移到 Monorepo 架构的过程和注意事项。

## 📋 迁移概述

**迁移时间**: 2025-11-15
**包管理器**: npm → pnpm
**架构**: 分离式 → Monorepo (pnpm workspace)

## 🏗️ 新架构结构

```
gc-code-monorepo/
├── apps/
│   ├── frontend/          # @gc-code/frontend - React + Vite
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── ...
│   └── backend/           # @gc-code/backend - NestJS
│       ├── src/
│       ├── prisma/
│       ├── package.json
│       └── ...
├── scripts/               # 通用脚本
│   ├── start-dev.sh
│   ├── start-frontend.sh
│   ├── start-backend.sh
│   └── kill-port.sh
├── pnpm-workspace.yaml    # pnpm workspace 配置
├── package.json           # Root workspace 控制器
├── .npmrc                 # pnpm 配置
└── README.md
```

## 🔄 主要变更

### 1. 项目结构变更

| 旧结构 | 新结构 |
|--------|--------|
| `src/` (前端) | `apps/frontend/src/` |
| `backend/` | `apps/backend/` |
| `package.json` (前端) | `apps/frontend/package.json` |
| `backend/package.json` | `apps/backend/package.json` |
| Root `package.json` | Workspace 控制器 |

### 2. 包管理器变更

**从 npm 迁移到 pnpm**:
- ✅ 更快的安装速度
- ✅ 更高效的磁盘空间利用
- ✅ 更严格的依赖管理
- ⚠️ 需要配置 bcrypt 等原生模块的自动构建

### 3. Package 命名

```json
// 前端
"name": "@gc-code/frontend"

// 后端
"name": "@gc-code/backend"
```

使用 scoped name 便于 workspace 过滤和管理。

## 📦 安装和启动

### 首次安装

```bash
# 1. 安装 pnpm (如果未安装)
npm install -g pnpm

# 2. 删除旧的 node_modules 和 lockfile
rm -rf node_modules package-lock.json backend/node_modules backend/package-lock.json

# 3. 安装所有依赖
pnpm install
```

**自动化处理**:
- ✅ bcrypt 自动构建
- ✅ Prisma Client 自动生成

### 启动开发环境

```bash
# 方式 1: 使用脚本（推荐）
pnpm dev
# 或
bash scripts/start-dev.sh

# 方式 2: 单独启动
pnpm dev:frontend  # 仅启动前端
pnpm dev:backend   # 仅启动后端
pnpm dev:all       # 同时启动（使用 concurrently）
```

### 构建生产版本

```bash
# 构建所有应用
pnpm build

# 单独构建
pnpm build:frontend
pnpm build:backend
```

## ⚙️ 环境变量配置

**重要变更**: 环境变量现在分开配置！

### 前端环境变量

位置: `apps/frontend/.env`

```bash
cp apps/frontend/.env.example apps/frontend/.env
# 编辑 apps/frontend/.env
```

前端环境变量必须使用 `VITE_` 前缀。

### 后端环境变量

位置: `apps/backend/.env`

```bash
cp apps/backend/.env.example apps/backend/.env
# 编辑 apps/backend/.env
```

后端环境变量包括:
- 数据库配置
- JWT 密钥
- Azure AD 配置
- 等等

## 🔧 常见问题

### 1. bcrypt 原生模块构建失败

**问题**: `Cannot find module 'bcrypt_lib.node'`

**解决方案**:
```bash
# 自动修复（已在 postinstall 脚本中）
pnpm rebuild bcrypt

# 或手动修复
cd apps/backend
pnpm install
```

**说明**:
- pnpm v10 有强制的构建脚本安全审批
- 我们在 `package.json` 的 `postinstall` 脚本中自动重建 bcrypt
- 不需要手动干预

### 2. Prisma Client 未生成

**问题**: TypeScript 提示 `@prisma/client` 类型错误

**解决方案**:
```bash
cd apps/backend
pnpm prisma generate
```

**说明**:
- Prisma Client 会在 `pnpm install` 时自动生成（通过 postinstall）
- 如果数据库 schema 修改，需要手动重新生成

### 3. pnpm 命令不可用

**解决方案**:
```bash
# 安装 pnpm
npm install -g pnpm

# 或使用 npx
npx pnpm install
```

### 4. 端口被占用

**解决方案**:
```bash
# 使用提供的脚本清理端口
bash scripts/kill-port.sh 3000  # 清理前端端口
bash scripts/kill-port.sh 5555  # 清理后端端口
```

## 🚀 Workspace 命令

### 在特定包中运行命令

```bash
# 在前端运行命令
pnpm --filter @gc-code/frontend <command>

# 在后端运行命令
pnpm --filter @gc-code/backend <command>

# 示例
pnpm --filter @gc-code/frontend lint
pnpm --filter @gc-code/backend test
```

### 在所有包中运行命令

```bash
# 在所有包中并行运行
pnpm -r <command>

# 示例
pnpm -r build
```

### 添加依赖

```bash
# 添加到前端
pnpm --filter @gc-code/frontend add <package>

# 添加到后端
pnpm --filter @gc-code/backend add <package>

# 添加到 root (开发工具等)
pnpm add -w <package>
```

## 📝 CI/CD 调整

### GitHub Actions 示例

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 10

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test
```

### Docker 构建调整

在 Dockerfile 中:

```dockerfile
# 使用 pnpm
FROM node:18-alpine
RUN npm install -g pnpm

# 复制 workspace 配置
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY apps/ ./apps/

# 构建
RUN pnpm build
```

## 🔍 验证迁移

运行以下命令验证迁移成功:

```bash
# 1. 清理并重新安装
rm -rf node_modules
pnpm install

# 2. 启动开发环境
pnpm dev

# 3. 验证前端 (http://localhost:3000)
curl http://localhost:3000

# 4. 验证后端 (http://localhost:5555)
curl http://localhost:5555/api/health/ping
```

预期结果:
- ✅ 前端可访问
- ✅ 后端健康检查返回 `{"message":"pong"}`
- ✅ 无构建错误
- ✅ 无 TypeScript 类型错误

## 📚 相关资源

- [pnpm Workspace 文档](https://pnpm.io/workspaces)
- [Monorepo 最佳实践](https://monorepo.tools/)
- [pnpm vs npm 性能对比](https://pnpm.io/benchmarks)

## 🆘 获取帮助

如果遇到问题:

1. 查看本文档的"常见问题"部分
2. 检查 GitHub Issues
3. 查看 pnpm 官方文档
4. 联系团队成员

## 🎯 下一步

迁移完成后，建议:

1. ✅ 更新 CI/CD 配置
2. ✅ 更新部署文档
3. ✅ 通知团队成员新的开发流程
4. ⏳ 考虑添加 Turbo 或 Nx 进行构建优化
