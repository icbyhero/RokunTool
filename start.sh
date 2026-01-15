#!/bin/bash
# Rokun Tool 开发启动脚本

echo "🚀 启动 Rokun Tool 开发环境..."
echo ""

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 错误: 需要 Node.js >= 18.0.0"
    echo "   当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"
echo ""

# 进入app目录
cd "$(dirname "$0")/packages/app"

# 启动开发服务器
echo "📦 启动开发服务器..."
npm run dev
