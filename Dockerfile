# ================================
# 多阶段构建 - 前端构建阶段
# ================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 workspace 配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

# 安装前端依赖
RUN pnpm install --frozen-lockfile --filter @gc-code/frontend

# 复制前端源代码
COPY apps/frontend/ ./apps/frontend/

# 构建前端应用
WORKDIR /app/apps/frontend
RUN pnpm run build

# ================================
# 多阶段构建 - 后端构建阶段
# ================================
FROM node:20-alpine AS backend-builder

# 安装 OpenSSL（Prisma 需要）
RUN apk add --no-cache openssl

WORKDIR /app

# 复制后端 package 文件
COPY apps/backend/package*.json ./

# 安装后端依赖（包括 devDependencies 用于构建）
# 设置 npm 超时和重试次数
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci

# 复制后端源代码和 Prisma schema
COPY apps/backend/ ./

# 生成 Prisma Client
RUN npx prisma generate

# 构建后端应用
RUN npm run build

# 清理开发依赖，只保留生产依赖
RUN npm ci --only=production && npm cache clean --force

# ================================
# 生产阶段 - 运行环境
# ================================
FROM node:20-alpine

# 安装 nginx、supervisor 和 OpenSSL（Prisma 运行时需要）
RUN apk add --no-cache nginx supervisor openssl

WORKDIR /app

# 从后端构建阶段复制必要文件
COPY --from=backend-builder /app/dist ./backend/dist
COPY --from=backend-builder /app/node_modules ./backend/node_modules
COPY --from=backend-builder /app/package*.json ./backend/
COPY --from=backend-builder /app/prisma ./backend/prisma

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/apps/frontend/dist ./frontend/dist

# 复制 nginx 配置
COPY nginx-fullstack.conf /etc/nginx/http.d/default.conf

# 复制 supervisor 配置
COPY supervisord.conf /etc/supervisord.conf

# 创建日志目录
RUN mkdir -p /var/log/supervisor /run/nginx

# 暴露端口
EXPOSE 80

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5555
ENV API_PREFIX=/api

# 使用 supervisor 启动 nginx 和后端服务
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
