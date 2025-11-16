#!/bin/bash

# 端口清理脚本
# 用法: ./kill-port.sh PORT [PROJECT_NAME]

PORT=$1
PROJECT_NAME=${2:-"gc-code"}

if [ -z "$PORT" ]; then
  echo "❌ 错误: 请提供端口号"
  echo "用法: $0 PORT [PROJECT_NAME]"
  exit 1
fi

# 检查端口是否被占用
PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PID" ]; then
  echo "✅ 端口 $PORT 未被占用"
  exit 0
fi

# 获取进程信息
PROCESS_INFO=$(ps -p $PID -o command= 2>/dev/null)

if [ -z "$PROCESS_INFO" ]; then
  echo "⚠️  端口 $PORT 被占用，但无法获取进程信息"
  exit 1
fi

echo "🔍 端口 $PORT 被进程占用:"
echo "   PID: $PID"
echo "   进程: $PROCESS_INFO"

# 检查是否是项目相关的进程
if echo "$PROCESS_INFO" | grep -qi "$PROJECT_NAME\|vite\|nest\|node"; then
  echo "🔄 检测到项目相关进程，正在清理..."
  kill -9 $PID 2>/dev/null

  # 等待进程被杀死
  sleep 1

  # 再次检查
  if lsof -ti:$PORT >/dev/null 2>&1; then
    echo "❌ 清理失败，端口仍被占用"
    exit 1
  else
    echo "✅ 端口 $PORT 已清理"
    exit 0
  fi
else
  echo "⚠️  端口被其他程序占用，不是项目进程，跳过清理"
  echo "   如需强制清理，请手动执行: kill -9 $PID"
  exit 1
fi
