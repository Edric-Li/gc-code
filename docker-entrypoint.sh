#!/bin/sh
set -e

# 数据库迁移（仅在首次部署时需要）
# 使用 --skip-seed 避免重复执行种子数据
echo "Running database migrations..."
cd /app/backend
npx prisma migrate deploy || echo "Migration failed or already applied"

# 启动 supervisor
exec /usr/bin/supervisord -c /etc/supervisord.conf
