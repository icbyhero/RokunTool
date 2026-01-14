# Design: Transactional Permissions System

## Architecture Overview

### 当前架构

```
┌─────────────┐     requestPermission()      ┌──────────────────┐
│   Plugin    │ ───────────────────────────> │ PermissionManager │
└─────────────┘                                └──────────────────┘
                                                      │
                                                      ├─> checkPermission()
                                                      │   └─> BASIC_PERMISSIONS
                                                      │   └─> SessionPermissionManager
                                                      │   └─> PermissionService
                                                      │
                                                      └─> send request to UI
                                                          └─> PermissionRequestDialog
                                                              └─> 用户授权/拒绝

问题:
1. 权限请求发生在执行过程中
2. 执行过程中被拒绝会产生垃圾数据
3. 没有回滚机制清理部分执行的结果
```

### 目标架构

```
┌─────────────┐                                    ┌──────────────────┐
│   Plugin    │ ──> 1. preCheckPermissions() ────> │ PermissionManager │
└─────────────┘                                    └──────────────────┘
                                                           │
                                                           ├─> 返回权限状态
                                                           │   (不弹对话框)
                                                           │
                                                           └─> all granted?
                                                               │
                        ┌──────────────────────────────────────┴─────┐
                        │ 有永久拒绝?                                 │
                        └─> YES: 立即中止,显示通知                      │
                                                                 │
                        ┌──────────────────────────────────────┴─────┐
                        │ 有待确认?                                   │
                        └─> YES: 2. requestFeaturePermissions() ────> UI
                                                               │
                                    ┌───────────────────────────────┴─────┐
                                    │ 用户授予所有权限?                       │
                                    └─> YES: 3. executeTransaction() ────> 执行
                                    │                                   │
                                    └─> NO: 中止,不执行任何操作              │
                                                                         │
                                    ┌──────────────────────────────────────┴─────┐
                                    │ 执行事务                                   │
                                    ├─> Step1.execute()                         │
                                    │   └─> 成功 → Step2.execute()              │
                                    │   └─> 失败 → rollback all                │
                                    ├─> Step2.execute()                         │
                                    │   └─> 成功 → Step3.execute()              │
                                    │   └─> 失败 → rollback Step2 + Step1      │
                                    └─> Step3.execute()                         │
                                        └─> 成功 → 完成                        │
                                        └─> 失败 → rollback all               │
```

## Component Design

### 1. Permission Pre-check API

#### 1.1 checkPermissions() 增强

当前实现:
```typescript
// permission-manager.ts
async checkPermissions(
  pluginId: string,
  permissions: Permission[]
): Promise<{
  hasPermanentDeny: boolean
  permanentlyDenied: Permission[]
  pending: Permission[]
  granted: Permission[]
}>
```

目标: 这个 API 已经存在,但需要添加更多功能:

**新增功能**:
1. **权限分组** - 区分必需权限和可选权限
2. **风险评估** - 计算权限组合的风险等级
3. **推荐策略** - 基于风险等级推荐授权选项

```typescript
interface FeaturePermissions {
  pluginId: string
  featureName: string
  permissions: Array<{
    permission: Permission
    required: boolean          // 是否必需
    reason?: string            // 为什么需要这个权限
  }>
}

interface PermissionCheckResult {
  canProceed: boolean
  permanentlyDenied: Array<{
    permission: Permission
    required: boolean
  }>
  pending: Array<{
    permission: Permission
    required: boolean
  }>
  granted: Array<{
    permission: Permission
    permanent: boolean
  }>
  riskLevel: 'low' | 'medium' | 'high'
  recommendation: 'auto_grant' | 'session_grant' | 'ask_user'
}
```

#### 1.2 UI 增强: FeaturePermissionDialog

创建新的对话框组件,专门用于功能级权限请求:

```tsx
<FeaturePermissionDialog
  featureName="创建微信分身"
  permissions={[
    {
      permission: 'fs:read',
      required: true,
      reason: '读取微信应用文件以进行复制',
      risk: 'low',
      icon: '📖'
    },
    {
      permission: 'fs:write',
      required: true,
      reason: '修改应用配置文件以创建分身',
      risk: 'high',
      icon: '📝'
    },
    {
      permission: 'process:exec',
      required: true,
      reason: '执行签名命令以使应用可运行',
      risk: 'high',
      icon: '⚙️'
    }
  ]}
  riskLevel="high"
  onConfirm={(sessionOnly) => {
    // 授予所有权限
  }}
  onCancel={() => {
    // 拒绝所有权限
  }}
/>
```

**UI 布局**:
```
┌─────────────────────────────────────────────┐
│  创建微信分身 需要权限                        │
│  ────────────────────────────────────       │
│  风险等级: 🔴 高                              │
│                                               │
│  所需权限列表:                                │
│  ┌─────────────────────────────────────┐   │
│  │ 📖 fs:read (必需)                   │   │
│  │    读取微信应用文件以进行复制         │   │
│  │    风险: 🟢 低                        │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 📝 fs:write (必需)                  │   │
│  │    修改应用配置文件以创建分身         │   │
│  │    风险: 🔴 高                        │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ ⚙️ process:exec (必需)              │   │
│  │    执行签名命令以使应用可运行         │   │
│  │    风险: 🔴 高                        │   │
│  └─────────────────────────────────────┘   │
│                                               │
│  ⚠️  安全提示                                  │
│  此功能需要多个高风险权限。请确保您信任此插件。 │
│  您可以在设置中随时撤销这些权限。               │
│                                               │
│  [ 拒绝所有 ]  [ 本次授权 ]  [ 永久授权 ]     │
└─────────────────────────────────────────────┘
```

### 2. Transaction Executor

#### 2.1 核心接口

```typescript
interface TransactionStep {
  /** 步骤名称 */
  name: string

  /** 执行操作 */
  execute: () => Promise<void>

  /** 回滚操作 (可选,但强烈推荐) */
  rollback?: () => Promise<void>

  /** 此步骤需要的权限 */
  requiredPermissions?: Permission[]

  /** 超时时间 (毫秒) */
  timeout?: number
}

interface Transaction {
  /** 功能名称 (用于日志和UI显示) */
  featureName: string

  /** 操作步骤 */
  steps: TransactionStep[]

  /** 执行选项 */
  options?: {
    /** 失败时是否自动回滚 (默认 true) */
    autoRollback?: boolean

    /** 是否记录详细日志 (默认 true) */
    enableLogging?: boolean

    /** 是否报告进度 (默认 true) */
    reportProgress?: boolean

    /** 回滚失败时的行为 */
    onRollbackFailure?: 'abort' | 'continue' | 'log_only'
  }
}

interface TransactionResult {
  /** 是否成功 */
  success: boolean

  /** 已执行的步骤 */
  executedSteps: string[]

  /** 失败的步骤 (如果有) */
  failedStep?: string

  /** 错误信息 (如果有) */
  error?: Error

  /** 回滚是否完成 */
  rollbackCompleted?: boolean

  /** 回滚失败的步骤 (如果有) */
  rollbackFailures?: Array<{
    step: string
    error: Error
  }>

  /** 事务ID (用于查询日志) */
  transactionId: string
}
```

#### 2.2 Executor 实现

```typescript
export class TransactionExecutor {
  constructor(
    private context: {
      logger: Logger
      progressReporter?: ProgressReporter
      transactionLogger?: TransactionLogger
    }
  ) {}

  async execute(transaction: Transaction): Promise<TransactionResult> {
    const transactionId = uuidv4()
    const executedSteps: TransactionStep[] = []

    // 开始事务日志
    await this.context.transactionLogger?.startTransaction({
      transactionId,
      featureName: transaction.featureName,
      steps: transaction.steps.map(s => s.name)
    })

    // 开始进度报告
    this.context.progressReporter?.start(
      transaction.featureName,
      transaction.steps.length
    )

    try {
      // 执行所有步骤
      for (let i = 0; i < transaction.steps.length; i++) {
        const step = transaction.steps[i]

        // 报告进度
        this.context.progressReporter?.update(
          i + 1,
          step.name,
          `正在执行: ${step.name}...`
        )

        // 记录步骤开始
        await this.context.transactionLogger?.logStepStart({
          transactionId,
          stepName: step.name
        })

        // 执行步骤
        await this.executeStep(step, transaction.options)

        // 记录步骤成功
        await this.context.transactionLogger?.logStepSuccess({
          transactionId,
          stepName: step.name
        })

        executedSteps.push(step)
      }

      // 所有步骤成功
      this.context.progressReporter?.complete('操作成功完成')

      await this.context.transactionLogger?.logTransactionSuccess({
        transactionId
      })

      return {
        success: true,
        executedSteps: executedSteps.map(s => s.name),
        transactionId
      }

    } catch (error) {
      this.context.logger.error(`事务失败: ${error.message}`)

      this.context.progressReporter?.fail(
        `操作失败: ${error.message}, 正在回滚...`
      )

      // 记录失败
      await this.context.transactionLogger?.logTransactionFailed({
        transactionId,
        error
      })

      // 执行回滚
      let rollbackResult: {
        completed: boolean
        failures: Array<{ step: string; error: Error }>
      } = { completed: false, failures: [] }

      if (transaction.options?.autoRollback !== false) {
        rollbackResult = await this.rollback(
          transactionId,
          executedSteps,
          transaction.options
        )
      }

      return {
        success: false,
        executedSteps: executedSteps.map(s => s.name),
        failedStep: executedSteps[executedSteps.length - 1]?.name,
        error,
        rollbackCompleted: rollbackResult.completed,
        rollbackFailures: rollbackResult.failures,
        transactionId
      }
    }
  }

  private async executeStep(
    step: TransactionStep,
    options?: TransactionOptions
  ): Promise<void> {
    const timeout = step.timeout || 30000 // 默认30秒超时

    // 使用 Promise.race 实现超时
    await Promise.race([
      step.execute(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`步骤超时: ${step.name}`)), timeout)
      )
    ])
  }

  private async rollback(
    transactionId: string,
    steps: TransactionStep[],
    options?: TransactionOptions
  ): Promise<{
    completed: boolean
    failures: Array<{ step: string; error: Error }>
  }> {
    this.context.logger.info(`开始回滚 ${steps.length} 个步骤...`)

    const failures: Array<{ step: string; error: Error }> = []

    // 按相反顺序回滚
    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i]

      try {
        if (step.rollback) {
          this.context.logger.info(`回滚: ${step.name}`)

          await this.context.transactionLogger?.logStepRollbackStart({
            transactionId,
            stepName: step.name
          })

          await step.rollback()

          await this.context.transactionLogger?.logStepRollbackSuccess({
            transactionId,
            stepName: step.name
          })

          this.context.logger.info(`回滚成功: ${step.name}`)
        } else {
          this.context.logger.warn(`步骤 ${step.name} 没有回滚操作`)
        }
      } catch (error) {
        this.context.logger.error(`回滚失败: ${step.name}`, error)

        await this.context.transactionLogger?.logStepRollbackFailed({
          transactionId,
          stepName: step.name,
          error
        })

        failures.push({ step: step.name, error })

        // 根据配置决定是否继续回滚
        if (options?.onRollbackFailure === 'abort') {
          this.context.logger.error('回滚失败,中止后续回滚操作')
          break
        }
      }
    }

    const completed = failures.length === 0

    if (completed) {
      this.context.logger.info('所有回滚操作完成')
      this.context.progressReporter?.complete('回滚完成,系统已恢复')
    } else {
      this.context.logger.warn(`部分回滚失败: ${failures.length} 个步骤失败`)
      this.context.progressReporter?.warn(
        `回滚部分完成, ${failures.length} 个步骤失败`
      )
    }

    return { completed, failures }
  }
}
```

### 3. Plugin Context API

#### 3.1 新增方法

```typescript
export interface PluginContext {
  // ... 现有方法

  // === 权限 API ===

  /** 单个权限请求 (现有) */
  requestPermission(
    permission: Permission,
    options?: PermissionRequestOptions
  ): Promise<boolean>

  /** 权限预检查 (新增) */
  preCheckPermissions(
    permissions: Permission[]
  ): Promise<PermissionCheckResult>

  /** 功能级权限请求 (新增) */
  requestFeaturePermissions(
    featureName: string,
    permissions: Array<{
      permission: Permission
      required: boolean
      reason?: string
    }>,
    reason?: string,
    context?: PermissionRequestContext
  ): Promise<{
    allGranted: boolean
    results: Array<{
      permission: Permission
      granted: boolean
      permanent: boolean
    }>
  }>

  // === 事务 API (新增) ===

  /** 执行事务 */
  executeTransaction(
    transaction: Transaction
  ): Promise<TransactionResult>

  /** 创建事务构建器 (辅助方法) */
  createTransaction(
    featureName: string,
    options?: TransactionOptions
  ): TransactionBuilder
}

/** 事务构建器 - 流式 API */
export class TransactionBuilder {
  private steps: TransactionStep[] = []

  constructor(
    private featureName: string,
    private options?: TransactionOptions
  ) {}

  /** 添加步骤 */
  addStep(
    name: string,
    execute: () => Promise<void>,
    rollback?: () => Promise<void>,
    options?: { timeout?: number; requiredPermissions?: Permission[] }
  ): this {
    this.steps.push({
      name,
      execute,
      rollback,
      timeout: options?.timeout,
      requiredPermissions: options?.requiredPermissions
    })
    return this
  }

  /** 构建事务 */
  build(): Transaction {
    return {
      featureName: this.featureName,
      steps: this.steps,
      options: this.options
    }
  }
}
```

#### 3.2 使用示例

```typescript
class MyPlugin extends Plugin {
  async createWeChatInstance(instanceName: string) {
    // 1. 定义功能权限
    const FEATURE_PERMISSIONS = [
      { permission: 'fs:read' as Permission, required: true },
      { permission: 'fs:write' as Permission, required: true },
      { permission: 'process:exec' as Permission, required: true }
    ]

    // 2. 预检查权限
    const checkResult = await this.context.preCheckPermissions(
      FEATURE_PERMISSIONS.map(p => p.permission)
    )

    if (checkResult.hasPermanentDeny) {
      this.showMessage(
        '功能无法完成: 需要的权限已被永久拒绝。\n' +
        '请查看右下角的通知了解详情。'
      )
      return { success: false, reason: 'permissions_denied' }
    }

    // 3. 请求所有权限
    const requestResult = await this.context.requestFeaturePermissions(
      '创建微信分身',
      FEATURE_PERMISSIONS,
      '创建微信分身需要以下权限',
      { operation: 'create-wechat-instance' }
    )

    if (!requestResult.allGranted) {
      this.showMessage('操作已取消: 未授予所有必需的权限')
      return { success: false, reason: 'not_all_granted' }
    }

    // 4. 执行事务 (两种方式)

    // 方式A: 直接构建事务
    const result = await this.context.executeTransaction({
      featureName: '创建微信分身',
      steps: [
        {
          name: '复制微信应用',
          execute: async () => {
            await this.copyWeChatApp(instanceName)
          },
          rollback: async () => {
            await this.deleteCopiedApp(instanceName)
          },
          requiredPermissions: ['fs:read' as Permission]
        },
        {
          name: '修改 Bundle ID',
          execute: async () => {
            await this.modifyBundleId(instanceName)
          },
          rollback: async () => {
            await this.restoreBundleId(instanceName)
          },
          requiredPermissions: ['fs:write' as Permission]
        },
        {
          name: '签名应用',
          execute: async () => {
            await this.signApp(instanceName)
          },
          rollback: async () => {
            await this.unsignApp(instanceName)
          },
          requiredPermissions: ['process:exec' as Permission]
        }
      ]
    })

    // 方式B: 使用构建器 (更简洁)
    const result2 = await this.context
      .createTransaction('创建微信分身')
      .addStep(
        '复制微信应用',
        () => this.copyWeChatApp(instanceName),
        () => this.deleteCopiedApp(instanceName),
        { requiredPermissions: ['fs:read' as Permission] }
      )
      .addStep(
        '修改 Bundle ID',
        () => this.modifyBundleId(instanceName),
        () => this.restoreBundleId(instanceName),
        { requiredPermissions: ['fs:write' as Permission] }
      )
      .addStep(
        '签名应用',
        () => this.signApp(instanceName),
        () => this.unsignApp(instanceName),
        { requiredPermissions: ['process:exec' as Permission] }
      )
      .build()

    return await this.context.executeTransaction(result2)
  }
}
```

### 4. Rollback Helpers Library

为了简化回滚逻辑的编写,提供常用操作的回滚辅助类:

#### 4.1 文件操作回滚

```typescript
export class FileRollback {
  /**
   * 带回滚的文件复制
   */
  static async copyWithRollback(
    source: string,
    target: string
  ): Promise<RollbackHandle> {
    await fs.copy(source, target)

    return {
      async rollback() {
        try {
          if (await fs.pathExists(target)) {
            await fs.remove(target)
          }
        } catch (error) {
          throw new Error(`回滚复制失败: ${error.message}`)
        }
      }
    }
  }

  /**
   * 带回滚的文件写入
   */
  static async writeWithRollback(
    filePath: string,
    content: string
  ): Promise<RollbackHandle> {
    const backupPath = `${filePath}.backup-${Date.now()}`

    // 备份原文件
    if (await fs.pathExists(filePath)) {
      await fs.copy(filePath, backupPath)
    }

    // 写入新内容
    await fs.writeFile(filePath, content, 'utf-8')

    return {
      async rollback() {
        try {
          if (await fs.pathExists(backupPath)) {
            await fs.move(backupPath, filePath, { overwrite: true })
          } else {
            await fs.remove(filePath)
          }
        } catch (error) {
          throw new Error(`回滚写入失败: ${error.message}`)
        }
      }
    }
  }

  /**
   * 带回滚的目录创建
   */
  static async mkdirWithRollback(
    dirPath: string
  ): Promise<RollbackHandle> {
    await fs.mkdir(dirPath, { recursive: true })

    return {
      async rollback() {
        try {
          if (await fs.pathExists(dirPath)) {
            await fs.remove(dirPath)
          }
        } catch (error) {
          throw new Error(`回滚目录创建失败: ${error.message}`)
        }
      }
    }
  }
}

interface RollbackHandle {
  rollback(): Promise<void>
}
```

#### 4.2 进程操作回滚

```typescript
export class ProcessRollback {
  private static managedProcesses = new Map<string, childProcess.ChildProcess>()

  /**
   * 带回滚的进程启动
   */
  static async spawnWithRollback(
    command: string,
    args: string[],
    options?: { id?: string }
  ): Promise<RollbackHandle & { process: childProcess.ChildProcess }> {
    const process = childProcess.spawn(command, args, {
      stdio: 'pipe'
    })

    const processId = options?.id || `process-${Date.now()}`
    this.managedProcesses.set(processId, process)

    return {
      process,

      async rollback() {
        try {
          const proc = this.managedProcesses.get(processId)
          if (proc && !proc.killed) {
            proc.kill('SIGTERM')

            // 等待进程终止
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('进程终止超时'))
              }, 5000)

              proc.on('exit', () => {
                clearTimeout(timeout)
                resolve()
              })

              proc.on('error', (err) => {
                clearTimeout(timeout)
                reject(err)
              })
            })
          }

          this.managedProcesses.delete(processId)
        } catch (error) {
          throw new Error(`回滚进程失败: ${error.message}`)
        }
      }
    }
  }
}
```

#### 4.3 配置修改回滚

```typescript
export class ConfigRollback {
  /**
   * 带回滚的配置修改
   */
  static async modifyWithRollback<T>(
    configPath: string,
    modifier: (config: T) => T
  ): Promise<RollbackHandle> {
    // 读取原配置
    const rawContent = await fs.readFile(configPath, 'utf-8')
    const originalConfig = JSON.parse(rawContent)

    // 修改配置
    const modifiedConfig = modifier(originalConfig)
    await fs.writeFile(
      configPath,
      JSON.stringify(modifiedConfig, null, 2),
      'utf-8'
    )

    return {
      async rollback() {
        try {
          await fs.writeFile(
            configPath,
            JSON.stringify(originalConfig, null, 2),
            'utf-8'
          )
        } catch (error) {
          throw new Error(`回滚配置修改失败: ${error.message}`)
        }
      }
    }
  }
}
```

## Data Model

### Transaction Log

事务日志记录所有事务的执行历史,用于调试和审计:

```typescript
interface TransactionLogEntry {
  transactionId: string
  featureName: string
  pluginId: string
  startTime: number
  endTime?: number
  duration?: number
  status: 'executing' | 'success' | 'failed' | 'rolled_back'
  steps: TransactionStepLog[]
  rollbackFailures?: Array<{
    step: string
    error: string
  }>
}

interface TransactionStepLog {
  name: string
  status: 'pending' | 'executing' | 'success' | 'failed' | 'rolled_back'
  startTime?: number
  endTime?: number
  duration?: number
  error?: string
}

// 日志存储位置
// ~/Library/Application Support/RokunTool/logs/transactions/
// └── 2026-01-14.json
```

## Error Handling

### 错误分类

```typescript
enum TransactionErrorType {
  /** 权限被永久拒绝 */
  PERMISSION_DENIED_PERMANENTLY = 'permission_denied_permanently',

  /** 用户拒绝授权 */
  PERMISSION_DENIED_BY_USER = 'permission_denied_by_user',

  /** 步骤执行失败 */
  STEP_EXECUTION_FAILED = 'step_execution_failed',

  /** 步骤超时 */
  STEP_TIMEOUT = 'step_timeout',

  /** 回滚失败 */
  ROLLBACK_FAILED = 'rollback_failed',

  /** 部分回滚失败 */
  PARTIAL_ROLLBACK_FAILED = 'partial_rollback_failed'
}

class TransactionError extends Error {
  constructor(
    public type: TransactionErrorType,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'TransactionError'
  }
}
```

### 错误处理策略

```typescript
interface ErrorHandlingStrategy {
  /** 权限错误: 不执行任何操作,让系统显示通知 */
  onPermissionDenied: 'silent_abort'

  /** 执行错误: 回滚并记录 */
  onExecutionError: 'rollback_and_log'

  /** 回滚错误: 继续回滚,记录所有失败 */
  onRollbackError: 'continue_and_log'

  /** 超时错误: 回滚并提示 */
  onTimeout: 'rollback_and_notify'
}
```

## Performance Considerations

1. **预检查开销**
   - 纯内存操作,延迟 < 10ms
   - 不影响性能

2. **事务执行开销**
   - 正常执行: 与手动执行相同
   - 失败回滚: 额外开销,但只在失败时发生

3. **日志写入**
   - 异步写入,不阻塞执行
   - 批量写入减少 I/O

## Security Considerations

1. **权限验证**
   - 每个步骤执行前验证权限
   - 防止权限提升攻击

2. **回滚安全**
   - 回滚操作也需要权限检查
   - 防止恶意回滚

3. **日志安全**
   - 敏感信息不记录到日志
   - 日志文件权限控制

## Migration Strategy

### Phase 1: 向后兼容

- 新 API 不影响现有插件
- 现有插件可以继续使用 `requestPermission()`

### Phase 2: 逐步迁移

- 提供迁移指南
- 提供最佳实践示例
- 鼓励插件使用新 API

### Phase 3: 强制使用

- 未来版本可能标记旧 API 为 deprecated
- 最终可能要求所有插件使用事务 API
