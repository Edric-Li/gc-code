# GC Code Portal Docker 部署指南

这是一个最简化的 Docker Compose 部署配置，使用外置数据库。

## 文件说明

- `docker-compose.yml` - Docker Compose 配置文件
- `.env` - 环境变量配置文件

## 部署步骤

### 1. 修改环境变量

编辑 `.env` 文件，修改以下配置：

**必须修改的配置：**
```bash
# 数据库连接 - 改为你的实际数据库地址
DATABASE_URL=postgresql://postgres:password@your-db-host:5432/gc_code_portal

# 前端地址 - 改为你的实际域名
FRONTEND_URL=http://your-domain.com

# JWT 密钥 - 生产环境务必修改
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 加密密钥 - 生产环境务必修改
ENCRYPTION_KEY=your-encryption-key
```

**可选配置：**
- Azure AD OAuth
- Google OAuth
- GitHub OAuth
- Relay API 配置

### 2. 初始化数据库

确保你的外置数据库已经创建好，并运行数据库迁移：

```bash
# 在 backend 目录下运行
npx prisma migrate deploy
```

### 3. 启动服务

```bash
docker-compose up -d
```

### 4. 查看日志

```bash
docker-compose logs -f
```

### 5. 停止服务

```bash
docker-compose down
```

## 访问地址

- 前端页面: http://your-domain.com
- 后端 API: http://your-domain.com:5555/api

## 注意事项

1. **数据库连接**：确保 Docker 容器能够访问你的外置数据库
   - 如果数据库在宿主机上，使用 `host.docker.internal`（Mac/Windows）
   - 如果数据库在其他服务器，确保网络可达

2. **端口映射**：
   - 80 端口：Nginx（前端）
   - 5555 端口：后端 API

3. **安全建议**：
   - 生产环境务必修改 JWT_SECRET 和 ENCRYPTION_KEY
   - 不要在公共仓库中提交包含敏感信息的 .env 文件
   - 建议使用反向代理（如 Nginx）并配置 HTTPS

4. **镜像更新**：
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## 故障排查

### 数据库连接失败
- 检查 DATABASE_URL 是否正确
- 确认数据库服务是否运行
- 检查防火墙和网络配置

### 容器无法启动
```bash
# 查看详细日志
docker-compose logs gc-code-portal

# 检查容器状态
docker-compose ps
```

### 环境变量未生效
- 确认 .env 文件格式正确
- 重启容器：`docker-compose restart`
