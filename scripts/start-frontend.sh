#!/bin/bash

# 前端启动脚本 - 自动清理端口 3000

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 启动前端服务..."
echo "📁 项目目录: $PROJECT_ROOT"
echo ""

# 清理端口 3000
bash "$SCRIPT_DIR/kill-port.sh" 3000

# 启动前端
cd "$PROJECT_ROOT"
echo ""
echo "▶️  正在启动 Vite 开发服务器..."
pnpm run dev:frontend
