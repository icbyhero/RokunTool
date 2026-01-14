# Design: Permanent Deny and Batch Permission Requests

## Architecture Overview

### Current Architecture

```
┌─────────────┐     requestPermission()      ┌──────────────────┐
│   Plugin    │ ──────────────────────────> │ PermissionManager │
└─────────────┘                               └──────────────────┘
                                                      │
                                                      ├─> checkPermission()
                                                      │   └─> BASIC_PERMISSIONS
                                                      │   └─> SessionPermissionManager
                                                      │   └─> PermissionService
                                                      │   └─> permissionStates (DENIED)
                                                      │
                                                      └─> send request to UI
                                                          └─> PermissionRequestDialog
                                                              └─> 3 options: 拒绝/本次授权/永久授权
```

### Proposed Architecture

```
┌─────────────┐     requestPermission()      ┌──────────────────┐
│   Plugin    │ ──────────────────────────> │ PermissionManager │
└─────────────┘                               └──────────────────┘
                                                      │
                                                      ├─> checkPermission()
                                                      │   └─> BASIC_PERMISSIONS
                                                      │   └─> SessionPermissionManager
                                                      │   └─> PermissionService
                                                      │   └─> permissionStates
                                                      │       ├─> DENIED (session)
                                                      │       └─> PERMANENTLY_DENIED (new)
                                                      │
                                                      ├─> if PERMANENTLY_DENIED
                                                      │   └─> broadcastPermissionDeniedEvent()
                                                      │       └─> UI shows Toast notification
                                                      │
                                                      └─> else send request to UI
                                                          └─> PermissionRequestDialog
                                                              └─> 4 options:
                                                                  ├─> 拒绝 (session)
                                                                  ├─> 永久拒绝 (permanent)
                                                                  ├─> 本次授权 (session)
                                                                  └─> 永久授权 (permanent)
```

## Component Design

### 1. Permission States

**Current States**:
- `PENDING` - 未询问
- `GRANTED` - 已授予
- `DENIED` - 已拒绝(会话级)

**New States**:
- `PERMANENTLY_DENIED` - 永久拒绝

**State Transitions**:
```
PENDING ──user clicks "拒绝"──> DENIED
PENDING ──user clicks "永久拒绝"──> PERMANENTLY_DENIED
PENDING ──user clicks "本次授权"──> GRANTED (session)
PENDING ──user clicks "永久授权"──> GRANTED (permanent)

DENIED ──app restart──> PENDING
PERMANENTLY_DENIED ──user "重新询问"──> PENDING
```

### 2. PermissionManager API Changes

#### Current API

```typescript
async requestPermission(
  pluginId: string,
  permission: Permission,
  reason?: string,
  context?: PermissionRequestContext
): Promise<boolean>
```

#### New API

```typescript
// Single permission request
async requestPermission(
  pluginId: string,
  permission: Permission | Permission[],
  reason?: string,
  context?: PermissionRequestContext
): Promise<PermissionResult | PermissionResult[]>

interface PermissionResult {
  permission: Permission
  granted: boolean
  permanent: boolean
  deniedPermanently: boolean  // new: indicates permanently denied
}

// Permanent deny with flag
async denyPermission(
  pluginId: string,
  permission: Permission,
  source: 'user' | 'system',
  permanent: boolean,  // new
  context?: PermissionRequestContext
): Promise<void>

// Clear permanently denied status
async clearPermanentDeny(
  pluginId: string,
  permission: Permission
): Promise<void>
```

### 3. UI Components

#### PermissionRequestDialog Changes

**Current Layout**:
```
┌─────────────────────────────┐
│  权限请求                   │
│  ────────────────────────   │
│  插件 xxx 需要 yyy 权限     │
│                             │
│  ┌─────┐ ┌──────┐ ┌─────┐  │
│  │ 拒绝 │ │本次  │ │永久 │  │
│  └─────┘ │授权  │ │授权 │  │
│          └──────┘ └─────┘  │
└─────────────────────────────┘
```

**New Layout (Single Permission)**:
```
┌─────────────────────────────┐
│  权限请求                   │
│  ────────────────────────   │
│  插件 xxx 需要 yyy 权限     │
│                             │
│  ┌─────┐ ┌──────┐ ┌───┐ ┌──┐│
│  │拒绝  │ │永久  │ │本 │ │永││
│  └─────┘ │拒绝  │ │次 │ │久││
│          └──────┘ │授 │ │授││
│                    │权 │ │权││
│                    └───┘ └──┘│
└─────────────────────────────┘
```

**New Layout (Batch Permissions)**:
```
┌─────────────────────────────┐
│  权限请求                   │
│  ────────────────────────   │
│  插件 xxx 需要 3 个权限:     │
│                             │
│  ☑ fs:read - 文件读取       │
│    ⚠️ 风险: 中等            │
│                             │
│  ☑ fs:write - 文件写入      │
│    ⚠️ 风险: 高              │
│                             │
│  ☑ clipboard:write - 剪贴板 │
│    ⚠️ 风险: 低              │
│                             │
│  [取消选中] [全选] [全不选]  │
│                             │
│  ┌─────┐ ┌──────┐ ┌───┐ ┌──┐│
│  │拒绝  │ │永久  │ │本 │ │永││
│  └─────┘ │拒绝  │ │次 │ │久││
│  (所有)  │ (所有)│ │权 │ │权││
│          └──────┘ │   │ │   ││
│                    └───┘ └──┘│
└─────────────────────────────┘
```

#### PermissionDeniedToast Component (New)

```typescript
interface PermissionDeniedToastProps {
  pluginId: string
  pluginName: string
  permission: Permission
  operation: string
  onOpenSettings: () => void
}

function PermissionDeniedToast({
  pluginName,
  permission,
  operation,
  onOpenSettings
}: PermissionDeniedToastProps) {
  return (
    <Toast variant="warning">
      <AlertCircle className="h-5 w-5" />
      <div>
        <ToastTitle>权限被拒绝</ToastTitle>
        <ToastDescription>
          {pluginName} 的 {getPermissionName(permission)} 权限已被永久拒绝。
          无法执行 "{operation}" 操作。
        </ToastDescription>
      </div>
      <Button onClick={onOpenSettings}>
        前往设置
      </Button>
    </Toast>
  )
}
```

### 4. Settings Page - Permission Management

**New Component: PermissionSettings**

```typescript
function PermissionSettings() {
  const [permissions, setPermissions] = useState<Record<string, PermissionState[]>>()

  return (
    <div>
      <h2>权限管理</h2>

      {Object.entries(permissions).map(([pluginId, perms]) => (
        <Card key={pluginId}>
          <h3>{pluginId}</h3>

          {perms.map(perm => (
            <PermissionItem
              key={perm.permission}
              permission={perm.permission}
              status={perm.status}
              onRevoke={() => revokePermission(pluginId, perm.permission)}
              onClearDeny={() => clearPermanentDeny(pluginId, perm.permission)}
            />
          ))}
        </Card>
      ))}
    </div>
  )
}

function PermissionItem({ permission, status, onRevoke, onClearDeny }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span>{permission}</span>
        <StatusBadge status={status} />
      </div>

      <div>
        {status === 'GRANTED' && (
          <Button onClick={onRevoke}>撤销</Button>
        )}

        {status === 'PERMANENTLY_DENIED' && (
          <Button onClick={onClearDeny}>重新询问</Button>
        )}
      </div>
    </div>
  )
}
```

### 5. IPC Events

**New Events**:

```typescript
// Main -> Renderer
interface PermissionDeniedEvent {
  pluginId: string
  pluginName: string
  permission: Permission
  operation: string
  timestamp: number
}

ipcMain.on('permission:permanently-denied',
  (_event, data: PermissionDeniedEvent) => {
    // Renderer shows toast
  }
)
```

## Data Model

### PermissionStore Schema

**Current Schema**:
```json
{
  "version": 1,
  "plugins": {
    "plugin-id": {
      "permissions": {
        "fs:write": "granted",
        "clipboard:read": "denied"
      },
      "history": [...]
    }
  }
}
```

**New Schema**:
```json
{
  "version": 2,
  "plugins": {
    "plugin-id": {
      "permissions": {
        "fs:write": {
          "status": "granted",
          "grantedAt": 1234567890,
          "permanent": true
        },
        "clipboard:read": {
          "status": "permanently_denied",
          "deniedAt": 1234567890,
          "permanent": true
        },
        "network:http": {
          "status": "denied",
          "deniedAt": 1234567890,
          "permanent": false
        }
      },
      "history": [...]
    }
  }
}
```

## Error Handling

### Scenario: Plugin tries to use permanently denied permission

**Flow**:
1. Plugin calls `requestPermission()`
2. `PermissionManager.checkPermission()` returns `PERMANENTLY_DENIED`
3. `PermissionManager.requestPermission()`:
   - Does NOT show dialog
   - Returns `{ granted: false, deniedPermanently: true }`
   - Emits `permission:permanently-denied` event
4. Plugin receives result, aborts operation
5. UI shows toast notification

**Plugin Code Example**:
```typescript
// Plugin method - 逐个请求权限(不推荐)
async copyFiles() {
  const result = await this.requestPermission('fs:write')

  if (!result.granted) {
    if (result.deniedPermanently) {
      // Don't show error, system will show toast
      return
    } else {
      // User denied this time
      this.showMessage('操作已取消: 未授予权限')
      return
    }
  }

  // Proceed with operation
  await this.doCopy()
}
```

### Scenario: Plugin pre-checks permissions before operation (推荐)

**重要**: 插件在执行功能前,应该先批量检查所有需要的权限,如果发现任何永久拒绝的权限:
- **立即停止执行**
- **不弹出任何对话框**
- **直接触发权限被拒通知**
- **告知用户需要去设置中开启**

**Flow**:
1. Plugin defines required permissions for a feature
2. Before executing, plugin checks all permissions
3. If any are permanently denied:
   - Abort entire operation immediately
   - Show toast notification for all denied permissions
   - Do NOT show permission request dialog
4. If all are available (pending/granted):
   - Show batch permission dialog
   - User confirms/rejects
   - Execute based on user decision

**Plugin Code Example (推荐模式)**:
```typescript
class MyPlugin {
  // 定义功能需要的权限
  private readonly COPY_FEATURE_PERMISSIONS = [
    'fs:read',
    'fs:write',
    'clipboard:write'
  ] as const

  async copyFilesFeature() {
    // 步骤1: 预检查所有权限
    const checkResult = await this.checkPermissions(
      this.COPY_FEATURE_PERMISSIONS
    )

    // 步骤2: 如果有永久拒绝的权限,立即中止
    if (checkResult.hasPermanentDeny) {
      // 系统会自动显示 toast 通知,插件不需要额外处理
      console.log('功能中止: 存在永久拒绝的权限',
        checkResult.permanentlyDenied)

      // 可选: 插件也可以显示自己的提示
      this.showMessage(
        '由于权限被拒绝,无法执行复制操作。' +
        '请查看右下角的通知了解详情。'
      )
      return
    }

    // 步骤3: 批量请求所有需要的权限
    const requestResult = await this.requestPermissions(
      this.COPY_FEATURE_PERMISSIONS,
      '复制微信应用需要以下权限',
      { operation: 'copy-wechat-app' }
    )

    // 步骤4: 检查是否所有权限都被授予
    if (!requestResult.allGranted) {
      // 用户拒绝了部分或全部权限
      const deniedPerms = requestResult.results
        .filter(r => !r.granted)
        .map(r => r.permission)

      this.showMessage(
        `操作已取消: 未授予以下权限: ${deniedPerms.join(', ')}`
      )
      return
    }

    // 步骤5: 执行实际功能
    await this.performCopyFiles()
  }
}
```

**API 设计**:

```typescript
// 新增: 批量检查权限(不弹出对话框)
async checkPermissions(
  permissions: Permission[]
): Promise<PermissionCheckResult>

interface PermissionCheckResult {
  // 是否有永久拒绝的权限
  hasPermanentDeny: boolean
  // 永久拒绝的权限列表
  permanentlyDenied: Permission[]
  // 待确认的权限列表
  pending: Permission[]
  // 已授予的权限列表
  granted: Permission[]
}

// 新增: 批量请求权限
async requestPermissions(
  permissions: Permission[],
  reason?: string,
  context?: PermissionRequestContext
): Promise<BatchPermissionResult>

interface BatchPermissionResult {
  // 是否所有权限都已授予
  allGranted: boolean
  // 每个权限的结果
  results: PermissionResult[]
}
```

## Performance Considerations

1. **Permission Check Cache**
   - Current: In-memory Map
   - New: Same, but add `PERMANENTLY_DENIED` cache
   - No performance impact

2. **Batch Permission Requests**
   - Single dialog render instead of N dialogs
   - Fewer IPC calls
   - Better UX

3. **Permission Denied Notifications**
   - Throttle: Same (plugin, permission) only once per session
   - Avoid notification spam

## Security Considerations

1. **Permanent Deny Persistence**
   - Stored in `userData/permissions/state.json`
   - Survives app restart
   - Clearable via UI

2. **Batch Permission Requests**
   - User must explicitly select each permission
   - No "select all" by default
   - Clear indication of required vs optional

3. **Permission Reset**
   - Settings page allows clearing permanent deny
   - Plugin cannot reset itself
   - User-initiated only

## Migration Strategy

### Data Migration

```typescript
// v1 -> v2 migration
function migratePermissionStore(v1: V1Store): V2Store {
  const v2: V2Store = {
    version: 2,
    plugins: {}
  }

  for (const [pluginId, data] of Object.entries(v1.plugins)) {
    v2.plugins[pluginId] = {
      permissions: {},
      history: data.history || []
    }

    for (const [perm, status] of Object.entries(data.permissions)) {
      v2.plugins[pluginId].permissions[perm] = {
        status: status,
        grantedAt: status === 'granted' ? Date.now() : undefined,
        permanent: status === 'granted' // Assume granted = permanent
      }
    }
  }

  return v2
}
```

### UI Migration

- Update `PermissionRequestDialog` to 4-button layout
- Add `PermissionSettings` page
- Add `PermissionDeniedToast` component

### Plugin Migration

- Plugins continue to use existing API
- Batch permission opt-in via new array parameter
- Backward compatible

## Testing Strategy

### Unit Tests

1. **PermissionManager**
   - Test `PERMANENTLY_DENIED` state persistence
   - Test batch permission request
   - Test permission denied event emission

2. **PermissionStore**
   - Test v1 -> v2 migration
   - Test new schema serialization

### Integration Tests

1. **End-to-end permission flow**
   - User permanently denies permission
   - Plugin tries to use permission
   - Verify toast notification shown
   - User goes to settings, clears deny
   - Verify permission request dialog shown again

2. **Batch permission flow**
   - Plugin requests 3 permissions
   - User grants 2, denies 1
   - Verify correct results returned
   - Verify plugin handles partial grant

### UI Tests

1. **PermissionRequestDialog**
   - Test 4-button layout
   - Test batch permission checkbox selection
   - Test "select all" / "deselect all"

2. **PermissionSettings**
   - Test permission list display
   - Test "revoke" button
   - Test "clear deny" button

## Future Enhancements

1. **Permission Groups**
   - Define groups of related permissions
   - Request groups as unit

2. **Permission Templates**
   - Pre-defined permission sets for common use cases
   - "File operations" = fs:read + fs:write

3. **Permission Usage Analytics**
   - Track which permissions are actually used
   - Suggest revoking unused permissions

4. **Advanced Batch Options**
   - "Remember my choice for this plugin"
   - "Always allow this plugin to access {permission}"
