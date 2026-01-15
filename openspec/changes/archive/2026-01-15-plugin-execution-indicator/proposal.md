# Proposal: Plugin Execution Indicator

## Meta

- **Change ID**: plugin-execution-indicator
- **Status**: Draft
- **Created**: 2026-01-14
- **Owner**: RokunTool Team

## Problem Statement

当前插件执行时存在以下用户体验问题:

1. **缺少视觉反馈**: 插件执行长时间操作时,如果没有显式调用进度 API,用户会以为应用卡死了
2. **进度条过重**: 不是所有操作都需要详细的进度条弹窗,简单的操作只需要一个"正在执行"的指示
3. **不一致的反馈**: 有些操作显示进度条,有些操作没有任何反馈

### 具体场景

**场景 1: 快速操作**
```
用户点击"刷新状态"
  ↓
插件执行 (1-2秒)
  ↓
无任何视觉反馈
  ↓
用户怀疑:是否卡住了?再点一次?
  ↓
重复执行,浪费资源
```

**场景 2: 长时间操作但无进度**
```
用户点击"安装配方"
  ↓
插件执行 (需要10秒)
  ↓
无任何反馈
  ↓
用户强制关闭应用
```

### 用户需求

1. **全局执行指示器**: 只要插件在执行任何操作,就显示一个轻量的"正在执行"指示
2. **自动触发**: 不需要插件手动调用,系统自动检测插件执行状态
3. **可选的详细进度**: 插件可以选择显示详细的进度条弹窗,但不是强制的
4. **非侵入式**: 指示器不应该遮挡用户界面,应该是一个小的 loading 图标或动画

## Proposed Solution

### 1. 全局插件执行指示器

在主窗口添加一个全局的执行指示器,当任何插件执行操作时自动显示。

#### 位置和样式

```
┌─────────────────────────────────────┐
│  RokunTool              🔴 正在执行... │  ← 右上角小图标
├─────────────────────────────────────┤
│                                     │
│  主内容区域                         │
│                                     │
└─────────────────────────────────────┘
```

**设计要点**:
- 位置: 右上角或顶部中心
- 样式: 小的 loading spinner + 简短文字
- 动画: 旋转的 spinner 或脉冲动画
- 颜色: 主题色 (浅色/深色模式自适应)

#### 触发条件

自动显示指示器的条件:
1. 插件方法被调用 (`plugin.callMethod`)
2. 事务执行开始
3. 权限对话框打开

自动隐藏指示器的条件:
1. 插件方法返回结果
2. 事务执行完成
3. 权限对话框关闭

### 2. 双层进度系统

#### Layer 1: 全局轻量指示器 (自动)

- **何时显示**: 任何插件执行操作时自动显示
- **显示内容**: "正在执行..." + 插件图标
- **交互**: 非交互式,仅显示状态
- **示例**:
  ```
  🔴 正在执行 - Rime 配置
  🔴 正在执行 - 微信分身
  ```

#### Layer 2: 详细进度弹窗 (可选)

- **何时显示**: 插件显式调用 `progress.start()` 时
- **显示内容**: 详细的进度条、步骤名称、日志
- **交互**: 可关闭,显示详细进度
- **现有组件**: ProgressDialog

### 3. API 设计

#### 自动检测 (无需 API)

系统自动监听以下事件:
```typescript
// 插件方法调用
window.electronAPI.plugin.callMethod({
  pluginId: 'rokun-rime-config',
  method: 'installRecipe'
})
// ↓ 自动显示全局指示器

// 方法返回
{ success: true, data: ... }
// ↓ 自动隐藏全局指示器
```

#### 可选的详细进度 (现有 API)

如果插件需要显示详细进度,仍然使用现有 API:
```typescript
// 插件代码
this.context.api.progress.start('安装配方', 5)
this.context.api.progress.update(1, '创建备份')
this.context.api.progress.complete('success')
// ↓ 显示 ProgressDialog
```

### 4. 超时处理

为避免指示器卡住,添加超时机制:
- **方法超时**: 30秒后自动隐藏指示器,显示"操作超时"提示
- **事务超时**: 继承事务的超时配置 (默认30秒)
- **权限超时**: 权限对话框超时后隐藏指示器

## User Impact

### Before

```
用户点击"刷新状态"
  ↓
等待... (无反馈)
  ↓
用户疑惑:是否卡住了?
  ↓
用户再次点击
  ↓
重复执行
```

### After

```
用户点击"刷新状态"
  ↓
[🔴 正在执行...] ← 自动显示指示器
  ↓
用户知道系统正在工作
  ↓
等待完成
  ↓
指示器消失
```

## Implementation Plan

### Phase 1: 全局指示器组件 (P0)

#### 1.1 创建 GlobalExecutionIndicator 组件

**文件**: `src/renderer/src/components/ui/GlobalExecutionIndicator.tsx`

**功能**:
- 显示全局执行状态
- 支持多个插件同时执行 (显示列表)
- 自动浅色/深色模式适配
- 动画效果

**样式**:
- 固定在右上角
- 半透明背景
- 小图标 + 文字
- 进出动画

#### 1.2 集成到主应用

**文件**: `src/renderer/src/App.tsx`

**功能**:
- 在顶层添加 GlobalExecutionIndicator
- 监听插件执行事件
- 管理执行状态列表

**监听事件**:
- `plugin:method:start` - 方法开始执行
- `plugin:method:end` - 方法执行完成
- `transaction:start` - 事务开始
- `transaction:end` - 事务完成

#### 1.3 主进程事件发送

**文件**: `src/main/ipc/handlers.ts`

**功能**:
- 在 `plugin:callMethod` handler 中发送开始/结束事件
- 在事务执行器中发送事务开始/结束事件
- 添加超时检测

### Phase 2: 自动触发机制 (P1)

#### 2.1 插件方法调用拦截

**文件**: `src/preload/ipc.ts`

**功能**:
- 包装 `plugin.callMethod` API
- 自动发送 `plugin:method:start` 事件
- 等待结果后发送 `plugin:method:end` 事件

#### 2.2 事务执行集成

**文件**: `src/main/transactions/transaction-executor.ts`

**功能**:
- 在 `execute()` 开始时发送 `transaction:start` 事件
- 在 `execute()` 结束时发送 `transaction:end` 事件

#### 2.3 超时处理

**文件**: `src/renderer/src/components/ui/GlobalExecutionIndicator.tsx`

**功能**:
- 使用 setTimeout 检测超时
- 超时后自动隐藏指示器
- 显示"操作超时"提示

### Phase 3: UI 优化 (P2)

#### 3.1 动画优化

- 平滑的进入/退出动画
- 加载 spinner 动画
- 多插件执行时的切换动画

#### 3.2 状态信息

- 显示正在执行的插件名称
- 显示执行时间
- 显示执行的操作类型

#### 3.3 可访问性

- ARIA 标签
- 屏幕阅读器支持
- 键盘导航

## Success Criteria

1. ✅ 任何插件执行操作时自动显示全局指示器
2. ✅ 指示器在操作完成后自动隐藏
3. ✅ 超时情况下指示器自动隐藏并提示
4. ✅ 插件可以选择显示详细进度弹窗
5. ✅ 支持多个插件同时执行
6. ✅ 浅色/深色模式适配
7. ✅ 不影响现有功能

## Alternatives Considered

### 方案 A: 强制显示 ProgressDialog

**优点**: 实现简单

**缺点**:
- 太重,所有操作都显示弹窗
- 侵入性强,遮挡用户界面
- 简单操作不需要详细进度

**结论**: 不采用

### 方案 B: 在每个按钮上显示 loading 状态

**优点**: 本地化反馈

**缺点**:
- 每个按钮都需要添加状态管理
- 全局操作无法显示
- 维护成本高

**结论**: 不采用

### 方案 C: 全局指示器 + 可选详细进度 (推荐)

**优点**:
- 轻量,不遮挡界面
- 自动触发,插件无需修改
- 灵活,支持详细进度

**缺点**: 需要全局状态管理

**结论**: 采用此方案

## Related Changes

- 依赖: `transactional-permissions` (需要集成事务事件)
- 补充: 进度报告系统
- 不冲突: 现有的 ProgressDialog 继续使用

### 与现有系统的集成

#### 事务系统集成
- ✅ 监听 `transaction:start` 和 `transaction:end` 事件
- ✅ 如果事务正在使用 ProgressDialog,则不显示全局指示器
- ✅ 两者互斥,避免重复显示进度

#### 进度报告系统集成
- ✅ 插件调用 `progress.start()` 时,显示 ProgressDialog
- ✅ 如果插件没有调用进度 API,则显示全局指示器
- ✅ 优先级: ProgressDialog > 全局指示器

#### 集成策略
```typescript
// 判断逻辑
if (pluginCalledProgressAPI) {
  // 显示 ProgressDialog (详细进度)
  showProgressDialog()
} else if (pluginExecuting) {
  // 显示全局指示器 (轻量指示)
  showGlobalIndicator()
}
```

## Spec Deltas

此变更不修改任何现有规格文件。

**理由**:
- 这是一个纯粹的 UI 增强功能
- 不改变插件系统的 API 或行为
- 不修改权限或事务系统的逻辑
- 只是添加了一个新的视觉反馈组件

### 需要修改的实现文件

#### Renderer 层
1. **新增**: `src/renderer/src/components/ui/GlobalExecutionIndicator.tsx`
   - 全局执行指示器组件
   - 执行项列表组件
   - 超时通知组件

2. **修改**: `src/renderer/src/App.tsx`
   - 集成全局指示器
   - 管理执行状态列表
   - 监听插件执行事件

3. **修改**: `src/renderer/src/types/electron.ts`
   - 添加新事件类型定义
   - `PluginMethodStartEvent`
   - `PluginMethodEndEvent`
   - `TransactionStartEvent`
   - `TransactionEndEvent`

#### Preload 层
4. **修改**: `src/preload/ipc.ts`
   - 包装 `plugin.callMethod` API
   - 自动发送 `plugin:method:start` 事件
   - 自动发送 `plugin:method:end` 事件

#### Main 层
5. **修改**: `src/main/ipc/handlers.ts`
   - 在 `plugin:callMethod` handler 中添加事件发送
   - 处理权限对话框场景

6. **修改**: `src/main/transactions/transaction-executor.ts`
   - 在 `execute()` 开始时发送 `transaction:start` 事件 (可能已实现)
   - 在 `execute()` 结束时发送 `transaction:end` 事件 (可能已实现)

### 不需要修改的部分

- ✅ 权限系统:完全独立,无修改
- ✅ 事务系统:仅监听事件,不修改核心逻辑
- ✅ 插件系统:API 保持不变,向后兼容
- ✅ 进度报告:继续使用现有 API

这些修改都是实现细节,不改变系统的功能规格。

## Risks & Mitigations

### 风险 1: 指示器卡住不消失

**缓解措施**(改进版):
1. ✅ **超时机制**: 30秒后自动隐藏
2. ✅ **手动关闭**: 点击指示器可关闭
3. ✅ **多事件监听**: 同时监听 `end` 事件和窗口焦点变化
4. ✅ **健康检查**: 每5秒检查插件进程是否存活

**实现细节**:
```typescript
// 健康检查
setInterval(async () => {
  for (const execution of activeExecutions) {
    const isAlive = await checkPluginProcess(execution.pluginId)
    if (!isAlive) {
      removeExecution(execution.id)
      showNotification(`${execution.pluginName} 无响应`)
    }
  }
}, 5000)
```

### 风险 2: 多个插件同时执行时混乱

**缓解措施**:
1. ✅ **执行项排序规则** (详见 design.md)
   - 当前页面的插件:置顶
   - 执行时间最长:排在前面
   - 最近启动:排在前面

2. ✅ **限制显示数量**
   - 桌面端:最多显示3个
   - 移动端:最多显示2个
   - 超出:显示"还有N个插件在执行..."

3. ✅ **使用折叠/展开动画**
   - 平滑的进入/退出动画
   - 虚拟化列表 (如果超过5个)

### 风险 3: 性能影响

**缓解措施**(改进版):
1. ✅ **使用 React.memo 包装组件**
   ```typescript
   export default React.memo(GlobalExecutionIndicator, (prev, next) => {
     return prev.executions.length === next.executions.length
   })
   ```

2. ✅ **限制更新频率**: 最多每秒更新1次执行时间
   ```typescript
   const [lastUpdateTime, setLastUpdateTime] = useState(0)
   const shouldUpdate = Date.now() - lastUpdateTime > 1000
   ```

3. ✅ **虚拟化列表**: 如果执行项超过5个,显示"还有N个..."
4. ✅ **性能监控**: 添加性能指标记录
   - 显示时长
   - 更新次数
   - 内存使用

### 风险 4: 与现有系统冲突

**缓解措施**:
1. ✅ **优先级明确**: ProgressDialog > 全局指示器
2. ✅ **事件隔离**: 使用独立的事件命名空间
3. ✅ **向后兼容**: 不影响现有插件代码
4. ✅ **降级方案**: 如果指示器加载失败,不影响主功能
