# 插件沙箱开发模式支持

**日期**: 2025-01-15
**状态**: 📋 设计阶段
**优先级**: P0 (必需)

---

## 概述

开发模式允许开发者在开发插件时禁用沙箱,提供更好的调试体验和更快的迭代速度。

### 设计目标

1. ✅ **环境变量控制**: 通过 `DISABLE_SANDBOX` 环境变量控制
2. ✅ **调试友好错误**: 提供清晰的错误消息和堆栈跟踪
3. ✅ **性能日志**: 记录沙箱性能影响
4. ✅ **安全警告**: 在开发模式下明确显示安全警告

---

## 实现方案

### 1. 环境变量

```bash
# 禁用沙箱 (开发模式)
export DISABLE_SANDBOX=1

# 或在启动时
DISABLE_SANDBOX=1 npm run dev

# Windows PowerShell
$env:DISABLE_SANDBOX="1"
npm run dev

# Windows CMD
set DISABLE_SANDBOX=1
npm run dev
```

### 2. 实现代码

#### 2.1 在 `PluginLoader` 中添加开发模式检测

**文件**: `rokun-tool/src/main/plugins/loader.ts`

```typescript
export class PluginLoader {
  // ... 现有代码

  /**
   * 检查是否启用开发模式
   */
  private isDevelopmentMode(): boolean {
    return process.env.DISABLE_SANDBOX === '1' || process.env.DISABLE_SANDBOX === 'true'
  }

  /**
   * 获取沙箱配置
   */
  private getSandboxConfig() {
    const devMode = this.isDevelopmentMode()

    return {
      enabled: !devMode,
      timeout: devMode ? Infinity : 30000, // 开发模式无超时
      strict: !devMode, // 开发模式放宽限制
      verbose: devMode // 开发模式详细日志
    }
  }

  async loadInstance(
    metadata: PluginMetadata,
    pluginPath: string,
    options?: PluginLoadOptions
  ): Promise<PluginInstance> {
    const config = this.getSandboxConfig()

    if (!config.enabled) {
      console.warn('⚠️  沙箱已禁用 (开发模式)')
      console.warn('⚠️  插件可以直接访问 Node.js API,存在安全风险')
      console.warn(`⚠️  插件: ${metadata.id}`)
    }

    // ... 继续现有加载逻辑
  }
}
```

#### 2.2 在 `PluginSandbox` 中支持开发模式

**文件**: `rokun-tool/src/main/plugins/sandbox.ts` (Phase 1 创建)

```typescript
export class PluginSandbox {
  constructor(private config: {
    enabled: boolean
    timeout: number
    strict: boolean
    verbose: boolean
  }) {}

  createSandboxContext(
    metadata: PluginMetadata,
    dataDir: string,
    api: any
  ): any {
    // 如果沙箱禁用,返回完整上下文
    if (!this.config.enabled) {
      return {
        // 开发模式: 提供完整的 require, process, global
        require: require,
        process: process,
        global: global,
        module: { exports: {} },
        exports: {},
        __dirname: metadata.dataDir,
        __filename: metadata.dataDir + '/index.js',
        context: {
          metadata,
          dataDir,
          env: {
            HOME: process.env.HOME,
            USER: process.env.USER,
            PATH: process.env.PATH
          },
          logger: console,
          api
        }
      }
    }

    // 生产模式: 受限的沙箱上下文
    return {
      // 移除 require, process, global
      module: { exports: {} },
      exports: {},
      __dirname: metadata.dataDir,
      __filename: metadata.dataDir + '/index.js',
      context: {
        metadata,
        dataDir,
        env: {
          HOME: process.env.HOME,
          USER: process.env.USER,
          PATH: process.env.PATH
        },
        logger: console,
        api
      }
    }
  }

  runInSandbox(
    code: string,
    context: any,
    timeout: number = 30000
  ): any {
    // 如果沙箱禁用,直接执行
    if (!this.config.enabled) {
      if (this.config.verbose) {
        console.log('🔓 开发模式: 直接执行插件代码 (无沙箱)')
      }
      return this.runWithoutSandbox(code, context)
    }

    // 生产模式: 使用 VM 沙箱
    return this.runInVM(code, context, timeout)
  }

  private runWithoutSandbox(code: string, context: any): any {
    // 开发模式: 直接执行代码,提供完整的 Node.js 环境
    const fn = new Function('module', 'exports', 'require', 'process', 'global', '__dirname', '__filename', 'context', code)
    const module = { exports: {} }

    fn(
      module,
      module.exports,
      require,
      process,
      global,
      context.__dirname,
      context.__filename,
      context.context
    )

    return module.exports
  }

  private runInVM(code: string, context: any, timeout: number): any {
    // TODO: Phase 1 实现 - 使用 vm.runInNewContext
  }
}
```

#### 2.3 调试友好的错误消息

**文件**: `rokun-tool/src/main/plugins/validator.ts` (Phase 1 创建)

```typescript
export class PluginValidator {
  validatePluginCode(code: string, pluginId: string): ValidationResult {
    const devMode = process.env.DISABLE_SANDBOX === '1'

    if (devMode) {
      // 开发模式: 警告但不阻止
      console.warn(`⚠️  开发模式: 跳过 ${pluginId} 的代码验证`)

      return {
        valid: true,
        warnings: [
          '开发模式已启用,代码验证被跳过',
          '请确保在生产环境部署前运行完整验证'
        ]
      }
    }

    // 生产模式: 严格验证
    return this.strictValidation(code, pluginId)
  }

  private strictValidation(code: string, pluginId: string): ValidationResult {
    // ... 严格的验证逻辑
  }
}
```

---

## 开发文档更新

### 1. 更新插件开发指南

**文件**: `docs/development/standards/plugin-development.md`

添加新章节:

```markdown
## 开发模式

### 启用开发模式

在开发插件时,你可以临时禁用沙箱以获得更好的调试体验:

\`\`\`bash
# 禁用沙箱
export DISABLE_SANDBOX=1

# 启动应用
npm run dev
\`\`\`

### 开发模式的优势

1. **完整的调试工具**: 可以使用 `console.log`, `debugger` 等所有调试工具
2. **清晰的错误堆栈**: 错误堆栈不会被沙箱截断
3. **无超时限制**: 长时间操作不会被中断
4. **完整的 Node.js API**: 可以直接使用 require 访问任何模块

### 开发模式的限制

⚠️ **安全警告**: 开发模式下插件可以直接访问:
- 文件系统 (无需权限检查)
- 子进程 (无需权限检查)
- 网络 (无需权限检查)
- 系统信息 (无需限制)

### 生产部署

在生产环境部署前,必须:
1. 移除 `DISABLE_SANDBOX` 环境变量
2. 确保所有插件符合沙箱要求
3. 运行验证脚本: `bash openspec/changes/plugin-sandbox-security/scripts/validate-migration.sh`
4. 测试所有插件功能
```

---

## 测试计划

### 测试场景 1: 开发模式禁用沙箱

**目标**: 验证 `DISABLE_SANDBOX=1` 时沙箱被禁用

**步骤**:
1. 设置 `DISABLE_SANDBOX=1`
2. 启动应用
3. 检查控制台是否显示 "⚠️ 沙箱已禁用 (开发模式)"
4. 加载一个插件
5. 验证插件可以正常工作

**预期结果**:
- ✅ 控制台显示开发模式警告
- ✅ 插件正常加载和运行
- ✅ 插件可以使用完整的 Node.js API

### 测试场景 2: 生产模式启用沙箱

**目标**: 验证默认情况下沙箱是启用的

**步骤**:
1. 不设置 `DISABLE_SANDBOX` 环境变量
2. 启动应用
3. 检查控制台无开发模式警告
4. 加载一个插件
5. 验证插件受沙箱限制

**预期结果**:
- ✅ 控制台无开发模式警告
- ✅ 插件受沙箱限制
- ✅ 插件无法直接访问 Node.js API

### 测试场景 3: 开发模式下的调试体验

**目标**: 验证开发模式提供更好的调试体验

**步骤**:
1. 在插件中添加 `console.log` 和 `debugger`
2. 使用 `DISABLE_SANDBOX=1` 启动应用
3. 触发插件代码执行
4. 检查是否能看到完整的堆栈跟踪

**预期结果**:
- ✅ `console.log` 输出完整可见
- ✅ `debugger` 可以正常触发
- ✅ 错误堆栈包含完整文件路径和行号

---

## 性能影响

### 预期影响

| 模式 | 插件加载时间 | API 调用延迟 | 内存使用 |
|------|-------------|-------------|---------|
| 生产模式 (沙箱启用) | +5-10ms | +0-1ms | +1-2MB |
| 开发模式 (沙箱禁用) | +0ms | +0ms | +0MB |

### 基准数据

根据 [baseline-results.json](baseline-results.json):

```
插件加载时间:
  - rokun-rime-config: 1ms
  - rokun-wechat-multi-instance: 0ms
  - test-plugin: 0ms

API 调用延迟:
  - fs.readFile: 6ms
  - process.exec: 121ms
```

**结论**: 沙箱的性能影响应该在可接受范围内 (<10% 性能损失)。

---

## 安全注意事项

### 开发模式风险

⚠️ **开发模式仅供开发使用,不应在生产环境启用**

风险:
1. **绕过权限检查**: 插件可以访问任何系统资源
2. **无代码验证**: 危险代码不会在加载时被检测
3. **无超时保护**: 恶意代码可以无限循环
4. **完整 Node.js 访问**: 可以执行任意命令

### 保护措施

1. **启动时警告**: 应用启动时明确显示开发模式警告
2. **UI 指示器**: 在 UI 中显示"开发模式"徽章
3. **日志记录**: 记录所有开发模式活动
4. **自动禁用**: 生产构建时自动忽略 `DISABLE_SANDBOX`

```typescript
// 生产构建检查
if (process.env.NODE_ENV === 'production') {
  // 强制启用沙箱,忽略环境变量
  config.enabled = true
  console.warn('⚠️  生产环境: 沙箱已强制启用')
}
```

---

## 实现时间表

### Phase 0: 基础设施 (当前)

- [x] 性能基准测试
- [x] 开发模式设计文档
- [ ] 在 `PluginLoader` 中添加 `isDevelopmentMode()` 方法
- [ ] 添加开发模式日志

### Phase 1: 集成 (与沙箱实施同步)

- [ ] 在 `PluginSandbox` 中支持开发模式
- [ ] 在 `PluginValidator` 中支持开发模式
- [ ] 添加 UI 开发模式指示器
- [ ] 更新开发文档

### Phase 2: 测试和文档 (沙箱完成后)

- [ ] 测试所有开发模式场景
- [ ] 编写开发模式使用指南
- [ ] 添加示例和最佳实践

---

## 参考

- [Plugin Sandbox Proposal](proposal.md)
- [Plugin Sandbox Design](design.md)
- [Plugin Sandbox Tasks](tasks.md)
- [Baseline Results](baseline-results.json)

---

**文档版本**: 1.0
**作者**: Claude (AI Assistant)
**状态**: 📋 设计完成,待实现
