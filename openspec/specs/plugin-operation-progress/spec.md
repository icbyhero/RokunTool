# plugin-operation-progress Specification

## Purpose
TBD - created by archiving change add-progress-feedback-ui. Update Purpose after archive.
## Requirements
### Requirement: 插件进度 API

The system MUST provide a progress reporting API for plugins to report operation progress to the user interface.

#### Scenario: 插件报告操作开始

- **WHEN** 插件开始执行长时间运行的操作
- **THEN** 插件必须调用 `context.api.progress.start(operation, totalSteps)`
- **AND** 系统必须发送 `plugin:operation-progress` 事件到渲染进程
- **AND** 事件必须包含操作名称和总步骤数
- **AND** 渲染进程必须显示进度对话框

#### Scenario: 插件报告操作进度

- **WHEN** 插件执行的操作进展到新步骤
- **THEN** 插件必须调用 `context.api.progress.update(currentStep, stepName)`
- **AND** 系统必须发送进度更新事件
- **AND** 事件必须包含当前步骤编号和步骤名称
- **AND** 渲染进程必须更新进度条和步骤文本

#### Scenario: 插件报告操作完成

- **WHEN** 插件操作成功完成
- **THEN** 插件必须调用 `context.api.progress.complete('success')`
- **AND** 系统必须发送完成事件
- **AND** 渲染进程必须显示成功状态图标
- **AND** 对话框必须显示关闭按钮

#### Scenario: 插件报告操作失败

- **WHEN** 插件操作失败并抛出错误
- **THEN** 插件必须在 catch 块中调用 `context.api.progress.complete('error', errorMessage)`
- **AND** 系统必须发送错误事件
- **AND** 事件必须包含错误信息
- **AND** 渲染进程必须显示错误状态图标和错误消息

### Requirement: 进度事件格式

The system MUST define a standard event format for operation progress reporting.

#### Scenario: 进度开始事件格式

- **WHEN** 插件调用 `progress.start()`
- **THEN** 事件格式必须包含以下字段:
  ```json
  {
    "pluginId": "rokun-wechat-multi-instance",
    "operation": "创建分身",
    "currentStep": 0,
    "totalSteps": 7,
    "stepName": "",
    "status": "running",
    "timestamp": 1705180800000
  }
  ```

#### Scenario: 进度更新事件格式

- **WHEN** 插件调用 `progress.update()`
- **THEN** 事件格式必须包含:
  - `pluginId`: 插件标识符
  - `operation`: 操作名称
  - `currentStep`: 当前步骤编号 (1-based)
  - `totalSteps`: 总步骤数
  - `stepName`: 当前步骤名称
  - `status`: "running"
  - `timestamp`: 事件时间戳

#### Scenario: 进度完成事件格式

- **WHEN** 插件调用 `progress.complete()`
- **THEN** 事件格式必须包含:
  - 所有更新事件字段
  - `status`: "success" 或 "error"
  - `error`: 错误消息 (如果 status 为 "error")

### Requirement: 进度对话框 UI

The system MUST provide a modal dialog component to display operation progress.

#### Scenario: 显示进度对话框

- **WHEN** 用户点击执行长时间操作
- **AND** 插件报告进度开始
- **THEN** 系统必须显示模态进度对话框
- **AND** 对话框必须显示在窗口中央
- **AND** 对话框必须阻止用户进行其他操作
- **AND** 对话框必须在 100ms 内显示

#### Scenario: 显示进度信息

- **WHEN** 进度对话框打开
- **THEN** 必须显示操作标题
- **AND** 必须显示进度条
- **AND** 必须显示当前步骤文本
- **AND** 必须显示状态图标
- **AND** 如果是批量操作,必须显示总体进度

#### Scenario: 进度条更新

- **WHEN** 收到进度更新事件
- **THEN** 进度条必须更新到新的百分比
- **AND** 百分比计算公式为 `(currentStep / totalSteps) * 100`
- **AND** 进度条必须使用平滑动画过渡
- **AND** 动画时长应为 300ms

#### Scenario: 显示完成状态

- **WHEN** 操作成功完成
- **THEN** 必须显示绿色对勾图标
- **AND** 必须显示"操作成功"文本
- **AND** 必须显示关闭按钮
- **AND** 点击关闭按钮或等待3秒后自动关闭对话框

#### Scenario: 显示错误状态

- **WHEN** 操作失败
- **THEN** 必须显示红色叉号图标
- **AND** 必须显示错误消息
- **AND** 必须显示关闭按钮
- **AND** 错误消息必须简洁明了

### Requirement: 操作进度状态管理

The system MUST manage operation progress state in the renderer process.

#### Scenario: 存储操作进度

- **WHEN** 收到进度事件
- **THEN** 必须将进度信息存储到状态管理
- **AND** 必须使用 `Map<string, OperationProgress>` 结构
- **AND** 键为插件 ID,值为进度对象

#### Scenario: 更新操作进度

- **WHEN** 同一插件的进度更新
- **THEN** 必须更新 Map 中对应的值
- **AND** 必须触发组件重新渲染
- **AND** 必须保持最新状态

#### Scenario: 清除操作进度

- **WHEN** 操作完成且用户关闭对话框
- **THEN** 必须从 Map 中删除该插件的进度信息
- **AND** 必须释放内存

### Requirement: 微信分身插件进度报告

The rokun-wechat-multi-instance plugin MUST report progress for all long-running operations.

#### Scenario: 创建分身进度报告

- **WHEN** 用户创建微信分身
- **THEN** 插件必须在以下步骤报告进度:
  1. 检查微信安装 (10%)
  2. 复制微信应用 (20%)
  3. 修改 Bundle ID (30%)
  4. 签名应用 (40%)
  5. 修改显示名称 (50%)
  6. 创建符号链接 (60%)
  7. 保存配置 (70%)
- **AND** 每个步骤必须显示清晰的步骤名称
- **AND** 完成后必须报告成功状态

#### Scenario: 更新分身进度报告

- **WHEN** 用户更新微信分身
- **THEN** 插件必须报告重建进度
- **AND** 步骤应包括:删除旧分身、复制新应用、修改配置等
- **AND** 完成后必须更新分身的版本信息

#### Scenario: 批量更新进度报告

- **WHEN** 用户批量更新多个分身
- **THEN** 插件必须报告总体进度
- **AND** 必须显示 "正在更新 WeChat2 (3/5)" 格式的文本
- **AND** 必须在所有分身处理完成后显示汇总结果
- **AND** 汇总结果应包含成功和失败的数量

### Requirement: 性能要求

The progress reporting system MUST meet specified performance benchmarks.

#### Scenario: 最小化性能影响

- **WHEN** 插件报告进度
- **THEN** IPC 事件发送必须是异步的
- **AND** 进度报告导致的性能下降必须小于 5%
- **AND** 不影响操作的正常执行速度

#### Scenario: UI 响应性能

- **WHEN** 进度对话框显示和更新
- **THEN** 对话框必须在 100ms 内显示
- **AND** UI 更新帧率必须保持 30fps 以上
- **AND** 进度条动画必须使用 GPU 加速

#### Scenario: 内存占用

- **WHEN** 存储操作进度状态
- **THEN** 每个进度对象的内存占用必须小于 500 bytes
- **AND** 完成后必须及时清理状态
- **AND** 不得有内存泄漏

### Requirement: 错误处理

The system MUST handle errors gracefully in progress reporting.

#### Scenario: 插件未报告完成

- **WHEN** 插件调用了 `start()` 但未调用 `complete()`
- **AND** 操作已经完成 (返回或抛出异常)
- **THEN** 系统必须在 30 秒后自动将状态标记为错误
- **AND** 必须显示 "操作超时或失败" 消息

#### Scenario: 进度报告失败

- **WHEN** 发送 IPC 事件失败 (如主窗口已销毁)
- **THEN** 不得影响插件操作的执行
- **AND** 必须捕获并记录错误
- **AND** 插件操作必须继续执行

#### Scenario: 无效进度数据

- **WHEN** 插件发送无效的进度数据 (如 currentStep > totalSteps)
- **THEN** 系统必须验证数据
- **AND** 必须记录警告日志
- **AND** 必须使用默认值或忽略该事件

### Requirement: 向后兼容性

The progress reporting system MUST maintain backward compatibility with existing plugins.

#### Scenario: 未使用进度 API 的插件

- **WHEN** 插件不调用 `progress` API
- **THEN** 插件必须继续正常工作
- **AND** 不得显示进度对话框
- **AND** 不得报错或警告

#### Scenario: 渐进式采用

- **WHEN** 插件只在部分操作中使用进度 API
- **THEN** 其他操作必须保持原有行为
- **AND** 不得强制所有插件使用进度 API

---

