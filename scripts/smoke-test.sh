#!/bin/bash
# 冒烟测试脚本 - 验证Electron基础功能

set -e  # 遇到错误立即退出

echo "🔥 开始冒烟测试..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
TESTS_PASSED=0
TESTS_FAILED=0

# 测试函数
test_case() {
    local test_name=$1
    local test_command=$2

    echo -n "测试: $test_name ... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. 环境检查
echo "📋 第1部分: 环境检查"
echo "-------------------"
test_case "Node.js存在" "command -v node"
test_case "Node.js版本 >= 18" "node -e 'process.exit(process.version.slice(1).split(\".\")[0] >= 18 ? 0 : 1)'"
test_case "pnpm存在" "command -v pnpm"
test_case "Git存在" "command -v git"
echo ""

# 2. Electron基础功能测试 (需要在实际项目环境中运行)
echo "📋 第2部分: Electron功能测试"
echo "---------------------------"
echo "⚠️  以下测试需要在Electron项目环境中运行"
echo ""

# 检查是否在Electron项目中
if [ -f "package.json" ] && grep -q "electron" package.json; then
    echo "✅ 检测到Electron项目"

    # 测试项目结构
    test_case "存在electron-vite配置" "[ -f electron.vite.config.ts ] || [ -f electron.vite.config.js ]"
    test_case "存在主进程目录" "[ -d src/main ]"
    test_case "存在渲染进程目录" "[ -d src/renderer ]"

    # 如果项目已安装依赖
    if [ -d "node_modules/electron" ]; then
        test_case "Electron已安装" "[ -d node_modules/electron ]"

        # 尝试运行构建
        if [ -f "package.json" ]; then
            echo ""
            echo "测试: 项目构建 ..."
            if pnpm build > /tmp/smoke-test-build.log 2>&1; then
                echo -e "${GREEN}✅ 构建成功${NC}"
                ((TESTS_PASSED++))
            else
                echo -e "${RED}❌ 构建失败${NC}"
                echo "查看日志: cat /tmp/smoke-test-build.log"
                ((TESTS_FAILED++))
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  依赖未安装,跳过功能测试${NC}"
        echo "运行: pnpm install"
    fi
else
    echo -e "${YELLOW}⚠️  未在Electron项目中,跳过项目特定测试${NC}"
fi

echo ""
echo "===================="
echo "📊 测试结果汇总"
echo "===================="
echo -e "${GREEN}通过: $TESTS_PASSED${NC}"
echo -e "${RED}失败: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✨ 所有测试通过!${NC}"
    exit 0
else
    echo -e "${RED}❌ 有测试失败,请检查${NC}"
    exit 1
fi
