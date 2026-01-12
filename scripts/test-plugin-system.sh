#!/bin/bash
# 插件系统冒烟测试脚本
# 用于验证插件系统的核心功能

set -e

echo "🔥 插件系统冒烟测试"
echo "===================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数器
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# 项目目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR/rokun-tool"

# 测试函数
test_case() {
    local test_name=$1
    local test_command=$2

    ((TESTS_TOTAL++))
    echo -n "[$TESTS_TOTAL] 测试: $test_name ... "

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

# 详细测试函数（显示输出）
test_case_verbose() {
    local test_name=$1
    local test_command=$2

    ((TESTS_TOTAL++))
    echo -e "${BLUE}[$TESTS_TOTAL] 测试: $test_name${NC}"
    echo "执行: $test_command"

    if eval "$test_command"; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
    echo ""
}

echo "📋 第1部分: 项目结构检查"
echo "---------------------------"

# 检查项目结构
test_case "项目根目录存在" "[ -d '$PROJECT_DIR/rokun-tool' ]"
test_case "插件目录存在" "[ -d '$PROJECT_DIR/rokun-tool/plugins' ]"
test_case "测试插件存在" "[ -d '$PROJECT_DIR/rokun-tool/plugins/test-plugin' ]"
test_case "测试插件package.json存在" "[ -f '$PROJECT_DIR/rokun-tool/plugins/test-plugin/package.json' ]"
test_case "测试插件主文件存在" "[ -f '$PROJECT_DIR/rokun-tool/plugins/test-plugin/index.js' ]"

echo ""
echo "📋 第2部分: 插件元数据验证"
echo "---------------------------"

# 验证插件元数据
test_case "插件ID格式正确" "grep -q '\"id\": \"test-plugin\"' plugins/test-plugin/package.json"
test_case "插件名称存在" "grep -q '\"name\"' plugins/test-plugin/package.json"
test_case "插件版本存在" "grep -q '\"version\"' plugins/test-plugin/package.json"
test_case "插件权限声明存在" "grep -q '\"permissions\"' plugins/test-plugin/package.json"
test_case "插件主入口存在" "grep -q '\"main\"' plugins/test-plugin/package.json"

echo ""
echo "📋 第3部分: 插件权限检查"
echo "---------------------------"

# 检查权限声明
test_case "文件读取权限已声明" "grep -q 'fs:read' plugins/test-plugin/package.json"
test_case "文件写入权限已声明" "grep -q 'fs:write' plugins/test-plugin/package.json"
test_case "进程启动权限已声明" "grep -q 'process:spawn' plugins/test-plugin/package.json"
test_case "进程执行权限已声明" "grep -q 'process:exec' plugins/test-plugin/package.json"
test_case "配置读取权限已声明" "grep -q 'config:read' plugins/test-plugin/package.json"
test_case "配置写入权限已声明" "grep -q 'config:write' plugins/test-plugin/package.json"
test_case "通知权限已声明" "grep -q 'notification:show' plugins/test-plugin/package.json"

echo ""
echo "📋 第4部分: 插件代码检查"
echo "---------------------------"

# 检查插件代码
test_case "插件导出onLoad钩子" "grep -q 'onLoad' plugins/test-plugin/index.js"
test_case "插件导出onEnable钩子" "grep -q 'onEnable' plugins/test-plugin/index.js"
test_case "插件导出onDisable钩子" "grep -q 'onDisable' plugins/test-plugin/index.js"
test_case "插件导出onUnload钩子" "grep -q 'onUnload' plugins/test-plugin/index.js"
test_case "插件包含文件系统测试" "grep -q 'testFileSystemAPI' plugins/test-plugin/index.js"
test_case "插件包含进程管理测试" "grep -q 'testProcessAPI' plugins/test-plugin/index.js"
test_case "插件包含配置API测试" "grep -q 'testConfigAPI' plugins/test-plugin/index.js"
test_case "插件包含权限系统测试" "grep -q 'testPermissionSystem' plugins/test-plugin/index.js"

echo ""
echo "📋 第5部分: 核心系统文件检查"
echo "---------------------------"

# 检查核心系统文件
test_case "插件加载器存在" "[ -f 'src/main/plugins/loader.ts' ]"
test_case "插件注册表存在" "[ -f 'src/main/plugins/registry.ts' ]"
test_case "插件类型定义存在" "[ -f 'src/shared/types/plugin.ts' ]"
test_case "IPC处理器存在" "[ -f 'src/main/ipc/handlers.ts' ]"
test_case "文件系统服务存在" "[ -f 'src/main/services/fs.ts' ]"
test_case "进程管理服务存在" "[ -f 'src/main/services/process.ts' ]"
test_case "配置服务存在" "[ -f 'src/main/services/config.ts' ]"
test_case "日志服务存在" "[ -f 'src/main/services/logger.ts' ]"
test_case "权限服务存在" "[ -f 'src/main/permissions/permission-service.ts' ]"

echo ""
echo "📋 第6部分: TypeScript编译检查"
echo "---------------------------"

# 检查TypeScript编译
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    echo "检查TypeScript编译..."
    if pnpm run build > /tmp/plugin-test-build.log 2>&1; then
        echo -e "${GREEN}✅ TypeScript编译成功${NC}"
        ((TESTS_PASSED++))
        ((TESTS_TOTAL++))
    else
        echo -e "${RED}❌ TypeScript编译失败${NC}"
        echo "查看日志: cat /tmp/plugin-test-build.log"
        ((TESTS_FAILED++))
        ((TESTS_TOTAL++))
    fi
else
    echo -e "${YELLOW}⚠️  依赖未安装，跳过编译测试${NC}"
    echo "运行: cd rokun-tool && pnpm install"
fi

echo ""
echo "📋 第7部分: 运行时测试"
echo "---------------------------"

# 检查是否可以启动应用
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  运行时测试需要手动启动应用${NC}"
    echo "请运行: cd rokun-tool && pnpm dev"
    echo "然后检查控制台输出，确认测试插件加载成功"
    echo ""
    echo "预期输出:"
    echo "  - [test-plugin] 测试插件开始加载"
    echo "  - [test-plugin] 测试插件已加载"
    echo "  - [test-plugin] 测试插件已启用"
    echo "  - [test-plugin] 测试文件系统API..."
    echo "  - [test-plugin] 测试进程管理API..."
    echo "  - [test-plugin] 测试配置API..."
    echo "  - [test-plugin] 测试权限系统..."
    echo "  - [test-plugin] ========== 测试结果 =========="
else
    echo -e "${YELLOW}⚠️  依赖未安装，跳过运行时测试${NC}"
fi

echo ""
echo "===================="
echo "📊 测试结果汇总"
echo "===================="
echo -e "总计: ${BLUE}$TESTS_TOTAL${NC} 个测试"
echo -e "${GREEN}通过: $TESTS_PASSED${NC}"
echo -e "${RED}失败: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✨ 所有静态测试通过!${NC}"
    echo ""
    echo "下一步:"
    echo "  1. 运行应用: cd rokun-tool && pnpm dev"
    echo "  2. 检查控制台输出，确认测试插件运行成功"
    echo "  3. 验证所有API测试通过"
    exit 0
else
    echo -e "${RED}❌ 有测试失败，请检查${NC}"
    exit 1
fi
