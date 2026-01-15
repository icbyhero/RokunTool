# 插件沙箱安全加固 - 技术设计

## 架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      主进程 (Main Process)                    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PluginLoader                               │ │
│  │                                                           │ │
│  │  loadInstance(pluginPath)                               │ │
│  │    ↓                                                     │ │
│  │  1. PluginValidator.validateCode()                      │ │
│  │     - 检查危险模式                                        │ │
│  │     - 违规时抛出错误                                      │ │
│  │    ↓                                                     │ │
│  │  2. PluginSandbox.createContext()                       │ │
│  │     - 创建隔离上下文                                      │ │
│  │     - 注入插件 API                                       │ │
│  │    ↓                                                     │ │
│  │  3. PluginSandbox.run(code, context)                    │ │
│  │     - vm.runInNewContext()                               │ │
│  │     - 返回 exports                                      │ │
│  │    ↓                                                     │ │
│  │  4. PluginMonitor.start()                               │ │
│  │     - 开始运行时监控                                      │ │
│  │    ↓                                                     │ │
│  │  5. 返回 PluginInstance                                 │ │
│  │                                                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PluginSandbox                              │ │
│  │                                                           │ │
│  │  createContext(pluginContext)                           │ │
│  │    → {                                                  │ │
│  │        context: pluginContext,  // ✅ 允许              │ │
│  │        exports: {},            // ✅ 允许              │ │
│  │        module: { exports: {} }, // ✅ 允许              │ │
│  │        __dirname, __filename,   // ✅ 允许              │ │
│  │        console,                 // ✅ 允许              │ │
│  │                                                           │ │
│  │        // ❌ 以下对象不可用:                             │ │
│  │        // require, process, global, Buffer, etc.       │ │
│  │      }                                                  │ │
│  │                                                           │ │
│  │  run(code, context, options)                            │ │
│  │    → vm.runInNewContext(code, context, {               │ │
│  │        timeout: 30000,  // 防止无限循环                  │ │
│  │        displayErrors: true                              │ │
│  │      })                                                 │ │
│  │                                                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PluginValidator                            │ │
│  │                                                           │ │
│  │  validateCode(code)                                     │ │
│  │    → 检查以下模式:                                        │ │
│  │      - require\s*\(                                    │ │
│  │      - process\.                                        │ │
│  │      - child_process                                    │ │
│  │      - eval\s*\(                                        │ │
│  │      - new Function\s*\(                                │ │
│  │      - import\s*\(                                      │ │
│  │    → 发现时抛出 ValidationError                          │ │
│  │                                                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PluginMonitor                              │ │
│  │                                                           │ │
│  │  monitorAPICall(pluginId, api, method, args)            │ │
│  │    → 记录到审计日志                                       │ │
│  │    → 检测异常模式                                         │ │
│  │    → 可选: 触发告警                                       │ │
│  │                                                           │ │
│  │  detectAnomaly(pluginId)                                │ │
│  │    → 分析行为模式                                         │ │
│  │    → 检测异常行为                                         │ │
│  │    → 生成风险评分                                         │ │
│  │                                                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              AuditLogger                                │ │
│  │                                                           │ │
│  │  logEvent(event)                                        │ │
│  │    → {                                                  │ │
│  │        timestamp,                                        │ │
│  │        pluginId,                                         │ │
│  │        action,                                           │ │
│  │        params: sanitized,                               │ │
│  │        result                                            │ │
│  │      }                                                  │ │
│  │    → 写入文件/数据库                                       │ │
│  │                                                           │ │
│  │  queryEvents(filter)                                    │ │
│  │    → 返回匹配的事件                                       │ │
│  │                                                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## 核心组件设计

### 1. PluginSandbox (沙箱执行器)

**文件**: `src/main/plugins/sandbox.ts`

```typescript
import { Script, Context } from 'vm'
import { readFileSync } from 'fs'

export interface SandboxContext {
  context: PluginContext  // 插件 API
  exports: any           // 导出对象
  module: any           // 模块对象
  __dirname: string     // 目录路径
  __filename: string    // 文件路径
  console: Console      // 控制台
}

export interface SandboxOptions {
  timeout?: number      // 执行超时 (默认 30000ms)
  filename?: string     // 文件名 (用于错误堆栈)
}

export class PluginSandbox {
  /**
   * 创建安全的沙箱上下文
   */
  createContext(pluginContext: PluginContext, filePath: string): Context {
    const context: Context = {
      // ✅ 允许的对象
      context: pluginContext,
      exports: {},
      module: { exports: {} },
      __dirname: require('path').dirname(filePath),
      __filename: filePath,
      console: console,

      // ✅ 基本的 JavaScript 对象
      Object,
      Array,
      String,
      Number,
      Boolean,
      Date,
      Math,
      JSON,
      RegExp,
      Error,
      TypeError,
      SyntaxError,
      ReferenceError,

      // ❌ 以下对象故意不提供:
      // - require (禁止加载模块)
      // - process (禁止访问进程)
      // - global (禁止访问全局)
      // - Buffer (安全考虑)
      // - eval (将被代理拦截)
      // - Function (将被代理拦截)
    }

    return context
  }

  /**
   * 在沙箱中执行代码
   */
  run(code: string, context: Context, options: SandboxOptions = {}): any {
    const {
      timeout = 30000,
      filename = 'plugin.js'
    } = options

    try {
      // 创建 VM 脚本
      const script = new Script(code, {
        filename: filename,
        displayErrors: true
      })

      // 在隔离上下文中执行
      script.runInNewContext(context, {
        timeout: timeout,
        displayErrors: true
      })

      // 返回导出对象
      return context.module.exports
    } catch (error) {
      // 区分沙箱错误和插件错误
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error(`Plugin execution timeout (${timeout}ms)`)
        }
        throw error
      }
      throw new Error('Plugin execution failed')
    }
  }

  /**
   * 加载并执行插件文件
   */
  load(filePath: string, pluginContext: PluginContext): any {
    const code = readFileSync(filePath, 'utf-8')

    const context = this.createContext(pluginContext, filePath)

    return this.run(code, context, {
      filename: filePath
    })
  }
}
```

### 2. PluginValidator (代码验证器)

**文件**: `src/main/plugins/validator.ts`

```typescript
import { readFileSync } from 'fs'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
  suggestion?: string
}

export class PluginValidator {
  // 危险模式列表
  private dangerousPatterns = [
    {
      pattern: /require\s*\(/,
      message: 'Direct require() call is not allowed',
      suggestion: 'Use context.api instead',
      severity: 'error'
    },
    {
      pattern: /process\./,
      message: 'Direct process object access is not allowed',
      suggestion: 'Use context.api.config for configuration',
      severity: 'error'
    },
    {
      pattern: /child_process|'child_process'|"child_process"/,
      message: 'child_process module is not allowed',
      suggestion: 'Use context.api.process instead',
      severity: 'error'
    },
    {
      pattern: /eval\s*\(/,
      message: 'eval() is not allowed for security reasons',
      suggestion: 'Avoid dynamic code execution',
      severity: 'error'
    },
    {
      pattern: /new\s+Function\s*\(/,
      message: 'Function constructor is not allowed',
      suggestion: 'Use regular functions instead',
      severity: 'error'
    },
    {
      pattern: /import\s*\(/,
      message: 'Dynamic import() is not allowed',
      suggestion: 'Use static imports or context.api',
      severity: 'error'
    }
  ]

  /**
   * 验证插件代码
   */
  validateCode(code: string, filePath: string): ValidationResult {
    const errors: ValidationError[] = []
    const lines = code.split('\n')

    // 检查每一行
    lines.forEach((line, index) => {
      const lineNumber = index + 1

      this.dangerousPatterns.forEach(({ pattern, message, suggestion, severity }) => {
        if (pattern.test(line)) {
          // 找到匹配位置
          const match = line.match(pattern)
          if (match) {
            const column = line.indexOf(match[0]) + 1

            errors.push({
              line: lineNumber,
              column: column,
              message,
              suggestion,
              severity: severity as 'error' | 'warning'
            })
          }
        }
      })
    })

    return {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors
    }
  }

  /**
   * 验证插件文件
   */
  validateFile(filePath: string): ValidationResult {
    const code = readFileSync(filePath, 'utf-8')
    return this.validateCode(code, filePath)
  }
}
```

### 3. PluginMonitor (运行时监控)

**文件**: `src/main/plugins/monitor.ts`

```typescript
export interface APICallEvent {
  timestamp: number
  pluginId: string
  api: string
  method: string
  args: any[]
  result?: any
  error?: string
  duration: number
}

export interface PluginStats {
  totalCalls: number
  failedCalls: number
  avgDuration: number
  lastCall: number
}

export class PluginMonitor {
  private stats: Map<string, PluginStats> = new Map()
  private auditLogger: AuditLogger

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger
  }

  /**
   * 监控 API 调用
   */
  async monitorAPICall<T>(
    pluginId: string,
    api: string,
    method: string,
    args: any[],
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()

    try {
      const result = await fn()

      const duration = Date.now() - startTime

      // 记录成功调用
      this.auditLogger.logEvent({
        timestamp: Date.now(),
        pluginId,
        action: `${api}.${method}`,
        params: this.sanitizeParams(args),
        result: 'success',
        duration
      })

      // 更新统计
      this.updateStats(pluginId, duration, false)

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      // 记录失败调用
      this.auditLogger.logEvent({
        timestamp: Date.now(),
        pluginId,
        action: `${api}.${method}`,
        params: this.sanitizeParams(args),
        result: 'error',
        error: error instanceof Error ? error.message : String(error),
        duration
      })

      // 更新统计
      this.updateStats(pluginId, duration, true)

      throw error
    }
  }

  /**
   * 更新插件统计
   */
  private updateStats(pluginId: string, duration: number, failed: boolean) {
    const stats = this.stats.get(pluginId) || {
      totalCalls: 0,
      failedCalls: 0,
      avgDuration: 0,
      lastCall: 0
    }

    stats.totalCalls++
    if (failed) stats.failedCalls++
    stats.avgDuration = (stats.avgDuration * (stats.totalCalls - 1) + duration) / stats.totalCalls
    stats.lastCall = Date.now()

    this.stats.set(pluginId, stats)
  }

  /**
   * 检测异常行为
   */
  detectAnomaly(pluginId: string): string[] {
    const stats = this.stats.get(pluginId)
    if (!stats) return []

    const anomalies: string[] = []

    // 检测高失败率
    const failureRate = stats.failedCalls / stats.totalCalls
    if (failureRate > 0.5) {
      anomalies.push(`High failure rate: ${(failureRate * 100).toFixed(1)}%`)
    }

    // 检测慢速调用
    if (stats.avgDuration > 5000) {
      anomalies.push(`Slow average response time: ${stats.avgDuration.toFixed(0)}ms`)
    }

    return anomalies
  }

  /**
   * 参数脱敏 (移除敏感信息)
   */
  private sanitizeParams(args: any[]): any[] {
    // 简单实现: 转换为字符串并截断
    return args.map(arg => {
      const str = String(arg)
      return str.length > 100 ? str.substring(0, 100) + '...' : str
    })
  }

  /**
   * 获取插件统计
   */
  getStats(pluginId: string): PluginStats | undefined {
    return this.stats.get(pluginId)
  }
}
```

### 4. AuditLogger (审计日志)

**文件**: `src/main/plugins/audit.ts`

```typescript
import { appendFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface AuditEvent {
  timestamp: number
  pluginId: string
  action: string
  params?: any[]
  result: 'success' | 'error'
  error?: string
  duration?: number
}

export class AuditLogger {
  private logDir: string
  private logFile: string

  constructor(logDir: string) {
    this.logDir = logDir
    this.logFile = join(logDir, 'audit.log')

    // 确保日志目录存在
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }
  }

  /**
   * 记录审计事件
   */
  logEvent(event: AuditEvent): void {
    const logLine = JSON.stringify(event) + '\n'

    try {
      appendFileSync(this.logFile, logLine)
    } catch (error) {
      console.error('Failed to write audit log:', error)
    }
  }

  /**
   * 查询审计事件
   */
  queryEvents(filter: {
    pluginId?: string
    startTime?: number
    endTime?: number
    action?: string
  }): AuditEvent[] {
    // 简单实现: 读取整个文件并过滤
    // 生产环境应该使用数据库

    const events: AuditEvent[] = []

    if (!existsSync(this.logFile)) {
      return events
    }

    const content = readFileSync(this.logFile, 'utf-8')
    const lines = content.split('\n')

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const event: AuditEvent = JSON.parse(line)

        // 应用过滤条件
        if (filter.pluginId && event.pluginId !== filter.pluginId) continue
        if (filter.startTime && event.timestamp < filter.startTime) continue
        if (filter.endTime && event.timestamp > filter.endTime) continue
        if (filter.action && !event.action.includes(filter.action)) continue

        events.push(event)
      } catch (error) {
        // 忽略解析错误
      }
    }

    return events
  }
}
```

## 集成到现有系统

### 修改 PluginLoader

**文件**: `src/main/plugins/loader.ts`

```typescript
import { PluginSandbox } from './sandbox'
import { PluginValidator } from './validator'

export class PluginLoader {
  private sandbox: PluginSandbox
  private validator: PluginValidator

  constructor(...) {
    // ...
    this.sandbox = new PluginSandbox()
    this.validator = new PluginValidator()
  }

  async loadInstance(
    metadata: PluginMetadata,
    pluginPath: string,
    options?: PluginLoadOptions
  ): Promise<PluginInstance> {
    // ...

    // 1. 验证插件代码
    const mainPath = join(pluginPath, metadata.main)
    const validation = this.validator.validateFile(mainPath)

    if (!validation.valid) {
      const errors = validation.errors.map(e =>
        `Line ${e.line}:${e.column}: ${e.message}${e.suggestion ? ` (Suggestion: ${e.suggestion})` : ''}`
      ).join('\n')

      throw new Error(
        `Plugin ${metadata.id} contains forbidden patterns:\n${errors}`
      )
    }

    // 2. 使用沙箱加载插件
    const context = this.createContext(metadata, pluginPath, options)
    const pluginExports = this.sandbox.load(mainPath, context)

    // 3. 其余加载逻辑...
    const hooks = {
      onLoad: pluginExports.onLoad,
      onEnable: pluginExports.onEnable,
      onDisable: pluginExports.onDisable,
      onUnload: pluginExports.onUnload
    }

    // ...
  }
}
```

## 安全边界

### 允许的操作

✅ **通过插件 API**:
- `context.api.fs.readFile()` - 有权限检查
- `context.api.process.exec()` - 有权限检查
- `context.api.clipboard.readText()` - 有权限检查
- 等等...

✅ **基本 JavaScript**:
- 使用标准 JavaScript 对象和函数
- 使用 `console.log()` 输出日志
- 使用 `exports` 导出接口

### 禁止的操作

❌ **直接访问 Node.js 模块**:
- `require('fs')` - 必须使用 `context.api.fs`
- `require('child_process')` - 必须使用 `context.api.process`
- 等等...

❌ **访问进程信息**:
- `process.env` - 环境变量
- `process.argv` - 命令行参数
- 等等...

❌ **动态代码执行**:
- `eval('code')` - 完全禁止
- `new Function('code')` - 完全禁止
- 动态 `import()` - 完全禁止

### 权限检查点

所有系统资源访问都经过以下检查:

```
插件代码
  ↓
沙箱限制 (只能使用 context.api)
  ↓
插件 API (context.api.fs.*)
  ↓
权限检查 (PermissionManager)
  ↓
服务层 (services.fs.*)
  ↓
实际操作
```

## 性能考虑

### 内存开销

- **沙箱上下文**: ~1KB per plugin
- **静态检查**: ~100ms per plugin (首次)
- **运行时监控**: ~50bytes per API call

**估算**: 对于 10 个插件,额外内存 < 10MB

### CPU 开销

- **静态检查**: O(n) where n = 代码行数
- **沙箱执行**: ~5-10% 性能下降 (VM 开销)
- **运行时监控**: <1% 性能下降

**优化策略**:
- 缓存静态检查结果
- 最小化运行时监控
- 异步写入审计日志

## 错误处理

### 沙箱错误

```typescript
try {
  const plugin = sandbox.load(pluginPath, context)
} catch (error) {
  if (error.message.includes('timeout')) {
    // 超时错误
    console.error('Plugin execution timeout')
  } else if (error.message.includes('forbidden')) {
    // 违规错误
    console.error('Plugin contains forbidden code')
  } else {
    // 其他错误
    console.error('Plugin load failed:', error)
  }
}
```

### 验证错误

```typescript
const validation = validator.validateFile(pluginPath)

if (!validation.valid) {
  validation.errors.forEach(error => {
    console.error(`Line ${error.line}: ${error.message}`)
    if (error.suggestion) {
      console.log(`  Suggestion: ${error.suggestion}`)
    }
  })
}
```

## 测试策略

### 单元测试

```typescript
describe('PluginSandbox', () => {
  it('should isolate global objects', () => {
    const sandbox = new PluginSandbox()
    const context = sandbox.createContext(mockContext, '/path/to/plugin.js')

    expect(context.require).toBeUndefined()
    expect(context.process).toBeUndefined()
    expect(context.global).toBeUndefined()
  })

  it('should execute code in sandbox', () => {
    const sandbox = new PluginSandbox()
    const context = sandbox.createContext(mockContext, '/path/to/plugin.js')

    sandbox.run('exports.test = true', context)

    expect(context.module.exports.test).toBe(true)
  })
})
```

### 安全测试

```typescript
describe('PluginValidator', () => {
  it('should detect require calls', () => {
    const validator = new PluginValidator()
    const result = validator.validateCode("const fs = require('fs')")

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('require')
  })

  it('should detect eval calls', () => {
    const validator = new PluginValidator()
    const result = validator.validateCode('eval("code")')

    expect(result.valid).toBe(false)
    expect(result.errors[0].message).toContain('eval')
  })
})
```

### 集成测试

```typescript
describe('Plugin Loading with Sandbox', () => {
  it('should load compliant plugin', async () => {
    const loader = new PluginLoader(...)
    const plugin = await loader.loadInstance(mockMetadata, pluginPath)

    expect(plugin).toBeDefined()
    expect(plugin.status).toBe('loaded')
  })

  it('should reject non-compliant plugin', async () => {
    const loader = new PluginLoader(...)

    await expect(
      loader.loadInstance(nonCompliantMetadata, nonCompliantPath)
    ).rejects.toThrow('forbidden patterns')
  })
})
```

## 部署计划

### 阶段 1: 警告模式

```typescript
// 临时允许违规,但记录警告
if (!validation.valid) {
  validation.errors.forEach(error => {
    console.warn(`[Plugin Warning] ${error.message}`)
  })

  // 仍然加载插件 (临时)
}
```

### 阶段 2: 强制模式

```typescript
// 严格模式,拒绝违规插件
if (!validation.valid) {
  throw new ValidationError(validation.errors)
}
```

### 渐进式启用

```typescript
const SANDBOX_ENABLED = process.env.SANDBOX_ENABLED !== 'false'

if (SANDBOX_ENABLED) {
  // 使用沙箱
  pluginExports = this.sandbox.load(mainPath, context)
} else {
  // 直接加载 (开发环境)
  const module = await import(mainPath)
  pluginExports = module.default || module
}
```
