# 插件开发规范

本文档定义了 RokunTool 插件开发必须遵循的规范和最佳实践。

## 目录

- [权限请求规范](#权限请求规范) ⚠️ **强制要求**
- [插件结构](#插件结构)
- [错误处理](#错误处理)
- [进度报告](#进度报告)
- [日志记录](#日志记录)
- [测试要求](#测试要求)

---

## 权限请求规范

### ⚠️ 强制要求

**所有插件必须使用 `requestFeaturePermissions()` API 进行权限请求**

旧的 `permission.request()` API 已被标记为 **@deprecated**,不应再使用。

### 为什么需要这个规范

旧的逐个权限请求方式导致以下问题:

1. **多个权限弹窗**: 一个功能需要 N 个权限,用户看到 N 个对话框
2. **混乱的用户体验**: 权限弹窗和进度弹窗混在一起
3. **缺少功能级上下文**: 用户看不到整个功能需要哪些权限
4. **没有风险评估**: 无法向用户展示操作的风险等级

### 正确实现示例

```javascript
class MyPlugin {
  async createInstance(instanceName) {
    // ✅ 正确: 功能级权限请求
    const granted = await this.context.api.permission.requestFeaturePermissions(
      '创建微信分身',  // 功能名称
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
      `将创建名为"${instanceName}"的微信分身,包含独立的数据目录。`,  // 功能描述
      {
        operation: '创建微信分身',
        target: instanceName
      }
    )

    // 检查权限是否授予
    if (!granted) {
      this.context.ui.showMessage('未授予所需权限,操作已取消', 'warning')
      return null
    }

    // 权限授予后,开始进度报告
    this.context.api.progress.start('创建分身', 5)

    // 执行实际操作...
  }
}
```

### 错误实现示例

```javascript
class MyPlugin {
  async createInstance(instanceName) {
    // ❌ 错误: 先开始进度报告
    this.context.api.progress.start('创建分身', 7)

    // ❌ 错误: 逐个请求权限
    const hasWritePermission = await this.context.api.permission.request('fs:write', {
      reason: '创建微信分身需要复制和修改文件'
    })

    if (!hasWritePermission) {
      throw new Error('未授予文件写入权限')
    }

    // ❌ 错误: 又一个权限弹窗
    const hasExecPermission = await this.context.api.permission.request('process:exec', {
      reason: '签名微信分身需要执行系统命令'
    })

    if (!hasExecPermission) {
      throw new Error('未授予进程执行权限')
    }

    // 结果: 用户看到 3 个弹窗 (2 个权限 + 1 个进度)
  }
}
```

### 功能级权限请求的优势

- ✅ **单一弹窗**: 用户只看到 1 个权限对话框
- ✅ **清晰的流程**: 权限请求 → 进度报告 → 完成
- ✅ **功能级上下文**: 显示功能名称、描述、风险等级
- ✅ **完整的权限列表**: 一次性看到所有需要的权限
- ✅ **清晰的授权选项**: 拒绝 / 本次授权 / 永久授权
- ✅ **风险可视化**: 低/中/高风险指示器

### 会话级授权行为

当用户选择"本次授权"时:
- ✅ 权限仅在当前会话有效
- ✅ 下次执行该功能时会重新询问
- ✅ 适合用户想要控制的敏感操作

### 何时可以使用逐个权限请求?

**不推荐**。在极少数情况下,你需要根据前一个权限的结果决定是否请求下一个权限时,考虑使用 `checkPermissionsEnhanced()` API。即使如此,也需要在代码审查时说明理由。

### 迁移清单

更新现有插件时:

- [ ] 将所有 `permission.request()` 调用替换为 `requestFeaturePermissions()`
- [ ] 按功能分组权限(而不是按单个操作)
- [ ] 将权限请求移到 `progress.start()` **之前**
- [ ] 提供清晰的功能名称和描述
- [ ] 测试新的对话框流程
- [ ] 更新插件文档

### 参考示例

- [微信分身插件](../../plugins/wechat-multi-instance/index.js) - 完整示例
- [Rime 配置插件](../../plugins/rime-config/index.js) - 完整示例

---

## 插件结构

### 基本结构

```javascript
class MyPlugin {
  constructor(context) {
    this.context = context
  }

  async onLoad(context) {
    // 插件加载时调用
    // 初始化插件状态
  }

  async onEnable(context) {
    // 插件启用时调用
  }

  async onDisable(context) {
    // 插件禁用时调用
  }

  async onUnload(context) {
    // 插件卸载时调用
    // 清理资源
  }
}

module.exports = MyPlugin
```

### 插件元数据

在插件目录中创建 `package.json`:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My plugin description",
  "main": "index.js",
  "permissions": [
    "fs:read",
    "fs:write"
  ]
}
```

---

## 错误处理

### 错误处理原则

1. **始终捕获错误**: 使用 try-catch 包裹异步操作
2. **提供清晰的错误消息**: 错误消息应该说明问题所在
3. **记录错误**: 使用 `context.logger.error()` 记录错误
4. **更新进度**: 如果使用了进度报告,调用 `progress.complete('error', message)`

### 示例

```javascript
async myMethod() {
  try {
    // 执行操作
    await this.doSomething()
    this.context.api.progress.complete('success')
  } catch (error) {
    this.context.logger.error('操作失败:', error)
    this.context.api.progress.complete('error', error.message)
    throw error
  }
}
```

---

## 进度报告

### 使用进度报告的场景

当操作可能需要较长时间时(> 1 秒),应该使用进度报告:

1. 文件复制/移动
2. 网络下载/上传
3. 进程执行
4. 批量操作

### 进度报告流程

```javascript
async longRunningOperation() {
  // 1. 请求权限(在进度报告之前!)
  const granted = await this.context.api.permission.requestFeaturePermissions(...)

  if (!granted) {
    return null
  }

  // 2. 开始进度报告
  const totalSteps = 5
  this.context.api.progress.start('操作名称', totalSteps)

  try {
    // 3. 更新进度
    this.context.api.progress.update(1, '步骤1名称', '步骤1详情...')

    // 执行步骤1...
    await this.step1()

    this.context.api.progress.update(2, '步骤2名称', '步骤2详情...')

    // 执行步骤2...
    await this.step2()

    // ...

    // 4. 完成
    this.context.api.progress.complete('success')
  } catch (error) {
    this.context.api.progress.complete('error', error.message)
    throw error
  }
}
```

---

## 日志记录

### 日志级别

```javascript
this.context.logger.debug('调试信息')  // 详细信息,仅在调试时使用
this.context.logger.info('普通信息')   // 一般信息
this.context.logger.warn('警告信息')   // 警告信息
this.context.logger.error('错误信息')  // 错误信息
```

### 日志记录建议

1. **记录关键操作**: 插件加载、启用、禁用等
2. **记录错误**: 包含错误堆栈和上下文信息
3. **记录用户操作**: 重要功能的调用
4. **避免过度记录**: 不要记录每个小步骤

### 示例

```javascript
async onLoad(context) {
  context.logger.info('插件加载中...')
  try {
    await this.initialize()
    context.logger.info('插件加载完成')
  } catch (error) {
    context.logger.error('插件加载失败:', error)
    throw error
  }
}
```

---

## 测试要求

### 单元测试

- [ ] 测试插件的主要功能
- [ ] 测试错误处理
- [ ] 测试边界情况

### 集成测试

- [ ] 测试插件与主应用的集成
- [ ] 测试权限请求流程
- [ ] 测试进度报告显示

### 手动测试清单

- [ ] 插件加载和卸载
- [ ] 权限请求对话框显示正确
- [ ] 进度报告显示正确
- [ ] 错误处理正确
- [ ] 深色模式兼容性

---

## 参考资源

- [权限系统使用指南](../PERMISSION-SYSTEM.md)
- [事务系统文档](../TRANSACTION-SYSTEM.md)
- [UI 设计系统](../UI-DESIGN-SYSTEM.md)
- [项目 CLAUDE.md](../../CLAUDE.md)

---

**版本**: 1.0.0
**最后更新**: 2026-01-14
**维护者**: RokunTool 开发团队
