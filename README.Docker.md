# Docker 部署指南

本项目支持使用 Docker 和 Docker Compose 进行一键部署，将前后端应用和数据库打包在一起。

## 快速开始

### 前置要求

- Docker Engine 20.10+
- Docker Compose 2.0+

### 部署步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd gc-code1
```

2. **配置环境变量**

复制示例环境变量文件并填入实际值：

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少需要配置以下必需项：

```bash
# 数据库密码（必需）
DB_PASSWORD=your-secure-postgres-password

# JWT 配置（必需）
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# Azure AD 配置（必需）
AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret
AZURE_AD_REDIRECT_URI=http://localhost/api/auth/azure/callback

# 外部中继服务配置（必需）
RELAY_API_BASE_URL=https://console.gccode.cn
RELAY_API_USERNAME=your-relay-username
RELAY_API_PASSWORD=your-relay-password
```

3. **启动服务**

```bash
docker-compose up -d
```

首次启动会自动：

- 构建前后端应用镜像
- 拉取 PostgreSQL 镜像
- 创建数据库容器
- 运行数据库迁移
- 启动应用服务

4. **访问应用**

- 前端应用：http://localhost
- 后端 API：http://localhost/api
- 健康检查：http://localhost/health

## 架构说明

### 容器组成

- **web 容器**：运行前后端应用
  - Nginx：提供前端静态文件服务，反向代理 API 请求
  - Node.js 后端：处理业务逻辑和数据库操作
  - Supervisor：进程管理器，同时管理 Nginx 和 Node.js 进程

- **postgres 容器**：PostgreSQL 16 数据库
  - 数据持久化到 Docker volume
  - 健康检查确保服务就绪

### 端口映射

- `80:80` - Web 服务（Nginx）
- `5432:5432` - PostgreSQL 数据库（可选，用于调试）

### 数据持久化

数据库数据存储在 Docker volume `postgres_data` 中，即使容器删除数据也会保留。

## 常用命令

### 查看服务状态

```bash
docker-compose ps
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f web
docker-compose logs -f postgres
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart web
```

### 停止服务

```bash
docker-compose down
```

### 停止并删除所有数据

```bash
docker-compose down -v
```

### 重新构建镜像

```bash
docker-compose build --no-cache
docker-compose up -d
```

### 进入容器调试

```bash
# 进入 web 容器
docker-compose exec web sh

# 进入数据库容器
docker-compose exec postgres psql -U postgres -d gc_code_portal
```

## 数据库管理

### 运行数据库迁移

如果需要手动运行迁移：

```bash
docker-compose exec web sh -c "cd /app/backend && npx prisma migrate deploy"
```

### 查看数据库

```bash
docker-compose exec postgres psql -U postgres -d gc_code_portal
```

### 备份数据库

```bash
docker-compose exec postgres pg_dump -U postgres gc_code_portal > backup.sql
```

### 恢复数据库

```bash
docker-compose exec -T postgres psql -U postgres gc_code_portal < backup.sql
```

## 生产环境部署建议

### 安全配置

1. **修改默认密码**
   - 更改 `DB_PASSWORD` 为强密码
   - 更改 `JWT_SECRET` 为至少 32 字符的随机字符串

2. **限制数据库端口暴露**
   - 如果不需要外部访问数据库，删除 docker-compose.yml 中的 `ports: - "5432:5432"`

3. **使用 HTTPS**
   - 配置 SSL 证书
   - 更新 `AZURE_AD_REDIRECT_URI` 为 HTTPS 地址
   - 更新 nginx 配置支持 HTTPS

### 性能优化

1. **调整资源限制**

在 docker-compose.yml 中添加：

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

2. **配置日志轮转**

```yaml
services:
  web:
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'
```

### 监控

1. **健康检查**

服务已配置健康检查：

- Web: `http://localhost/health`
- PostgreSQL: `pg_isready`

2. **查看容器状态**

```bash
docker-compose ps
docker stats
```

## 故障排查

### 容器启动失败

1. 检查环境变量是否正确配置
2. 查看容器日志：`docker-compose logs web`
3. 检查端口是否被占用：`lsof -i :80`

### 数据库连接失败

1. 确认数据库容器已启动：`docker-compose ps postgres`
2. 检查数据库健康状态：`docker-compose exec postgres pg_isready -U postgres`
3. 验证 `DATABASE_URL` 环境变量配置

### Nginx 502 错误

1. 检查后端是否正常运行：`docker-compose exec web supervisorctl status`
2. 查看后端日志：`docker-compose exec web tail -f /var/log/supervisor/backend.err.log`
3. 重启后端进程：`docker-compose exec web supervisorctl restart backend`

### 前端页面无法访问

1. 检查 Nginx 是否运行：`docker-compose exec web supervisorctl status nginx`
2. 检查前端文件是否存在：`docker-compose exec web ls -la /app/frontend/dist`
3. 查看 Nginx 日志：`docker-compose exec web tail -f /var/log/nginx/error.log`

## 开发环境

如果需要在开发环境中使用 Docker：

```bash
# 使用 volume 挂载源代码（需要修改 docker-compose.yml）
docker-compose -f docker-compose.dev.yml up
```

开发环境建议直接使用本地开发：

```bash
# 仅启动数据库
docker-compose up -d postgres

# 本地运行前后端
cd backend && npm run start:dev
npm run dev
```

## 更新部署

当代码更新后：

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose build
docker-compose up -d

# 运行数据库迁移（如果有）
docker-compose exec web sh -c "cd /app/backend && npx prisma migrate deploy"
```

## 环境变量说明

详细的环境变量配置请参考 `.env.example` 文件，主要分为以下几类：

- **数据库配置**：数据库连接密码
- **JWT 配置**：身份认证密钥和过期时间
- **Azure AD 配置**：Microsoft Azure AD 单点登录配置
- **中继服务配置**：外部 Claude API 中继服务配置
- **Session 配置**：会话管理相关参数
- **测试配置**：渠道连接测试相关配置

## 技术栈

- **前端**：React 18 + TypeScript + Vite + TailwindCSS
- **后端**：NestJS + Prisma ORM + PostgreSQL
- **Web 服务器**：Nginx
- **进程管理**：Supervisor
- **容器化**：Docker + Docker Compose

## 许可证

[LICENSE](LICENSE)
