# 修复开发环境插件路径 - 技术设计

## Context

### 问题背景

项目目录重组后,插件从 `rokun-tool/plugins/` 移动到根目录 `plugins/`。插件加载器使用相对路径查找插件目录:

```typescript
const pluginsDir = join(__dirname, '../../plugins')
```

这在生产环境工作正常,但在开发环境失败。

### 环境差异

**项目结构**:
```
RokunTool/                    # 项目根目录
├── plugins/                  # 插件目录 (移动后)
├── rokun-tool/               # 核心代码
│   ├── src/main/index.ts    # 主进程入口
│   └── out/
│       └── main/
│           └── index.js     # 编译后的主进程
└── ...
```

**路径解析**:
- `__dirname` 在运行时总是指向 `rokun-tool/out/main/`
- `join(__dirname, '../../plugins')` 解析为 `rokun-tool/plugins/`
- 但实际插件在项目根目录的 `plugins/`

### 约束条件

1. **不能破坏生产环境** - 生产环境必须继续正常工作
2. **最小改动** - 只修改必要的代码
3. **向后兼容** - 不影响现有功能
4. **跨平台** - 在 macOS/Linux/Windows 上都能工作

## Goals / Non-Goals

### Goals

- ✅ 修复开发环境插件加载问题
- ✅ 保持生产环境正常工作
- ✅ 添加调试日志方便问题排查
- ✅ 提供清晰的路径解析逻辑

### Non-Goals

- ❌ 重新设计插件系统架构
- ❌ 支持运行时动态修改插件路径
- ❌ 添加配置文件管理插件路径
- ❌ 修改插件加载器的核心逻辑

## Decisions

### 决策1: 使用环境检测

**选择**: 通过 `process.env.NODE_ENV` 检测开发环境,使用不同的相对路径

**理由**:
- 简单直接,易于理解
- Electron-Vite 已经设置了 `NODE_ENV`
- 不需要额外的配置或依赖
- 明确区分两种环境的行为

**实现**:
```typescript
const isDev = process.env.NODE_ENV === 'development'
const pluginsDir = isDev
  ? join(__dirname, '../../../plugins')  // 开发: out/main/ → ../../../ → plugins/
  : join(__dirname, '../../plugins')     // 生产: out/main/ → ../../ → plugins/
```

**路径验证**:
```
开发环境:
  rokun-tool/out/main/ + ../../../plugins/ = RokunTool/plugins/ ✅

生产环境:
  rokun-tool/out/main/ + ../../plugins/ = RokunTool/plugins/ ✅
```

### 决策2: 添加路径验证和日志

**选择**: 在启动时验证插件目录并输出详细日志

**理由**:
- 方便调试和问题排查
- 早期发现路径配置问题
- 不影响正常功能

**实现**:
```typescript
console.log('[Plugin System] Initializing...')
console.log(`[Plugin System] Environment: ${process.env.NODE_ENV}`)
console.log(`[Plugin System] __dirname: ${__dirname}`)
console.log(`[Plugin System] Plugins directory: ${pluginsDir}`)
console.log(`[Plugin System] Plugins exists: ${fs.existsSync(pluginsDir)}`)
```

### 决策3: 不使用环境变量配置

**选择**: 不引入 `PLUGINS_DIR` 环境变量

**理由**:
- 当前只需要修复默认路径
- 环境变量增加使用复杂度
- 如果有需求可以后续添加
- 遵循"简单优先"原则

**未来扩展**:
如果需要支持自定义路径,可以添加:
```typescript
const pluginsDir = process.env.PLUGINS_DIR ||
  (isDev ? join(__dirname, '../../../plugins')
          : join(__dirname, '../../plugins'))
```

## Risks / Trade-offs

### Risk 1: 路径计算错误

**风险**: 相对路径层级计算错误,导致两个环境都无法工作

**缓解措施**:
1. 添加路径验证和日志
2. 在两种环境下都进行测试
3. 添加文件存在性检查
4. 提供清晰的错误信息

### Risk 2: 环境检测失败

**风险**: `process.env.NODE_ENV` 未正确设置

**缓解措施**:
1. Electron-Vite 默认设置 `NODE_ENV`
2. 如果未设置,默认为开发环境
3. 添加兜底逻辑

### Risk 3: 不同操作系统的路径差异

**风险**: Windows/macOS/Linux 路径分隔符不同

**缓解措施**:
1. 使用 Node.js `path.join()` 处理路径
2. 不使用硬编码的路径分隔符
3. 在所有平台上测试

## Trade-offs

### 简单性 vs 灵活性

**选择**: 优先简单性

**权衡**:
- ✅ 简单: 只用环境检测,无需配置
- ❌ 不灵活: 无法自定义插件路径

**结论**: 当前简单性更重要,灵活性可以后续添加

### 硬编码 vs 配置化

**选择**: 硬编码路径计算逻辑

**权衡**:
- ✅ 硬编码: 简单直接,零配置
- ❌ 配置化: 灵活但复杂

**结论**: 当前硬编码足够,配置化过度设计

## Migration Plan

### 实施步骤

1. **修改路径计算**
   - 编辑 `src/main/index.ts`
   - 添加环境检测
   - 更新路径计算逻辑

2. **添加日志和验证**
   - 输出环境信息
   - 验证路径存在
   - 显示插件目录

3. **测试**
   - 开发环境测试 (`pnpm dev`)
   - 生产环境测试 (`pnpm build && pnpm start`)
   - 验证插件加载

4. **文档更新**
   - 更新开发文档
   - 添加路径配置说明

### 回滚计划

如果出现问题:
1. 恢复原始代码: `join(__dirname, '../../plugins')`
2. 提交问题报告
3. 分析根本原因
4. 重新设计方案

## Open Questions

### Q1: 是否需要支持多个插件目录?

**当前状态**: 只支持单个插件目录

**考虑**: 未来可能需要支持:
- 用户插件目录 (`~/.rokun-tool/plugins/`)
- 系统插件目录 (`/usr/local/lib/rokun-tool/plugins/`)

**决策**: 当前不需要,保持简单

### Q2: 是否需要插件目录扫描的失败保护?

**当前状态**: 如果插件目录不存在,返回空列表

**考虑**: 是否应该:
- 显示警告信息?
- 降级到默认位置?
- 抛出错误?

**决策**: 显示警告,但不阻塞启动

## Implementation Notes

### 关键点

1. **路径计算**
   - 开发: `../../../plugins` (向上3级)
   - 生产: `../../plugins` (向上2级)

2. **环境检测**
   - 使用 `process.env.NODE_ENV === 'development'`
   - Electron-Vite 自动设置此变量

3. **日志级别**
   - 开发环境: 详细日志
   - 生产环境: 简洁日志

### 测试场景

1. **开发环境启动**
   ```bash
   pnpm dev
   # 预期: 插件正确加载
   ```

2. **生产环境启动**
   ```bash
   pnpm build && pnpm start
   # 预期: 插件正确加载
   ```

3. **插件目录不存在**
   ```bash
   mv plugins plugins.bak
   pnpm dev
   # 预期: 显示警告,但不崩溃
   ```

## Performance Considerations

- **路径解析**: 一次性启动开销,可忽略
- **日志输出**: 只在启动时,不影响运行时性能
- **文件检查**: 单次 `fs.existsSync()`,性能影响极小

## Security Considerations

- ✅ 不引入新的安全风险
- ✅ 路径遍历攻击防护: 使用 `path.join()`
- ✅ 不接受用户输入的路径

## Testing Strategy

### 手动测试

1. 启动应用,检查控制台日志
2. 验证插件列表不为空
3. 测试插件启用/禁用
4. 检查插件功能

### 自动化测试

- 单元测试: 路径计算函数
- 集成测试: 插件加载器
- E2E 测试: 应用启动

---

**设计状态**: ✅ 完成
**最后更新**: 2026-01-12
**审核人**: 待定
