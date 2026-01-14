# 全局执行指示器 (Global Execution Indicator)

## 概述

全局执行指示器是一个自动显示插件执行状态的 UI 组件,旨在解决用户在插件执行操作时不知道应用是否在工作的 UX 问题。

### 核心特性

- ✅ **完全自动化**: 插件无需修改任何代码即可享受此功能
- ✅ **零侵入性**: 通过 API 包装自动检测执行状态
- ✅ **用户友好**: 显示真实的插件名称和操作信息
- ✅ **性能优化**: 使用 React.memo、useCallback 和更新频率限制
- ✅ **深色模式**: 完美支持浅色/深色主题
- ✅ **可访问性**: 符合 ARIA 无障碍标准

## 功能说明

### 1. 自动触发机制

指示器会自动检测以下场景并显示:

1. **插件方法调用**: 当插件调用任何方法时
2. **事务执行**: 当插件执行事务操作时
3. **超时处理**: 执行超过 30 秒(默认)时自动提示

### 2. 显示信息

每个执行项显示:

- **插件名称**: 从插件元数据获取的真实名称
- **操作类型**: 方法名或事务名(如 `install`, `configure`)
- **执行时间**: 实时更新的执行时长(秒/毫秒)
- **加载动画**: 红色旋转 spinner

### 3. 交互功能

- **关闭按钮**: 点击右上角 X 按钮清空列表
- **悬停效果**: 鼠标悬停时高亮显示
- **排序逻辑**:
  - 当前页面的插件优先显示
  - 执行时间最长的排在前面
  - 最近启动的排在前面

## 技术实现

### 架构

```
┌─────────────────────────────────────────────┐
│           Renderer Process (App.tsx)        │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  GlobalExecutionIndicator            │  │
│  │  - 管理执行状态列表                   │  │
│  │  - 监听 IPC 事件                     │  │
│  │  - 显示 UI                           │  │
│  └──────────────────────────────────────┘  │
│                  ↑ ↓                         │
│  ┌──────────────────────────────────────┐  │
│  │  IPC Events                          │  │
│  │  - plugin:method:start               │  │
│  │  - plugin:method:end                 │  │
│  │  - transaction:start                 │  │
│  │  - transaction:end                   │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↑ ↓
┌─────────────────────────────────────────────┐
│           Main Process                      │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  preload/ipc.ts                      │  │
│  │  - 包装 plugin.callMethod             │  │
│  │  - 自动发送事件                       │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │  TransactionExecutor                 │  │
│  │  - 执行事务时发送事件                 │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 事件流

#### 插件方法调用

```
插件调用 plugin.callMethod()
  ↓
preload/ipc.ts 拦截调用
  ↓
发送 'plugin:method:start' 事件
  ↓
App.tsx 接收事件 → 添加到执行列表
  ↓
方法执行完成/失败
  ↓
发送 'plugin:method:end' 事件
  ↓
App.tsx 接收事件 → 从执行列表移除
```

#### 事务执行

```
插件调用 transaction.execute()
  ↓
TransactionExecutor.execute() 开始
  ↓
发送 'transaction:start' 事件
  ↓
App.tsx 接收事件 → 添加到执行列表
  ↓
事务执行完成/失败
  ↓
发送 'transaction:end' 事件
  ↓
App.tsx 接收事件 → 从执行列表移除
```

### 性能优化

1. **React.memo**: 组件记忆化避免不必要的重渲染
2. **useCallback**: 缓存事件处理函数
3. **更新频率限制**: 执行时间最多每秒更新一次
4. **CSS 动画**: 使用 Tailwind animate-in 而非 JS 动画
5. **自动清理**: 没有执行项时不渲染组件

### 超时处理

- **默认超时**: 30 秒
- **超时检测**: 每秒检查一次
- **超时动作**:
  1. 从执行列表移除
  2. 显示 toast 警告通知
  3. 通知内容: "插件名 操作 执行超时 (超过 X 秒)"
- **自定义超时**: 可在 Execution 对象中设置 `timeout` 属性
- **禁用超时**: 设置 `timeout: 0`

## 使用方式

### 对于插件开发者

**无需任何操作!** 此功能完全自动化,插件代码不需要任何修改。

### 对于用户

1. **查看执行状态**:
   - 当插件执行操作时,右上角会自动显示指示器
   - 可以看到哪些插件正在执行
   - 可以看到执行了多长时间

2. **手动关闭**:
   - 点击右上角的 X 按钮关闭指示器
   - 关闭后不会影响正在执行的操作

3. **超时提示**:
   - 如果某个操作超过 30 秒,会自动超时并提示
   - 提示后会从列表移除

## 配置选项

### Execution 接口

```typescript
interface Execution {
  id: string              // 唯一标识 (自动生成)
  pluginId: string        // 插件 ID
  pluginName: string      // 插件名称 (自动获取)
  pluginIcon?: string     // 插件图标 (可选)
  operation?: string      // 操作描述 (自动获取)
  startTime: number       // 开始时间 (自动生成)
  timeout?: number        // 超时时间(毫秒),0=禁用 (可选)
}
```

### GlobalExecutionIndicator Props

```typescript
interface GlobalExecutionIndicatorProps {
  executions: Execution[]           // 执行列表
  currentPluginId?: string          // 当前页面的插件 ID
  onTimeout?: (execution: Execution) => void  // 超时回调
  onClose?: () => void              // 关闭回调
}
```

## 文件位置

- **组件**: `src/renderer/src/components/ui/GlobalExecutionIndicator.tsx`
- **集成**: `src/renderer/src/App.tsx`
- **API 包装**: `src/preload/ipc.ts`
- **事务集成**: `src/main/transactions/transaction-executor.ts`
- **任务文档**: `openspec/changes/plugin-execution-indicator/tasks.md`

## 相关系统

- [事务系统](../../TRANSACTION-SYSTEM.md): 事务执行器会自动触发指示器
- [权限系统](../../PERMISSION-SYSTEM.md): 权限请求不会触发指示器(因为是弹窗)
- [UI 设计系统](../../UI-DESIGN-SYSTEM.md): 指示器遵循设计系统规范

## 常见问题

### Q: 为什么我的插件操作没有显示指示器?

A: 请检查:
1. 是否通过 `plugin.callMethod` 调用方法
2. 是否使用了事务 API (`transaction.execute()`)
3. 操作是否太快(小于 100ms)导致闪现

### Q: 可以禁用某个操作的指示器吗?

A: 可以,有以下方式:
1. 不通过 `plugin.callMethod` 调用
2. 设置超时为 0 (不会显示超时,但仍会显示执行状态)
3. 直接调用主进程 API (绕过 preload 层)

### Q: 指示器会影响性能吗?

A: 不会。已做充分优化:
- 最多每秒更新一次执行时间
- 使用 React.memo 避免重渲染
- 空列表时不渲染组件
- 使用 CSS 动画而非 JS

### Q: 如何修改默认超时时间?

A: 在发送事件时可以自定义超时:
```typescript
// 在 preload/ipc.ts 中修改
addExecution({
  // ...
  timeout: 60000  // 60 秒超时
})
```

## 未来改进

可能的增强功能 (Phase 3/4):

- [ ] 点击执行项跳转到插件详情页
- [ ] 显示插件图标
- [ ] 更详细的执行状态(进度百分比)
- [ ] 分组显示(同一插件的多个操作)
- [ ] 执行历史记录
- [ ] 配置面板(用户自定义超时、位置等)

## 版本历史

- **v1.0** (2025-01-15): 初始版本
  - Phase 1: 全局指示器组件 ✅
  - Phase 2: 自动触发机制 ✅
  - Phase 3: UI 优化(核心) ✅
  - Phase 4: 文档和测试(进行中)
