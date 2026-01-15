# ADR 0001: 强制使用功能级权限请求 API

## 状态
**已接受 (Accepted)** - 2026-01-14

## 上下文

### 问题描述

在 transactional-permissions 特性实现之前,插件使用 `permission.request()` API 逐个请求权限,导致以下问题:

1. **多个权限弹窗**: 一个功能需要多个权限时,会弹出多个对话框
2. **权限弹窗和进度弹窗冲突**: 权限请求和进度报告混在一起,用户体验混乱
3. **缺少功能级上下文**: 用户看不到整个功能需要哪些权限
4. **没有风险评估**: 无法向用户展示操作的风险等级
5. **会话级授权体验差**: "本次授权"的概念不清晰

### 示例问题代码

```javascript
// ❌ 错误: 逐个请求权限
async createInstance() {
  // 先开始进度报告
  this.context.api.progress.start('创建分身', 7)

  // 第一个权限弹窗
  const hasWritePermission = await this.context.api.permission.request('fs:write', {
    reason: '创建微信分身需要复制和修改文件',
    context: { operation: '复制微信应用', target: instancePath }
  })

  if (!hasWritePermission) {
    throw new Error('未授予文件写入权限')
  }

  // 第二个权限弹窗 (用户看到第二个对话框!)
  const hasExecPermission = await this.context.api.permission.request('process:exec', {
    reason: '签名微信分身需要执行系统命令',
    context: { operation: '签名应用', target: instancePath }
  })

  if (!hasExecPermission) {
    throw new Error('未授予进程执行权限')
  }

  // 然后执行实际操作...
}
```

**问题**:
- 用户看到 2 个权限弹窗 + 1 个进度弹窗 = 3 个弹窗!
- 权限请求发生在进度报告期间,顺序混乱
- 无法感知"创建微信分身"这个功能的整体风险

## 决策

### 强制要求

**所有插件必须使用 `requestFeaturePermissions()` API 进行权限请求**

旧的 `permission.request()` API 已被标记为 **@deprecated**,不应再使用。

### 正确实现

```javascript
// ✅ 正确: 功能级权限请求
async createInstance() {
  const instanceName = `WeChat${this.getNextInstanceNumber()}`

  // 1. 一次性请求功能所需的所有权限
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
      target: instancePath
    }
  )

  // 2. 检查权限是否授予
  if (!granted) {
    this.context.ui.showMessage('未授予所需权限,操作已取消', 'warning')
    return null
  }

  // 3. 权限授予后,开始进度报告和执行操作
  this.context.api.progress.start('创建分身', 5)
  // ... 执行操作
}
```

**优势**:
- ✅ 用户只看到 **1 个权限弹窗**
- ✅ 权限弹窗在进度弹窗 **之前** 出现
- ✅ 显示功能名称、描述、风险等级
- ✅ 列出所有权限及原因
- ✅ 提供清晰的授权选项: 拒绝 / 本次授权 / 永久授权

### 架构原则

1. **功能原子性**: 一个功能 = 一组权限 + 一组操作
2. **权限优先**: 权限请求必须在进度报告之前完成
3. **一次弹窗**: 所有权限在一个对话框中请求
4. **风险透明**: 显示风险等级和推荐策略
5. **会话级授权**: 支持"本次授权",下次执行时重新询问

## 后果

### 正面影响

1. **更好的用户体验**:
   - 减少弹窗数量 (N 个权限 → 1 个弹窗)
   - 清晰的执行流程 (权限 → 进度 → 完成)
   - 功能级上下文 (用户知道整个操作的目的)

2. **更高的安全性**:
   - 风险可视化 (低/中/高风险指示器)
   - 智能推荐策略 (系统建议最佳授权方式)
   - 会话级授权默认化 (鼓励谨慎授权)

3. **一致的开发模式**:
   - 所有插件使用相同的 API
   - 代码更简洁易读
   - 更容易维护

### 负面影响

1. **迁移成本**: 现有插件需要更新代码
2. **学习曲线**: 开发者需要学习新 API
3. **向后兼容性**: 旧的 API 仍然可用但不推荐

### 缓解措施

1. **文档完善**: 提供详细的使用指南和示例
2. **代码示例**: 在文档中提供对比示例
3. **迁移指南**: 为现有插件提供迁移步骤
4. **API 标记**: 旧 API 添加 @deprecated 注释

## 实施计划

### 第一阶段: 框架层 (已完成)

- ✅ 实现 `requestFeaturePermissions()` API
- ✅ 实现 FeaturePermissionDialog 组件
- ✅ 实现风险评估和推荐策略
- ✅ 修复权限弹窗 z-index 问题

### 第二阶段: 插件迁移 (进行中)

- ✅ 微信分身插件已迁移
- ⏳ Rime 配置插件迁移中
- ⏳ 其他插件待迁移

### 第三阶段: 废弃旧 API (待实施)

- ⏳ 标记 `permission.request()` 为 @deprecated
- ⏳ 在控制台输出警告
- ⏳ 更新所有示例代码
- ⏳ 更新插件开发文档

## 参考资料

### 相关文档

- [权限系统使用指南](../PERMISSION-SYSTEM.md)
- [事务系统文档](../TRANSACTION-SYSTEM.md)
- [transactional-permissions 提案](../openspec/changes/transactional-permissions/proposal.md)

### API 参考

```typescript
/**
 * 功能级权限请求 API (推荐使用)
 *
 * @param featureName 功能名称 (如 "创建微信分身")
 * @param permissions 权限数组
 * @param featureDescription 功能描述 (可选)
 * @param context 操作上下文 (可选)
 * @returns Promise<boolean> 是否授予所有必需权限
 */
permission.requestFeaturePermissions(
  featureName: string,
  permissions: Array<{
    permission: PluginPermission
    required: boolean
    reason?: string
  }>,
  featureDescription?: string,
  context?: {
    operation: string
    target?: string
  }
): Promise<boolean>
```

### 已迁移插件

1. **微信分身插件** (`plugins/wechat-multi-instance/index.js`)
   - 功能: 创建微信分身
   - 权限: `fs:write`, `process:exec`
   - 提交: [待添加]

2. **Rime 配置插件** (`plugins/rime-config/index.js`)
   - 功能: 安装/更新/卸载配方, 启用/禁用方案
   - 权限: `fs:write`, `process:exec`
   - 提交: [待添加]

## 例外情况

### 何时可以不用功能级权限请求?

**不建议**。但如果必须逐个请求权限,需要:

1. 提供充分的理由
2. 在代码审查时说明原因
3. 确保用户体验不受影响

**示例**: 极少数情况下,某些操作需要根据前一个权限的结果决定是否请求下一个权限。即使如此,也应该考虑使用 `checkPermissionsEnhanced()` API 预检查。

## 审查和更新

- **创建日期**: 2026-01-14
- **最后更新**: 2026-01-14
- **审查周期**: 每季度
- **负责人**: RokunTool 开发团队

---

**历史记录**:

| 日期 | 版本 | 变更说明 | 作者 |
|------|------|----------|------|
| 2026-01-14 | 1.0 | 初始版本 | Claude |
