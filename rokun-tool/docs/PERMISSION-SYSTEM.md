# 权限系统使用指南

本文档描述 RokunTool 的增强权限系统,包括永久拒绝、批量权限请求等功能。

## 目录

- [概述](#概述)
- [权限状态](#权限状态)
- [单个权限请求](#单个权限请求)
- [批量权限请求](#批量权限请求)
- [权限检查](#权限检查)
- [权限被拒处理](#权限被拒处理)
- [最佳实践](#最佳实践)

## 概述

RokunTool 的权限系统允许插件请求敏感权限(如文件访问、进程执行等),用户可以授予权限、会话级授权或永久拒绝。

### 主要特性

- ✅ **永久授权**: 权限被永久保存,不再询问
- ✅ **会话级授权**: 权限仅在当前会话有效
- ✅ **永久拒绝**: 用户可以永久拒绝某个权限
- ✅ **批量权限请求**: 一次性请求多个权限
- ✅ **权限被拒通知**: 用户永久拒绝权限时,会显示提示通知

### 权限类型

| 权限 | 说明 | 风险等级 |
|-----|------|---------|
| `fs:read` | 文件读取 | 低 |
| `fs:write` | 文件写入 | 高 |
| `process:exec` | 进程执行 | 高 |
| `process:spawn` | 进程启动 | 中 |
| `process:kill` | 进程终止 | 中 |
| `shell:execute` | Shell 执行 | 高 |
| `network:http` | 网络访问 | 中 |
| `clipboard:read` | 剪贴板读取 | 中 |
| `clipboard:write` | 剪贴板写入 | 低 |
| `notification:show` | 显示通知 | 低 |
| `config:read` | 配置读取 | 低 |
| `config:write` | 配置写入 | 中 |
| `window:open` | 打开窗口 | 低 |

## 权限状态

权限可以处于以下状态:

- **PENDING**: 待确认(首次使用时会询问用户)
- **GRANTED**: 已授予(永久或会话级)
- **DENIED**: 已拒绝(会话级,重启应用后可重新询问)
- **PERMANENTLY_DENIED**: 永久拒绝(用户明确拒绝,需要手动清除)

### 状态转换

```
PENDING ──用户点击"拒绝"──> DENIED
PENDING ──用户点击"永久拒绝"──> PERMANENTLY_DENIED
PENDING ──用户点击"本次授权"──> GRANTED (session)
PENDING ──用户点击"永久授权"──> GRANTED (permanent)

DENIED ──应用重启──> PENDING
PERMANENTLY_DENIED ──用户点击"重新询问"──> PENDING
```

## 单个权限请求

### 基础用法

```typescript
class MyPlugin {
  async copyFile(source: string, target: string) {
    // 1. 请求权限
    const granted = await this.context.requestPermission('fs:write', {
      reason: '复制文件需要写入权限',
      context: {
        operation: '复制文件',
        target: target
      }
    })

    // 2. 检查结果
    if (!granted) {
      this.showMessage('操作已取消: 未授予文件写入权限')
      return
    }

    // 3. 执行操作
    await fs.copyFile(source, target)
    this.showMessage('文件复制成功')
  }
}
```

### 检查权限状态

```typescript
async checkAndRequest() {
  // 先检查权限状态
  const result = await this.context.checkPermission('fs:write')

  console.log('权限状态:', result.status)
  // PENDING, GRANTED, DENIED, PERMANENTLY_DENIED

  if (result.status === 'PERMANENTLY_DENIED') {
    this.showMessage('文件写入权限已被永久拒绝,请在设置中重新启用')
    return
  }

  if (result.status === 'GRANTED') {
    // 直接执行操作,无需再次请求
    await this.performWriteOperation()
  } else {
    // PENDING 或 DENIED,需要请求权限
    const granted = await this.context.requestPermission('fs:write')
    if (granted) {
      await this.performWriteOperation()
    }
  }
}
```

## 批量权限请求

当你的功能需要多个权限时,使用批量权限请求可以避免连续弹出多个对话框。

### 定义功能权限

```typescript
class MyPlugin {
  // 定义功能需要的权限常量
  private readonly COPY_FEATURE_PERMISSIONS = [
    'fs:read',
    'fs:write',
    'clipboard:write'
  ] as const
}
```

### 推荐模式: 预检查 + 批量请求

这是最佳实践,可以在执行操作前一次性处理所有权限:

```typescript
async copyFilesFeature() {
  // 步骤1: 预检查所有权限
  const checkResult = await this.context.checkPermissions(
    this.COPY_FEATURE_PERMISSIONS
  )

  // 步骤2: 如果有永久拒绝的权限,立即中止
  if (checkResult.hasPermanentDeny) {
    const deniedNames = checkResult.permanentlyDenied.map(p => this.getPermissionName(p))
    this.showMessage(
      `由于以下权限被永久拒绝,无法执行操作:\n${deniedNames.join('\n')}\n\n` +
      '请在应用设置 > 权限管理中重新启用这些权限。'
    )
    return
  }

  // 步骤3: 批量请求所有需要的权限
  const requestResult = await this.context.requestPermissions(
    this.COPY_FEATURE_PERMISSIONS,
    '复制微信应用需要以下权限',  // 原因说明
    { operation: 'copy-wechat-app' }  // 操作上下文
  )

  // 步骤4: 检查是否所有权限都被授予
  if (!requestResult.allGranted) {
    const deniedPerms = requestResult.results
      .filter(r => !r.granted)
      .map(r => this.getPermissionName(r.permission))

    this.showMessage(
      `操作已取消: 未授予以下权限:\n${deniedPerms.join('\n')}`
    )
    return
  }

  // 步骤5: 执行实际功能
  await this.performCopyFiles()
}

// 辅助方法: 获取权限的中文名称
private getPermissionName(permission: string): string {
  const names: Record<string, string> = {
    'fs:read': '文件读取',
    'fs:write': '文件写入',
    'clipboard:write': '剪贴板写入'
  }
  return names[permission] || permission
}
```

### 批量请求结果

`requestPermissions()` 返回的结果结构:

```typescript
{
  allGranted: boolean,  // 是否所有权限都已授予
  results: [
    {
      permission: 'fs:read',
      granted: true,
      permanent: true  // 是否永久授权
    },
    {
      permission: 'fs:write',
      granted: true,
      permanent: false  // 会话级授权
    },
    {
      permission: 'clipboard:write',
      granted: false
    }
  ]
}
```

## 权限检查

### checkPermissions() 预检查结果

```typescript
const result = await this.context.checkPermissions([
  'fs:read',
  'fs:write',
  'clipboard:write'
])

// 结果结构:
{
  hasPermanentDeny: boolean,  // 是否有永久拒绝的权限
  permanentlyDenied: string[],  // 永久拒绝的权限列表
  pending: string[],           // 待确认的权限列表
  granted: string[]            // 已授予的权限列表
}
```

### 使用场景

```typescript
// 场景1: 在UI中显示权限状态
async displayPermissionStatus() {
  const result = await this.context.checkPermissions([
    'fs:read',
    'fs:write'
  ])

  this.ui.update({
    canRead: result.granted.includes('fs:read'),
    canWrite: result.granted.includes('fs:write'),
    needsPermission: result.pending.length > 0,
    permanentlyDenied: result.permanentlyDenied
  })
}

// 场景2: 提前中止操作
async dangerousOperation() {
  const checkResult = await this.context.checkPermissions([
    'process:exec',
    'fs:write'
  ])

  if (checkResult.hasPermanentDeny) {
    // 不要执行操作,不要弹出对话框
    // 系统会自动显示权限被拒通知
    console.log('操作中止: 存在永久拒绝的权限')
    return
  }

  // 继续执行...
}
```

## 权限被拒处理

### 当权限被永久拒绝时

当用户永久拒绝某个权限后,插件再次请求该权限时:

1. **不会弹出权限请求对话框**
2. `requestPermission()` 直接返回 `false`
3. 系统自动在右下角显示 Toast 通知
4. 用户可以点击"前往设置"按钮

### 插件的最佳处理方式

```typescript
async someFeature() {
  // 方式1: 预检查(推荐)
  const checkResult = await this.context.checkPermissions(['fs:write'])

  if (checkResult.hasPermanentDeny) {
    // 静默中止,让系统显示通知
    return
  }

  // 方式2: 直接请求
  const granted = await this.context.requestPermission('fs:write')

  if (!granted) {
    // 不需要额外提示,系统已经处理
    return
  }

  // 执行操作
  await this.doSomething()
}
```

### 用户如何恢复权限

1. 用户看到权限被拒通知
2. 点击"前往设置"按钮
3. 进入"权限管理"页面
4. 找到对应的权限,点击"重新询问"
5. 下次使用功能时,会重新弹出权限请求对话框

## 最佳实践

### 1. 在功能开始前统一请求权限

❌ **不好的做法**:
```typescript
async badExample() {
  await fs.readFile(path)  // 第一次请求
  await fs.writeFile(path2, data)  // 第二次请求
  await clipboard.write(text)  // 第三次请求
}
```

✅ **好的做法**:
```typescript
async goodExample() {
  // 一次性请求所有权限
  const result = await this.context.requestPermissions([
    'fs:read',
    'fs:write',
    'clipboard:write'
  ])

  if (!result.allGranted) {
    return
  }

  // 执行所有操作
  await fs.readFile(path)
  await fs.writeFile(path2, data)
  await clipboard.write(text)
}
```

### 2. 提供清晰的权限说明

❌ **不好的做法**:
```typescript
await this.context.requestPermission('fs:write')
// 没有说明为什么需要权限
```

✅ **好的做法**:
```typescript
await this.context.requestPermission('fs:write', {
  reason: '为了安装 Rime 配置方案,需要写入配置文件',
  context: {
    operation: '安装配置方案',
    target: '~/Library/Rime/'
  }
})
```

### 3. 尊重用户的选择

```typescript
async handleUserChoice() {
  const granted = await this.context.requestPermission('fs:write')

  if (!granted) {
    // 不要强制执行或重复请求
    this.showMessage('操作已取消')

    // 可选: 提供替代方案
    if (this.hasAlternative()) {
      this.showMessage('您可以选择手动导出配置文件')
    }

    return
  }

  // 执行操作
  await this.doOperation()
}
```

### 4. 合理使用权限状态检查

```typescript
async smartFeature() {
  // 检查是否已有权限
  const checkResult = await this.context.checkPermissions(['fs:write'])

  if (checkResult.granted.includes('fs:write')) {
    // 已有权限,直接执行
    await this.doWriteOperation()
  } else if (checkResult.permanentlyDenied.includes('fs:write')) {
    // 永久拒绝,提供指引
    this.showMessage('请在应用设置中启用文件写入权限')
  } else {
    // 需要请求权限
    const granted = await this.context.requestPermission('fs:write')
    if (granted) {
      await this.doWriteOperation()
    }
  }
}
```

### 5. 区分必需和可选权限

```typescript
async featureWithOptionalPermissions() {
  // 必需权限
  const requiredResult = await this.context.requestPermissions([
    'fs:read',
    'fs:write'
  ])

  if (!requiredResult.allGranted) {
    this.showMessage('缺少必需权限,操作已取消')
    return
  }

  // 可选权限
  const optionalResult = await this.context.requestPermissions([
    'clipboard:write'
  ])

  // 根据可选权限是否授予,提供不同体验
  if (optionalResult.allGranted) {
    await this.copyToClipboard()
  } else {
    // 提供手动复制方式
    this.showManualCopyInstructions()
  }
}
```

## 完整示例

这是一个完整的插件功能示例,展示了权限系统的所有最佳实践:

```typescript
import { PluginContext, Plugin } from '@rokun/tool'

class WeChatInstaller extends Plugin {
  // 定义功能所需的权限
  private readonly INSTALL_PERMISSIONS = [
    'fs:read',
    'fs:write',
    'process:spawn'
  ] as const

  async installWeChat(sourcePath: string, targetPath: string) {
    try {
      // 步骤1: 预检查权限
      const checkResult = await this.context.checkPermissions(
        this.INSTALL_PERMISSIONS
      )

      // 步骤2: 处理永久拒绝
      if (checkResult.hasPermanentDeny) {
        const deniedNames = checkResult.permanentlyDenied.join(', ')
        this.showMessage(
          `以下权限已被永久拒绝: ${deniedNames}\n` +
          '请在应用设置 > 权限管理中重新启用'
        )
        return { success: false, error: '权限被拒绝' }
      }

      // 步骤3: 批量请求权限
      const requestResult = await this.context.requestPermissions(
        this.INSTALL_PERMISSIONS,
        '安装微信应用需要以下权限',
        {
          operation: '安装微信应用',
          target: targetPath
        }
      )

      // 步骤4: 检查结果
      if (!requestResult.allGranted) {
        this.showMessage('未授予所有必需权限,操作已取消')
        return { success: false, error: '权限不足' }
      }

      // 步骤5: 执行安装
      await this.performInstall(sourcePath, targetPath)

      this.showMessage('微信应用安装成功!')
      return { success: true }

    } catch (error) {
      console.error('安装失败:', error)
      this.showMessage(`安装失败: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  private async performInstall(sourcePath: string, targetPath: string) {
    // 检查源文件
    const sourceExists = await fs.exists(sourcePath)
    if (!sourceExists) {
      throw new Error('源文件不存在')
    }

    // 创建目标目录
    await fs.mkdir(dirname(targetPath), { recursive: true })

    // 复制文件
    await fs.copyFile(sourcePath, targetPath)

    // 启动应用
    await this.context.spawnProcess(targetPath, [])
  }
}

export default WeChatInstaller
```

## 常见问题

### Q: 权限请求对话框没有弹出?

**A**: 检查以下几点:
1. 权限是否已经被授予(使用 `checkPermission()` 检查状态)
2. 权限是否被永久拒绝(查看设置 > 权限管理)
3. 控制台是否有错误日志

### Q: 如何让用户重新授权永久拒绝的权限?

**A**: 引导用户前往"设置 > 权限管理",找到对应权限,点击"重新询问"按钮。

### Q: 会话级权限何时失效?

**A**: 会话级权限在以下情况下失效:
- 应用关闭后重启
- 插件被卸载后重新加载
- 用户手动撤销权限

### Q: 批量请求时可以只授权部分权限吗?

**A**: 当前版本不支持部分授权。用户必须选择"全部授权"或"全部拒绝"。未来版本可能支持部分授权。

### Q: 如何测试权限功能?

**A**:
1. 在"设置 > 权限管理"中清除所有权限
2. 重启应用
3. 触发需要权限的功能
4. 验证权限请求对话框是否弹出
5. 测试不同的授权选项(永久/会话/拒绝)

## 参考文档

- [插件开发指南](./PLUGIN-DEVELOPMENT.md)
- [API 参考](./API-REFERENCE.md)
- [权限系统设计](../openspec/specs/permission-system/)
