# 事务系统使用指南

本文档描述 RokunTool 的事务执行系统,它提供了原子性操作执行和自动回滚能力。

## 目录

- [概述](#概述)
- [核心概念](#核心概念)
- [基本用法](#基本用法)
- [高级用法](#高级用法)
- [回滚策略](#回滚策略)
- [进度报告](#进度报告)
- [事务日志](#事务日志)
- [最佳实践](#最佳实践)
- [完整示例](#完整示例)

## 概述

事务系统允许插件将多个操作组合成一个原子单元,要么全部成功,要么全部回滚。

### 主要特性

- ✅ **原子性**: 多个操作要么全部成功,要么全部失败
- ✅ **自动回滚**: 失败时自动执行已执行操作的逆操作
- ✅ **超时控制**: 每个步骤可以配置超时时间
- ✅ **进度报告**: 自动集成进度报告系统
- ✅ **事务日志**: 完整记录事务执行过程
- ✅ **灵活配置**: 支持多种回滚策略

### 适用场景

- **文件操作**: 复制、移动、修改多个文件
- **配置变更**: 修改多个配置项
- **进程管理**: 启动多个相互依赖的进程
- **插件安装**: 解压、复制、配置等多个步骤
- **数据迁移**: 批量数据转换和迁移

## 核心概念

### 事务 (Transaction)

事务是一个包含多个步骤的操作单元,具有以下属性:

```typescript
interface Transaction {
  id: string              // 唯一标识符
  name: string            // 事务名称
  description?: string    // 事务描述
  pluginId: string        // 插件ID
  steps: TransactionStep[] // 所有步骤
  options?: TransactionOptions // 配置选项
}
```

### 事务步骤 (TransactionStep)

每个步骤包含执行逻辑和可选的回滚逻辑:

```typescript
interface TransactionStep {
  name: string              // 步骤名称
  execute: () => Promise<void>  // 执行函数
  rollback?: () => Promise<void> // 回滚函数 (可选)
  timeout?: number          // 超时时间(毫秒)
  description?: string      // 步骤描述
}
```

### 事务结果 (TransactionResult)

事务执行完成后返回的结果:

```typescript
interface TransactionResult {
  transactionId: string
  success: boolean
  executedSteps: number    // 已执行的步骤数
  totalSteps: number       // 总步骤数
  error?: string           // 错误信息
  rollbackInfo?: {         // 回滚信息
    success: boolean
    rolledBackSteps: number
    errors: Array<{ step: string; error: string }>
  }
}
```

## 基本用法

### 方法1: 直接构建事务对象

```typescript
class MyPlugin {
  async installFeature() {
    // 定义事务
    const transaction = {
      id: `install-${Date.now()}`,
      name: '安装功能',
      pluginId: this.context.metadata.id,
      steps: [
        {
          name: '检查依赖',
          execute: async () => {
            console.log('检查依赖...')
          }
        },
        {
          name: '下载文件',
          execute: async () => {
            console.log('下载文件...')
            await this.downloadFile()
          },
          rollback: async () => {
            console.log('删除已下载的文件...')
            await this.deleteDownloadedFile()
          }
        },
        {
          name: '安装文件',
          execute: async () => {
            console.log('安装文件...')
            await this.installFiles()
          },
          rollback: async () => {
            console.log('卸载文件...')
            await this.uninstallFiles()
          }
        }
      ]
    }

    // 执行事务
    const result = await this.context.api.transaction.execute(transaction)

    if (result.success) {
      this.context.ui.showMessage('安装成功!', 'info')
    } else {
      this.context.ui.showMessage(`安装失败: ${result.error}`, 'error')
    }
  }
}
```

### 方法2: 使用 TransactionBuilder (推荐)

```typescript
class MyPlugin {
  async installFeature() {
    // 使用构建器创建事务
    const transaction = this.context.api.transaction.createBuilder()
      .id(`install-${Date.now()}`)
      .name('安装功能')
      .pluginId(this.context.metadata.id)
      .addStep({
        name: '检查依赖',
        execute: async () => {
          console.log('检查依赖...')
        }
      })
      .addStep({
        name: '下载文件',
        execute: async () => {
          await this.downloadFile()
        },
        rollback: async () => {
          await this.deleteDownloadedFile()
        }
      })
      .addStep({
        name: '安装文件',
        execute: async () => {
          await this.installFiles()
        },
        rollback: async () => {
          await this.uninstallFiles()
        }
      })
      .build()

    // 执行事务
    const result = await this.context.api.transaction.execute(transaction)

    if (result.success) {
      this.context.ui.showMessage('安装成功!', 'info')
    } else {
      this.context.ui.showMessage(`安装失败: ${result.error}`, 'error')
    }
  }
}
```

## 高级用法

### 配置事务选项

```typescript
const transaction = {
  id: 'my-transaction',
  name: '复杂操作',
  pluginId: this.context.metadata.id,
  steps: [...],
  options: {
    autoRollback: true,                  // 失败时自动回滚 (默认)
    continueOnRollbackError: false,      // 回滚失败时停止 (默认)
    defaultTimeout: 30000,               // 默认超时30秒
    enableLogging: true                  // 启用日志 (默认)
  }
}
```

### 步骤超时控制

```typescript
{
  name: '长时间操作',
  timeout: 60000,  // 60秒超时
  execute: async () => {
    // 执行可能耗时的操作
  }
}
```

### 步骤间数据传递

通过闭包在步骤间传递数据:

```typescript
let downloadedFile: string | null = null

const transaction = createBuilder()
  .id('data-pass')
  .name('数据传递示例')
  .pluginId(this.context.metadata.id)
  .addStep({
    name: '下载文件',
    execute: async () => {
      downloadedFile = await this.downloadFile()
    },
    rollback: async () => {
      if (downloadedFile) {
        await fs.unlink(downloadedFile)
      }
    }
  })
  .addStep({
    name: '处理文件',
    execute: async () => {
      if (downloadedFile) {
        await this.processFile(downloadedFile)
      }
    }
  })
  .build()
```

## 回滚策略

### 完整回滚

每个步骤都提供回滚函数:

```typescript
{
  name: '修改配置',
  execute: async () => {
    const oldConfig = await this.readConfig()
    await this.writeConfig(newConfig)
  },
  rollback: async () => {
    await this.writeConfig(oldConfig)
  }
}
```

### 部分回滚

有些步骤无法回滚,可以省略 rollback 函数:

```typescript
{
  name: '发送通知',
  execute: async () => {
    await this.sendNotification('操作完成')
  }
  // 没有 rollback - 发送的通知无法撤销
}
```

### 回滚失败处理

配置回滚失败时的行为:

```typescript
options: {
  continueOnRollbackError: true  // 回滚失败时继续执行其他回滚
}
```

### 使用回滚辅助工具

RokunTool 提供了预构建的回滚辅助类,可以简化回滚逻辑的编写。

#### 导入回滚辅助工具

```typescript
import {
  copyWithRollback,
  writeWithRollback,
  mkdirWithRollback,
  modifyJsonWithRollback,
  spawnWithRollback
} from '@/main/rollback'
```

#### 文件操作回滚示例

```typescript
.addStep({
  name: '复制配置文件',
  execute: async () => {
    // copyWithRollback 返回回滚函数
    this.rollbackStack.push(await copyWithRollback(
      '/path/to/source/config.json',
      '/path/to/target/config.json'
    ))
  },
  rollback: async () => {
    // 执行栈中的所有回滚
    for (const rollback of this.rollbackStack.reverse()) {
      await rollback()
    }
  }
})
```

#### 更简洁的模式 - 使用闭包

```typescript
let rollbackCopy: (() => void) | null = null

.addStep({
  name: '复制配置文件',
  execute: async () => {
    rollbackCopy = await copyWithRollback(
      '/path/to/source/config.json',
      '/path/to/target/config.json'
    )
  },
  rollback: async () => {
    if (rollbackCopy) {
      await rollbackCopy()
    }
  }
})
```

#### 配置修改回滚示例

```typescript
let rollbackConfig: (() => Promise<void>) | null = null

.addStep({
  name: '修改应用配置',
  execute: async () => {
    rollbackConfig = await modifyJsonWithRollback(
      '/path/to/config.json',
      (config) => {
        config.server.port = 8080
        config.server.host = 'localhost'
        return config
      },
      {
        validate: (c) => c.server && typeof c.server.port === 'number'
      }
    )
  },
  rollback: async () => {
    if (rollbackConfig) {
      await rollbackConfig()
    }
  }
})
```

#### 进程启动回滚示例

```typescript
let rollbackProcess: (() => Promise<void>) | null = null
let serverPid: number | null = null

.addStep({
  name: '启动服务器',
  execute: async () => {
    const { pid, rollback } = await spawnWithRollback(
      'node',
      ['server.js'],
      { cwd: '/path/to/server' }
    )
    serverPid = pid
    rollbackProcess = rollback
  },
  rollback: async () => {
    if (rollbackProcess) {
      await rollbackProcess()
    }
  }
})
```

#### 可用的回滚辅助函数

**文件操作**:
- `copyWithRollback(source, target)` - 复制文件
- `writeWithRollback(filePath, data)` - 写入文件
- `mkdirWithRollback(dirPath)` - 创建目录
- `moveWithRollback(source, target)` - 移动文件
- `copyDirWithRollback(source, target)` - 复制目录

**进程操作**:
- `spawnWithRollback(command, args, options)` - 启动进程
- `execWithRollback(command, args, options)` - 执行并等待
- `waitForProcess(pid, timeout)` - 等待进程退出
- `killProcesses(pids, timeout)` - 批量终止进程

**配置操作**:
- `modifyJsonWithRollback(filePath, modifier, options)` - 修改JSON配置
- `modifyConfigValueWithRollback(filePath, key, value, options)` - 修改单个配置项
- `modifyConfigValuesWithRollback(filePath, changes, options)` - 批量修改配置
- `deleteConfigValueWithRollback(filePath, key, options)` - 删除配置项

## 进度报告

事务系统自动集成进度报告,无需额外配置:

```typescript
// 事务执行时,会自动:
// 1. 调用 progress.start(name, totalSteps)
// 2. 每个步骤调用 progress.update(stepName, stepIndex)
// 3. 完成时调用 progress.complete('success' 或 'error', message)

const result = await this.context.api.transaction.execute(transaction)
```

UI 会自动显示进度条和步骤信息。

## 事务日志

### 日志存储位置

日志存储在 `userData/logs/transactions/` 目录,按日期分文件:

```
~/Library/Application Support/RokunTool/logs/transactions/
├── 2025-01-14.jsonl
├── 2025-01-15.jsonl
└── 2025-01-16.jsonl
```

### 日志格式

每行一个 JSON 对象:

```json
{"transactionId":"tx-123","timestamp":"2025-01-14T10:30:00.000Z","level":"info","event":"transaction_start","data":{"transactionName":"安装功能","pluginId":"my-plugin"}}
{"transactionId":"tx-123","timestamp":"2025-01-14T10:30:01.000Z","level":"info","event":"step_start","data":{"stepName":"检查依赖","stepIndex":0}}
{"transactionId":"tx-123","timestamp":"2025-01-14T10:30:01.500Z","level":"success","event":"step_success","data":{"stepName":"检查依赖","stepIndex":0}}
{"transactionId":"tx-123","timestamp":"2025-01-14T10:30:02.000Z","level":"success","event":"transaction_success","data":{"executedSteps":3}}
```

### 日志事件类型

- `transaction_start`: 事务开始
- `step_start`: 步骤开始
- `step_success`: 步骤成功
- `step_failed`: 步骤失败
- `transaction_success`: 事务成功
- `transaction_failed`: 事务失败

## 最佳实践

### 1. 合理划分步骤

❌ **不好的做法** - 一个步骤做太多事情:
```typescript
{
  name: '安装功能',
  execute: async () => {
    await this.checkDependency()
    await this.downloadFile()
    await this.installFile()
    await this.configure()
  }
}
```

✅ **好的做法** - 拆分成多个步骤:
```typescript
.addStep({ name: '检查依赖', execute: async () => { ... } })
.addStep({ name: '下载文件', execute: async () => { ... } })
.addStep({ name: '安装文件', execute: async () => { ... } })
.addStep({ name: '配置', execute: async () => { ... } })
```

### 2. 回滚要完整

❌ **不好的做法** - 回滚不完整:
```typescript
{
  name: '安装文件',
  execute: async () => {
    await fs.mkdir(targetDir)
    await fs.copyFile(src1, target1)
    await fs.copyFile(src2, target2)
  },
  rollback: async () => {
    await fs.unlink(target1)  // 忘记删除 target2 和目录
  }
}
```

✅ **好的做法** - 完整回滚:
```typescript
{
  name: '安装文件',
  execute: async () => {
    await fs.mkdir(targetDir, { recursive: true })
    await fs.copyFile(src1, target1)
    await fs.copyFile(src2, target2)
  },
  rollback: async () => {
    await fs.unlink(target1)
    await fs.unlink(target2)
    await fs.rm(targetDir, { recursive: true })
  }
}
```

### 3. 处理异常

❌ **不好的做法** - 忽略错误:
```typescript
{
  name: '安装文件',
  execute: async () => {
    await fs.copyFile(src, target)  // 可能抛出异常
  }
}
```

✅ **好的做法** - 捕获并重新抛出:
```typescript
{
  name: '安装文件',
  execute: async () => {
    try {
      await fs.copyFile(src, target)
    } catch (error) {
      throw new Error(`文件复制失败: ${error.message}`)
    }
  }
}
```

### 4. 步骤幂等性

确保步骤可以安全地重复执行:

```typescript
{
  name: '创建目录',
  execute: async () => {
    await fs.mkdir(targetDir, { recursive: true })  // recursive: true 确保幂等性
  },
  rollback: async () => {
    await fs.rm(targetDir, { recursive: true })
  }
}
```

### 5. 合理使用超时

为可能长时间运行的步骤设置合适的超时:

```typescript
{
  name: '下载大文件',
  timeout: 300000,  // 5分钟
  execute: async () => {
    await this.downloadLargeFile()
  }
}
```

## 完整示例

### 示例1: 微信副本创建

```typescript
class WeChatPlugin {
  async createInstance(sourcePath: string, targetPath: string) {
    let bundleIdModified = false
    let filesCopied = false

    const transaction = this.context.api.transaction.createBuilder()
      .id(`create-instance-${Date.now()}`)
      .name('创建微信副本')
      .pluginId(this.context.metadata.id)
      .addStep({
        name: '检查源应用',
        execute: async () => {
          if (!await fs.exists(sourcePath)) {
            throw new Error('源应用不存在')
          }
        }
      })
      .addStep({
        name: '创建目标目录',
        execute: async () => {
          await fs.mkdir(dirname(targetPath), { recursive: true })
        },
        rollback: async () => {
          await fs.rm(dirname(targetPath), { recursive: true })
        }
      })
      .addStep({
        name: '复制应用文件',
        timeout: 120000,  // 2分钟
        execute: async () => {
          await fs.copy(sourcePath, targetPath, { recursive: true })
          filesCopied = true
        },
        rollback: async () => {
          if (filesCopied) {
            await fs.rm(targetPath, { recursive: true })
          }
        }
      })
      .addStep({
        name: '修改Bundle ID',
        execute: async () => {
          await this.modifyBundleId(targetPath)
          bundleIdModified = true
        },
        rollback: async () => {
          if (bundleIdModified) {
            await this.restoreBundleId(targetPath)
          }
        }
      })
      .build()

    const result = await this.context.api.transaction.execute(transaction)

    if (result.success) {
      this.context.ui.showMessage('微信副本创建成功!', 'info')
      return { success: true, path: targetPath }
    } else {
      this.context.ui.showMessage(`创建失败: ${result.error}`, 'error')
      return { success: false, error: result.error }
    }
  }
}
```

### 示例2: Rime 配置安装

```typescript
class RimePlugin {
  async installRecipe(recipeId: string) {
    let downloaded = false
    let installed = false
    let deployed = false

    const transaction = this.context.api.transaction.createBuilder()
      .id(`install-recipe-${recipeId}`)
      .name('安装 Rime 配置方案')
      .pluginId(this.context.metadata.id)
      .addStep({
        name: '检查冲突',
        execute: async () => {
          const conflict = await this.checkConflict(recipeId)
          if (conflict) {
            throw new Error(`存在冲突的配置: ${conflict}`)
          }
        }
      })
      .addStep({
        name: '下载配置',
        timeout: 180000,  // 3分钟
        execute: async () => {
          await this.downloadRecipe(recipeId)
          downloaded = true
        },
        rollback: async () => {
          if (downloaded) {
            await this.deleteDownloadedRecipe(recipeId)
          }
        }
      })
      .addStep({
        name: '安装配置文件',
        execute: async () => {
          await this.installRecipeFiles(recipeId)
          installed = true
        },
        rollback: async () => {
          if (installed) {
            await this.uninstallRecipeFiles(recipeId)
          }
        }
      })
      .addStep({
        name: '部署 Rime',
        timeout: 60000,  // 1分钟
        execute: async () => {
          await this.deployRime()
          deployed = true
        },
        rollback: async () => {
          // 部署操作无法回滚,用户可以重新部署
        }
      })
      .build()

    // 报告进度
    this.context.progress.start('安装配置方案', 4)

    const result = await this.context.api.transaction.execute(transaction)

    if (result.success) {
      this.context.ui.showMessage('配置方案安装成功!', 'info')
    } else {
      this.context.ui.showMessage(`安装失败: ${result.error}`, 'error')
    }

    return result.success
  }
}
```

### 示例3: 批量文件处理

```typescript
class FileProcessor {
  async processFiles(files: string[]) {
    const processedFiles: string[] = []

    const builder = this.context.api.transaction.createBuilder()
      .id(`process-files-${Date.now()}`)
      .name('批量处理文件')
      .pluginId(this.context.metadata.id)

    // 动态添加步骤
    for (const file of files) {
      builder.addStep({
        name: `处理 ${basename(file)}`,
        execute: async () => {
          await this.processFile(file)
          processedFiles.push(file)
        },
        rollback: async () => {
          await this.undoProcessFile(file)
        }
      })
    }

    const transaction = builder.build()
    const result = await this.context.api.transaction.execute(transaction)

    return result.success
  }
}
```

## 常见问题

### Q: 事务执行很慢怎么办?

**A**:
1. 检查是否有步骤超时设置过长
2. 使用性能分析工具找出慢步骤
3. 考虑并行执行独立步骤(需要手动实现)

### Q: 回滚失败怎么办?

**A**:
1. 设置 `continueOnRollbackError: true` 继续执行其他回滚
2. 检查回滚逻辑是否完整
3. 记录详细的错误日志

### Q: 如何调试事务?

**A**:
1. 查看事务日志: `userData/logs/transactions/`
2. 在每个步骤中添加 console.log
3. 使用 try-catch 捕获详细错误信息

### Q: 事务可以嵌套吗?

**A**: 当前版本不支持事务嵌套。如果需要,可以将子事务作为步骤实现。

## 参考文档

- [插件开发指南](./PLUGIN-DEVELOPMENT.md)
- [权限系统文档](./PERMISSION-SYSTEM.md)
- [API 参考](./API-REFERENCE.md)
- [事务系统设计](../openspec/specs/transactional-permissions/)
