# 添加插件操作进度反馈 UI - 技术设计

## Context

### 问题背景

用户反馈在执行长时间运行的插件操作(如创建微信分身、批量更新分身)时,应用没有任何视觉反馈,让用户感觉"像是卡住了一样"。

### 现状分析

**已有基础设施**:
1. ✅ `PluginLoading.tsx` 组件 - 显示插件加载进度
2. ✅ `pluginStore.loadingPlugins` - 插件加载状态管理
3. ✅ `plugin:loading` IPC 事件 - 插件加载进度事件
4. ✅ 权限请求对话框 - `PermissionRequestDialog`

**缺失部分**:
1. ❌ 插件方法执行时的进度反馈
2. ❌ 通用的进度对话框组件
3. ❌ 插件进度 API (`PluginAPI.progress`)
4. ❌ 操作进度状态管理

### 用户需求

用户明确要求:
> "执行任务的时候应该有个进度页面,或者有个处理页面,现在点击操作,会觉得像是卡住了一样。这个是否可以统一主程序上实现,"

**关键点**:
1. 需要进度反馈界面
2. 必须统一在主程序实现
3. 不能是每个插件单独实现

### 约束条件

1. **向后兼容** - 不能破坏现有插件
2. **渐进增强** - 插件可以选择性使用
3. **性能优先** - 进度报告不能影响操作执行速度
4. **用户体验** - 响应时间 < 100ms

## Goals / Non-Goals

### Goals

- ✅ 提供统一的插件操作进度反馈机制
- ✅ 在主程序实现,所有插件可用
- ✅ 改善长时间操作的用户体验
- ✅ 符合 OpenSpec 规格要求

### Non-Goals

- ❌ 修改所有插件添加进度反馈(只实现微信分身和 Rime 配置插件)
- ❌ 支持操作取消功能(简化实现)
- ❌ 进度信息持久化(运行时状态即可)
- ❌ 重新设计插件加载流程

## Decisions

### 决策1: 扩展 PluginAPI 添加进度方法

**选择**: 在 `PluginAPI` 中添加 `progress` 对象,包含 `start()`, `update()`, `complete()` 方法

**理由**:
- **统一接口**: 所有插件使用相同的 API
- **类型安全**: TypeScript 类型检查确保正确使用
- **实现简单**: 插件只需调用几个方法
- **易于理解**: `start -> update -> complete` 流程清晰

**实现细节**:

```typescript
// 类型定义
interface PluginAPI {
  progress: {
    start(operation: string, totalSteps?: number): void
    update(currentStep: number, stepName?: string): void
    complete(result: 'success' | 'error', error?: string): void
  }
}

// 插件使用示例
async createInstance() {
  this.context.api.progress.start('创建分身', 7)

  try {
    this.context.api.progress.update(1, '检查微信安装')
    await checkWeChatInstalled()

    this.context.api.progress.update(2, '复制应用')
    await copyWeChatApp()

    // ...

    this.context.api.progress.complete('success')
  } catch (error) {
    this.context.api.progress.complete('error', error.message)
    throw error
  }
}
```

### 决策2: 使用专用 IPC 事件通道

**选择**: 使用 `plugin:operation-progress` 事件通道,独立于 `plugin:loading`

**理由**:
- **关注点分离**: 插件加载 vs 操作执行
- **避免冲突**: 不会干扰现有的插件加载流程
- **易于扩展**: 可以添加更多操作类型的事件

**事件格式**:

```typescript
// 进度开始事件
{
  pluginId: string
  operation: string        // 操作名称
  currentStep: 0
  totalSteps: number
  stepName: ''
  status: 'running'
  timestamp: number
}

// 进度更新事件
{
  pluginId: string
  operation: string
  currentStep: number      // 1, 2, 3, ...
  totalSteps: number
  stepName: string         // "复制应用", "签名应用"
  status: 'running'
  timestamp: number
}

// 进度完成事件
{
  pluginId: string
  operation: string
  currentStep: number
  totalSteps: number
  stepName: string
  status: 'success' | 'error'
  error?: string
  timestamp: number
}
```

### 决策3: 在渲染进程使用对话框组件

**选择**: 创建 `ProgressDialog` 组件,作为模态对话框显示进度

**理由**:
- **注意力聚焦**: 模态对话框强制用户关注当前操作
- **防止重复操作**: 对话框打开时,用户无法重复点击
- **易于实现**: 使用现有的 Dialog 组件
- **标准交互**: 用户熟悉对话框交互

**UI 设计**:

```
┌─────────────────────────────────────┐
│  创建分身                    [×]    │
├─────────────────────────────────────┤
│                                      │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░  57%           │
│                                      │
│  正在签名应用...                     │
│  (第 4 步,共 7 步)                   │
│                                      │
│  [⏳]                                │
│                                      │
└─────────────────────────────────────┘
```

**完成状态**:

```
成功:
┌─────────────────────────────────────┐
│  创建分身                    [×]    │
├─────────────────────────────────────┤
│                                      │
│  ✓ 分身创建成功!                     │
│                                      │
│         [关闭]                       │
│                                      │
└─────────────────────────────────────┘

失败:
┌─────────────────────────────────────┐
│  创建分身                    [×]    │
├─────────────────────────────────────┤
│                                      │
│  ✗ 创建失败                          │
│                                      │
│  错误: 磁盘空间不足                  │
│                                      │
│         [关闭]                       │
│                                      │
└─────────────────────────────────────┘
```

### 决策4: 状态管理使用 Map 结构

**选择**: 使用 `Map<string, OperationProgress>` 存储操作进度

**理由**:
- **支持并发**: 多个插件可能同时执行操作
- **快速查找**: 通过 pluginId 快速定位
- **易于清理**: 完成后可以删除条目

**类型定义**:

```typescript
interface OperationProgress {
  operation: string        // "创建分身", "更新版本"
  currentStep: number      // 1, 2, 3, ...
  totalSteps: number       // 7
  stepName: string         // "复制应用"
  status: 'running' | 'success' | 'error'
  error?: string
  startTime: number
  endTime?: number
}

interface PluginState {
  // 使用 Map 存储,键为 pluginId
  operationProgress: Map<string, OperationProgress>
}
```

### 决策5: 在首批插件中实施进度报告

**选择**: 在微信分身插件和 Rime 配置插件中添加进度报告

**理由**:
- **用户痛点**: 创建分身和安装配方是最耗时的操作(2-5分钟)
- **影响最大**: 改善最明显的用户体验
- **可行性强**: 插件代码已熟悉,易于实施

**实施步骤**:

**微信分身插件**:

1. **createInstance** (7 步):
   - 检查微信安装
   - 复制微信应用
   - 修改 Bundle ID
   - 签名应用
   - 修改显示名称
   - 创建符号链接
   - 保存配置

2. **rebuildInstance** (7 步):
   - 删除旧分身
   - 检查微信安装
   - 复制微信应用
   - 修改 Bundle ID
   - 签名应用
   - 修改显示名称
   - 创建符号链接
   - 保存配置

3. **rebuildAllInstances** (批量更新):
   - 显示总体进度: "正在更新 3/5"
   - 显示当前分身: "正在更新 WeChat2..."

**Rime 配置插件**:

1. **installRecipe** (3 步):
   - 请求执行权限
   - 执行 rime-install 命令
   - 验证安装状态

2. **updateRecipe** (3 步):
   - 请求执行权限
   - 执行 rime-install 命令
   - 验证更新状态

3. **deployRime** (3 步):
   - 请求执行权限
   - 执行 rime_deployer 命令
   - 完成部署

## Risks / Trade-offs

### Risk 1: 进度报告影响性能

**风险**: 频繁发送 IPC 事件可能影响操作执行速度

**缓解措施**:
1. **异步发送**: 使用 `webContents.send()` 异步发送事件
2. **批量更新**: 每个步骤发送一次,避免过度频繁
3. **节流**: 如果步骤很短,可以合并多个步骤
4. **性能测试**: 测试有/无进度报告的性能差异

**验收标准**: 进度报告导致的性能下降 < 5%

### Risk 2: 对话框阻塞主线程

**风险**: 频繁更新 UI 可能导致渲染进程卡顿

**缓解措施**:
1. **React 优化**: 使用 `useMemo` 和 `useCallback`
2. **状态更新优化**: 只更新变化的数据
3. **动画优化**: 进度条使用 CSS transition,避免 JS 动画
4. **虚拟化**: 如果显示多个进度,使用虚拟列表

**验收标准**: UI 更新帧率 > 30fps

### Risk 3: 批量操作进度显示混乱

**风险**: 批量更新多个分身时,进度信息可能混乱

**缓解措施**:
1. **分层进度**: 显示总体进度 + 当前项进度
2. **队列显示**: "正在更新 WeChat2 (3/5)"
3. **简化显示**: 批量操作只显示总体进度和当前项
4. **完成摘要**: "成功 3 个,失败 2 个"

**UI 示例**:

```
┌─────────────────────────────────────┐
│  批量更新分身               [×]     │
├─────────────────────────────────────┤
│                                      │
│  总体进度: ▓▓▓▓▓▓░░░░░░  60%         │
│                                      │
│  正在更新: WeChat2 (第 3 个,共 5 个) │
│  当前步骤: 签名应用...               │
│                                      │
│  [⏳]                                │
│                                      │
└─────────────────────────────────────┘
```

### Risk 4: 插件不使用进度 API

**风险**: 插件开发者忘记或不使用进度 API,问题依然存在

**缓解措施**:
1. **文档强调**: 在插件开发文档中明确建议使用
2. **最佳实践**: 提供示例代码
3. **代码审查**: 审查长时间操作的插件
4. **用户反馈**: 用户体验差的插件会收到反馈

**长期方案**: 考虑添加自动超时检测,如果操作超过 3 秒无响应,自动显示"处理中..."提示

## Trade-offs

### 简单性 vs 灵活性

**选择**: 优先简单性

**权衡**:
- ✅ 简单: 只有 `start`, `update`, `complete` 三个方法
- ❌ 不灵活: 不支持子步骤、并发步骤等复杂场景

**结论**: 当前简单性更重要,95% 的场景只需要线性进度。复杂场景可以后续扩展。

### 模态对话框 vs 非模态提示

**选择**: 模态对话框

**权衡**:
- ✅ 模态: 强制用户关注,防止重复操作
- ❌ 模态: 阻止用户进行其他操作

**结论**: 对于创建分身等关键操作,模态对话框更合适。用户应该等待操作完成。

### 详细进度 vs 简化进度

**选择**: 详细进度

**权衡**:
- ✅ 详细: 显示每个步骤,用户了解具体在做什么
- ❌ 详细: 插件需要添加更多进度报告代码

**结论**: 详细进度显著改善用户体验,值得多写几行代码。

## Implementation Plan

### 阶段1: 基础设施 (主进程)

**文件**: `rokun-tool/src/main/plugins/plugin-instance.ts`

1. **扩展 PluginContext 添加 progress API**
   ```typescript
   context.api.progress = {
     start: (operation, totalSteps) => { /* ... */ },
     update: (currentStep, stepName) => { /* ... */ },
     complete: (result, error) => { /* ... */ }
   }
   ```

2. **发送 IPC 事件**
   ```typescript
   private sendProgressEvent(data: ProgressEventData): void {
     this.mainWindow?.webContents.send('plugin:operation-progress', data)
   }
   ```

### 阶段2: 状态管理 (渲染进程)

**文件**: `rokun-tool/src/renderer/src/store/pluginStore.ts`

1. **添加 operationProgress 状态**
   ```typescript
   operationProgress: Map<string, OperationProgress>
   ```

2. **添加 Actions**
   ```typescript
   setOperationProgress: (pluginId, progress) => void
   clearOperationProgress: (pluginId) => void
   ```

### 阶段3: UI 组件 (渲染进程)

**文件**: `rokun-tool/src/renderer/src/components/ui/ProgressDialog.tsx`

1. **创建 ProgressDialog 组件**
   - 显示操作名称
   - 显示进度条
   - 显示当前步骤
   - 显示状态图标
   - 显示错误信息

2. **添加关闭按钮**
   - 只在完成时显示
   - 点击后清理状态

### 阶段4: 集成到插件

**文件**: `plugins/wechat-multi-instance/index.js` 和 `plugins/rime-config/index.js`

#### 4.1 微信分身插件集成

1. **修改 createInstance 方法**
   - 在每个步骤前调用 `this.context.api.progress.update()`
   - 添加 try-catch 确保 `complete()` 被调用

2. **修改 rebuildInstance 方法**
   - 同上

3. **修改 rebuildAllInstances 方法**
   - 显示总体进度
   - 更新当前处理的分身

### 阶段5: 监听事件并显示对话框

**文件**: `rokun-tool/src/renderer/src/components/pages/WeChatMultiInstance.tsx`

1. **监听 IPC 事件**
   ```typescript
   useEffect(() => {
     const handler = (_event, data) => {
       setOperationProgress(data)
     }
     window.electronAPI.ipc.on('plugin:operation-progress', handler)
     return () => window.electronAPI.ipc.off('plugin:operation-progress', handler)
   }, [])
   ```

2. **渲染 ProgressDialog**
   ```typescript
   <ProgressDialog
     isOpen={operationProgress !== null}
     title={operationProgress?.operation}
     currentStep={operationProgress?.stepName}
     progress={calculateProgress(operationProgress)}
     status={operationProgress?.status}
     error={operationProgress?.error}
     onClose={() => clearOperationProgress()}
   />
   ```

### 阶段6: 测试

1. **功能测试**
   - 创建单个分身,验证进度显示
   - 更新单个分身,验证进度显示
   - 批量更新分身,验证总体进度

2. **性能测试**
   - 测量有/无进度报告的操作耗时
   - 验证性能下降 < 5%

3. **错误处理测试**
   - 操作失败时显示错误信息
   - 异常情况下也能显示完成状态

## Testing Strategy

### 单元测试

**测试范围**:
- `PluginAPI.progress` 方法调用
- IPC 事件发送
- 状态管理更新

**示例**:
```typescript
describe('PluginAPI.progress', () => {
  it('should send progress start event', () => {
    const progress = pluginInstance.api.progress
    progress.start('创建分身', 7)

    expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
      'plugin:operation-progress',
      expect.objectContaining({
        operation: '创建分身',
        totalSteps: 7,
        status: 'running'
      })
    )
  })
})
```

### 集成测试

**测试范围**:
- 插件执行操作时,渲染进程收到进度事件
- UI 正确显示进度信息

**示例**:
```typescript
it('should display progress dialog when plugin reports progress', async () => {
  // 触发创建分身操作
  fireEvent.click(getByText('创建分身'))

  // 等待进度对话框出现
  await waitFor(() => {
    expect(getByText('创建分身')).toBeInTheDocument()
  })

  // 验证进度信息
  expect(getByText('正在复制应用...')).toBeInTheDocument()
})
```

### 手动测试

**测试场景**:

1. **正常流程**
   - 点击"创建分身"
   - 验证对话框立即显示
   - 验证进度条逐步更新
   - 验证完成后显示成功状态

2. **错误流程**
   - 模拟磁盘空间不足
   - 验证错误信息正确显示
   - 验证可以关闭对话框

3. **批量操作**
   - 创建多个分身
   - 点击"全部更新"
   - 验证总体进度正确显示

## Performance Considerations

### IPC 事件频率

**当前设计**: 每个步骤发送一次事件

**性能影响**:
- IPC 事件开销: ~1ms
- 创建分身: 7 个步骤 = 7ms 额外开销
- 操作总耗时: 2-5 分钟
- **影响**: < 0.01% (可忽略)

### UI 更新频率

**当前设计**: 每次收到进度事件都更新 UI

**性能影响**:
- React 渲染: ~10ms
- 进度条动画: CSS transition (GPU 加速)
- 创建分身: 7 次更新 = 70ms 额外开销
- **影响**: 可忽略

### 内存占用

**当前设计**: Map 存储进度状态

**性能影响**:
- 每个进度对象: ~200 bytes
- 最多并发操作: ~10 个
- **总占用**: ~2 KB (可忽略)

## Security Considerations

- ✅ 不引入新的安全风险
- ✅ 进度信息经过验证和序列化
- ✅ 不接受用户输入的进度数据(由插件提供)

## Migration Plan

### 实施步骤

1. **第1步**: 实现主进程进度 API (1天)
   - 扩展 PluginAPI
   - 实现 IPC 事件发送

2. **第2步**: 实现渲染进程状态管理 (0.5天)
   - 添加 operationProgress 状态
   - 实现 Actions

3. **第3步**: 创建 ProgressDialog 组件 (0.5天)
   - 实现 UI 组件
   - 添加样式

4. **第4步**: 集成到微信分身插件 (1天)
   - 添加进度报告调用
   - 测试功能

5. **第5步**: 测试和文档 (0.5天)
   - 功能测试
   - 更新文档

**总计**: 3.5 天

### 回滚计划

如果出现问题:
1. 移除插件的进度报告调用
2. 禁用 ProgressDialog 组件
3. 保留进度 API(不影响其他功能)

## Open Questions

### Q1: 是否需要支持操作取消?

**当前状态**: 不支持

**考虑**: 用户可能想中止长时间操作

**决策**: 当前不支持,原因:
- 创建分身操作难以安全取消(可能留下半成品)
- 增加实现复杂度
- 用户可以关闭应用强制终止

**未来**: 如果有强烈需求,可以添加:
```typescript
context.api.progress.cancel()
```

### Q2: 进度信息是否需要持久化?

**当前状态**: 不持久化

**考虑**: 应用重启后是否恢复进度显示

**决策**: 不需要持久化,原因:
- 操作通常在几分钟内完成
- 应用重启时操作可能已完成或失败
- 持久化增加复杂度

### Q3: 是否需要显示操作耗时?

**当前状态**: 不显示

**考虑**: 显示"已用时 1分30秒"

**决策**: 当前不显示,原因:
- 进度百分比已经足够
- 耗时信息不是必需的
- 可以后续添加

## Implementation Notes

### 关键点

1. **进度百分比计算**
   ```typescript
   const progress = totalSteps > 0
     ? (currentStep / totalSteps) * 100
     : 0
   ```

2. **防止状态泄漏**
   ```typescript
   // 操作完成后,延迟清理状态
   setTimeout(() => {
     clearOperationProgress(pluginId)
   }, 3000) // 3秒后自动关闭
   ```

3. **错误处理**
   ```typescript
   try {
     // 操作代码
     context.api.progress.complete('success')
   } catch (error) {
     context.api.progress.complete('error', error.message)
     throw error // 重新抛出,让调用者处理
   }
   ```

### 测试场景

1. **正常创建分身**
   - 验证 7 个步骤都显示
   - 验证进度条正确更新

2. **创建失败**
   - 验证错误信息显示
   - 验证可以关闭对话框

3. **批量更新**
   - 验证总体进度显示
   - 验证当前分身显示

4. **网络中断(未来)**
   - 验证网络操作的超时处理
   - 验证重试机制的进度显示

---

**设计状态**: ✅ 完成
**最后更新**: 2026-01-13
**审核人**: 待定
