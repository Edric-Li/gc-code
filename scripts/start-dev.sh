#!/bin/bash

# 开发环境启动脚本 - 同时启动前端和后端，自动清理端口

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 清除可能存在的系统环境变量，确保使用 .env 文件中的值
unset AZURE_AD_CLIENT_ID
unset AZURE_AD_TENANT_ID
unset AZURE_AD_CLIENT_SECRET
unset AZURE_AD_REDIRECT_URI

echo "🚀 启动开发环境（前端 + 后端）..."
echo "📁 项目目录: $PROJECT_ROOT"
echo ""

# 清理端口 3000 (前端)
bash "$SCRIPT_DIR/kill-port.sh" 3000

# 清理端口 5555 (后端)
bash "$SCRIPT_DIR/kill-port.sh" 5555

# 同时启动前端和后端
cd "$PROJECT_ROOT"
echo ""
echo "▶️  正在启动前端和后端服务..."
pnpm run dev:all
