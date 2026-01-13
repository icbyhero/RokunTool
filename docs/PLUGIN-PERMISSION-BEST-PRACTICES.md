# 插件权限申请最佳实践

## 概述

本文档说明了插件在使用敏感权限时的正确模式,确保:
1. 在执行任何需要权限的操作**之前**先申请权限
2. 权限请求对话框拥有最高的 z-index 层级
3. 用户友好地处理权限拒绝情况

## 修复内容

### 1. 权限对话框层级修复

**问题**: 权限请求对话框可能被其他 UI(如加载页面)遮挡

**修复**:
- 文件: `src/renderer/src/components/permissions/PermissionRequestDialog.tsx`
- 将 z-index 从 `z-50` 提升到 `z-[9999]`
- 确保权限对话框始终显示在最顶层

**修改前**:
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
```

**修改后**:
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
```

### 2. 插件权限申请最佳实践

#### ✅ 正确模式:在操作前申请权限

```javascript
async deleteInstance(instanceId) {
  // 1. 先申请权限
  const hasPermission = await this.context.api.permission.request('fs:write', {
    reason: '删除微信分身需要删除文件',
    context: {
      operation: '删除应用',
      target: instance.path
    }
  })

  // 2. 检查权限是否授予
  if (!hasPermission) {
    throw new Error('未授予文件写入权限，无法删除微信分身')
  }

  // 3. 权限授予后才执行实际操作
  try {
    await execAsync(`rm -rf "${instance.realPath}"`)
    this.context.logger.info(`文件已删除: ${instance.realPath}`)
  } catch (error) {
    this.context.logger.error('删除文件失败:', error)
    throw error
  }
}
```

#### ❌ 错误模式:在操作中申请权限

```javascript
// 错误示例 - 不要这样做!
async badDeleteInstance(instanceId) {
  try {
    // 直接执行操作,在操作过程中申请权限
    await execAsync(`rm -rf "${instance.realPath}"`)

    // 然后才申请权限 - 太晚了!
    const hasPermission = await this.context.api.permission.request('fs:write')
  } catch (error) {
    // 错误处理
  }
}
```

## 标准流程

### 单权限操作流程

```javascript
async performSinglePermissionOperation() {
  // Step 1: 申请权限
  const hasPermission = await this.context.api.permission.request('fs:write', {
    reason: '为什么需要这个权限',
    context: {
      operation: '操作名称',
      target: '目标文件/路径'
    }
  })

  // Step 2: 检查权限
  if (!hasPermission) {
    this.context.logger.warn('用户拒绝了权限请求')
    return { success: false, reason: 'permission_denied' }
  }

  // Step 3: 执行操作
  try {
    // 实际的操作代码
    await doSomething()
    return { success: true }
  } catch (error) {
    this.context.logger.error('操作失败:', error)
    throw error
  }
}
```

### 多权限操作流程(推荐)

对于需要多个权限的操作,应该:

1. **在功能入口处定义需要的所有权限**
2. **提前检查所有权限状态**
3. **如有永久拒绝,立即中止并通知用户**
4. **批量请求所有待确认权限**
5. **所有权限授予后才执行操作**

```javascript
// 定义功能需要的权限
const COPY_FEATURE_PERMISSIONS = [
  'fs:read',
  'fs:write',
  'clipboard:write'
]

async copyFilesFeature() {
  // Step 1: 检查所有权限状态(不弹对话框)
  const checkResult = await this.checkPermissions(COPY_FEATURE_PERMISSIONS)

  // Step 2: 如果有永久拒绝的权限,立即中止
  if (checkResult.hasPermanentDeny) {
    this.showMessage(
      '由于权限被拒绝,无法执行复制操作。' +
      '请查看右下角的通知了解详情。'
    )
    return
  }

  // Step 3: 批量请求所有权限
  const requestResult = await this.requestPermissions(
    COPY_FEATURE_PERMISSIONS,
    '复制微信应用需要以下权限',
    { operation: 'copy-wechat-app' }
  )

  // Step 4: 检查是否全部授予
  if (!requestResult.allGranted) {
    const deniedPerms = requestResult.results
      .filter(r => !r.granted)
      .map(r => r.permission)

    this.showMessage(
      `操作已取消: 未授予以下权限: ${deniedPerms.join(', ')}`
    )
    return
  }

  // Step 5: 执行实际功能
  await this.performCopy()
}
```

## 常见权限使用场景

### 文件系统操作

```javascript
// fs:read - 读取文件
async readFile(filePath) {
  const hasPermission = await this.context.api.permission.request('fs:read', {
    reason: '读取配置文件',
    context: { operation: '读取配置', target: filePath }
  })

  if (!hasPermission) return null

  return await fs.readFile(filePath, 'utf-8')
}

// fs:write - 写入文件
async writeFile(filePath, content) {
  const hasPermission = await this.context.api.permission.request('fs:write', {
    reason: '保存配置到文件',
    context: { operation: '保存配置', target: filePath }
  })

  if (!hasPermission) return false

  await fs.writeFile(filePath, content)
  return true
}
```

### 进程执行

```javascript
// process:exec - 执行系统命令
async signApp(appPath) {
  const hasPermission = await this.context.api.permission.request('process:exec', {
    reason: '签名应用需要执行 codesign 命令',
    context: { operation: '签名应用', target: appPath }
  })

  if (!hasPermission) {
    throw new Error('未授予进程执行权限')
  }

  await execAsync(`codesign --force --deep --sign - "${appPath}"`)
}
```

### 剪贴板操作

```javascript
// clipboard:write - 写入剪贴板
async copyToClipboard(text) {
  const hasPermission = await this.context.api.permission.request('clipboard:write', {
    reason: '复制文本到剪贴板',
    context: { operation: '复制文本' }
  })

  if (!hasPermission) return

  await this.context.api.clipboard.writeText(text)
}
```

## 权限请求参数说明

### reason 参数
- **必填**: 描述为什么需要这个权限
- **应该**: 简洁明确,用户能理解
- **示例**:
  - ✅ "删除微信分身需要删除文件"
  - ❌ "需要权限"

### context 参数
- **必填**: 提供操作上下文信息
- **operation**: 操作名称(如"删除应用"、"复制文件")
- **target**: 操作目标(如文件路径、应用名称)

**完整示例**:
```javascript
await this.context.api.permission.request('fs:write', {
  reason: '删除微信分身需要删除文件',
  context: {
    operation: '删除应用',
    target: '/Applications/WeChat2.app'
  }
})
```

## 错误处理

### 1. 权限被拒绝

```javascript
const hasPermission = await this.context.api.permission.request('fs:write', {
  reason: '...',
  context: { ... }
})

if (!hasPermission) {
  // 不要显示错误对话框,系统会自动处理
  // 只记录日志
  this.context.logger.info('用户拒绝了权限请求')
  return
}
```

### 2. 权限被永久拒绝

```javascript
// 在未来的批量权限 API 中
const checkResult = await this.checkPermissions(['fs:write'])

if (checkResult.hasPermanentDeny) {
  // 系统会自动显示 Toast 通知
  // 插件只需要中止操作
  this.context.logger.info('权限已被永久拒绝,中止操作')
  return
}
```

## 实际插件示例

### 微信分身插件 (wechat-multi-instance)

**创建分身功能**:
```javascript
async createInstance(instanceName, bundleId) {
  // 1. 报告进度
  this.context.api.progress.start(`创建分身 - ${instanceName}`, 7)

  // 2. 申请 fs:write 权限
  this.context.api.progress.update(2, '请求权限', '请求文件写入权限...')
  const hasPermission = await this.context.api.permission.request('fs:write', {
    reason: '创建微信分身需要复制和修改文件',
    context: {
      operation: '复制微信应用',
      target: instancePath
    }
  })

  if (!hasPermission) {
    throw new Error('未授予文件写入权限，无法创建微信分身')
  }

  // 3. 执行创建操作
  this.context.api.progress.update(3, '复制文件', '正在复制微信应用...')
  await this.copyDirectory(weChatPath, instancePath)

  // ... 后续操作
}
```

## 总结

### 关键原则

1. **先权限,后操作** - 永远在执行操作前申请权限
2. **明确说明** - reason 和 context 参数要清晰明确
3. **优雅降级** - 权限被拒绝时要优雅处理,不要崩溃
4. **用户体验** - 使用进度报告让用户了解当前状态

### 检查清单

插件开发时,确保每个需要权限的功能都:
- [ ] 在操作前调用 `permission.request()`
- [ ] 提供清晰的 `reason` 说明
- [ ] 提供详细的 `context` 信息
- [ ] 检查权限是否授予
- [ ] 优雅处理权限拒绝情况
- [ ] 记录相关日志

## 相关文件

- 权限管理器: `src/main/permissions/permission-manager.ts`
- 权限对话框: `src/renderer/src/components/permissions/PermissionRequestDialog.tsx`
- 插件 API: `src/main/plugins/plugin-context.ts`
- 微信分身插件示例: `plugins/wechat-multi-instance/index.js`
