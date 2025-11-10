# GC Code Portal - 后端集成指南

## 项目结构

```
gc-code-portal/
├── backend/              # 后端 NestJS 项目
│   ├── src/
│   │   ├── modules/
│   │   │   └── health/  # 健康检查模块
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env             # 环境变量配置
│   ├── .env.example     # 环境变量示例
│   ├── package.json
│   └── tsconfig.json
├── src/                 # 前端 React 项目
├── docs/                # 文档
└── package.json         # 根项目配置
```

## 快速开始

### 1. 安装依赖

```bash
# 安装根目录和后端依赖
npm run install:all

# 或者分别安装
npm install                  # 前端依赖
npm run install:backend      # 后端依赖
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp backend/.env.example backend/.env

# 编辑 backend/.env 文件，配置必要的参数
```

### 3. 运行项目

```bash
# 只运行前端 (默认)
npm run dev
# 或
npm run dev:frontend

# 只运行后端
npm run dev:backend

# 同时运行前端和后端
npm run dev:all
```

## 可用脚本

### 开发环境

| 命令                   | 说明                           |
| ---------------------- | ------------------------------ |
| `npm run dev`          | 运行前端（默认）               |
| `npm run dev:frontend` | 运行前端开发服务器 (端口 3000) |
| `npm run dev:backend`  | 运行后端开发服务器 (端口 5555) |
| `npm run dev:all`      | 同时运行前后端                 |

### 生产构建

| 命令                         | 说明             |
| ---------------------------- | ---------------- |
| `npm run build`              | 构建前端和后端   |
| `npm run build:frontend`     | 只构建前端       |
| `npm run build:backend`      | 只构建后端       |
| `npm run start:backend:prod` | 运行生产环境后端 |

### 依赖安装

| 命令                      | 说明               |
| ------------------------- | ------------------ |
| `npm run install:all`     | 安装前端和后端依赖 |
| `npm run install:backend` | 只安装后端依赖     |

## 端口配置

- **前端**: `http://localhost:3000`
- **后端**: `http://localhost:5555`
- **API 文档**: `http://localhost:5555/api/docs` (Swagger)
- **健康检查**: `http://localhost:5555/api/health`

## 健康检查接口

### GET /api/health

返回后端服务健康状态

**请求示例**:

```bash
curl http://localhost:5555/api/health
```

**响应示例**:

```json
{
  "status": "ok",
  "message": "🎉 GC Code Portal Backend is running!",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0",
  "uptime": 3600.5
}
```

### GET /api/health/ping

简单的 ping 测试

**请求示例**:

```bash
curl http://localhost:5555/api/health/ping
```

**响应示例**:

```json
{
  "message": "pong",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## API 文档

后端启动后，访问 Swagger 文档：

```
http://localhost:5555/api/docs
```

## 环境变量说明

### backend/.env

```env
# 服务器配置
NODE_ENV=development          # 环境：development | production
PORT=5555                     # 后端端口
API_PREFIX=/api              # API 前缀

# 前端地址
FRONTEND_URL=http://localhost:3000

# JWT 配置 (后续阶段使用)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h

# 数据库配置 (后续阶段使用)
DATABASE_URL=postgresql://postgres:password@localhost:5432/gc_code_portal

# OAuth 配置 (后续阶段使用)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_REDIRECT_URI=http://localhost:5555/api/auth/azure/callback
```

## 开发工作流

### 日常开发

```bash
# 1. 启动开发服务器（前后端同时运行）
npm run dev:all

# 2. 访问前端
open http://localhost:3000

# 3. 访问 API 文档
open http://localhost:5555/api/docs

# 4. 测试健康检查
curl http://localhost:5555/api/health
```

### 后端开发

```bash
# 进入后端目录
cd backend

# 启动开发服务器（自动重启）
npm run start:dev

# 构建
npm run build

# 运行生产版本
npm run start:prod

# 代码格式化
npm run format

# 代码检查
npm run lint

# 数据库管理
npm run db:init    # 初始化数据库表
npm run db:reset   # 重置数据库（会删除所有数据！）
npm run db:shell   # 进入数据库命令行
```

## 技术栈

### 后端

- **框架**: NestJS 10
- **语言**: TypeScript 5
- **ORM**: Prisma 5 (第二阶段)
- **数据库**: PostgreSQL 15 (第二阶段)
- **认证**: Passport + JWT (第二阶段)
- **文档**: Swagger/OpenAPI
- **安全**: Helmet, CORS

### 前端

- **框架**: React 19
- **构建工具**: Vite 6
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **路由**: React Router v7
- **状态管理**: Zustand

## 数据库使用

### 初始化数据库

```bash
cd backend

# 首次运行：初始化数据库表和默认数据
npm run db:init

# 重置数据库（删除并重建所有表，会丢失所有数据！）
npm run db:reset

# 进入数据库命令行
npm run db:shell
```

### 默认账号

系统已创建一个默认管理员账号：

- **用户名**: `admin`
- **密码**: `admin123`
- **邮箱**: `admin@gccode.cn`
- **角色**: ADMIN

⚠️ **重要**：生产环境请立即修改默认密码！

### 数据库连接信息

- **Host**: localhost
- **Port**: 5432
- **User**: postgres
- **Password**: xA123456
- **Database**: gc_code_portal
- **Docker 容器**: pg-temp

详细的数据库设计和使用说明请查看：[backend/prisma/README.md](./backend/prisma/README.md)

## 下一步计划

### 第二阶段功能

1. **数据库集成** ✅
   - ✅ 配置数据库连接
   - ✅ 创建用户表和 OAuth 账号表
   - ✅ 数据库初始化脚本

2. **用户认证** (进行中)
   - JWT 认证
   - 用户名密码登录
   - Azure AD OAuth 登录
   - 多 OAuth 提供商支持

3. **用户管理**
   - 用户 CRUD
   - 角色权限
   - 个人资料管理

## 故障排查

### 后端无法启动

```bash
# 检查端口是否被占用
lsof -i :5555

# 清理并重新安装依赖
cd backend
rm -rf node_modules package-lock.json
npm install
```

### CORS 错误

确保 `backend/.env` 中的 `FRONTEND_URL` 配置正确：

```env
FRONTEND_URL=http://localhost:3000
```

### 依赖安装失败

```bash
# 使用 legacy-peer-deps
npm install --legacy-peer-deps

# 或清理 npm 缓存
npm cache clean --force
npm install
```

## 参考文档

- [后端技术栈选型](./docs/BACKEND_TECH_STACK.md)
- [Azure AD 集成指南](./docs/AZURE_AD_INTEGRATION.md)
- [数据库设计 V1](./docs/DATABASE_DESIGN_V1.md)
- [NestJS 官方文档](https://docs.nestjs.com/)
- [Prisma 官方文档](https://www.prisma.io/docs)

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交改动 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT
