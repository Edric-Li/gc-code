#!/bin/bash

# 后端启动脚本 - 自动清理端口 5555

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 启动后端服务..."
echo "📁 项目目录: $PROJECT_ROOT"
echo ""

# 清理端口 5555
bash "$SCRIPT_DIR/kill-port.sh" 5555

# 启动后端
cd "$PROJECT_ROOT"
echo ""
echo "▶️  正在启动 NestJS 后端服务器..."
pnpm run dev:backend
