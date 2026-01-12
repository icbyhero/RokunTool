# 设计文档: 完成插件核心功能和测试框架

## Context

### 背景

当前项目已完成44.95%(98/218任务),核心框架和基础UI已经就绪并通过冒烟测试。两个初始插件(微信分身、Rime配置)的基础功能已实现,但还存在关键功能缺失:

**已完成**:
- ✅ 核心框架(插件系统、IPC通信、权限管理、服务层)
- ✅ UI框架(组件库、状态管理、路由系统、深色模式)
- ✅ 微信分身插件核心功能(创建分身、实例管理)
- ✅ Rime插件基础功能(配方管理、配置读取)
- ✅ 代码质量修复(TypeScript编译、ESLint配置)
- ✅ 基础文档(用户指南、技术文档、配置模板)

**待完成**:
- ❌ Rime配置编辑器增强(语法高亮、验证、格式化、diff)
- ❌ Rime词库管理(列表、下载、更新、导入导出、编辑)
- ❌ 配置备份恢复(自动备份、手动备份、恢复、导入导出)
- ❌ 测试框架(单元测试、集成测试)
- ❌ 性能优化(启动、加载、UI、内存)
- ❌ 文档补充(截图、演示视频)
- ❌ 安全审计(权限、IPC、文件操作、依赖)

### 约束条件

- **性能要求**: 启动 < 3秒, 加载 < 1秒, UI响应 < 100ms, 内存 < 300MB
- **测试要求**: 核心模块单元测试覆盖率 > 60%
- **打包体积**: 当前约150-200MB, 需要控制增长
- **开发时间**: 预计4-6周完成所有功能
- **人力资源**: 1-2名开发者

### 利益相关者

- **最终用户**: 需要功能完整、性能优秀、安全可靠的应用
- **开发者**: 需要清晰的代码和充足的测试,便于维护
- **插件开发者**: 需要示例代码和开发文档

## Goals / Non-Goals

### 目标 ✅

1. **功能完整性**: 实现Rime插件的所有核心功能(配置编辑器、词库管理)
2. **质量保障**: 建立完整的测试体系,确保代码质量
3. **性能达标**: 满足所有性能指标要求
4. **安全可靠**: 通过安全审计,修复所有高危漏洞
5. **文档完善**: 提供完整的用户文档和示例

### 非目标 ❌

1. ~~插件市场功能~~ (后续版本考虑)
2. ~~云端同步功能~~ (后续版本考虑)
3. ~~插件评分评论~~ (后续版本考虑)
4. ~~移动端支持~~ (仅桌面平台)
5. ~~国际化(i18n)~~ (Phase 2考虑)

## Decisions

### 决策1: 使用Monaco Editor作为配置编辑器

**选择内容**: 使用Monaco Editor而非CodeMirror或其他轻量级编辑器

**理由**:
- ✅ VSCode同款编辑器,用户熟悉
- ✅ 强大的代码编辑功能(语法高亮、自动补全、验证)
- ✅ 优秀的YAML语言支持
- ✅ 成熟稳定,社区活跃
- ✅ TypeScript原生支持

**替代方案比较**:

| 编辑器 | 优势 | 劣势 | 评分 |
|--------|------|------|------|
| Monaco Editor | 功能强大,VSCode同款 | 体积大(~30MB) | ⭐⭐⭐⭐⭐ |
| CodeMirror 6 | 模块化,体积小 | YAML支持较弱,需要配置 | ⭐⭐⭐⭐ |
| Ace Editor | 轻量级 | 功能较少,维护不活跃 | ⭐⭐⭐ |
| 简单文本框 | 最轻量 | 无语法高亮,用户体验差 | ⭐ |

**缓解措施**(针对体积问题):
- 懒加载Monaco Editor,只在打开配置编辑器时加载
- 使用Web Worker加载编辑器,避免阻塞主线程
- 考虑使用CDN加载(如果用户允许)

### 决策2: 使用Vitest作为测试框架

**选择内容**: 使用Vitest而非Jest

**理由**:
- ✅ 与Vite深度集成,配置简单
- ✅ 更快的测试执行速度
- ✅ ESM原生支持
- ✅ 兼容Jest API,迁移成本低
- ✅ 内置代码覆盖率工具

**替代方案**:
- **Jest**: 成熟但配置复杂,与Vite集成不够友好
- **ava**: 简洁但学习成本高
- **mocha**: 需要额外配置断言库和mock

### 决策3: 使用Playwright for Electron进行E2E测试

**选择内容**: Playwright而非Spectron或WebDriverIO

**理由**:
- ✅ 微软开发,维护活跃
- ✅ 专为Electron提供支持
- ✅ 强大的自动等待和重试机制
- ✅ 优秀的调试工具
- ✅ 并行测试支持

**替代方案**:
- **Spectron**: 已停止维护 ❌
- **WebDriverIO**: 配置复杂,学习曲线陡峭

### 决策4: 性能优化策略

**优化优先级**:

1. **启动时间优化** (目标: < 3秒)
   - 延迟加载非关键模块
   - 优化主进程初始化顺序
   - 预编译模板和配置

2. **插件加载优化** (目标: < 1秒)
   - 并行加载独立插件
   - 延迟加载插件UI组件
   - 缓存插件元数据

3. **UI渲染优化** (目标: < 100ms)
   - React.memo优化组件重渲染
   - useMemo/useCallback优化计算和函数
   - 虚拟滚动(长列表)
   - 防抖/节流用户输入

4. **内存优化** (目标: < 300MB)
   - 清理事件监听器和定时器
   - 优化图片和资源加载
   - 实现组件卸载清理
   - 监控内存泄漏

### 决策5: 安全加固措施

**安全策略**:

1. **权限系统**
   - 严格的权限声明和验证
   - 用户明确授权才允许操作
   - 权限可撤销
   - 记录权限使用日志

2. **IPC通信**
   - 验证消息来源
   - 验证消息参数
   - 敏感操作需要二次确认
   - 错误信息不泄露敏感数据

3. **文件操作**
   - 路径遍历攻击防护
   - 符号链接检查
   - 文件权限验证
   - 敏感操作(删除)需确认

4. **Electron安全**
   - 禁用渲染进程Node.js集成
   - 启用上下文隔离
   - 启用webSecurity
   - 配置CSP策略

## Technical Considerations

### 技术栈新增依赖

**配置编辑器相关**:
```json
{
  "@monaco-editor/react": "^4.6.0",
  "monaco-editor": "^0.45.0",
  "js-yaml": "^4.1.0",
  "diff2html": "^3.4.48"
}
```

**测试相关**:
```json
{
  "vitest": "^1.0.4",
  "@vitest/ui": "^1.0.4",
  "@testing-library/react": "^14.1.2",
  "@testing-library/jest-dom": "^6.1.5",
  "@testing-library/user-event": "^14.5.1",
  "playwright": "^1.40.1",
  "@playwright/test": "^1.40.1"
}
```

**性能监控**:
```json
{
  "rollup-plugin-visualizer": "^5.11.0",
  "vite-plugin-inspect": "^0.7.42"
}
```

### 架构调整

**新增目录结构**:
```
rokun-tool/
├── plugins/
│   └── rime-config/
│       └── src/
│           ├── components/
│           │   ├── ConfigurationEditor.tsx    # Monaco编辑器
│           │   ├── DictionaryList.tsx         # 词库列表
│           │   ├── DictionaryEditor.tsx       # 词库编辑器
│           │   └── BackupManager.tsx          # 备份管理器
│           ├── services/
│           │   ├── dictionaryService.ts       # 词库服务
│           │   ├── backupService.ts           # 备份服务
│           │   └── validationService.ts       # YAML验证
│           └── utils/
│               ├── yamlFormatter.ts           # YAML格式化
│               └── diffGenerator.ts           # Diff生成
│
├── tests/                                     # 新增测试目录
│   ├── unit/                                  # 单元测试
│   │   ├── plugins/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/                           # 集成测试
│   └── e2e/                                   # E2E测试
│       ├── playwright.config.ts
│       └── specs/
│
└── vitest.config.ts                           # Vitest配置
```

### Monaco Editor集成方案

**加载策略**:
```typescript
// 懒加载Monaco Editor
const MonacoEditor = lazy(() => import('@monaco-editor/react'))

// 在配置编辑器组件中使用
<Suspense fallback={<LoadingSpinner />}>
  <MonacoEditor
    height="600px"
    language="yaml"
    theme="vs-dark"
    value={content}
    onChange={handleChange}
    options={{
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
    }}
  />
</Suspense>
```

**YAML语言支持**:
```typescript
import * as monaco from 'monaco-editor'

// 配置YAML语言
monaco.languages.registerCompletionItemProvider('yaml', {
  provideCompletionItems: () => {
    return {
      suggestions: getYamlCompletionItems()
    }
  }
})

// 配置语法验证
monaco.languages.registerDocumentFormattingEditProvider('yaml', {
  provideDocumentFormattingEdits: (model) => {
    const formatted = formatYaml(model.getValue())
    return [
      {
        range: model.getFullModelRange(),
        text: formatted
      }
    ]
  }
})
```

### 测试策略

**单元测试结构**:
```typescript
// 示例:插件加载器测试
describe('PluginLoader', () => {
  it('should load plugin successfully', async () => {
    const loader = new PluginLoader()
    const plugin = await loader.load('test-plugin')
    expect(plugin.id).toBe('test-plugin')
    expect(plugin.version).toBeDefined()
  })

  it('should handle missing plugin gracefully', async () => {
    const loader = new PluginLoader()
    await expect(loader.load('non-existent')).rejects.toThrow()
  })
})
```

**集成测试结构**:
```typescript
// 示例:E2E测试
test('plugin installation flow', async ({ page }) => {
  await page.goto('app://./index.html#/plugins')
  await page.click('[data-testid="install-plugin-button"]')
  await page.fill('[data-testid="plugin-path"]', '/path/to/plugin')
  await page.click('[data-testid="confirm-install"]')
  await expect(page.locator('[data-testid="plugin-list"]')).toContainText('Test Plugin')
})
```

**性能测试**:
```typescript
// 示例:性能基准测试
import { bench, describe } from 'vitest'

describe('Plugin Loading Performance', () => {
  bench('load single plugin', async () => {
    const loader = new PluginLoader()
    await loader.load('test-plugin')
  })

  bench('load 10 plugins concurrently', async () => {
    const loader = new PluginLoader()
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        loader.load(`plugin-${i}`)
      )
    )
  })
})
```

## Risks / Trade-offs

### 风险1: Monaco Editor体积过大

**风险描述**: Monaco Editor约30MB,会让打包体积显著增大

**影响**: 用户下载时间增加,占用磁盘空间增加

**缓解措施**:
- ✅ 懒加载:只在需要时加载编辑器
- ✅ CDN加载:考虑从CDN加载Monaco(需用户同意)
- ✅ 代码分割:将编辑器单独打包
- ⚠️ 备选方案:如果体积问题严重,切换到CodeMirror 6

**权衡**:
- Monaco: 用户体验好,但体积大
- CodeMirror: 体积小,但功能较弱
- **决策**: 优先用户体验,选择Monaco + 懒加载

### 风险2: 测试编写时间过长

**风险描述**: 编写完整测试套件需要大量时间

**影响**: 延迟功能发布时间

**缓解措施**:
- ✅ 优先覆盖核心功能(插件加载器、权限系统、IPC)
- ✅ 逐步扩展,先达到60%覆盖率
- ✅ 使用测试模板和工具函数提高效率
- ✅ 边开发边测试,而不是全部开发完再写测试

**权衡**:
- 完整测试:质量高,但耗时
- 最小测试:快速,但质量低
- **决策**: 平衡策略,核心模块完整测试,UI组件基础测试

### 风险3: 性能优化可能需要重构

**风险描述**: 性能优化可能需要重构现有代码

**影响**: 引入新的bug,延长开发时间

**缓解措施**:
- ✅ 在优化前做好性能基准测试
- ✅ 逐步优化,每次优化后测试
- ✅ 保持代码审查
- ✅ 准备回滚计划

**权衡**:
- 激进优化:性能提升大,但风险高
- 保守优化:安全,但效果有限
- **决策**: 渐进式优化,先优化低风险高收益项

### 风险4: 安全漏洞修复可能影响功能

**风险描述**: 修复安全漏洞可能需要修改现有功能

**影响**: 功能变化可能影响用户体验

**缓解措施**:
- ✅ 充分测试修复后的功能
- ✅ 在发布说明中说明变更
- ✅ 提供迁移指南(如果需要)
- ✅ 保留兼容性(如果可能)

## Migration Plan

### 阶段1: Rime配置编辑器 (Week 1-2)

**步骤**:
1. 安装Monaco Editor和相关依赖
2. 创建ConfigurationEditor组件
3. 实现YAML语法高亮和验证
4. 实现自动补全和格式化
5. 实现diff对比功能
6. 测试和调试

**验收标准**:
- ✅ 配置编辑器可以正常加载和显示
- ✅ YAML语法错误实时检测
- ✅ 自动补全和格式化功能正常
- ✅ Diff对比功能正常

### 阶段2: 词库管理功能 (Week 2-3)

**步骤**:
1. 实现字典文件扫描和列表
2. 实现词库导入/导出
3. 实现词库编辑器
4. 实现词库合并功能
5. 测试和调试

**验收标准**:
- ✅ 字典列表正确显示
- ✅ 导入/导出功能正常
- ✅ 词库编辑器可用
- ✅ 词库合并功能正常

### 阶段3: 备份恢复功能 (Week 3)

**步骤**:
1. 实现自动备份逻辑
2. 实现手动备份UI
3. 实现备份管理界面
4. 实现恢复功能
5. 测试和调试

**验收标准**:
- ✅ 自动备份正常触发
- ✅ 手动备份功能正常
- ✅ 备份列表正确显示
- ✅ 恢复功能正常

### 阶段4: 测试框架 (Week 3-4)

**步骤**:
1. 安装Vitest和相关依赖
2. 配置测试环境
3. 编写核心模块单元测试
4. 编写E2E测试
5. 配置CI/CD测试流程

**验收标准**:
- ✅ 测试框架配置完成
- ✅ 核心模块单元测试覆盖率 > 60%
- ✅ E2E测试覆盖主要流程
- ✅ 所有测试通过

### 阶段5: 性能优化 (Week 4-5)

**步骤**:
1. 建立性能基准
2. 分析性能瓶颈
3. 实施优化措施
4. 验证优化效果
5. 回归测试

**验收标准**:
- ✅ 启动时间 < 3秒
- ✅ 插件加载 < 1秒
- ✅ UI响应 < 100ms
- ✅ 内存占用 < 300MB

### 阶段6: 文档补充 (Week 5-6)

**步骤**:
1. 截取插件界面截图
2. 整理截图并添加说明
3. 更新文档
4. (可选)制作演示视频

**验收标准**:
- ✅ 所有主要功能有截图
- ✅ 截图清晰,说明完整
- ✅ 文档更新完成

### 阶段7: 安全审计 (Week 6)

**步骤**:
1. 运行npm audit
2. 审查权限系统
3. 审查IPC通信
4. 审查文件操作
5. 修复漏洞
6. 安全加固

**验收标准**:
- ✅ 无高危漏洞
- ✅ 安全审查完成
- ✅ 安全文档完善

**回滚计划**:
- 每个阶段完成后创建Git标签
- 如果某阶段出现问题,回退到上一个标签
- 保留功能开关,可以快速禁用问题功能

## Open Questions

1. **Monaco Editor的体积问题**?
   - ❓ 是否需要提供精简版编辑器?
   - ❓ 用户是否接受增加30MB体积?
   - → **决策**: 先使用Monaco + 懒加载,如果用户反馈不好,考虑切换到CodeMirror

2. **测试覆盖率目标**?
   - ❓ 60%覆盖率是否足够?
   - ❓ UI组件是否需要测试?
   - → **决策**: 核心模块 > 60%, UI组件基础测试即可

3. **性能优化优先级**?
   - ❓ 启动时间和内存占用哪个更重要?
   - → **决策**: 启动时间优先,因为用户感知更强

4. **文档截图风格**?
   - ❓ 使用深色还是浅色主题?
   - ❓ 是否需要多平台截图?
   - → **决策**: 使用深色主题(现代感),先只提供macOS截图

5. **演示视频必要性**?
   - ❓ 是否必须制作演示视频?
   - → **决策**: 可选,优先完成其他功能

## Success Metrics

### 功能完整性
- ✅ Rime配置编辑器: 100%功能实现
- ✅ Rime词库管理: 100%功能实现
- ✅ 配置备份恢复: 100%功能实现

### 质量指标
- ✅ 单元测试覆盖率: > 60% (核心模块)
- ✅ 集成测试: 覆盖主要用户流程
- ✅ E2E测试: 覆盖关键路径
- ✅ 所有测试通过率: 100%

### 性能指标
- ✅ 应用启动时间: < 3秒
- ✅ 插件加载时间: < 1秒
- ✅ UI响应时间: < 100ms
- ✅ 内存占用(空载): < 300MB
- ✅ 打包体积增长: < 50MB

### 安全指标
- ✅ 高危漏洞: 0个
- ✅ 中危漏洞: < 3个
- ✅ 安全审查: 100%完成

### 文档指标
- ✅ 用户文档: 100%完整
- ✅ API文档: 100%完整
- ✅ 截图覆盖: 主要功能100%
