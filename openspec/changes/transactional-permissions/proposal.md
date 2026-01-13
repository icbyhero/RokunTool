# Proposal: 事务性权限管理系统

## Change Metadata
- **ID**: `transactional-permissions`
- **Title**: 事务性权限管理与原子操作
- **Status**: `proposed`
- **Created**: 2026-01-13
- **Related Specs**:
  - `spec:permission-system`
  - `spec:plugin-system`

## Problem Statement

### 当前问题

插件的某个功能需要多个权限时,如果在执行过程中部分权限被拒绝,会导致:

1. **数据不一致** - 已执行的操作产生了数据,但后续操作失败,留下垃圾数据
2. **资源泄漏** - 创建的文件、进程等资源无法清理
3. **用户体验差** - 用户不知道会在功能执行中途被拒绝
4. **难以调试** - 部分失败难以追踪和修复

### 具体场景

**场景: 微信分身创建功能**

```
步骤1: 复制微信应用
  ├─ 需要 fs:read 权限
  ├─ 用户授权 ✅
  └─ 执行成功,产生了新文件

步骤2: 修改 Bundle ID
  ├─ 需要 fs:write 权限
  ├─ 用户拒绝 ❌
  └─ 功能失败

结果:留下了复制的文件,但无法完成分身创建
```

### 根本原因

1. **缺少预检查机制** - 没有在功能开始前检查所有需要的权限
2. **缺少回滚机制** - 无法清理已执行的操作
3. **权限申请时机错误** - 在执行过程中申请权限,而不是执行前
4. **缺少事务支持** - 没有原子性保证

## Proposed Solution

### 核心概念: 事务性权限管理

将权限申请和功能执行分离为两个独立的阶段:

1. **权限预检查阶段** (Pre-check Phase)
   - 在功能执行前批量检查所有需要的权限
   - 如有永久拒绝,立即中止
   - 如有待确认权限,一次性弹出对话框

2. **功能执行阶段** (Execution Phase)
   - 所有权限已授予后才执行功能
   - 如执行失败,执行回滚操作
   - 保证系统状态一致性

### 方案设计

#### 1. 权限预检查 API

```typescript
// 插件定义功能需要的权限
interface FeaturePermissions {
  featureName: string
  permissions: Permission[]
  required: boolean[]  // 每个权限是否必需
  rollback?: RollbackPlan  // 回滚计划
}

// 预检查所有权限
async preCheckPermissions(
  permissions: FeaturePermissions
): Promise<PermissionCheckResult>

interface PermissionCheckResult {
  canProceed: boolean          // 是否可以继续执行
  permanentlyDenied: Permission[]  // 永久拒绝的权限列表
  pending: Permission[]         // 待确认的权限列表
  granted: Permission[]         // 已授予的权限列表
}

// 批量请求权限
async requestFeaturePermissions(
  permissions: FeaturePermissions
): Promise<PermissionRequestResult>

interface PermissionRequestResult {
  allGranted: boolean           // 所有权限都已授予
  results: PermissionGrant[]
}

interface PermissionGrant {
  permission: Permission
  granted: boolean
  permanent: boolean
}
```

#### 2. 事务执行 API

```typescript
// 定义事务操作
interface Transaction {
  featureName: string
  steps: TransactionStep[]
  rollbackSteps: TransactionStep[]
}

interface TransactionStep {
  name: string
  execute: () => Promise<void>
  rollback: () => Promise<void>
  requiredPermissions: Permission[]
}

// 执行事务
async executeTransaction(
  transaction: Transaction
): Promise<TransactionResult>

interface TransactionResult {
  success: boolean
  executedSteps: string[]
  failedStep?: string
  rollbackCompleted: boolean
  error?: Error
}
```

#### 3. 插件使用模式

**模式1: 预检查 + 批量申请 + 执行**

```typescript
class MyPlugin {
  // 定义功能和权限
  private readonly CREATE_INSTANCE_TRANSACTION = {
    featureName: '创建微信分身',
    permissions: ['fs:read', 'fs:write', 'process:exec'],
    required: [true, true, true],  // 所有权限都是必需的
    rollback: {
      steps: [
        '删除复制的文件',
        '清理临时目录'
      ]
    }
  }

  async createWeChatInstance(instanceName) {
    // 阶段1: 预检查权限
    const checkResult = await this.api.permission.preCheckPermissions(
      this.CREATE_INSTANCE_TRANSACTION
    )

    if (!checkResult.canProceed) {
      // 有永久拒绝的权限,无法执行
      this.showMessage(
        '功能无法完成: 需要的权限已被永久拒绝。' +
        '请查看右下角的通知了解详情。'
      )
      return { success: false, reason: 'permissions_denied' }
    }

    // 阶段2: 批量请求所有权限
    const requestResult = await this.api.permission.requestFeaturePermissions(
      this.CREATE_INSTANCE_TRANSACTION
    )

    if (!requestResult.allGranted) {
      // 用户拒绝了部分权限
      this.showMessage('操作已取消: 未授予所有必需的权限')
      return { success: false, reason: 'not_all_granted' }
    }

    // 阶段3: 执行功能(带事务支持)
    const result = await this.executeTransaction({
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
          requiredPermissions: ['fs:read']
        },
        {
          name: '修改 Bundle ID',
          execute: async () => {
            await this.modifyBundleId(instanceName)
          },
          rollback: async () => {
            await this.restoreBundleId(instanceName)
          },
          requiredPermissions: ['fs:write']
        },
        {
          name: '签名应用',
          execute: async () => {
            await this.signApp(instanceName)
          },
          rollback: async () => {
            await this.unsignApp(instanceName)
          },
          requiredPermissions: ['process:exec']
        }
      ],
      rollbackSteps: [
        {
          name: '删除分身文件',
          execute: async () => {
            await this.deleteInstanceFiles(instanceName)
          },
          rollback: async () => {
            // 无法回滚删除操作
          },
          requiredPermissions: []
        }
      ]
    })

    return result
  }
}
```

### 关键特性

#### 1. 权限预检查 (Pre-check)

**目的**: 在执行任何操作前,先验证所有权限可用

**流程**:
```
1. 检查权限状态
   ├─ 有永久拒绝? → 立即中止,显示通知
   ├─ 全部已授予? → 直接执行
   └─ 有待确认? → 批量请求权限

2. 批量请求权限
   ├─ 用户全部授予? → 执行功能
   └─ 用户拒绝任何? → 中止,不执行任何操作
```

**优势**:
- 用户预先知道需要哪些权限
- 不会执行到一半被拒绝
- 避免产生垃圾数据

#### 2. 事务执行 (Transactional Execution)

**目的**: 保证操作的原子性,要么全部成功,要么全部回滚

**流程**:
```
执行步骤:
  Step1.execute()
  ├─ 成功 → Step2.execute()
  ├─ 失败 → 执行回滚
  │         ├─ Step1.rollback()
  │         └─ 清理资源
  └─ 返回失败

  Step2.execute()
  ├─ 成功 → Step3.execute()
  ├─ 失败 → 执行回滚
  │         ├─ Step2.rollback()
  │         ├─ Step1.rollback()
  │         └─ 清理资源
  └─ 返回失败

  Step3.execute()
  ├─ 成功 → 返回成功
  └─ 失败 → 执行回滚
             ├─ Step3.rollback()
             ├─ Step2.rollback()
             ├─ Step1.rollback()
             └─ 清理资源
```

**优势**:
- 保证数据一致性
- 自动清理失败的操作
- 可追溯的执行日志

#### 3. 回滚机制 (Rollback Mechanism)

**目的**: 清理部分执行产生的数据,恢复系统状态

**回滚策略**:

1. **精确回滚** - 每个步骤定义自己的回滚操作
2. **链式回滚** - 按相反顺序回滚所有已执行的步骤
3. **清理操作** - 删除临时文件、终止进程等
4. **状态恢复** - 恢复配置文件、数据库等

**示例**:

```typescript
{
  name: '复制微信应用',
  execute: async () => {
    await fs.copy(weChatPath, instancePath)
    // 产生新文件
  },
  rollback: async () => {
    await fs.remove(instancePath)
    // 删除复制的文件
  }
}
```

## Implementation Plan

### Phase 1: 权限预检查 (P0 - 核心功能)

#### 1.1 权限系统扩展

**新增 API**:

```typescript
// PermissionManager
async preCheckPermissions(
  pluginId: string,
  permissions: Permission[]
): Promise<{
  canProceed: boolean
  permanentlyDenied: Permission[]
  pending: Permission[]
  granted: Permission[]
}>

async requestFeaturePermissions(
  pluginId: string,
  featureName: string,
  permissions: Permission[],
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
```

**文件修改**:
- `src/main/permissions/permission-manager.ts`
- `src/main/ipc/handlers.ts`
- `src/preload/ipc.ts`
- `src/renderer/src/types/permission.ts`

#### 1.2 UI 更新

**批量权限对话框**:

```tsx
<PermissionBatchDialog
  featureName="创建微信分身"
  permissions={[
    { name: 'fs:read', description: '读取微信应用文件', risk: 'low' },
    { name: 'fs:write', description: '修改应用配置', risk: 'medium' },
    { name: 'process:exec', description: '执行签名命令', risk: 'high' }
  ]}
  onConfirm={handleBatchConfirm}
  onCancel={handleCancel}
/>
```

**文件修改**:
- `src/renderer/src/components/permissions/PermissionRequestDialog.tsx`
- 更新为支持批量权限显示

#### 1.3 插件上下文扩展

**新增方法**:

```typescript
// PluginContext
permission: {
  // 现有方法
  request(permission, options): Promise<boolean>

  // 新增方法
  preCheck(permissions): Promise<CheckResult>
  requestBatch(permissions, reason, context): Promise<BatchResult>
  executeTransaction(transaction): Promise<TransactionResult>
}
```

**文件修改**:
- `src/main/plugins/plugin-context.ts`
- `src/main/plugins/base-plugin.ts`

### Phase 2: 事务执行引擎 (P1 - 事务支持)

#### 2.1 TransactionExecutor 类

```typescript
class TransactionExecutor {
  async execute(transaction: Transaction): Promise<TransactionResult> {
    const executedSteps: TransactionStep[] = []

    try {
      // 正向执行所有步骤
      for (const step of transaction.steps) {
        await step.execute()
        executedSteps.push(step)
      }

      return { success: true, executedSteps: executedSteps.map(s => s.name) }
    } catch (error) {
      // 执行失败,开始回滚
      this.context.logger.error(`事务失败: ${error.message}, 开始回滚`)

      const rollbackResults = await this.rollback(executedSteps)

      return {
        success: false,
        executedSteps: executedSteps.map(s => s.name),
        failedStep: executedSteps[executedSteps.length - 1].name,
        rollbackCompleted: rollbackResults.allSuccess,
        error
      }
    }
  }

  private async rollback(steps: TransactionStep[]): Promise<{
    allSuccess: boolean
    failures: Array<{ step: string; error: Error }>
  }> {
    const failures = []

    // 按相反顺序回滚
    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i]

      try {
        if (step.rollback) {
          await step.rollback()
          this.context.logger.info(`回滚成功: ${step.name}`)
        }
      } catch (error) {
        this.context.logger.error(`回滚失败: ${step.name}`, error)
        failures.push({ step: step.name, error })
      }
    }

    return {
      allSuccess: failures.length === 0,
      failures
    }
  }
}
```

**文件**:
- `src/main/plugins/transaction-executor.ts` (新建)

#### 2.2 进度报告集成

```typescript
// 在事务执行过程中报告进度
async execute(transaction: Transaction): Promise<TransactionResult> {
  this.api.progress.start(
    transaction.featureName,
    transaction.steps.length
  )

  try {
    for (let i = 0; i < transaction.steps.length; i++) {
      const step = transaction.steps[i]

      this.api.progress.update(
        i + 1,
        step.name,
        `正在执行: ${step.name}...`
      )

      await step.execute()
    }

    this.api.progress.complete('操作成功完成')
    return { success: true, ... }
  } catch (error) {
    this.api.progress.fail(`操作失败: ${error.message}`)
    // 执行回滚...
  }
}
```

### Phase 3: 回滚策略库 (P2 - 高级功能)

#### 3.1 常用回滚模式

**文件操作回滚**:

```typescript
class FileOperationRollback {
  static async copy(source: string, target: string): Promise<RollbackHandle> {
    await fs.copy(source, target)

    return {
      async rollback() {
        await fs.remove(target)
      }
    }
  }

  static async write(filePath: string, content: string): Promise<RollbackHandle> {
    const backupPath = `${filePath}.backup`

    // 备份原文件
    if (await fs.pathExists(filePath)) {
      await fs.copy(filePath, backupPath)
    }

    // 写入新内容
    await fs.writeFile(filePath, content)

    return {
      async rollback() {
        if (await fs.pathExists(backupPath)) {
          await fs.move(backupPath, filePath, { overwrite: true })
        } else {
          await fs.remove(filePath)
        }
      }
    }
  }
}
```

**进程操作回滚**:

```typescript
class ProcessRollback {
  static async spawn(command: string, args: string[]): Promise<RollbackHandle> {
    const process = childProcess.spawn(command, args)

    return {
      async rollback() {
        if (process && !process.killed) {
          process.kill('SIGTERM')

          // 等待进程终止
          await new Promise(resolve => {
            process.on('exit', resolve)
            setTimeout(resolve, 5000)  // 5秒超时
          })
        }
      }
    }
  }
}
```

#### 3.2 事务日志

```typescript
interface TransactionLog {
  transactionId: string
  featureName: string
  startTime: number
  endTime?: number
  status: 'executing' | 'success' | 'failed' | 'rolled_back'
  steps: Array<{
    name: string
    status: 'pending' | 'success' | 'failed' | 'rolled_back'
    timestamp: number
    error?: Error
  }>
}

class TransactionLogger {
  async startTransaction(transaction: Transaction): Promise<string> {
    const log: TransactionLog = {
      transactionId: uuidv4(),
      featureName: transaction.featureName,
      startTime: Date.now(),
      status: 'executing',
      steps: transaction.steps.map(s => ({
        name: s.name,
        status: 'pending',
        timestamp: Date.now()
      }))
    }

    await this.saveLog(log)
    return log.transactionId
  }

  async logStep(transactionId: string, stepName: string, status: string) {
    // 更新步骤状态
  }

  async getTransactionLogs(): Promise<TransactionLog[]> {
    // 获取所有事务日志
  }
}
```

## User Impact

### 用户体验改进

**Before**:
```
用户点击"创建分身"
  ↓
复制文件... (需要 fs:read)
  ├─ 用户授权 ✅
  └─ 文件复制成功
  ↓
修改配置... (需要 fs:write)
  ├─ 用户拒绝 ❌
  └─ 功能失败!

问题:留下了垃圾文件,用户不知道清理
```

**After**:
```
用户点击"创建分身"
  ↓
[权限对话框]
需要以下权限:
☑ fs:read - 读取微信应用文件
☑ fs:write - 修改应用配置
☑ process:exec - 执行签名命令

[全部授权] [全部拒绝]
  ↓
用户点击"全部授权"
  ↓
开始执行...
  ├─ 复制文件... ✅
  ├─ 修改配置... ✅
  └─ 签名应用... ✅

完成!

或:
  ├─ 复制文件... ✅
  ├─ 修改配置... ❌
  └─ [自动回滚]
      ├─ 删除复制的文件
      └─ 清理临时数据

回滚完成,系统恢复原状
```

### 插件开发者体验

**Before**:
```typescript
// 插件开发者需要手动处理回滚
async createInstance() {
  try {
    await this.copyApp()
    await this.modifyConfig()
    await this.signApp()
  } catch (error) {
    // 手动清理 - 容易遗漏!
    await this.cleanup()
    throw error
  }
}
```

**After**:
```typescript
// 框架自动处理回滚
async createInstance() {
  return await this.executeTransaction({
    featureName: '创建微信分身',
    steps: [
      {
        name: '复制应用',
        execute: () => this.copyApp(),
        rollback: () => this.deleteCopiedApp()
      },
      {
        name: '修改配置',
        execute: () => this.modifyConfig(),
        rollback: () => this.restoreConfig()
      },
      {
        name: '签名应用',
        execute: () => this.signApp(),
        rollback: () => this.unsignApp()
      }
    ]
  })
}
```

## Implementation Scope

### Phase 1: 权限预检查 (P0, 2-3天)

- [ ] 添加 `preCheckPermissions()` API
- [ ] 添加 `requestFeaturePermissions()` API
- [ ] 更新权限对话框支持批量显示
- [ ] 更新插件上下文 API
- [ ] 编写文档和示例

### Phase 2: 事务执行引擎 (P1, 3-4天)

- [ ] 实现 `TransactionExecutor` 类
- [ ] 支持步骤执行和回滚
- [ ] 集成进度报告
- [ ] 添加事务日志
- [ ] 编写单元测试和集成测试

### Phase 3: 回滚策略库 (P2, 2-3天)

- [ ] 实现常用回滚模式
  - [ ] 文件操作回滚
  - [ ] 进程操作回滚
  - [ ] 配置修改回滚
- [ ] 创建回滚辅助工具类
- [ ] 编写最佳实践文档

## Success Criteria

### Phase 1

- ✅ 插件可以预检查多个权限
- ✅ 权限预检查不显示对话框
- ✅ 批量权限请求显示单个对话框
- ✅ 用户拒绝任何权限后,功能不会执行
- ✅ 无永久拒绝时,显示批量对话框

### Phase 2

- ✅ 插件可以定义事务步骤
- ✅ 事务失败时自动回滚
- ✅ 回滚按相反顺序执行
- ✅ 进度报告实时显示执行状态
- ✅ 事务日志完整记录

### Phase 3

- ✅ 提供文件操作回滚工具
- ✅ 提供进程操作回滚工具
- ✅ 回滚失败时有清晰的日志
- ✅ 插件可以自定义回滚逻辑

## Alternatives Considered

### 方案A: 仅预检查,无事务

**优点**: 实现简单
**缺点**: 无法处理执行过程中的失败,仍然可能产生垃圾数据

### 方案B: 手动回滚

**优点**: 灵活性高
**缺点**: 插件开发者容易遗漏回滚逻辑,容易出错

**最终选择**: 自动事务执行引擎,降低插件开发者负担

## Risks and Mitigations

### 风险1: 回滚失败导致系统不一致

**缓解措施**:
- 每个步骤的回滚操作必须经过测试
- 回滚失败时记录详细日志
- 提供手动清理工具

### 风险2: 性能开销

**缓解措施**:
- 预检查阶段是纯内存操作,性能影响可忽略
- 事务执行阶段与手动执行相同,无额外开销
- 回滚仅在失败时执行,不影响正常流程

### 风险3: 复杂度增加

**缓解措施**:
- 提供简洁的 API
- 提供详细的文档和示例
- 提供回滚辅助工具类

## Estimated Effort

- Phase 1: 2-3 天
- Phase 2: 3-4 天
- Phase 3: 2-3 天

**Total**: 7-10 天

## Related Changes

- 依赖: `permanent-deny-and-batch-permissions` (永久拒绝和批量权限)
- 补充: 权限系统基础增强
