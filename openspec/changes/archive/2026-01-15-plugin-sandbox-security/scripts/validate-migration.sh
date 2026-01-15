#!/bin/bash
# 插件沙箱迁移验证脚本
# 用于验证所有插件是否符合沙箱要求

set -e

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║           插件沙箱迁移 - 验证脚本                                      ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 统计变量
TOTAL_VIOLATIONS=0
CHECKS_PASSED=0
CHECKS_FAILED=0

# 检查函数
check_violations() {
    local check_name=$1
    local pattern=$2
    local description=$3
    local exclude_pattern=$4  # Optional: pattern to exclude from results

    echo -n "检查 $check_name... "

    local result=$(grep -rn "$pattern" plugins/*/index.js 2>/dev/null | grep -v "node_modules" | grep -v "^\s*//")

    # Apply exclusion pattern if provided
    if [ -n "$exclude_pattern" ] && [ -n "$result" ]; then
        result=$(echo "$result" | grep -v "$exclude_pattern" || true)
    fi

    if [ -z "$result" ]; then
        echo -e "${GREEN}✓ 通过${NC} (无违规)"
        ((CHECKS_PASSED++))
        return 0
    else
        local count=$(echo "$result" | wc -l)
        echo -e "${RED}✗ 失败${NC} (发现 $count 处违规)"
        echo "$result" | head -5
        if [ $count -gt 5 ]; then
            echo "... 还有 $((count - 5)) 处"
        fi
        ((CHECKS_FAILED++))
        ((TOTAL_VIOLATIONS+=count))
        return 1
    fi
}

# 执行检查
echo "执行安全检查..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_violations "require() 调用" "\\brequire\\(" "直接 require() 调用,应使用插件 API"
echo ""

check_violations "process. 访问" "\\bprocess\\.[a-zA-Z]" "直接 process 访问,应使用 context.env 或 context.api.system" "api\\.process"
echo ""

check_violations "eval() 调用" "\\beval\\(" "eval() 调用,严重安全风险"
echo ""

check_violations "new Function()" "\\bnew Function\\(" "Function 构造器调用,严重安全风险"
echo ""

# JavaScript 语法检查
echo "检查 JavaScript 语法..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SYNTAX_ERRORS=0

for plugin in plugins/*/index.js; do
    echo -n "验证 $(basename $(dirname $plugin))... "
    if node -c "$plugin" 2>/dev/null; then
        echo -e "${GREEN}✓ 通过${NC}"
    else
        echo -e "${RED}✗ 失败${NC} (语法错误)"
        ((SYNTAX_ERRORS++))
    fi
done
echo ""

# 生成报告
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "检查结果汇总"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "通过检查: $CHECKS_PASSED/4"
echo "失败检查: $CHECKS_FAILED/4"
echo "违规总数: $TOTAL_VIOLATIONS"
echo "语法错误: $SYNTAX_ERRORS"
echo ""

# 判断总体结果
if [ $CHECKS_FAILED -eq 0 ] && [ $SYNTAX_ERRORS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ 所有检查通过!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "插件已准备好进入沙箱环境。"
    echo ""
    echo "下一步:"
    echo "  1. 运行性能基准测试: npm run benchmark"
    echo "  2. 开始 Phase 1 实施: 创建 PluginSandbox 类"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ 检查未通过,需要修复${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "请修复上述违规后再继续。"
    echo ""
    echo "参考文档:"
    echo "  - openspec/changes/plugin-sandbox-security/static-analysis-report.md"
    echo "  - openspec/changes/plugin-sandbox-security/migration-checklist.md"
    echo ""
    exit 1
fi
