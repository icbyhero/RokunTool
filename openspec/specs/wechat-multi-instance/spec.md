# wechat-multi-instance Specification

## Purpose
TBD - created by archiving change complete-plugin-features. Update Purpose after archive.
## Requirements
### Requirement: Testing and Documentation
The plugin SHALL have comprehensive test coverage and complete documentation.

#### Scenario: Plugin unit tests
- **WHEN** unit tests are run
- **THEN** all plugin functions are tested
- **AND** test coverage exceeds 60%
- **AND** all tests pass
- **AND** tests execute in less than 30 seconds

#### Scenario: Plugin integration tests
- **WHEN** integration tests are run
- **THEN** instance creation flow is tested (simulated)
- **AND** instance launch flow is tested
- **AND** error handling is tested
- **AND** UI interactions are tested

#### Scenario: Documentation completeness
- **WHEN** user reads plugin documentation
- **THEN** user guide provides clear installation steps
- **AND** user guide provides usage examples
- **AND** technical documentation explains architecture
- **AND** troubleshooting guide covers common issues
- **AND** screenshots illustrate key features
- **AND** configuration examples are provided

#### Scenario: Feature demonstration
- **WHEN** user views plugin demo (optional)
- **THEN** demo video shows instance creation process
- **AND** demo video shows instance management
- **AND** demo highlights key features
- **AND** demo is accessible and well-narrated

### Requirement: 微信应用检测

The plugin MUST be able to detect whether WeChat application is installed in the system and obtain its version information.

#### Scenario: 检测已安装的微信
- **WHEN** 插件加载或用户刷新状态
- **THEN** 系统必须检查 `/Applications/WeChat.app` 是否存在
- **AND** 必须读取微信应用的版本号
- **AND** 必须记录应用的最后修改时间

#### Scenario: 微信未安装
- **WHEN** 检测不到微信应用
- **THEN** 必须显示友好的错误提示
- **AND** 必须提供安装指引
- **AND** 创建分身功能必须禁用

#### Scenario: 微信版本兼容性
- **WHEN** 检测到微信版本更新
- **THEN** 必须记录新版本信息
- **AND** 必须提示用户重新创建分身以避免数据丢失

### Requirement: 微信分身创建

The plugin MUST be able to create complete copies of the WeChat application and modify their identifiers to enable multi-instance operation.

#### Scenario: 创建第一个分身
- **WHEN** 用户点击创建分身按钮
- **AND** 不存在已创建的分身
- **THEN** 系统必须复制 `/Applications/WeChat.app` 到 `/Applications/WeChat2.app`
- **AND** 必须修改 `CFBundleIdentifier` 为 `com.tencent.xinWeChat2`
- **AND** 必须对应用进行重新签名
- **AND** 必须记录分身创建信息

#### Scenario: 创建多个分身
- **WHEN** 用户创建多个分身
- **THEN** 系统必须自动递增编号(WeChat2, WeChat3, WeChat4...)
- **AND** 每个分身必须有唯一的 `CFBundleIdentifier`
- **AND** 每个分身必须独立签名
- **AND** 分身列表必须显示所有实例

#### Scenario: 分身已存在
- **WHEN** 创建分身时发现目标名称已存在
- **THEN** 系统必须询问是否覆盖
- **AND** 用户确认后必须先删除旧分身
- **AND** 删除失败必须终止操作并提示错误

#### Scenario: 创建失败处理
- **WHEN** 创建分身的任何步骤失败
- **THEN** 系统必须回滚已执行的操作
- **AND** 必须显示详细的错误信息
- **AND** 必须记录错误日志供排查

### Requirement: 权限提升处理

The plugin MUST be able to handle operations requiring administrator privileges and provide users with a friendly permission request process.

#### Scenario: 首次需要管理员权限
- **WHEN** 执行需要管理员权限的操作
- **THEN** 系统必须显示权限申请对话框
- **AND** 必须清楚说明为何需要此权限
- **AND** 用户拒绝后必须中止操作

#### Scenario: 权限授予成功
- **WHEN** 用户授予管理员权限
- **THEN** 系统必须以提升的权限执行命令
- **AND** 必须在命令执行后释放权限
- **AND** 不得在后台保持权限状态

#### Scenario: 权限授予失败
- **WHEN** 用户输入错误的密码或取消授权
- **THEN** 系统必须显示友好的错误提示
- **AND** 不得重复弹出权限请求
- **AND** 必须提供手动执行命令的选项

### Requirement: 分身实例管理

The plugin MUST provide complete instance management functionality, including starting, stopping, deleting, and status monitoring.

#### Scenario: 启动分身实例
- **WHEN** 用户点击启动按钮
- **THEN** 系统必须检查实例是否已运行
- **AND** 未运行时必须启动应用进程
- **AND** 必须使用 detached 模式使进程独立运行
- **AND** 启动后必须更新实例状态

#### Scenario: 实例状态监控
- **WHEN** 插件处于活动状态
- **THEN** 系统必须定期检查每个实例的运行状态
- **AND** 必须实时更新UI上的状态指示器
- **AND** 必须区分"运行中"、"已停止"和"错误"状态

#### Scenario: 删除分身实例
- **WHEN** 用户删除分身实例
- **THEN** 系统必须先检查实例是否正在运行
- **AND** 运行中必须先终止进程
- **AND** 必须询问是否删除用户数据
- **AND** 删除后必须从列表中移除

#### Scenario: 批量操作
- **WHEN** 用户选择多个实例进行操作
- **THEN** 系统必须支持批量启动
- **AND** 必须支持批量删除
- **AND** 必须显示操作进度

### Requirement: 进程监控和控制

The plugin MUST be able to monitor and manage WeChat processes, including detecting running status and forcefully terminating processes.

#### Scenario: 检测运行中的进程
- **WHEN** 系统扫描实例状态
- **THEN** 必须使用进程列表API查找微信进程
- **AND** 必须通过 Bundle ID 区分不同实例
- **AND** 必须准确映射进程到实例

#### Scenario: 终止实例进程
- **WHEN** 用户请求停止运行中的实例
- **THEN** 系统必须发送终止信号给进程
- **AND** 必须等待进程退出(最长5秒)
- **AND** 超时未退出必须强制终止
- **AND** 终止失败必须提示错误

#### Scenario: 进程意外退出
- **WHEN** 微信进程意外崩溃或被用户关闭
- **THEN** 系统必须检测到进程消失
- **AND** 必须更新实例状态为"已停止"
- **AND** 不得自动重启进程

### Requirement: 配置文件修改

The plugin MUST be able to correctly modify the application's Info.plist file and perform code signing.

#### Scenario: 修改 Bundle ID
- **WHEN** 复制微信应用后
- **THEN** 系统必须解析 `Contents/Info.plist` 文件
- **AND** 必须修改 `CFBundleIdentifier` 字段
- **AND** 必须修改 `CFBundleName` 字段
- **AND** 必须保存修改后的 plist 文件

#### Scenario: 应用代码签名
- **WHEN** 修改应用内容后
- **THEN** 系统必须执行 `codesign --force --deep --sign -`
- **AND** 必须验证签名是否成功
- **AND** 签名失败必须显示详细错误
- **AND** 必须在签名前移除扩展属性(如有)

#### Scenario: 签名验证
- **WHEN** 分身创建完成
- **THEN** 系统必须尝试验证应用签名
- **AND** 验证失败必须警告用户
- **AND** 必须提供重新签名的选项

### Requirement: 用户数据保护

The plugin MUST protect user data to avoid data loss and conflicts.

#### Scenario: 检测数据目录冲突
- **WHEN** 创建新分身
- **THEN** 系统必须警告用户关于数据目录的说明
- **AND** 必须说明不同分身共享还是独立数据
- **AND** 必须提供数据备份建议

#### Scenario: 微信更新后的重建
- **WHEN** 检测到原微信应用更新
- **THEN** 系统必须提示用户重新创建分身
- **AND** 必须说明直接使用旧分身的风险
- **AND** 必须提供一键重建功能(保留配置)

#### Scenario: 数据备份
- **WHEN** 用户重建分身前
- **THEN** 系统必须询问是否备份数据
- **AND** 确认后必须复制用户数据目录
- **AND** 备份失败必须警告用户但允许继续

### Requirement: 操作日志记录

The plugin MUST record all critical operations for troubleshooting and auditing.

#### Scenario: 记录创建操作
- **WHEN** 创建分身
- **THEN** 必须记录时间戳
- **AND** 必须记录操作步骤和结果
- **AND** 失败时必须记录完整错误堆栈

#### Scenario: 记录启动/停止操作
- **WHEN** 启动或停止实例
- **THEN** 必须记录操作时间
- **AND** 必须记录实例标识和结果
- **AND** 必须记录进程ID(启动成功时)

#### Scenario: 日志查看和导出
- **WHEN** 用户请求查看日志
- **THEN** 系统必须显示格式化的日志列表
- **AND** 必须提供日志搜索功能
- **AND** 必须支持导出日志文件

### Requirement: 错误处理和恢复

The plugin MUST provide robust error handling mechanisms and recovery options.

#### Scenario: 磁盘空间不足
- **WHEN** 创建分身时检测到磁盘空间不足
- **THEN** 必须提前检查所需空间
- **AND** 空间不足必须终止操作
- **AND** 必须显示需要清理多少空间

#### Scenario: 权限错误
- **WHEN** 操作因权限不足失败
- **THEN** 必须捕获权限相关错误
- **AND** 必须提供明确的解决方案
- **AND** 必须提供手动命令供用户执行

#### Scenario: 部分失败恢复
- **WHEN** 创建多个分身时部分失败
- **THEN** 系统必须清除失败的实例
- **AND** 必须保留成功的实例
- **AND** 必须显示详细的失败原因

### Requirement: 用户界面交互

The plugin MUST provide an intuitive and easy-to-use user interface.

#### Scenario: 实例列表展示
- **WHEN** 用户打开插件页面
- **THEN** 必须显示所有已创建的实例
- **AND** 每个实例必须显示名称、状态和操作按钮
- **AND** 运行中的实例必须有视觉区分

#### Scenario: 创建流程引导
- **WHEN** 用户首次创建分身
- **THEN** 系统必须显示操作说明
- **AND** 必须说明需要管理员权限的原因
- **AND** 必须在每一步显示进度提示

#### Scenario: 操作反馈
- **WHEN** 执行任何操作
- **THEN** 系统必须显示加载状态
- **AND** 操作完成后必须显示成功或失败提示
- **AND** 长时间操作必须显示进度条

#### Scenario: 快捷操作
- **WHEN** 用户右键点击实例
- **THEN** 必须显示上下文菜单
- **AND** 必须提供常用操作的快捷方式
- **AND** 必须支持键盘快捷键

### Requirement: 配置持久化

The plugin MUST persistently save user configurations and instance information.

#### Scenario: 保存实例配置
- **WHEN** 创建或修改实例
- **THEN** 系统必须保存实例信息到配置文件
- **AND** 必须包含实例名称、路径、Bundle ID
- **AND** 必须包含创建时间和版本信息

#### Scenario: 加载实例配置
- **WHEN** 插件启动
- **THEN** 系统必须从配置文件加载实例列表
- **AND** 配置损坏必须使用默认值
- **AND** 必须验证配置文件中的实例是否存在

#### Scenario: 配置迁移
- **WHEN** 插件版本更新
- **THEN** 系统必须自动迁移旧配置
- **AND** 迁移失败必须保留备份
- **AND** 必须提示用户配置已更新

### Requirement: 性能和资源管理

The plugin MUST run efficiently without consuming excessive system resources.

#### Scenario: 进程扫描优化
- **WHEN** 监控实例状态
- **THEN** 必须使用高效的进程查询API
- **AND** 必须限制扫描频率(最多每2秒一次)
- **AND** 页面不可见时必须暂停扫描

#### Scenario: 内存管理
- **WHEN** 插件运行时
- **THEN** 内存占用必须控制在合理范围
- **AND** 必须及时清理不再使用的资源
- **AND** 大量操作必须分批处理

### Requirement: 平台兼容性

The plugin MUST correctly handle platform differences to ensure proper operation across different macOS versions.

#### Scenario: macOS 版本检测
- **WHEN** 插件加载
- **THEN** 必须检测当前 macOS 版本
- **AND** 必须验证是否支持该版本
- **AND** 不支持的版本必须显示警告

#### Scenario: Apple Silicon 和 Intel
- **WHEN** 运行在不同架构的 Mac
- **THEN** 必须正确处理应用架构
- **AND** 必须使用正确的签名命令
- **AND** 必须清楚标识架构类型

#### Scenario: 系统完整性保护(SIP)
- **WHEN** 检测到 SIP 影响
- **THEN** 必须警告用户可能的问题
- **AND** 必须提供解决方案
- **AND** 不得要求用户关闭 SIP

