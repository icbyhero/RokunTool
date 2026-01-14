# 事务系统 API 参考

完整的事务执行和回滚 API 文档。

## 目录

- [快速开始](#快速开始)
- [核心 API](#核心-api)
- [回滚策略](#回滚策略)
- [使用示例](#使用示例)

## 快速开始

### 基础用法

```javascript
// 创建并执行事务
const result = await this.context.api.transaction.execute({
  name: '安装配方',
  steps: [
    {
      name: '创建备份',
      execute: async () => { /* ... */ },
      rollback: async () => { /* ... */ }
    },
    {
      name: '安装配方',
      execute: async () => { /* ... */ },
      rollback: async () => { /* ... */ }
    }
  ]
})
```

### 使用 Builder

```javascript
const builder = this.context.api.transaction.create('安装配方')

builder
  .addStep({
    name: '创建备份',
    execute: async () => await this.createBackup(),
    rollback: async () => await this.deleteBackup()
  })
  .addStep({
    name: '安装配方',
    execute: async () => await this.install(),
    rollback: async () => await this.uninstall()
  })

const result = await builder.execute()
```

## 核心 API

### executeTransaction()

执行事务

**参数**: `Transaction` 对象
- `name`: 事务名称
- `steps`: 步骤数组
- `options`: 选项 (可选)

**返回**: `Promise<TransactionResult>`

**详见**: [事务系统完整文档](../../TRANSACTION-SYSTEM.md)

## 使用示例

### 示例: 带回滚的文件操作

```javascript
const result = await this.context.api.transaction.execute({
  name: '配置文件修改',
  steps: [
    {
      name: '备份配置',
      execute: async () => {
        await fs.copyFile(configPath, backupPath)
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
        await fs.writeFile(configPath, JSON.stringify(config))
      },
      rollback: async () => {
        await fs.copyFile(backupPath, configPath)
      }
    }
  ]
})
```

## 回滚策略

### 文件操作回滚

详见: [回滚策略库](../../TRANSACTION-SYSTEM.md#回滚策略库)

### 辅助函数

```javascript
const { copyWithRollback } = require('../rollback/file-rollback')

await copyWithRollback(source, target, {
  context: this.context,
  rollbackContext: {
    operationId: 'copy-file',
    actions: []
  }
})
```

## 相关文档

- **[事务系统完整指南](../../TRANSACTION-SYSTEM.md)** - 详细文档
- **[权限系统 API](permissions.md)** - 权限请求 API
- **[插件开发规范](../standards/plugin-development.md)** - 插件规范

---

**最后更新**: 2026-01-14
