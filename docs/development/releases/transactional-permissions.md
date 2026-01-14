# 事务性权限管理系统 - 发布说明

**版本**: 1.0.0
**发布日期**: 2026-01-14
**状态**: 已发布

## 概述

事务性权限管理系统是一个重大更新,为插件提供了原子性操作保证和功能级权限请求,显著改善了用户体验和开发体验。

### 主要改进

- ✅ **功能级权限请求**: 一次性请求所有权限,避免多个弹窗
- ✅ **事务执行引擎**: 原子性操作保证,失败自动回滚
- ✅ **回滚策略库**: 简化回滚逻辑,提供常用操作的自动回滚
- ✅ **统一进度报告**: 集成进度报告到事务执行
- ✅ **BasePlugin 基类**: 简化插件开发,提供辅助方法

## 对用户的影响

### 1. 更好的权限请求体验

**之前**:
```
用户点击"创建分身"
  ↓
[权限弹窗] 需要 fs:write 权限?
  ├─ 用户点击"允许"
  ↓
[权限弹窗] 需要 process:exec 权限?
  ├─ 用户点击"允许"
  ↓
开始执行...
```

**现在**:
```
用户点击"创建分身"
  ↓
[权限弹窗] 创建微信分身
  需要:
  ☑ fs:write - 复制和修改文件
  ☑ process:exec - 签名应用

  [拒绝] [本次授权] [永久授权]
  ↓
用户点击"永久授权"
  ↓
开始执行...
```

### 2. 自动回滚保证

**之前**: 失败后留下垃圾数据,用户需要手动清理

**现在**: 失败时自动回滚,系统恢复原状

### 3. 清晰的进度提示

所有长时间操作都显示明确的进度和状态

## 对插件开发者的影响

### 1. 迁移到新的权限 API

#### 旧 API (已废弃)

```javascript
// ❌ 不再推荐
const granted1 = await this.context.api.permission.request('fs:write', {
  reason: '创建分身需要写入文件'
})

const granted2 = await this.context.api.permission.request('process:exec', {
  reason: '签名应用需要执行命令'
})
```

#### 新 API (推荐)

```javascript
// ✅ 推荐
const granted = await this.context.api.permission.requestFeaturePermissions(
  '创建微信分身',
  [
    { permission: 'fs:write', required: true, reason: '复制和修改文件' },
    { permission: 'process:exec', required: true, reason: '签名应用' }
  ],
  '将创建独立的微信应用副本'
)
```

### 2. 使用事务 API

#### 手动执行 (容易出错)

```javascript
// ❌ 旧方式
async createInstance() {
  try {
    await fs.mkdir(instancePath)
    await fs.copy(sourcePath, targetPath)
    await this.modifyConfig(configPath)
  } catch (error) {
    // 需要手动回滚,容易遗漏
    await fs.rm(instancePath, { recursive: true })
    throw error
  }
}
```

#### 事务执行 (推荐)

```javascript
// ✅ 新方式
async createInstance() {
  const transaction = this.createTransactionBuilder()
    .name('创建分身')
    .addStep({
      name: '创建目录',
      execute: async () => await fs.mkdir(instancePath),
      rollback: async () => await fs.rm(instancePath, { recursive: true })
    })
    .addStep({
      name: '复制文件',
      execute: async () => await fs.copy(sourcePath, targetPath),
      rollback: async () => await fs.rm(targetPath, { recursive: true })
    })
    .addStep({
      name: '修改配置',
      execute: async () => await this.modifyConfig(configPath),
      rollback: async () => await this.restoreConfig(configPath)
    })
    .build()

  return await this.context.api.transaction.execute(transaction)
}
```

### 3. 使用 BasePlugin

```javascript
import { BasePlugin } from '@main/plugins/base-plugin'

class MyPlugin extends BasePlugin {
  async myFeature() {
    // 使用简化的 API
    const granted = await this.requestFeaturePermissions(...)
    this.progressStart('功能', 5)

    const transaction = this.createTransactionBuilder()
      .name('功能')
      .addStep({ ... })
      .build()

    return await this.context.api.transaction.execute(transaction)
  }
}
```

## 升级指南

### 对于现有插件

#### 步骤 1: 更新权限请求

找到所有 `permission.request()` 调用,替换为 `requestFeaturePermissions()`:

```javascript
// 之前
const granted1 = await this.context.api.permission.request('fs:write', { reason: '...' })
const granted2 = await this.context.api.permission.request('process:exec', { reason: '...' })

// 之后
const granted = await this.context.api.permission.requestFeaturePermissions(
  '功能名称',
  [
    { permission: 'fs:write', required: true, reason: '...' },
    { permission: 'process:exec', required: true, reason: '...' }
  ],
  '功能描述...'
)
```

#### 步骤 2: 识别多步骤操作

找到包含多个步骤的功能,考虑使用事务:

```javascript
// 之前: 手动执行
async myFeature() {
  try {
    await step1()
    await step2()
    await step3()
    this.progressComplete('success')
  } catch (error) {
    // 手动回滚
    await cleanup()
    this.progressComplete('error', error.message)
  }
}
```

#### 步骤 3: 转换为事务

```javascript
// 之后: 事务执行
async myFeature() {
  const transaction = this.createTransactionBuilder()
    .name('我的功能')
    .addStep({
      name: '步骤 1',
      execute: async () => await step1(),
      rollback: async () => await rollback1()
    })
    .addStep({
      name: '步骤 2',
      execute: async () => await step2(),
      rollback: async () => await rollback2()
    })
    .addStep({
      name: '步骤 3',
      execute: async () => await step3(),
      rollback: async () => await rollback3()
    })
    .build()

  return await this.context.api.transaction.execute(transaction)
}
```

#### 步骤 4: 测试

- 测试成功场景
- 测试失败场景和回滚
- 测试权限请求流程

### 对于新插件

直接使用新的 API:

```javascript
import { BasePlugin } from '@main/plugins/base-plugin'

class MyPlugin extends BasePlugin {
  async myFeature() {
    // 1. 请求权限
    const granted = await this.requestFeaturePermissions(
      '功能名称',
      [
        { permission: 'fs:read', required: true },
        { permission: 'fs:write', required: true }
      ]
    )

    if (!granted) {
      return { success: false }
    }

    // 2. 执行事务
    const transaction = this.createTransactionBuilder()
      .name('功能名称')
      .addStep({ ... })
      .build()

    // 3. 返回结果
    return await this.context.api.transaction.execute(transaction)
  }
}
```

## 新增 API

### 权限 API

- `permission.requestFeaturePermissions()` - 功能级权限请求
- `permission.checkPermissionsEnhanced()` - 增强版权限检查

### 事务 API

- `transaction.execute()` - 执行事务
- `transaction.createBuilder()` - 创建事务构建器

### BasePlugin 辅助方法

- `requestFeaturePermissions()` - 简化的权限请求
- `createTransactionBuilder()` - 简化的事务构建
- `executeTransaction()` - 简化的事务执行
- `progressStart/Update/Complete()` - 简化的进度报告

### 回滚辅助类

- `FileRollback` - 文件操作回滚
- `ProcessRollback` - 进程操作回滚
- `ConfigRollback` - 配置修改回滚

## 废弃的 API

以下 API 已标记为 `@deprecated`:

- `permission.request()` - 逐个权限请求

**注意**: 旧 API 仍然可用,但强烈建议迁移到新 API。未来版本可能会移除旧 API。

## 已知问题

### 1. 回滚可能失败

如果回滚操作本身失败(例如网络断开、磁盘损坏),系统可能无法完全恢复原状。

**缓解措施**:
- 回滚失败会记录详细日志
- 提供手动清理工具(未来版本)

### 2. 长时间运行的事务

事务执行时间过长可能导致用户体验下降。

**建议**:
- 将大任务分解为多个小事务
- 在事务之间提供进度反馈

### 3. 并发事务

当前不支持同一插件的并发事务执行。

**限制**: 同一插件同时只能执行一个事务

## 性能影响

- ✅ **权限预检查**: 纯内存操作,性能影响可忽略
- ✅ **事务执行**: 与手动执行相同,无额外开销
- ✅ **回滚**: 仅在失败时执行,不影响正常流程

## 兼容性

- ✅ **向后兼容**: 旧 API 仍然可用
- ✅ **现有插件**: 无需立即迁移
- ✅ **渐进式升级**: 可以逐步迁移到新 API

## 文档更新

### 新增文档

- [事务系统 API 参考](../api/transactions.md)
- [插件开发规范 - 事务执行规范](../standards/plugin-development.md#事务执行规范)
- [事务使用示例](../examples/transaction-examples.md)

### 更新文档

- [权限系统 API 参考](../api/permissions.md) - 添加功能级权限请求
- [插件开发规范](../standards/plugin-development.md) - 添加事务章节

## 反馈和支持

如果您在使用过程中遇到问题或有改进建议:

1. 查看文档:
   - [API 参考](../api/transactions.md)
   - [使用示例](../examples/transaction-examples.md)
   - [最佳实践](../standards/plugin-development.md#事务执行规范)

2. 提交 Issue:
   - [GitHub Issues](https://github.com/icbyhero/RokunTool/issues)

3. 查看现有示例:
   - Rime 配置插件
   - 微信分身插件

## 致谢

感谢所有参与测试和提供反馈的开发者!

---

**最后更新**: 2026-01-14
**维护者**: RokunTool 开发团队
