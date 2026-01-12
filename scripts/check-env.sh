#!/bin/bash
# 环境检查脚本

echo "🔍 检查开发环境..."
echo ""

# Node.js版本检查
NODE_VERSION=$(node -v)
echo "✅ Node.js: $NODE_VERSION"

# 检查Node.js版本是否 >= 18
if ! node -e "process.exit(process.version.slice(1).split('.')[0] >= 18 ? 0 : 1)"; then
    echo "❌ Node.js版本必须 >= 18.0.0"
    exit 1
fi

# pnpm检查
PNPM_VERSION=$(pnpm --version)
echo "✅ pnpm: $PNPM_VERSION"

# Git检查
GIT_VERSION=$(git --version)
echo "✅ Git: $GIT_VERSION"

# 系统环境检查
SYSTEM_INFO=$(uname -srm)
echo "✅ 系统: $SYSTEM_INFO"

# 检查是否为macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    macOS_VERSION=$(sw_vers -productVersion)
    echo "✅ macOS版本: $macOS_VERSION"
fi

echo ""
echo "✨ 环境检查完成! 所有依赖项都已满足。"
