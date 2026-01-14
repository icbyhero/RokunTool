# Tasks: Plugin Execution Indicator

## Phase 1: 全局指示器组件 (P0 - 核心功能)

### 1.1 创建 GlobalExecutionIndicator 组件

**文件**: `src/renderer/src/components/ui/GlobalExecutionIndicator.tsx`

- [x] 1.1.1 创建基础组件结构
  - 函数式组件 + hooks
  - TypeScript 类型定义
  - Props 接口设计

- [x] 1.1.2 实现执行状态显示
  - 显示执行中的插件列表
  - 显示插件图标和名称
  - 显示"正在执行..."文字

- [x] 1.1.3 添加动画效果
  - 旋转的 loading spinner
  - 进入/退出动画 (fade-in/out)
  - 多插件切换动画

- [x] 1.1.4 样式实现
  - 固定在右上角
  - 半透明背景
  - 浅色模式样式
  - 深色模式样式

- [x] 1.1.5 可访问性
  - ARIA 标签
  - 屏幕阅读器支持
  - 键盘导航支持

### 1.2 集成到主应用

**文件**: `src/renderer/src/App.tsx`

- [x] 1.2.1 添加 GlobalExecutionIndicator 到顶层
  - 在 App 组件中渲染
  - 传递必要的 props

- [x] 1.2.2 创建执行状态管理
  - useState 管理执行列表
  - addExecution/removeExecution 方法
  - updateExecution 方法

- [x] 1.2.3 监听插件执行事件
  - 监听 `plugin:method:start`
  - 监听 `plugin:method:end`
  - 监听 `transaction:start`
  - 监听 `transaction:end`

- [x] 1.2.4 清理监听器
  - useEffect cleanup
  - 避免内存泄漏

### 1.3 主进程事件发送

**文件**: `src/main/ipc/handlers.ts`

- [ ] 1.3.1 在 plugin:callMethod handler 中添加事件
  - 方法调用前发送 `plugin:method:start`
  - 方法返回后发送 `plugin:method:end`
  - 包含插件 ID 和方法名称

- [ ] 1.3.2 添加错误处理
  - 错误时也发送 `plugin:method:end`
  - 包含错误信息

### 1.4 测试基础功能

- [ ] 1.4.1 手动测试单个插件执行
  - 验证指示器显示
  - 验证指示器隐藏
  - 验证动画效果

- [ ] 1.4.2 测试多个插件同时执行
  - 验证列表显示
  - 验证更新正确
  - 验证清理正确

## Phase 2: 自动触发机制 (P1 - 自动化)

### 2.1 插件方法调用拦截

**文件**: `src/preload/ipc.ts`

- [x] 2.1.1 包装 plugin.callMethod API
  - 添加自动事件发送逻辑
  - 保持原有 API 不变

- [x] 2.1.2 发送开始事件
  - 调用前发送 `plugin:method:start`
  - 包含时间戳

- [x] 2.1.3 发送结束事件
  - 返回后发送 `plugin:method:end`
  - 包含执行结果和时间戳

- [x] 2.1.4 错误处理 (新增)
  - 失败时也发送 `plugin:method:end`
  - 包含错误信息

### 2.2 事务执行集成

**文件**: `src/main/transactions/transaction-executor.ts`

- [x] 2.2.1 在 execute() 开始时发送事件
  - 发送 `transaction:start` 事件
  - 包含事务 ID 和名称

- [x] 2.2.2 在 execute() 结束时发送事件
  - 发送 `transaction:end` 事件
  - 包含执行结果

- [x] 2.2.3 集成到进度报告
  - 事务和全局指示器同步
  - 避免重复显示

### 2.3 超时处理

**文件**: `src/renderer/src/components/ui/GlobalExecutionIndicator.tsx`

- [x] 2.3.1 添加超时检测
  - 使用 setTimeout 检测超时
  - 默认 30 秒超时

- [ ] 2.3.2 超时后隐藏指示器
  - 自动从列表中移除
  - 显示"操作超时"提示

- [ ] 2.3.3 可配置超时时间
  - 支持自定义超时
  - 支持禁用超时

### 2.4 测试自动化

- [ ] 2.4.1 测试自动触发
  - 验证所有插件调用都触发指示器
  - 验证事务执行触发指示器

- [ ] 2.4.2 测试超时机制
  - 验证超时后指示器消失
  - 验证超时提示显示

## Phase 3: UI 优化 (P2 - 增强体验)

### 3.1 动画优化

- [ ] 3.1.1 优化进入/退出动画
  - 使用 CSS transitions
  - 添加 easing 函数
  - 调整动画时长

- [ ] 3.1.2 优化 loading spinner
  - 使用更流畅的动画
  - 支持自定义颜色

- [ ] 3.1.3 添加多插件切换动画
  - 列表项添加/移除动画
  - 位置变化动画

### 3.2 状态信息增强

- [ ] 3.2.1 显示执行时间
  - 显示已执行时间
  - 格式化为秒/毫秒

- [ ] 3.2.2 显示操作类型
  - 显示"正在安装..."
  - 显示"正在配置..."

- [ ] 3.2.3 显示插件图标
  - 从插件元数据获取图标
  - 回退到默认图标

### 3.3 交互增强

- [ ] 3.3.1 添加鼠标悬停效果
  - 显示更多信息
  - 高亮效果

- [ ] 3.3.2 添加点击操作
  - 点击显示详情
  - 点击跳转到插件页面

- [ ] 3.3.3 添加关闭按钮
  - 允许用户手动关闭
  - 确认对话框 (如果需要)

### 3.4 性能优化

- [ ] 3.4.1 使用 React.memo 优化
  - 避免不必要的重渲染
  - 优化 props 比较

- [ ] 3.4.2 优化事件监听
  - 防抖处理
  - 批量更新

- [ ] 3.4.3 减少 DOM 操作
  - 使用 CSS 动画而非 JS 动画
  - 使用 transform 而非 top/left

## Phase 4: 文档和测试 (P3 - 完善工作)

### 4.1 文档更新

- [ ] 4.1.1 更新插件开发文档
  - 说明全局指示器功能
  - 说明如何禁用指示器 (可选)

- [ ] 4.1.2 更新 UI 设计系统
  - 添加 GlobalExecutionIndicator 组件文档
  - 添加使用示例

- [ ] 4.1.3 更新用户文档
  - 说明新的视觉反馈
  - 解释不同状态

### 4.2 测试

- [ ] 4.2.1 单元测试
  - 测试组件渲染
  - 测试状态管理
  - 测试事件处理

- [ ] 4.2.2 集成测试
  - 测试与插件系统集成
  - 测试与事务系统集成
  - 测试多插件场景

- [ ] 4.2.3 手动测试
  - 测试所有插件
  - 测试各种执行时长
  - 测试边界情况

### 4.3 发布准备

- [ ] 4.3.1 性能测试
  - 测试组件性能影响
  - 确保无明显延迟

- [ ] 4.3.2 可访问性测试
  - 测试屏幕阅读器
  - 测试键盘导航
  - 测试高对比度模式

- [ ] 4.3.3 浏览器兼容性测试
  - 测试不同 Electron 版本
  - 测试不同操作系统

## Estimated Time

- **Phase 1**: 3-4 小时
- **Phase 2**: 2-3 小时
- **Phase 3**: 2-3 小时
- **Phase 4**: 1-2 小时

**Total**: 8-12 小时

## Dependencies

- **依赖**: `transactional-permissions` (需要事务事件)
- **依赖**: 现有的进度报告系统
- **集成**: 插件系统 IPC 通信

## Success Metrics

- ✅ 所有插件执行时自动显示指示器
- ✅ 指示器在完成后自动隐藏
- ✅ 超时情况下正确处理
- ✅ 不影响现有 ProgressDialog 功能
- ✅ 浅色/深色模式都正常显示
- ✅ 性能无明显影响
- ✅ 用户满意度提升
