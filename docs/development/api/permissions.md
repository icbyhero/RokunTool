# 权限系统 API 参考

完整的权限系统 API 文档和使用指南。

**⚠️ 重要**: 插件开发者必须先阅读 [插件开发规范](../standards/plugin-development.md)

## 目录

- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [使用示例](#使用示例)
- [迁移指南](#迁移指南)

## 快速开始

### 推荐方式: 功能级权限请求

```javascript
// ✅ 推荐: 一次性请求所有权限
const granted = await this.context.api.permission.requestFeaturePermissions(
  '创建微信分身',  // 功能名称
  [
    { permission: 'fs:write', required: true, reason: '复制和修改文件' },
    { permission: 'process:exec', required: true, reason: '签名应用' }
  ],
  '将创建独立的微信分身实例',  // 功能描述
  { operation: '创建分身', target: instancePath }
)

if (!granted) {
  this.context.ui.showMessage('未授予权限,操作已取消', 'warning')
  return
}

// 继续执行操作...
```

## API 参考

### requestFeaturePermissions()

功能级权限请求 API (推荐使用)

**参数**:
- `featureName` (string): 功能名称
- `permissions` (Array): 权限数组
  - `permission` (PluginPermission): 权限类型
  - `required` (boolean): 是否必需
  - `reason` (string, 可选): 权限原因
- `featureDescription` (string, 可选): 功能描述
- `context` (object, 可选): 操作上下文

**返回**: `Promise<boolean>` - 是否授予所有必需权限

**详见**: [权限系统完整文档](../../PERMISSION-SYSTEM.md)

## 使用示例

### 示例 1: 微信分身插件

```javascript
async createInstance() {
  const granted = await this.context.api.permission.requestFeaturePermissions(
    '创建微信分身',
    [
      {
        permission: 'fs:write',
        required: true,
        reason: '创建微信分身需要复制应用和修改配置文件'
      },
      {
        permission: 'process:exec',
        required: true,
        reason: '签名微信分身需要执行 codesign 命令'
      }
    ],
    `将创建名为"${instanceName}"的微信分身`,
    {
      operation: '创建微信分身',
      target: instancePath
    }
  )

  if (!granted) return null

  // 开始进度报告...
  this.context.api.progress.start('创建分身', 5)
}
```

### 示例 2: Rime 配置插件

```javascript
async installRecipe(recipe) {
  const granted = await this.context.api.permission.requestFeaturePermissions(
    `安装 Rime 配方: ${recipe.name}`,
    [
      {
        permission: 'process:exec',
        required: true,
        reason: '执行 rime-install 命令以下载和安装 Plum 配方'
      }
    ],
    `将安装配方"${recipe.name}",可能需要一些时间下载组件。`,
    {
      operation: '安装配方',
      target: recipe.name
    }
  )

  if (!granted) {
    return { success: false, message: '未授予进程执行权限' }
  }

  // 继续执行安装...
}
```

## 迁移指南

### 从旧 API 迁移

**旧方式** (已废弃):
```javascript
// ❌ 不要使用
const perm1 = await this.context.api.permission.request('fs:write', {...})
const perm2 = await this.context.api.permission.request('process:exec', {...})
```

**新方式** (推荐):
```javascript
// ✅ 使用功能级权限请求
const granted = await this.context.api.permission.requestFeaturePermissions(...)
```

### 迁移检查清单

- [ ] 将所有 `permission.request()` 替换为 `requestFeaturePermissions()`
- [ ] 按功能分组权限 (不是单个操作)
- [ ] 将权限请求移到 `progress.start()` 之前
- [ ] 提供清晰的功能名称和描述
- [ ] 测试权限被拒绝的情况

## 相关文档

- **[插件开发规范](../standards/plugin-development.md)** - 强制性规范
- **[权限系统完整指南](../../PERMISSION-SYSTEM.md)** - 详细文档
- **[事务系统 API](transactions.md)** - 事务执行 API

---

**最后更新**: 2026-01-14
