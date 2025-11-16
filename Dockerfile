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

# 安装前端依赖（跳过 postinstall 脚本，因为后端目录不存在）
RUN pnpm install --frozen-lockfile --filter @gc-code/frontend --ignore-scripts

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

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制 workspace 配置文件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# 安装后端依赖（包括 devDependencies 用于构建，跳过 postinstall）
RUN pnpm install --frozen-lockfile --filter @gc-code/backend --ignore-scripts

# 复制后端源代码和 Prisma schema
COPY apps/backend/ ./apps/backend/

# 生成 Prisma Client
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# 构建后端应用
RUN pnpm run build

# 清理开发依赖，只保留生产依赖
RUN CI=true pnpm prune --prod --ignore-scripts

# ================================
# 生产阶段 - 运行环境
# ================================
FROM node:20-alpine

# 安装 nginx、supervisor、OpenSSL 和编译工具（bcrypt 需要编译）
RUN apk add --no-cache nginx supervisor openssl python3 make g++

WORKDIR /app

# 从后端构建阶段复制必要文件
COPY --from=backend-builder /app/apps/backend/dist ./backend/dist
COPY --from=backend-builder /app/apps/backend/package.json ./backend/
COPY --from=backend-builder /app/apps/backend/prisma ./backend/prisma

# 安装生产依赖（使用 npm 而非 pnpm，避免 workspace 符号链接问题）
WORKDIR /app/backend
RUN npm install --omit=dev && \
    npx prisma generate && \
    apk del python3 make g++

WORKDIR /app

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
