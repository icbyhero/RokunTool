# Rime配置管理器插件规范

## ADDED Requirements

### Requirement: Rime安装检测

The plugin MUST be able to detect whether Rime input method is installed in the system and locate its configuration directory.

#### Scenario: 检测Rime安装
- **WHEN** 插件加载或用户刷新状态
- **THEN** 系统必须检查默认Rime配置目录是否存在
- **AND** macOS: 必须检查 `~/Library/Rime`
- **AND** Windows: 必须检查 `%APPDATA%\Rime`
- **AND** Linux: 必须检查 `~/.local/share/fcitx5/rime` 或 `~/.config/ibus/rime`

#### Scenario: 检测Rime可执行文件
- **WHEN** 检测Rime安装
- **THEN** 系统必须尝试定位Rime可执行文件
- **AND** macOS: 检查 `/Library/Input Methods/Squirrel.app` 或 `~/Library/Input Methods/Squirrel.app`
- **AND** 必须检测Rime版本信息

#### Scenario: Rime未安装
- **WHEN** 检测不到Rime安装
- **THEN** 必须显示友好的错误提示
- **AND** 必须提供Rime安装指引
- **AND** 必须根据平台提供下载链接

### Requirement: Plum配方管理

The plugin MUST integrate Rime Plum functionality to implement recipe browsing, installation, updates, and uninstallation.

#### Scenario: 获取配方列表
- **WHEN** 用户访问配方市场
- **THEN** 系统必须从Plum仓库获取可用配方列表
- **AND** 必须显示配方名称、描述、作者信息
- **AND** 必须支持搜索和筛选功能
- **AND** 必须缓存列表以加快访问速度

#### Scenario: 安装配方
- **WHEN** 用户选择安装配方
- **THEN** 系统必须调用Plum安装命令
- **AND** 必须显示安装进度
- **AND** 安装成功后必须重新部署Rime
- **AND** 失败时必须显示详细错误信息

#### Scenario: 更新配方
- **WHEN** 用户更新已安装的配方
- **THEN** 系统必须检查配方是否有更新
- **AND** 有更新时必须执行更新命令
- **AND** 更新后必须重新部署Rime
- **AND** 必须保留用户的自定义配置

#### Scenario: 卸载配方
- **WHEN** 用户卸载配方
- **THEN** 系统必须询问是否同时删除配置文件
- **AND** 确认后必须删除配方相关文件
- **AND** 必须重新部署Rime
- **AND** 必须更新已安装配方列表

#### Scenario: 配置依赖关系
- **WHEN** 安装有依赖的配方
- **THEN** 系统必须检查依赖是否已安装
- **AND** 缺失依赖必须提示用户
- **AND** 必须提供一键安装依赖的选项

### Requirement: 配置文件管理

The plugin MUST provide configuration file viewing, editing, validation, and backup functionality.

#### Scenario: 配置文件列表
- **WHEN** 用户访问配置文件页面
- **THEN** 系统必须列出Rime目录下的所有配置文件
- **AND** 必须显示文件类型(yaml/default.yaml等)
- **AND** 必须显示文件大小和修改时间
- **AND** 必须区分内置配置和用户配置

#### Scenario: 查看配置文件
- **WHEN** 用户打开配置文件
- **THEN** 系统必须在编辑器中显示文件内容
- **AND** 必须提供语法高亮
- **AND** 必须支持行号显示
- **AND** 只读配置文件必须禁止编辑

#### Scenario: 编辑配置文件
- **WHEN** 用户编辑配置文件
- **THEN** 系统必须提供代码编辑器
- **AND** 必须支持自动缩进
- **AND** 必须支持查找和替换
- **AND** 必须在保存前验证YAML语法

#### Scenario: 配置验证
- **WHEN** 用户保存配置文件
- **THEN** 系统必须验证YAML语法
- **AND** 语法错误必须显示具体位置和原因
- **AND** 无效配置必须阻止保存
- **AND** 必须提供修复建议

#### Scenario: 配置文件备份
- **WHEN** 用户修改配置文件
- **THEN** 系统必须自动创建备份
- **AND** 必须保留最近5个版本
- **AND** 必须提供恢复到备份的功能
- **AND** 手动备份必须允许用户添加备注

### Requirement: 字典文件管理

The plugin MUST manage Rime dictionary files, including downloading, updating, and custom vocabulary.

#### Scenario: 字典文件列表
- **WHEN** 用户访问字典管理页面
- **THEN** 系统必须列出所有已安装的字典文件
- **AND** 必须显示字典文件名、大小、词数
- **AND** 必须显示字典最后更新时间
- **AND** 必须区分系统字典和自定义字典

#### Scenario: 下载字典
- **WHEN** 用户从配方市场下载字典
- **THEN** 系统必须显示下载进度
- **AND** 下载完成后必须部署字典
- **AND** 下载失败必须支持断点续传
- **AND** 必须验证字典文件完整性

#### Scenario: 更新字典
- **WHEN** 用户更新字典
- **THEN** 系统必须检查字典是否有新版本
- **AND** 更新前必须备份旧字典
- **AND** 更新失败必须能恢复备份
- **AND** 更新成功必须重新编译词典

#### Scenario: 自定义词库管理
- **WHEN** 用户管理自定义词库
- **THEN** 系统必须支持导入txt词库文件
- **AND** 必须支持添加、删除、编辑词条
- **AND** 必须支持词库分类和分组
- **AND** 必须支持词库优先级调整

#### Scenario: 词库编译
- **WHEN** 用户修改词库或配置
- **THEN** 系统必须重新编译词典
- **AND** 必须显示编译进度
- **AND** 编译错误必须显示详细日志
- **AND** 编译成功必须自动重部署

### Requirement: 输入方案管理

The plugin MUST manage Rime input schemes, including enabling, disabling, and switching scheme configurations.

#### Scenario: 方案列表展示
- **WHEN** 用户查看输入方案
- **THEN** 系统必须列出所有可用方案
- **AND** 必须显示方案名称、说明、作者
- **AND** 必须标识当前启用的方案
- **AND** 必须显示方案的状态(启用/禁用)

#### Scenario: 启用/禁用方案
- **WHEN** 用户启用方案
- **THEN** 系统必须将方案添加到 `default.custom.yaml`
- **AND** 必须重新部署Rime
- **WHEN** 用户禁用方案
- **THEN** 系统必须从列表中移除方案
- **AND** 必须重新部署Rime

#### Scenario: 方案预览
- **WHEN** 用户预览方案
- **THEN** 系统必须显示方案的配置内容
- **AND** 必须显示方案特性(如拼音、五笔等)
- **AND** 必须显示方案的词库信息
- **AND** 必须提供试用方案的功能

#### Scenario: 方案切换
- **WHEN** 用户切换默认方案
- **THEN** 系统必须修改方案优先级
- **AND** 必须保存到配置文件
- **AND** 必须重新部署Rime
- **AND** 必须立即生效

### Requirement: Rime部署和重启动

The plugin MUST be able to trigger Rime deployment and restart operations.

#### Scenario: 部署Rime
- **WHEN** 用户点击部署按钮
- **THEN** 系统必须执行Rime部署命令
- **AND** 必须显示部署进度
- **AND** 部署失败必须显示错误日志
- **AND** 部署成功必须通知用户

#### Scenario: 重启Rime
- **WHEN** 用户重启Rime
- **THEN** 系统必须终止Rime进程
- **AND** 必须等待进程退出
- **AND** 必须重新启动Rime进程
- **AND** 失败时必须显示错误信息

#### Scenario: 自动部署
- **WHEN** 修改配置或方案后
- **THEN** 系统必须询问是否立即部署
- **AND** 用户确认后必须自动执行部署
- **AND** 必须提供"不再提示"的选项
- **AND** 配置中保存用户的偏好

### Requirement: 同步功能

The plugin MUST support Rime configuration synchronization features (such as user dictionary synchronization).

#### Scenario: 配置导出
- **WHEN** 用户导出配置
- **THEN** 系统必须打包所有配置文件
- **AND** 必须包含用户词库和配置
- **AND** 必须生成压缩文件
- **AND** 必须提供导出路径选择

#### Scenario: 配置导入
- **WHEN** 用户导入配置
- **THEN** 系统必须解压配置包
- **AND** 必须验证配置文件格式
- **AND** 必须询问是否覆盖现有配置
- **AND** 导入后必须重新部署Rime

#### Scenario: 用户词典同步
- **WHEN** 用户启用词典同步
- **THEN** 系统必须支持同步到云端(如Dropbox、iCloud)
- **AND** 必须支持自动同步
- **AND** 冲突时必须提示用户选择
- **AND** 必须显示同步状态

### Requirement: 主题和外观

The plugin MUST be able to manage Rime appearance theme configurations.

#### Scenario: 主题列表
- **WHEN** 用户访问主题页面
- **THEN** 系统必须列出所有可用主题
- **AND** 必须显示主题预览图
- **AND** 必须显示主题名称和说明
- **AND** 必须标识当前应用的主题

#### Scenario: 应用主题
- **WHEN** 用户应用主题
- **THEN** 系统必须下载主题文件
- **AND** 必须配置主题到方案文件
- **AND** 必须重新部署Rime
- **AND** 必须预览主题效果

#### Scenario: 自定义主题
- **WHEN** 用户自定义主题
- **THEN** 系统必须提供颜色选择器
- **AND** 必须支持自定义字体
- **AND** 必须支持自定义窗口样式
- **AND** 必须实时预览效果

### Requirement: 用户界面设计

The plugin MUST provide an intuitive and easy-to-use user interface.

#### Scenario: 主界面布局
- **WHEN** 用户打开插件
- **THEN** 必须显示侧边栏导航
- **AND** 必须包含配方市场、配置文件、字典管理等入口
- **AND** 必须显示Rime状态信息
- **AND** 必须提供快速操作按钮

#### Scenario: 配置编辑器
- **WHEN** 用户编辑配置文件
- **THEN** 必须提供分屏视图(代码和预览)
- **AND** 必须提供配置项说明
- **AND** 必须支持智能补全
- **AND** 必须显示配置验证结果

#### Scenario: 进度和反馈
- **WHEN** 执行耗时操作
- **THEN** 必须显示进度条
- **AND** 必须显示操作日志
- **AND** 完成后必须显示通知
- **AND** 必须支持取消操作

#### Scenario: 搜索和筛选
- **WHEN** 用户浏览配方或字典
- **THEN** 必须提供搜索框
- **AND** 必须支持关键词搜索
- **AND** 必须支持标签筛选
- **AND** 必须显示搜索结果数量

### Requirement: 错误处理

The plugin MUST provide comprehensive error handling mechanisms.

#### Scenario: 网络错误
- **WHEN** 下载配方或字典时网络错误
- **THEN** 必须捕获网络异常
- **AND** 必须显示友好的错误提示
- **AND** 必须提供重试选项
- **AND** 必须支持离线模式

#### Scenario: 文件操作错误
- **WHEN** 读写配置文件失败
- **THEN** 必须显示具体错误原因
- **AND** 必须检查文件权限
- **AND** 必须提供修复建议
- **AND** 失败操作不得损坏原文件

#### Scenario: Rime进程错误
- **WHEN** Rime部署或重启失败
- **THEN** 必须记录错误日志
- **AND** 必须检查Rime是否正在运行
- **AND** 必须提供手动重启指引
- **AND** 必须检查配置文件是否有语法错误

### Requirement: 日志记录

The plugin MUST record all critical operations and error information.

#### Scenario: 操作日志
- **WHEN** 执行任何操作
- **THEN** 必须记录操作类型和时间
- **AND** 必须记录操作结果
- **AND** 失败时必须记录完整错误信息
- **AND** 必须支持日志导出

#### Scenario: 日志查看
- **WHEN** 用户查看日志
- **THEN** 必须显示格式化的日志列表
- **AND** 必须支持按级别筛选(信息/警告/错误)
- **AND** 必须支持日志搜索
- **AND** 必须显示时间戳和详情

### Requirement: 帮助和文档

The plugin MUST provide comprehensive help documentation and usage guides.

#### Scenario: 内置帮助
- **WHEN** 用户点击帮助按钮
- **THEN** 必须显示使用指南
- **AND** 必须包含常见问题解答
- **AND** 必须提供操作示例
- **AND** 必须链接到Rime官方文档

#### Scenario: 工具提示
- **WHEN** 用户鼠标悬停在配置项上
- **THEN** 必须显示配置项说明
- **AND** 必须解释配置项的作用
- **AND** 必须提供可选值和示例
- **AND** 必须显示相关配置项的关联

#### Scenario: 新手引导
- **WHEN** 用户首次使用插件
- **THEN** 必须显示功能介绍
- **AND** 必须提供快速开始指南
- **AND** 必须引导用户完成初始配置
- **AND** 必须提供示例配置

### Requirement: 性能优化

The plugin MUST optimize performance to provide a smooth user experience.

#### Scenario: 列表虚拟化
- **WHEN** 显示大量配方或字典
- **THEN** 必须使用虚拟滚动
- **AND** 必须延迟加载图片
- **AND** 必须分页加载数据
- **AND** 不得一次性加载所有数据

#### Scenario: 缓存管理
- **WHEN** 访问配方列表或文件内容
- **THEN** 必须缓存常用数据
- **AND** 必须设置合理的缓存过期时间
- **AND** 必须支持手动刷新缓存
- **AND** 缓存大小必须有限制

#### Scenario: 后台操作
- **WHEN** 执行耗时操作
- **THEN** 必须在后台线程执行
- **AND** 不得阻塞UI线程
- **AND** 必须支持取消操作
- **AND** 必须显示操作进度

### Requirement: 平台兼容性

The plugin MUST correctly handle differences across different platforms.

#### Scenario: 路径处理
- **WHEN** 访问Rime配置目录
- **THEN** 必须使用正确的路径分隔符
- **AND** 必须处理路径中的特殊字符
- **AND** 必须验证路径是否存在
- **AND** 必须处理权限问题

#### Scenario: 命令执行
- **WHEN** 执行Rime相关命令
- **THEN** 必须使用平台正确的命令
- **AND** macOS: 使用 `/usr/local/bin/rime_deployer`
- **AND** Windows: 使用 `%APPDATA%\Rime\rime_deployer.bat`
- **AND** Linux: 使用 `rime_deployer`
- **AND** 必须处理命令不存在的情况
