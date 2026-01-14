# Spec: 权限系统增强 - 永久拒绝和批量请求

**Capability**: 权限系统增强
**Version**: 2.0
**Status**: proposed

---

## ADDED Requirements

### Requirement: 永久拒绝权限状态

系统必须支持永久拒绝权限,用户可以明确表示某个插件永远不应该拥有某个权限。

#### Scenario: 用户永久拒绝插件权限

**Given** 插件请求某个权限
**When** 用户在权限请求对话框中点击"永久拒绝"按钮
**Then** 系统应该:
- 将权限状态设置为 `PERMANENTLY_DENIED`
- 持久化保存此状态到磁盘
- 下次插件请求相同权限时,不弹出对话框,直接返回 `denied: true, permanent: true`

#### Scenario: 插件尝试使用被永久拒绝的权限

**Given** 某个权限已被永久拒绝
**When** 插件尝试请求该权限
**Then** 系统应该:
- 不显示权限请求对话框
- 返回 `{ granted: false, deniedPermanently: true }`
- 在右下角显示 Toast 通知,告知用户权限已被拒绝
- Toast 通知包含"前往设置"按钮

#### Scenario: 用户在设置中重新询问永久拒绝的权限

**Given** 某个权限已被永久拒绝
**When** 用户在设置页面点击"重新询问"按钮
**Then** 系统应该:
- 清除 `PERMANENTLY_DENIED` 状态
- 将状态重置为 `PENDING`
- 下次插件请求该权限时,重新显示权限请求对话框

---

### Requirement: 批量权限请求

插件可以在执行功能前批量检查和请求多个权限,提升用户体验。

#### Scenario: 插件预检查批量权限 - 无永久拒绝

**Given** 插件功能需要 3 个权限: fs:read, fs:write, clipboard:write
**And** 所有权限状态都是 `PENDING` 或 `GRANTED`
**When** 插件调用 `checkPermissions([权限列表])`
**Then** 系统应该:
- 返回 `{ hasPermanentDeny: false, permanentlyDenied: [], pending: [...], granted: [...] }`
- **不显示**任何对话框

#### Scenario: 插件预检查批量权限 - 存在永久拒绝

**Given** 插件功能需要 3 个权限
**And** 其中 `fs:write` 已被永久拒绝
**When** 插件调用 `checkPermissions([权限列表])`
**Then** 系统应该:
- 返回 `{ hasPermanentDeny: true, permanentlyDenied: ['fs:write'], ... }`
- **不显示**对话框
- 立即在右下角显示 Toast 通知: "插件需要的 fs:write 权限已被永久拒绝"

#### Scenario: 插件批量请求权限 - 用户全部授权

**Given** 插件调用 `checkPermissions()` 检查权限,无永久拒绝
**When** 插件调用 `requestPermissions([权限列表])`
**Then** 系统应该:
- 显示单个对话框,列出所有 3 个权限
- 每个权限显示名称、描述、风险等级
- 用户可以勾选/取消勾选每个权限
**And** 用户点击"永久授权"按钮
**Then** 系统应该:
- 将所有勾选的权限设置为 `GRANTED`
- 持久化保存到磁盘
- 返回 `{ allGranted: true, results: [...] }`

#### Scenario: 插件批量请求权限 - 用户部分授权

**Given** 权限对话框显示 3 个权限
**When** 用户只勾选 2 个权限,取消勾选 1 个
**And** 点击"永久授权"按钮
**Then** 系统应该:
- 将勾选的 2 个权限设置为 `GRANTED`
- 未勾选的 1 个权限保持 `PENDING`
- 返回 `{ allGranted: false, results: [...] }`
- 插件根据返回结果决定是否执行功能

#### Scenario: 插件批量请求权限 - 用户拒绝

**Given** 权限对话框显示 3 个权限
**When** 用户点击"拒绝"或"永久拒绝"按钮
**Then** 系统应该:
- 不授予任何权限
- 如果是"永久拒绝",将所有权限设置为 `PERMANENTLY_DENIED`
- 返回 `{ allGranted: false, results: [...] }`
- 插件中止功能执行

---

### Requirement: 权限被拒通知

当插件尝试使用被永久拒绝的权限时,系统必须明确告知用户。

#### Scenario: 显示权限被拒通知

**Given** 插件尝试使用被永久拒绝的权限
**When** 权限检查返回 `PERMANENTLY_DENIED`
**Then** 系统应该:
- 在右下角显示 Toast 通知
- 通知内容包括:
  - 标题: "权限被拒绝"
  - 消息: "插件 {插件名} 的 {权限名} 权限已被永久拒绝。无法执行 {操作名} 操作。"
  - "前往设置"按钮
- 点击按钮后,打开设置页面并高亮相关权限

#### Scenario: 避免重复通知

**Given** 同一个(插件, 权限)组合已被永久拒绝
**When** 插件在同一次应用会话中多次尝试使用该权限
**Then** 系统应该:
- 只显示一次 Toast 通知
- 后续尝试不重复显示通知

---

## MODIFIED Requirements

### Requirement: 权限请求对话框 UI

**Before**: 三按钮布局(拒绝 / 本次授权 / 永久授权)
**After**: 四按钮布局(拒绝 / 永久拒绝 / 本次授权 / 永久授权)

#### Scenario: 用户选择永久拒绝

**Given** 权限请求对话框显示
**When** 用户点击"永久拒绝"按钮
**Then** 系统应该:
- 关闭对话框
- 将权限状态设置为 `PERMANENTLY_DENIED`
- 持久化保存状态
- 插件收到 `{ granted: false, permanent: true, deniedPermanently: true }`

#### Scenario: 用户选择临时拒绝

**Given** 权限请求对话框显示
**When** 用户点击"拒绝"按钮
**Then** 系统应该:
- 关闭对话框
- 将权限状态设置为 `DENIED` (仅在内存中)
- **不持久化**到磁盘
- 插件收到 `{ granted: false, permanent: false, deniedPermanently: false }`
- 下次应用重启后,状态重置为 `PENDING`

---

### Requirement: 权限存储结构

**Before**: 权限状态存储为字符串
```json
{
  "permissions": {
    "fs:write": "granted",
    "clipboard:read": "denied"
  }
}
```

**After**: 权限状态存储为对象,包含更多元数据
```json
{
  "permissions": {
    "fs:write": {
      "status": "granted",
      "permanent": true,
      "timestamp": 1234567890
    },
    "clipboard:read": {
      "status": "permanently_denied",
      "permanent": true,
      "timestamp": 1234567890
    },
    "network:http": {
      "status": "denied",
      "permanent": false,
      "timestamp": 1234567890
    }
  }
}
```

#### Scenario: 数据迁移

**Given** 用户从旧版本升级
**And** 旧版本权限数据为 v1 格式(字符串)
**When** 应用启动时
**Then** 系统应该:
- 自动检测 v1 格式数据
- 迁移到 v2 格式
- 保留所有权限状态
- 假设旧版本的 "granted" 为永久授权
- 假设旧版本的 "denied" 为临时拒绝

---

## Implementation Notes

### 权限状态枚举

```typescript
enum PermissionStatus {
  PENDING = 'pending',              // 未询问
  GRANTED = 'granted',              // 已授予
  DENIED = 'denied',                // 已拒绝(会话级,不持久化)
  PERMANENTLY_DENIED = 'permanently_denied'  // 永久拒绝
}
```

### 新增 API

```typescript
// 批量检查权限(不弹对话框)
async checkPermissions(
  permissions: Permission[]
): Promise<{
  hasPermanentDeny: boolean
  permanentlyDenied: Permission[]
  pending: Permission[]
  granted: Permission[]
}>

// 批量请求权限(弹对话框)
async requestPermissions(
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

// 清除永久拒绝
async clearPermanentDeny(
  pluginId: string,
  permission: Permission
): Promise<void>
```

### UI 组件变更

1. **PermissionRequestDialog**
   - 支持单个或多个权限
   - 4按钮布局
   - 权限列表展示(批量模式)

2. **PermissionDeniedToast** (新增)
   - 显示永久拒绝通知
   - "前往设置"按钮

3. **PermissionSettings** (新增)
   - 权限管理页面
   - 列出所有插件权限
   - "撤销"和"重新询问"按钮

### IPC 事件

**新增事件**:
- `permission:permanently-denied` - 权限被永久拒绝时发送

**新增处理器**:
- `permission:checkPermissions` - 批量检查权限
- `permission:requestPermissions` - 批量请求权限
- `permission:clearPermanentDeny` - 清除永久拒绝

---

## Test Cases

### 单元测试

- [ ] `PermissionManager.denyPermission()` - 测试 permanent 参数
- [ ] `PermissionManager.checkPermissions()` - 测试批量检查
- [ ] `PermissionManager.requestPermissions()` - 测试批量请求
- [ ] `PermissionStore` - 测试 v1 到 v2 数据迁移
- [ ] 权限状态持久化和恢复

### 集成测试

- [ ] 永久拒绝完整流程: 拒绝 → 通知 → 清除 → 重新询问
- [ ] 批量权限流程: 预检查 → 批量对话框 → 部分授权 → 执行
- [ ] 权限被拒通知: 显示一次 → 节流 → 不重复显示

### 端到端测试

- [ ] 用户安装插件 → 使用功能 → 永久拒绝权限 → 功能中止 → 查看通知 → 前往设置 → 清除拒绝 → 重新使用功能 → 授予权限
- [ ] 用户使用批量权限功能 → 预检查通过 → 批量对话框 → 部分授权 → 功能部分执行

---

## Acceptance Criteria

### Phase 1 (永久拒绝)

- ✅ 用户可以选择"永久拒绝"权限
- ✅ 永久拒绝后,插件再次请求时不会弹出对话框
- ✅ 永久拒绝的权限会被持久化保存
- ✅ 插件尝试使用永久拒绝的权限时,显示 Toast 通知
- ✅ 用户可以在设置中查看所有权限状态
- ✅ 用户可以清除永久拒绝状态

### Phase 2 (批量权限)

- ✅ 插件可以批量检查多个权限(不弹对话框)
- ✅ 如果任何权限被永久拒绝,批量检查返回 `hasPermanentDeny: true`
- ✅ 插件可以批量请求多个权限
- ✅ 批量请求对话框显示所有权限列表
- ✅ 用户可以选择部分授权(勾选部分权限)
- ✅ 返回每个权限的授权结果

### Phase 3 (优化)

- ✅ 批量权限对话框显示风险等级图标
- ✅ 权限被拒通知包含可操作的建议
- ✅ 性能:批量检查 10 个权限 < 100ms
- ✅ 文档:插件开发指南和用户指南完整

---

## Dependencies

- **依赖**: 无
- **被依赖**: 插件系统(批量权限功能)
- **兼容性**: 向后兼容 v1 权限数据

---

## Risks and Mitigations

### 风险 1: 永久拒绝导致功能完全不可用

**缓解措施**:
- 在设置中提供明确的"重新询问"入口
- Toast 通知中直接提供"前往设置"按钮
- 文档中说明如何恢复权限

### 风险 2: 批量权限对话框太复杂

**缓解措施**:
- 简洁的 UI 设计
- 清晰的权限说明
- 默认全选,用户只需要取消不想要的
- 提供"全选"/"全不选"快捷操作

### 风险 3: 数据迁移失败

**缓解措施**:
- 完善的单元测试覆盖迁移逻辑
- 备份旧数据
- 迁移失败时回退到旧数据
- 用户友好的错误提示
