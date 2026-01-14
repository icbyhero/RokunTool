# Tasks: Transactional Permissions System

## Phase 1: 权限预检查 API (P0 - 核心功能) ✅ 已完成

### 1.1 增强 checkPermissions() API
- [x] 1.1.1 添加 `PermissionCheckResult` 类型定义
  - 包含权限分组 (必需/可选)
  - 包含风险评估 (low/medium/high)
  - 包含推荐策略
- [x] 1.1.2 更新 `PermissionManager.checkPermissions()` 实现
  - 支持权限分组检查
  - 计算风险等级
  - 生成推荐策略
- [ ] 1.1.3 添加单元测试
  - 测试权限状态分类
  - 测试风险计算
  - 测试永久拒绝检测
- [x] 1.1.4 更新 IPC handler
  - 添加 `permission:checkPermissionsEnhanced` handler
  - 处理权限分组参数
- [x] 1.1.5 更新 preload 类型定义
  - 在 `ipc.ts` 中添加 `checkPermissionsEnhanced` API
  - 包含完整的类型定义

### 1.2 创建 FeaturePermissionDialog 组件
- [x] 1.2.1 创建 `FeaturePermissionDialog.tsx` 组件
  - 显示功能名称和描述
  - 显示所有权限列表 (图标、名称、原因、风险)
  - 风险等级指示器 (低/中/高)
  - 安全提示区域
- [x] 1.2.2 实现权限列表渲染
  - 每个权限卡片显示:
    - 权限图标
    - 权限名称 (中文)
    - 权限原因
    - 风险等级 (颜色标记)
    - 是否必需标记
- [x] 1.2.3 实现三个按钮
  - 拒绝所有
  - 本次授权 (所有权限)
  - 永久授权 (所有权限)
- [x] 1.2.4 集成到 App.tsx
  - 添加 `permission:featureRequest` 事件监听
  - 显示 FeaturePermissionDialog
  - 处理用户响应
- [x] 1.2.5 添加样式和动画
  - 深色模式支持
  - 响应式布局
  - 进入/退出动画

### 1.3 更新 Plugin Context API
- [x] 1.3.1 添加 `checkPermissionsEnhanced()` 方法
  - 接受权限数组参数
  - 返回 `EnhancedPermissionCheckResult`
- [x] 1.3.2 添加 `requestFeaturePermissions()` 方法
  - 接受功能名称、权限数组、原因
  - 显示 FeaturePermissionDialog
  - 返回授权结果
- [x] 1.3.3 更新插件上下文实现
  - 在 `loader.ts` 中实现新方法
  - 集成 PermissionManager
- [x] 1.3.4 添加使用示例和文档
  - 创建示例插件代码
  - 更新 API 文档

### 1.4 文档和测试
- [x] 1.4.1 更新 PERMISSION-SYSTEM.md
  - 添加功能级权限请求章节
  - 添加预检查 API 说明
  - 添加最佳实践
- [ ] 1.4.2 编写集成测试
  - 测试预检查流程
  - 测试批量权限请求
  - 测试永久拒绝检测
- [ ] 1.4.3 代码审查和优化

## Phase 2: 事务执行引擎 (P1 - 事务支持) ✅ 已完成

### 2.1 实现 TransactionExecutor 类
- [x] 2.1.1 创建 `transaction-executor.ts` 文件
  - 定义 `Transaction` 接口
  - 定义 `TransactionStep` 接口
  - 定义 `TransactionResult` 接口
- [x] 2.1.2 实现核心 `execute()` 方法
  - 遍历执行所有步骤
  - 错误捕获和处理
  - 自动触发回滚
- [x] 2.1.3 实现步骤超时机制
  - 使用 Promise.race 实现超时
  - 默认 30 秒超时
  - 可配置超时时间
- [x] 2.1.4 实现回滚逻辑
  - 按相反顺序执行回滚
  - 处理回滚失败
  - 支持配置回滚失败行为
- [ ] 2.1.5 添加单元测试
  - 测试成功执行
  - 测试失败回滚
  - 测试部分回滚失败

### 2.2 集成进度报告
- [x] 2.2.1 在 TransactionExecutor 中集成 ProgressReporter
  - 执行开始: 调用 `start()`
  - 每个步骤: 调用 `update()`
  - 执行成功: 调用 `complete()`
  - 执行失败: 调用 `fail()`
- [x] 2.2.2 处理回滚时的进度更新
  - 显示"正在回滚..."消息
  - 更新回滚进度
  - 回滚完成提示
- [ ] 2.2.3 测试进度报告集成

### 2.3 实现事务日志
- [x] 2.3.1 创建 `transaction-logger.ts`
  - 定义 `TransactionLogEntry` 接口
  - 实现 `startTransaction()` 方法
  - 实现 `logStepStart/Success/Failed()` 方法
  - 实现 `logTransactionSuccess/Failed()` 方法
- [x] 2.3.2 实现日志持久化
  - 按日期分文件存储
  - JSON 格式 (JSONL)
  - 异步写入不阻塞
- [x] 2.3.3 集成到 TransactionExecutor
  - 每个步骤记录日志
  - 记录回滚过程
  - 记录错误详情
- [ ] 2.3.4 添加日志查询 API
  - 按事务ID查询
  - 按插件查询
  - 按时间范围查询
- [ ] 2.3.5 添加日志查看 UI (可选)
  - 在设置页面添加"事务日志"选项
  - 显示历史事务列表
  - 显示详细步骤和错误

### 2.4 扩展 Plugin Context
- [x] 2.4.1 添加 `executeTransaction()` 方法
  - 接受 `Transaction` 参数
  - 返回 `TransactionResult`
- [x] 2.4.2 实现 `TransactionBuilder` 类
  - 流式 API 设计
  - `addStep()` 方法
  - `build()` 方法
- [x] 2.4.3 添加 `createTransaction()` 工厂方法
  - 返回 `TransactionBuilder` 实例
  - 简化事务创建
- [ ] 2.4.4 更新插件基类
  - 在 `BasePlugin` 中添加事务方法
  - 提供默认配置

### 2.5 文档和示例
- [x] 2.5.1 创建事务使用指南
  - 基本用法
  - 高级特性
  - 最佳实践
  - 错误处理
- [ ] 2.5.2 更新插件开发文档
  - 事务 vs 手动执行
  - 何时使用事务
  - 回滚策略
- [ ] 2.5.3 创建完整示例
  - 微信创建副本 (3步)
  - Rime 配置安装 (多步)
  - 显示进度和回滚

## Phase 3: 回滚策略库 (P2 - 高级功能)

### 3.1 文件操作回滚
- [x] 3.1.1 创建 `file-rollback.ts`
  - 实现 `copyWithRollback()`
  - 实现 `writeWithRollback()`
  - 实现 `mkdirWithRollback()`
  - 实现 `moveWithRollback()`
  - 实现 `copyDirWithRollback()`
- [ ] 3.1.2 添加单元测试
  - 测试复制回滚
  - 测试写入回滚
  - 测试目录创建回滚
  - 测试备份恢复
- [x] 3.1.3 添加错误处理
  - 处理文件不存在
  - 处理权限错误
  - 处理磁盘空间不足

### 3.2 进程操作回滚
- [x] 3.2.1 创建 `process-rollback.ts`
  - 实现 `spawnWithRollback()`
  - 实现进程管理
  - 实现进程终止
- [x] 3.2.2 添加超时处理
  - 默认5秒超时
  - 强制杀死 (SIGKILL)
  - 子进程清理
- [ ] 3.2.3 添加单元测试
  - 测试正常终止
  - 测试强制终止
  - 测试子进程清理

### 3.3 配置修改回滚
- [x] 3.3.1 创建 `config-rollback.ts`
  - 实现 `modifyJsonWithRollback()`
  - 实现 `modifyConfigValueWithRollback()`
  - 实现 `modifyConfigValuesWithRollback()`
  - 实现 `deleteConfigValueWithRollback()`
  - 支持 JSON 配置
  - 支持 YAML 配置 (可选)
- [x] 3.3.2 实现配置验证
  - 回滚后验证配置有效性
  - 检测配置损坏
  - 自动恢复备份
- [ ] 3.3.3 添加单元测试
  - 测试配置修改
  - 测试配置恢复
  - 测试配置验证

### 3.4 创建回滚辅助工具
- [x] 3.4.1 创建 `index.ts` (统一导出)
  - 导出所有回滚辅助类
  - 提供统一接口
- [x] 3.4.2 编写回滚最佳实践文档
  - 何时使用辅助类
  - 何时自定义回滚
  - 回滚失败处理
- [x] 3.4.3 创建回滚示例
  - 文件操作示例
  - 进程操作示例
  - 配置修改示例

### 3.5 文档和测试
- [x] 3.5.1 更新插件开发文档
  - 添加回滚策略章节 (在 TRANSACTION-SYSTEM.md 中)
  - 添加回滚辅助类参考
- [ ] 3.5.2 编写集成测试
  - 测试完整事务流程
  - 测试回滚流程
  - 测试错误恢复
- [ ] 3.5.3 性能测试
  - 测试事务执行性能
  - 测试回滚性能
  - 确保无显著开销

## Cross-Cutting Tasks

### 文档和培训
- [ ] 更新 API 参考文档
- [ ] 创建迁移指南 (从旧 API 到新 API)
- [ ] 创建视频教程 (可选)
- [ ] 提供代码片段库

### 测试和质量保证
- [ ] 端到端测试
  - 测试完整插件工作流
  - 测试权限和事务集成
- [ ] 性能基准测试
  - 对比事务 vs 手动执行
  - 确保性能可接受
- [ ] 安全审计
  - 审查权限检查逻辑
  - 审查回滚安全性
  - 审查日志安全性

### 发布和推广
- [ ] 发布说明
  - 列出所有新功能
  - 提供升级指南
- [ ] 插件迁移支持
  - 帮助现有插件迁移
  - 提供迁移工具 (可选)
- [ ] 示例插件更新
  - 更新微信创建副本插件使用事务 API
  - **更新 Rime 配置插件使用进度报告** ⚠️
  - 更新其他插件

### Rime 插件进度报告集成
- [ ] 分析 Rime 插件的长时间操作
  - `installRecipe()` - 配方安装 (下载+安装,可能较慢)
  - `updateRecipe()` - 配方更新
  - `createBackup()` - 创建备份
  - `restoreBackup()` - 恢复备份
- [ ] 为 installRecipe() 添加进度报告
  - 添加 `progress.start('安装配方', 5)` 开始进度
  - 步骤1: 检查冲突
  - 步骤2: 卸载冲突配方
  - 步骤3: 请求权限
  - 步骤4: 执行 rime-install
  - 步骤5: 标记已安装
  - 添加 `progress.complete('success')` 或 `complete('error', message)`
- [ ] 为 updateRecipe() 添加进度报告
  - 类似 installRecipe 的进度报告
- [ ] 为备份/恢复操作添加进度报告
- [ ] 测试进度报告在 UI 中的显示
- [ ] 验证用户体验改善

## Estimated Timeline

- **Phase 1**: 2-3 天 (权限预检查)
- **Phase 2**: 3-4 天 (事务执行引擎)
- **Phase 3**: 2-3 天 (回滚策略库)

**Total**: 7-10 天

## Dependencies

- **依赖**: `permanent-deny-and-batch-permissions` (已完成)
- **集成**: `plugin-operation-progress` (需要统一进度报告)
- **补充**: 权限系统基础增强

## Success Metrics

- ✅ 所有单元测试通过
- ✅ 所有集成测试通过
- ✅ 无性能退化
- ✅ 至少 2 个示例插件使用新 API
- ✅ 文档完整且易懂
- ✅ 代码审查通过
