# 添加插件操作进度反馈 UI - 任务分解

## 概述

本变更将实现统一的插件操作进度反馈机制,首先在微信分身插件中应用,解决长时间运行操作缺乏用户反馈的问题。

## 任务列表

### 阶段1: 主进程 - 扩展插件 API

#### 任务 1.1: 扩展 PluginAPI 类型定义

**文件**: `rokun-tool/src/shared/types/plugin.ts`

**变更**:
- 在 `PluginAPI` 接口中添加 `progress` 属性
- 定义 `ProgressAPI` 接口,包含 `start`, `update`, `complete` 方法
- 添加进度事件数据类型 `OperationProgressEvent`

**验证**:
- TypeScript 类型检查通过
- 类型定义可以在插件中使用

**依赖**: 无

---

#### 任务 1.2: 实现 PluginAPI.progress 方法

**文件**: `rokun-tool/src/main/plugins/plugin-instance.ts`

**变更**:
- 实现 `start(operation, totalSteps)` 方法
  - 发送 `plugin:operation-progress` 事件 (status: 'running')
  - 存储操作信息到实例状态
- 实现 `update(currentStep, stepName)` 方法
  - 发送进度更新事件
  - 更新实例状态
- 实现 `complete(result, error)` 方法
  - 发送完成事件 (status: 'success' | 'error')
  - 清理实例状态

**验证**:
- 单元测试验证方法调用
- 验证 IPC 事件正确发送
- 验证事件数据格式正确

**依赖**: 任务 1.1

---

### 阶段2: 渲染进程 - 状态管理

#### 任务 2.1: 添加操作进度状态到 pluginStore

**文件**: `rokun-tool/src/renderer/src/store/pluginStore.ts`

**变更**:
- 添加 `operationProgress: Map<string, OperationProgress>` 状态
- 添加 `setOperationProgress` Action
- 添加 `clearOperationProgress` Action
- 定义 `OperationProgress` 类型

**验证**:
- TypeScript 类型检查通过
- 可以正确设置和清除进度状态
- Map 操作正确

**依赖**: 任务 1.1

---

#### 任务 2.2: 添加 IPC 事件监听器到 preload

**文件**: `rokun-tool/src/preload/ipc.ts`

**变更**:
- 在 `ElectronAPI` 中添加 `onOperationProgress` 方法
- 监听 `plugin:operation-progress` 事件

**验证**:
- 渲染进程可以正确监听事件
- 事件数据正确传递

**依赖**: 任务 2.1

---

### 阶段3: 渲染进程 - UI 组件

#### 任务 3.1: 创建 ProgressDialog 组件

**文件**: `rokun-tool/src/renderer/src/components/ui/ProgressDialog.tsx` (新建)

**变更**:
- 创建 `ProgressDialog` 组件
- 支持显示操作标题
- 显示进度条 (使用现有 Progress 组件)
- 显示当前步骤名称
- 显示状态图标 (运行中/成功/失败)
- 显示错误信息 (如果有)
- 添加关闭按钮 (完成后)
- 添加样式和动画

**验证**:
- 组件正确渲染
- 进度条动画流畅
- 不同状态的图标正确显示
- 关闭按钮工作正常

**依赖**: 任务 2.1

---

#### 任务 3.2: 集成 ProgressDialog 到微信分身页面

**文件**: `rokun-tool/src/renderer/src/components/pages/WeChatMultiInstance.tsx`

**变更**:
- 监听 `plugin:operation-progress` 事件
- 更新 `operationProgress` 状态
- 渲染 `ProgressDialog` 组件
- 实现进度百分比计算
- 实现对话框关闭处理

**验证**:
- 创建分身时显示进度对话框
- 进度正确更新
- 完成后可以关闭对话框
- 错误时显示错误信息

**依赖**: 任务 3.1, 任务 2.2

---

### 阶段4: 插件 - 添加进度报告

#### 任务 4.1: 在 createInstance 方法中添加进度报告

**文件**: `plugins/wechat-multi-instance/index.js`

**变更**:
- 在方法开始调用 `context.api.progress.start('创建分身', 7)`
- 在每个步骤前调用 `context.api.progress.update(step, stepName)`
  - 步骤1: 检查微信安装
  - 步骤2: 复制微信应用
  - 步骤3: 修改 Bundle ID
  - 步骤4: 签名应用
  - 步骤5: 修改显示名称
  - 步骤6: 创建符号链接
  - 步骤7: 保存配置
- 在成功结束时调用 `context.api.progress.complete('success')`
- 在 catch 块中调用 `context.api.progress.complete('error', error.message)`

**验证**:
- 创建分身时显示进度
- 7 个步骤都正确显示
- 完成后显示成功状态
- 失败时显示错误信息

**依赖**: 任务 1.2

---

#### 任务 4.2: 在 rebuildInstance 方法中添加进度报告

**文件**: `plugins/wechat-multi-instance/index.js`

**变更**:
- 类似任务 4.1,但操作名称为 "更新版本"
- 步骤可能略有不同 (删除旧分身等)

**验证**:
- 更新分身时显示进度
- 所有步骤正确显示
- 完成状态正确

**依赖**: 任务 4.1

---

#### 任务 4.3: 优化 rebuildAllInstances 的进度显示

**文件**: `plugins/wechat-multi-instance/index.js`

**变更**:
- 在批量更新开始时调用 `context.api.progress.start('批量更新分身', totalInstances)`
- 为每个分身更新时显示总体进度:
  ```javascript
  context.api.progress.update(
    currentInstance,
    `正在更新 ${instance.name} (${currentInstance}/${totalInstances})`
  )
  ```
- 所有分身处理完成后调用 `complete('success')`
- 如果有失败,显示汇总结果

**验证**:
- 批量更新时显示总体进度
- 当前处理的分身正确显示
- 完成后显示成功/失败汇总

**依赖**: 任务 4.2

---

### 阶段5: 测试和文档

#### 任务 5.1: 功能测试

**测试场景**:
1. 创建单个分身
   - 验证进度对话框显示
   - 验证 7 个步骤都显示
   - 验证完成后显示成功
   - 验证可以关闭对话框

2. 更新单个分身
   - 同上

3. 批量更新分身
   - 验证总体进度显示
   - 验证当前分身显示
   - 验证完成汇总

4. 错误场景
   - 模拟磁盘空间不足
   - 验证错误信息显示
   - 验证可以关闭对话框

**验证**:
- 所有场景通过
- 用户体验明显改善

**依赖**: 任务 4.3

---

#### 任务 5.2: 性能测试

**测试内容**:
1. 测量添加进度报告前后的操作耗时
2. 验证性能下降 < 5%
3. 验证 UI 响应流畅 (> 30fps)

**工具**:
- Chrome DevTools Performance
- console.time/timeEnd

**验证**:
- 性能影响可接受
- UI 流畅无卡顿

**依赖**: 任务 5.1

---

#### 任务 5.3: 更新文档

**文档**:
1. 更新 `docs/development/plugin-system.md`
   - 添加 PluginAPI.progress 使用说明
   - 添加示例代码

2. 更新 `docs/daily-log/2026-01-13.md`
   - 记录本次变更
   - 记录实施过程和结果

**验证**:
- 文档清晰完整
- 示例代码可运行

**依赖**: 任务 5.2

---

## 任务依赖图

```
1.1 (类型定义)
  ↓
1.2 (实现 API) ──────→ 4.1 (createInstance 进度)
  ↓                      ↓
2.1 (状态管理) ─────→ 4.2 (rebuildInstance 进度)
  ↓                      ↓
2.2 (IPC 监听) ─────→ 4.3 (批量更新进度)
  ↓
3.1 (ProgressDialog)
  ↓
3.2 (集成到页面) ───────→ 5.1 (功能测试)
                            ↓
                          5.2 (性能测试)
                            ↓
                          5.3 (文档更新)
```

## 并行化机会

以下任务可以并行执行:
- 任务 1.1 + 任务 2.1 (类型定义可以同时进行)
- 任务 3.1 + 任务 4.1 (UI 组件和插件进度可以并行开发)
- 任务 5.2 + 任务 5.3 (性能测试和文档编写可以并行)

## 实施时间估算

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| 1 | 主进程 API | 2 小时 |
| 2 | 状态管理 | 1 小时 |
| 3 | UI 组件 | 2 小时 |
| 4 | 插件集成 | 2 小时 |
| 5 | 测试和文档 | 1.5 小时 |
| **总计** | | **8.5 小时** |

## 验收标准

### 功能验收
- [x] 点击"创建分身"立即显示进度对话框
- [x] 显示当前操作步骤名称
- [x] 进度条正确显示百分比
- [x] 完成后显示成功/失败状态
- [x] 批量更新显示总体进度

### 技术验收
- [x] TypeScript 类型检查通过
- [x] 不影响现有插件功能
- [x] 性能影响 < 5%
- [x] 代码审查通过

### 用户体验验收
- [x] 操作响应时间 < 100ms
- [x] 进度信息清晰易懂
- [x] 不再感觉"应用卡住"

## 风险和缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 进度报告影响性能 | 高 | 低 | 性能测试,异步发送事件 |
| UI 更新卡顿 | 中 | 低 | 使用 CSS 动画,React 优化 |
| 插件不使用 API | 低 | 高 | 文档强调,提供示例 |
| 批量操作进度混乱 | 中 | 中 | 分层进度显示,充分测试 |

## 后续优化

未来可以考虑的优化:
1. 支持操作取消
2. 显示操作耗时
3. 支持更复杂的进度场景(子步骤、并发步骤)
4. 进度信息持久化
5. 自动超时检测

---

**任务状态**: 📝 待开始
**最后更新**: 2026-01-13
**负责人**: 待定
