# 事务系统 API 参考

完整的事务执行和回滚 API 文档。

**⚠️ 重要**: 插件开发者必须先阅读 [插件开发规范](../standards/plugin-development.md#事务执行规范)

## 目录

- [快速开始](#快速开始)
- [核心 API](#核心-api)
- [类型定义](#类型定义)
- [回滚策略库](#回滚策略库)
- [使用示例](#使用示例)
- [迁移指南](#迁移指南)
- [最佳实践](#最佳实践)

## 快速开始

### 基础用法: 直接执行

```javascript
const result = await this.context.api.transaction.execute({
  id: 'install-recipe-123',
  name: '安装配方',
  pluginId: this.context.metadata.id,
  steps: [
    {
      name: '创建备份',
      execute: async () => {
        await fs.copy(configPath, backupPath)
      },
      rollback: async () => {
        await fs.unlink(backupPath)
      }
    },
    {
      name: '安装配方',
      execute: async () => {
        await fs.copy(recipePath, targetPath)
      },
      rollback: async () => {
        await fs.rm(targetPath, { recursive: true })
      }
    }
  ]
})

if (result.success) {
  this.showMessage('安装成功!', 'info')
} else {
  this.showMessage(`安装失败: ${result.error}`, 'error')
}
```

### 使用 Builder 模式

```javascript
const transaction = this.context.api.transaction.createBuilder()
  .id('create-instance-123')
  .name('创建微信分身')
  .pluginId(this.context.metadata.id)
  .addStep({
    name: '复制应用',
    execute: async () => {
      await fs.copy(sourcePath, targetPath)
    },
    rollback: async () => {
      await fs.rm(targetPath, { recursive: true })
    }
  })
  .addStep({
    name: '修改配置',
    execute: async () => {
      await this.modifyConfig(configPath)
    },
    rollback: async () => {
      await this.restoreConfig(configPath)
    }
  })
  .build()

const result = await this.context.api.transaction.execute(transaction)
```

### 使用 BasePlugin (推荐)

```javascript
import { BasePlugin } from '@main/plugins/base-plugin'

class MyPlugin extends BasePlugin {
  async myFeature() {
    // 1. 请求权限
    const granted = await this.requestFeaturePermissions(
      '功能名称',
      [...]
    )

    if (!granted) {
      return { success: false }
    }

    // 2. 创建事务
    const transaction = this.createTransactionBuilder()
      .name('功能名称')
      .addStep({ ... })
      .build()

    // 3. 执行事务
    return await this.context.api.transaction.execute(transaction)
  }
}
```

## 核心 API

### transaction.execute()

执行事务,保证原子性。

**签名**:
```typescript
execute(transaction: Transaction): Promise<TransactionResult>
```

**参数**: `Transaction` 对象
```typescript
interface Transaction {
  id: string              // 事务唯一标识
  name: string            // 事务名称
  pluginId: string        // 插件 ID
  steps: TransactionStep[]  // 步骤数组
  rollbackOnError?: boolean  // 失败时是否回滚 (默认: true)
  stopOnFirstError?: boolean  // 首次错误时停止 (默认: true)
}

interface TransactionStep {
  name: string              // 步骤名称
  execute: () => Promise<void>  // 执行函数
  rollback?: () => Promise<void>  // 回滚函数
  timeout?: number          // 超时时间 (毫秒,默认: 30000)
}
```

**返回**: `Promise<TransactionResult>`
```typescript
interface TransactionResult {
  success: boolean          // 是否成功
  executedSteps: string[]   // 已执行的步骤名称
  failedStep?: string       // 失败的步骤名称
  rollbackCompleted: boolean  // 回滚是否完成
  error?: string            // 错误信息
}
```

**示例**:
```javascript
const result = await this.context.api.transaction.execute({
  id: 'my-transaction-123',
  name: '我的事务',
  pluginId: this.context.metadata.id,
  steps: [
    {
      name: '步骤 1',
      execute: async () => { /* ... */ },
      rollback: async () => { /* ... */ }
    }
  ]
})
```

### transaction.createBuilder()

创建事务构建器,提供流式 API。

**签名**:
```typescript
createBuilder(): TransactionBuilder
```

**返回**: `TransactionBuilder` 实例

**方法**:
```typescript
class TransactionBuilder {
  id(id: string): this  // 设置事务 ID
  name(name: string): this  // 设置事务名称
  pluginId(pluginId: string): this  // 设置插件 ID
  addStep(step: TransactionStep): this  // 添加步骤
  rollbackOnError(value: boolean): this  // 设置失败时是否回滚
  stopOnFirstError(value: boolean): this  // 设置首次错误时是否停止
  build(): Transaction  // 构建事务对象
}
```

**示例**:
```javascript
const transaction = this.context.api.transaction.createBuilder()
  .id('my-transaction')
  .name('我的事务')
  .pluginId(this.context.metadata.id)
  .addStep({
    name: '步骤 1',
    execute: async () => { /* ... */ },
    rollback: async () => { /* ... */ }
  })
  .addStep({
    name: '步骤 2',
    execute: async () => { /* ... */ },
    rollback: async () => { /* ... */ }
  })
  .build()
```

## 类型定义

### Transaction

```typescript
interface Transaction {
  /** 事务唯一标识 */
  id: string

  /** 事务名称 (用于日志和 UI 显示) */
  name: string

  /** 插件 ID */
  pluginId: string

  /** 事务步骤 */
  steps: TransactionStep[]

  /** 失败时是否回滚 (默认: true) */
  rollbackOnError?: boolean

  /** 首次错误时是否停止 (默认: true) */
  stopOnFirstError?: boolean
}
```

### TransactionStep

```typescript
interface TransactionStep {
  /** 步骤名称 */
  name: string

  /** 执行函数 */
  execute: () => Promise<void>

  /** 回滚函数 (可选,但强烈推荐) */
  rollback?: () => Promise<void>

  /** 超时时间 (毫秒,默认: 30000) */
  timeout?: number
}
```

### TransactionResult

```typescript
interface TransactionResult {
  /** 是否成功 */
  success: boolean

  /** 已执行的步骤名称列表 */
  executedSteps: string[]

  /** 失败的步骤名称 (如果失败) */
  failedStep?: string

  /** 回滚是否完成 (如果执行了回滚) */
  rollbackCompleted: boolean

  /** 错误信息 (如果失败) */
  error?: string
}
```

## 回滚策略库

框架提供了回滚辅助类来简化开发:

### FileRollback - 文件操作回滚

```javascript
import { FileRollback } from '@main/transactions/rollback/file-rollback'

// 写入文件 (自动备份)
await FileRollback.writeFile(filePath, content)

// 复制文件 (自动记录删除操作)
await FileRollback.copy(source, target)

// 创建目录 (自动记录删除操作)
await FileRollback.mkdir(dirPath)

// 移动文件 (自动记录恢复操作)
await FileRollback.move(oldPath, newPath)
```

### ProcessRollback - 进程操作回滚

```javascript
import { ProcessRollback } from '@main/transactions/rollback/process-rollback'

// 启动进程 (自动管理进程生命周期)
const pid = await ProcessRollback.spawn(command, args)

// 终止进程
await ProcessRollback.kill(pid)
```

### ConfigRollback - 配置修改回滚

```javascript
import { ConfigRollback } from '@main/transactions/rollback/config-rollback'

// 修改 JSON 配置 (自动备份)
await ConfigRollback.modifyJsonWithRollback(configPath, (config) => {
  config.newSetting = value
  return config
})
```

**详见**: [完整示例](../examples/transaction-examples.md#示例-3-使用回滚辅助类)

## 使用示例

### 示例 1: 简单的文件操作

```javascript
const result = await this.context.api.transaction.execute({
  id: 'update-config',
  name: '更新配置文件',
  pluginId: this.context.metadata.id,
  steps: [
    {
      name: '备份配置',
      execute: async () => {
        await fs.copy(configPath, backupPath)
      },
      rollback: async () => {
        await fs.unlink(backupPath)
      }
    },
    {
      name: '修改配置',
      execute: async () => {
        const config = JSON.parse(await fs.readFile(configPath))
        config.newSetting = value
        await fs.writeFile(configPath, JSON.stringify(config, null, 2))
      },
      rollback: async () => {
        await fs.copy(backupPath, configPath)
      }
    }
  ]
})
```

### 示例 2: 使用回滚辅助类

```javascript
import { FileRollback } from '@main/transactions/rollback/file-rollback'

const result = await this.context.api.transaction.execute({
  id: 'write-config',
  name: '写入配置',
  pluginId: this.context.metadata.id,
  steps: [
    {
      name: '写入配置文件',
      execute: async () => {
        // FileRollback 自动处理备份和恢复
        await FileRollback.writeFile(configPath, newContent)
      },
      rollback: async () => {
        // FileRollback 已自动处理,这里可以留空
        this.logger.info('配置文件已自动恢复')
      }
    }
  ]
})
```

### 示例 3: 带进度报告的事务

```javascript
// 1. 开始进度报告
this.progressStart('创建分身', 5)

// 2. 执行事务
const result = await this.context.api.transaction.execute(transaction)

// 3. 完成进度报告
if (result.success) {
  this.progressComplete('success')
} else {
  this.progressComplete('error', result.error)
}
```

**完整示例**: 查看 [事务使用示例](../examples/transaction-examples.md)

## 迁移指南

### 从手动执行迁移到事务 API

#### ❌ 旧代码: 手动执行

```javascript
async createInstance() {
  try {
    // 步骤 1
    await fs.mkdir(instancePath)
    this.progressUpdate(1, '创建目录')

    // 步骤 2
    await fs.copy(sourcePath, targetPath)
    this.progressUpdate(2, '复制文件')

    // 步骤 3
    await this.modifyConfig(configPath)
    this.progressUpdate(3, '修改配置')

    this.progressComplete('success')
  } catch (error) {
    // 手动回滚 - 容易遗漏!
    try {
      await fs.rm(instancePath, { recursive: true })
    } catch (cleanupError) {
      // 清理可能失败
    }

    this.progressComplete('error', error.message)
    throw error
  }
}
```

#### ✅ 新代码: 使用事务

```javascript
async createInstance() {
  // 1. 请求权限
  const granted = await this.requestFeaturePermissions(
    '创建微信分身',
    [
      { permission: 'fs:read', required: true },
      { permission: 'fs:write', required: true }
    ]
  )

  if (!granted) {
    return { success: false }
  }

  // 2. 定义事务
  const transaction = this.createTransactionBuilder()
    .name('创建微信分身')
    .addStep({
      name: '创建目录',
      execute: async () => {
        await fs.mkdir(instancePath)
      },
      rollback: async () => {
        await fs.rm(instancePath, { recursive: true })
      }
    })
    .addStep({
      name: '复制文件',
      execute: async () => {
        await fs.copy(sourcePath, targetPath)
      },
      rollback: async () => {
        await fs.rm(targetPath, { recursive: true })
      }
    })
    .addStep({
      name: '修改配置',
      execute: async () => {
        await this.modifyConfig(configPath)
      },
      rollback: async () => {
        await this.restoreConfig(configPath)
      }
    })
    .build()

  // 3. 执行事务 (自动处理进度和回滚)
  return await this.context.api.transaction.execute(transaction)
}
```

**改进点**:
- ✅ 原子性保证: 要么全部成功,要么全部回滚
- ✅ 自动回滚: 失败时自动执行回滚
- ✅ 清晰的错误信息: 明确指出哪个步骤失败
- ✅ 更好的可维护性: 每个步骤的回滚逻辑集中定义

## 最佳实践

### 1. 合理的事务粒度

❌ **太大**: 一个事务包含太多步骤
```javascript
// 一个事务包含 100 个步骤,难以调试
const transaction = this.createTransactionBuilder()
  .name('大事务')
  // ... 100 个步骤
```

✅ **合理**: 分解为多个小事务
```javascript
async completeInstall() {
  // 分解为 3 个事务
  await this.downloadTransaction()
  await this.installTransaction()
  await this.configureTransaction()
}
```

### 2. 所有步骤都应该有回滚

❌ **错误**: 缺少回滚
```javascript
.addStep({
  name: '修改文件',
  execute: async () => {
    await fs.writeFile(path, content)
  }
  // 缺少 rollback!
})
```

✅ **正确**: 定义回滚
```javascript
.addStep({
  name: '修改文件',
  execute: async () => {
    await FileRollback.writeFile(path, content)
  },
  rollback: async () => {
    // FileRollback 已自动处理
  }
})
```

### 3. 健壮的回滚

❌ **不可靠**: 回滚可能失败
```javascript
rollback: async () => {
  await db.revert()  // 如果断开会失败
}
```

✅ **可靠**: 处理回滚失败
```javascript
rollback: async () => {
  try {
    await db.revert()
  } catch (error) {
    // 使用备份恢复
    await db.restore(backupData)
  }
}
```

### 4. 使用辅助类简化开发

```javascript
import { FileRollback, ProcessRollback, ConfigRollback } from '@main/transactions/rollback'

// 自动处理备份和恢复
await FileRollback.writeFile(path, content)
await ProcessRollback.spawn(command, args)
await ConfigRollback.modifyJsonWithRollback(configPath, modifier)
```

### 5. 清晰的错误处理

```javascript
const result = await this.context.api.transaction.execute(transaction)

if (!result.success) {
  this.logger.error(`事务失败: ${result.failedStep}`)
  this.logger.error(`错误: ${result.error}`)

  if (result.rollbackCompleted) {
    this.showMessage('操作失败,但已自动回滚', 'warning')
  } else {
    this.showMessage('操作失败且回滚未完成,请检查系统状态', 'error')
  }
}
```

## 相关文档

- **[事务使用示例](../examples/transaction-examples.md)** - 完整的实战示例
- **[插件开发规范](../standards/plugin-development.md)** - 事务执行规范
- **[权限系统 API](permissions.md)** - 权限请求 API
- **[完整事务系统文档](../../TRANSACTION-SYSTEM.md)** - 系统架构和设计

---

**最后更新**: 2026-01-14
**维护者**: RokunTool 开发团队
