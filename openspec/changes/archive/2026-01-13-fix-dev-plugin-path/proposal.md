# 修复开发环境插件加载路径

## 概述

修复在开发环境(`pnpm dev`)下插件无法加载的问题,确保开发和生产环境都能正确找到插件目录。

## Why

### 当前问题

在项目目录重组后,插件从 `rokun-tool/plugins/` 移动到了项目根目录的 `plugins/`。这导致:

1. **开发环境插件加载失败**
   - 运行 `pnpm dev` 时,插件列表为空
   - 控制台可能显示找不到插件目录

2. **路径解析问题**
   - `__dirname` 在开发环境指向 `out/main/`
   - 相对路径 `../../plugins` 无法正确解析到项目根目录的 `plugins/`

### 根本原因

```typescript
// src/main/index.ts:18
const pluginsDir = join(__dirname, '../../plugins')
```

**开发环境**:
- `__dirname` = `/path/to/RokunTool/rokun-tool/out/main`
- `join(__dirname, '../../plugins')` = `/path/to/RokunTool/rokun-tool/plugins` ❌
- 但实际插件在: `/path/to/RokunTool/plugins` ✅

**生产环境**(构建后):
- `__dirname` = `/path/to/RokunTool/rokun-tool/out/main`
- `join(__dirname, '../../plugins')` = `/path/to/RokunTool/plugins` ✅
- 插件确实在: `/path/to/RokunTool/plugins` ✅

## What Changes

### 核心修改

修改插件目录路径解析逻辑,使其在开发和生产环境都能正确工作:

```typescript
// 修改前
const pluginsDir = join(__dirname, '../../plugins')

// 修改后 - 方案1: 使用环境检测
const isDev = process.env.NODE_ENV === 'development'
const pluginsDir = isDev
  ? join(__dirname, '../../../plugins')  // 开发环境
  : join(__dirname, '../../plugins')     // 生产环境

// 修改后 - 方案2: 使用绝对路径
const pluginsDir = process.env.PLUGINS_DIR || join(__dirname, '../../plugins')

// 修改后 - 方案3: 使用动态查找
const { resolvePluginsDir } = require('./plugins/path-resolver')
const pluginsDir = resolvePluginsDir()
```

### 推荐方案

使用**方案1(环境检测)**,因为:
- ✅ 简单直接
- ✅ 不依赖额外配置
- ✅ 明确区分开发和生产环境
- ✅ 易于理解和维护

## Impact

### 影响范围

**修改文件**:
- `src/main/index.ts` - 修改插件目录路径计算逻辑

**影响功能**:
- 插件加载器
- 开发环境启动
- 插件列表显示

### 兼容性

- ✅ 向后兼容 - 生产环境行为不变
- ✅ 开发环境 - 修复插件加载问题
- ✅ 无破坏性变更

### 风险评估

- **低风险** - 只修改路径计算逻辑
- **影响可控** - 只影响插件目录解析
- **易回滚** - 出问题可快速回退

## Success Criteria

### 功能验收

- [ ] 运行 `pnpm dev` 后,插件列表正确显示
- [ ] 所有插件(wechat-multi-instance, rime-config)都能正常加载
- [ ] 插件可以启用和禁用
- [ ] 插件功能正常工作

### 技术验收

- [ ] 开发环境(`pnpm dev`)插件加载成功
- [ ] 生产环境(`pnpm build && pnpm start`)插件加载成功
- [ ] TypeScript 编译无错误
- [ ] 路径解析在两种环境下都正确

### 测试验收

- [ ] 手动测试: `pnpm dev` 启动应用
- [ ] 验证插件列表不为空
- [ ] 测试插件启用/禁用功能
- [ ] 检查控制台无路径相关错误

## Alternatives Considered

### 方案A: 使用环境变量

**优点**:
- 灵活性高
- 可配置不同路径

**缺点**:
- 需要额外配置
- 开发者需要知道配置环境变量
- 增加使用复杂度

**结论**: 不采用 - 过于复杂

### 方案B: 使用配置文件

**优点**:
- 可配置
- 易于修改

**缺点**:
- 需要维护配置文件
- 增加项目复杂度

**结论**: 不采用 - 当前不需要

### 方案C: 使用符号链接

**优点**:
- 无需修改代码

**缺点**:
- 需要在两个位置维护插件
- Git 可能混淆
- 不是真正的解决方案

**结论**: 不采用 - 治标不治本

## Open Questions

1. **是否需要支持自定义插件路径?**
   - 当前不需要,可以使用环境变量扩展
   - 如果有需求,可以后续添加

2. **是否需要添加插件目录扫描的日志?**
   - 可以添加,方便调试
   - 在开发环境输出详细信息

## Related Changes

- 依赖: `reorganize-project-structure` (已归档)
- 相关: 插件系统路径配置
