# Design: Plugin Execution Indicator

## Architecture Overview

全局插件执行指示器是一个轻量级的视觉反馈系统,用于显示插件的执行状态。

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Window                              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  🔴 正在执行...                                      │    │
│  │  ┌─ Rime 配置 (3s)                                 │    │
│  │  └─ 微信分身 (5s)                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Main Content Area                                │    │
│  │                                                    │    │
│  │  [插件页面内容]                                    │    │
│  │                                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [可选] ProgressDialog (仅当插件调用 progress.start 时)      │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── GlobalExecutionIndicator (新增)
│   ├── ExecutionList
│   │   ├── ExecutionItem
│   │   │   ├── PluginIcon
│   │   │   ├── PluginName
│   │   │   ├── LoadingSpinner
│   │   │   └── ExecutionTime
│   └── TimeoutNotification
└── [现有组件]
    └── ProgressDialog (保持不变)
```

## Data Flow

### 1. 插件方法调用流程

```
User Action
  ↓
[UI Component] calls window.electronAPI.plugin.callMethod()
  ↓
[Preload] Sends plugin:method:start event
  ↓
[Renderer] Receives event, adds to execution list
  ↓
[Renderer] Shows GlobalExecutionIndicator
  ↓
[Main Process] Executes plugin method
  ↓
[Main Process] Returns result
  ↓
[Preload] Sends plugin:method:end event
  ↓
[Renderer] Receives event, removes from execution list
  ↓
[Renderer] Hides GlobalExecutionIndicator (if list empty)
```

### 2. 事务执行流程

```
Plugin calls context.api.transaction.execute()
  ↓
[TransactionExecutor] Sends transaction:start event
  ↓
[Renderer] Receives event, adds to execution list
  ↓
[Renderer] Shows GlobalExecutionIndicator
  ↓
[TransactionExecutor] Executes steps
  ↓
[TransactionExecutor] Completes transaction
  ↓
[TransactionExecutor] Sends transaction:end event
  ↓
[Renderer] Receives event, removes from execution list
  ↓
[Renderer] Hides GlobalExecutionIndicator
```

### 事件发送责任

#### Preload 层
- **职责**: 包装 `plugin.callMethod` 的直接调用
- **发送事件**:
  - `plugin:method:start` - 方法调用开始
  - `plugin:method:end` - 方法调用结束
- **实现位置**: `src/preload/ipc.ts`

#### Main 层 (事务执行器)
- **职责**: 发送事务生命周期事件
- **发送事件**:
  - `transaction:start` - 事务开始执行
  - `transaction:end` - 事务执行完成
- **实现位置**: `src/main/transactions/transaction-executor.ts`
- **状态**: ✅ 可能已实现,需验证

#### Main 层 (IPC Handlers)
- **职责**: 处理权限对话框场景
- **发送事件**:
  - `permission:request:start` - 权限请求开始
  - `permission:request:end` - 权限请求结束
- **实现位置**: `src/main/ipc/handlers.ts`

#### 优先级规则
1. **如果插件正在使用 ProgressDialog**: 不显示全局指示器
2. **如果是事务执行**: 优先使用事务事件
3. **如果是直接方法调用**: 使用方法事件
4. **事件冲突**:ProgressDialog 优先级 > 全局指示器

## Component Design

### GlobalExecutionIndicator

**位置**: `src/renderer/src/components/ui/GlobalExecutionIndicator.tsx`

**职责**:
- 显示执行中的插件列表
- 管理执行状态
- 处理超时
- 提供视觉反馈

**State**:
```typescript
interface Execution {
  id: string              // 唯一标识
  pluginId: string        // 插件 ID
  pluginName: string      // 插件名称
  pluginIcon?: string     // 插件图标
  operation?: string      // 操作描述
  startTime: number       // 开始时间
  timeout?: number        // 超时时间
}

interface GlobalExecutionIndicatorProps {
  executions: Execution[]
  onTimeout?: (execution: Execution) => void
}
```

**Behavior**:
- 当 `executions.length > 0` 时显示
- 当 `executions.length === 0` 时隐藏
- 每秒更新执行时间
- 超时后自动移除并通知
- 支持多插件同时执行 (最多显示3个)

**执行项排序规则**:
```typescript
function sortExecutions(executions: Execution[], currentPluginId?: string): Execution[] {
  return executions.sort((a, b) => {
    // 1. 当前页面的插件置顶
    if (currentPluginId) {
      if (a.pluginId === currentPluginId && b.pluginId !== currentPluginId) {
        return -1
      }
      if (b.pluginId === currentPluginId && a.pluginId !== currentPluginId) {
        return 1
      }
    }

    // 2. 执行时间最长的排在前面
    const durationA = Date.now() - a.startTime
    const durationB = Date.now() - b.startTime
    if (Math.abs(durationA - durationB) > 5000) {
      return durationB - durationA
    }

    // 3. 最近启动的排在前面
    return b.startTime - a.startTime
  })
}
```

**显示数量限制**:
- 桌面端:最多显示3个
- 移动端:最多显示2个
- 超出限制:显示"还有N个插件在执行..."

```typescript
function getVisibleExecutions(executions: Execution[], isMobile: boolean) {
  const maxVisible = isMobile ? 2 : 3
  const sorted = sortExecutions(executions)

  if (sorted.length <= maxVisible) {
    return { visible: sorted, hidden: [] }
  }

  return {
    visible: sorted.slice(0, maxVisible),
    hidden: sorted.slice(maxVisible)
  }
}
```

### ExecutionItem

**职责**:
- 显示单个执行项
- 显示执行时间
- 显示 loading 动画

**UI Design**:
```
┌──────────────────────────────────┐
│ 🔴  Rime 配置     ⏱ 3.2s       │
└──────────────────────────────────┘
```

**Elements**:
1. **Loading Icon**: 旋转的 spinner (红色,表示活动)
2. **Plugin Name**: 插件名称
3. **Execution Time**: 已执行时间 (秒)

## Event System

### New Events

#### plugin:method:start

**发送时机**: 插件方法调用开始

**Payload**:
```typescript
{
  pluginId: string
  methodName: string
  timestamp: number
}
```

**发送位置**: `src/preload/ipc.ts` (包装 plugin.callMethod)

#### plugin:method:end

**发送时机**: 插件方法调用结束

**Payload**:
```typescript
{
  pluginId: string
  methodName: string
  timestamp: number
  duration: number
  success: boolean
  error?: string
}
```

**发送位置**: `src/preload/ipc.ts` (包装 plugin.callMethod)

#### transaction:start

**发送时机**: 事务执行开始

**Payload**:
```typescript
{
  transactionId: string
  transactionName: string
  pluginId: string
  timestamp: number
}
```

**发送位置**: `src/main/transactions/transaction-executor.ts`

#### transaction:end

**发送时机**: 事务执行结束

**Payload**:
```typescript
{
  transactionId: string
  transactionName: string
  pluginId: string
  timestamp: number
  duration: number
  success: boolean
  error?: string
}
```

**发送位置**: `src/main/transactions/transaction-executor.ts`

## UI Design Specifications

### Visual Design

#### Positioning

- **Default**: 右上角
- **Alternative**: 顶部中心
- **Z-Index**: 1000 (低于 ProgressDialog,高于主内容)

#### Size

- **Width**: 自动 (min 200px, max 400px)
- **Height**: 自动 (基于执行项数量)
- **Padding**: 12px 16px
- **Border Radius**: 8px

#### Colors

**Light Mode**:
- Background: `rgba(0, 0, 0, 0.8)` (半透明黑色)
- Text: `white`
- Spinner: `#ef4444` (红色)

**Dark Mode**:
- Background: `rgba(255, 255, 255, 0.9)` (半透明白色)
- Text: `gray-900`
- Spinner: `#ef4444` (红色)

#### Typography

- Plugin Name: `font-medium text-sm`
- Execution Time: `text-xs text-gray-300 dark:text-gray-600`

### Animations

#### Entry Animation

```css
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in {
  animation: slideInFromRight 0.3s ease-out;
}
```

#### Exit Animation

```css
@keyframes slideOutToRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.slide-out {
  animation: slideOutToRight 0.3s ease-in;
}
```

#### Spinner Animation

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

### Responsiveness

**Mobile (< 768px)**:
- Position: 顶部中心
- Width: 90%
- Font Size: 更小 (text-xs)
- Max items: 最多显示2个执行项

**Desktop (≥ 768px)**:
- Position: 右上角
- Width: auto (min 200px, max 400px)
- Font Size: 正常 (text-sm)
- Max items: 最多显示3个执行项

### UI 示例: 多个插件执行

```
┌────────────────────────────────────┐
│  🔴 正在执行...                     │
│  └─ Rime 配置 (8.5s)              │  ← 当前页面,置顶
│  └─ 微信分身 (3.2s)               │
│  └─ 还有 1 个插件在执行...          │  ← 折叠显示
└────────────────────────────────────┘
```

点击"还有N个插件在执行..."可展开查看全部。

## Error Handling

### Scenario 1: 超时

**Detection**: 执行时间超过 `timeout` 配置

**Action**:
1. 从执行列表中移除
2. 显示超时通知
3. 记录日志

**Notification**:
```
⚠️ Rime 配置执行超时 (30s)
```

### Scenario 2: 插件崩溃

**Detection**: 主进程检测到插件进程退出

**Action**:
1. 从执行列表中移除
2. 显示崩溃通知
3. 记录错误日志

**Notification**:
```
❌ 微信分身插件无响应
```

### Scenario 3: 事件丢失

**Detection**: 超时后仍未收到结束事件

**Action**: 同超时处理

## Performance Considerations

### Optimization Strategies

1. **React.memo**: 使用 memo 避免不必要的重渲染
2. **useCallback**: 缓存事件处理函数
3. **CSS Animations**: 使用 CSS 而非 JS 动画
4. **Debouncing**: 防抖快速更新

### Memory Management

1. **Cleanup**: 组件卸载时清理所有定时器和监听器
2. **State Limit**: 限制最多显示 3 个执行项
3. **Event Listeners**: 及时移除事件监听器

### Monitoring

1. **Execution Count**: 监控同时执行的插件数量
2. **Display Duration**: 监控指示器显示时长
3. **Update Frequency**: 监控状态更新频率

## Accessibility

### ARIA Labels

```tsx
<div
  role="status"
  aria-live="polite"
  aria-label="插件执行状态"
>
  <div aria-label="Rime 配置正在执行">
    <span aria-hidden="true">🔴</span>
    Rime 配置
    <span aria-label="已执行3.2秒">⏱ 3.2s</span>
  </div>
</div>
```

### Keyboard Navigation

- **Tab**: 可以聚焦到指示器
- **Escape**: 关闭指示器 (可选)
- **Enter**: 查看详情 (可选)

### Screen Reader Support

- 通知执行开始: "Rime 配置开始执行"
- 通知执行结束: "Rime 配置执行完成"
- 通知超时: "Rime 配置执行超时"

## Testing Strategy

### Unit Tests

1. **Component Rendering**
   - 测试空状态不显示
   - 测试有执行项时显示
   - 测试多个执行项

2. **State Management**
   - 测试添加执行项
   - 测试移除执行项
   - 测试更新执行时间

3. **Event Handling**
   - 测试开始事件处理
   - 测试结束事件处理
   - 测试超时处理

### Integration Tests

1. **Plugin Integration**
   - 测试插件调用触发指示器
   - 测试插件返回隐藏指示器

2. **Transaction Integration**
   - 测试事务开始触发指示器
   - 测试事务完成隐藏指示器

### Manual Tests

1. **Visual Tests**
   - 测试浅色模式显示
   - 测试深色模式显示
   - 测试动画流畅度

2. **Interaction Tests**
   - 测试鼠标悬停
   - 测试点击操作
   - 测试关闭按钮

3. **Edge Cases**
   - 测试多个插件同时执行
   - 测试执行超时
   - 测试快速添加/移除

## Future Enhancements

### Phase 2 Features (考虑中)

1. **点击跳转**: 点击指示器跳转到对应插件页面
2. **执行历史**: 显示最近的执行记录
3. **执行统计**: 显示执行次数、平均时长等
4. **自定义位置**: 允许用户自定义指示器位置
5. **自定义样式**: 允许用户自定义颜色和大小

### Out of Scope

1. 进度条功能 (已有 ProgressDialog)
2. 取消执行功能 (复杂度高,需要插件支持)
3. 执行日志详情 (可通过 ProgressDialog 显示)
