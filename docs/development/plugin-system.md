# 插件系统

本文档详细描述 RokunTool 的插件系统架构和使用方法。

## 目录

- [概述](#概述)
- [插件结构](#插件结构)
- [插件 API](#插件-api)
- [插件生命周期](#插件生命周期)
- [插件开发](#插件开发)
- [最佳实践](#最佳实践)

## 概述

RokunTool 采用插件化架构,核心功能最小化,所有功能通过插件扩展。

### 设计目标

- **模块化**: 每个插件独立开发和维护
- **可扩展**: 易于添加新功能
- **安全**: 运行时权限控制
- **隔离**: 插件之间相互隔离

### 插件类型

1. **内置插件**: 随应用分发的核心插件
   - 微信分身插件
   - Rime 配置插件

2. **第三方插件**: 社区开发的插件
   - 可单独安装和更新
   - 通过插件市场分发(未来)

## 插件结构

### 目录结构

```
plugins/
└── my-plugin/
    ├── index.js              # 插件入口
    ├── package.json          # 插件元数据
    ├── README.md             # 插件文档
    └── data/                 # 插件数据(可选)
        └── config.json
```

### package.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "插件描述",
  "main": "index.js",
  "permissions": [
    "fs:write",
    "process:exec"
  ],
  "author": "作者",
  "license": "MIT",
  "rokun": {
    "displayName": "我的插件",
    "icon": "icon.png",
    "category": "工具",
    "homepage": "https://github.com/xxx/my-plugin"
  }
}
```

### 必需字段

| 字段 | 类型 | 描述 |
|------|------|------|
| `name` | string | 插件唯一标识(kebab-case) |
| `version` | string | 语义化版本号 |
| `main` | string | 入口文件路径 |
| `permissions` | array | 所需权限列表 |

### 可选字段

| 字段 | 类型 | 描述 |
|------|------|------|
| `description` | string | 插件描述 |
| `author` | string | 作者 |
| `license` | string | 许可证 |
| `rokun.displayName` | string | 显示名称(中文) |
| `rokun.icon` | string | 图标文件 |
| `rokun.category` | string | 分类(工具/系统/网络等) |

## 插件 API

### 插件类

每个插件必须导出一个插件类:

```javascript
class MyPlugin {
  /**
   * 构造函数
   * @param {Object} metadata - 插件元数据
   * @param {Object} context - 插件上下文
   */
  constructor(metadata, context) {
    this.metadata = metadata
    this.context = context
    this.id = metadata.id
    this.version = metadata.version
  }

  /**
   * 激活插件
   * @returns {Promise<void>}
   */
  async activate() {
    this.context.logger.info('插件已激活')
    // 初始化逻辑
  }

  /**
   * 停用插件
   * @returns {Promise<void>}
   */
  async deactivate() {
    this.context.logger.info('插件已停用')
    // 清理逻辑
  }
}

module.exports = MyPlugin
```

### 上下文 API

#### 1. 基础信息

```javascript
context.id          // 插件 ID
context.version     // 插件版本
context.dataPath    // 数据目录路径
```

#### 2. 日志 API

```javascript
context.logger.info('信息日志')
context.logger.warn('警告日志')
context.logger.error('错误日志')
```

#### 3. 文件系统 API

```javascript
// 读取文件
const content = await context.api.fs.readFile('/path/to/file', 'utf-8')

// 写入文件(需要 fs:write 权限)
await context.api.fs.writeFile('/path/to/file', 'content')

// 检查文件是否存在
const exists = await context.api.fs.exists('/path/to/file')

// 列出目录
const files = await context.api.fs.readdir('/path/to/dir')

// 删除文件(需要 fs:write 权限)
await context.api.fs.unlink('/path/to/file')
```

#### 4. 进程 API

```javascript
// 执行命令(需要 process:exec 权限)
const { stdout, stderr } = await context.api.process.exec('ls -la')

// 生成进程(需要 process:spawn 权限)
const child = context.api.process.spawn('node', ['script.js'])

// 杀死进程
context.api.process.kill(pid)
```

#### 5. 剪贴板 API

```javascript
// 读取剪贴板
const text = await context.api.clipboard.readText()

// 写入剪贴板
await context.api.clipboard.writeText('Hello')
```

#### 6. 通知 API

```javascript
// 发送通知
context.api.notification.notify({
  title: '标题',
  body: '内容'
})
```

#### 7. 权限 API

```javascript
// 请求权限
const granted = await context.api.permission.request('fs:write', {
  reason: '需要创建配置文件',
  context: {
    operation: '创建配置',
    target: '~/.rokun-tool/config.json'
  }
})

// 检查权限
const status = await context.api.permission.check('fs:write')
// status: 'pending' | 'granted' | 'denied'

// 快速检查
if (context.api.permission.has('fs:write')) {
  // 有权限
}
```

### 事件系统

```javascript
// 监听事件
context.on('plugin:enabled', (pluginId) => {
  console.log(`插件 ${pluginId} 已启用`)
})

// 移除监听
context.off('plugin:enabled', handler)

// 发送事件
context.emit('my-event', { data: 'value' })
```

### 可用事件

| 事件 | 数据 | 描述 |
|------|------|------|
| `plugin:enabled` | pluginId | 插件已启用 |
| `plugin:disabled` | pluginId | 插件已停用 |
| `app:quit` | - | 应用即将退出 |

## 插件生命周期

### 生命周期阶段

```
┌──────────────┐
│   发现插件    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  加载元数据   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  验证插件     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  创建实例     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  激活插件     │◄─────┐
└──────┬───────┘      │
       │              │
       ▼              │
┌──────────────┐      │
│   运行中      │      │
└──────┬───────┘      │
       │              │
       ▼              │
┌──────────────┐      │
│  停用插件     │──────┘
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  卸载插件     │
└──────────────┘
```

### activate()

在插件激活时调用,应该:

- 初始化插件状态
- 注册事件监听
- 准备所需资源
- 返回 Promise 表示完成

```javascript
async activate() {
  // 1. 加载配置
  await this.loadConfig()

  // 2. 注册事件
  this.context.on('app:quit', this.onQuit.bind(this))

  // 3. 创建必要的目录
  await this.ensureDataDir()

  this.context.logger.info('插件激活完成')
}
```

### deactivate()

在插件停用时调用,应该:

- 取消事件监听
- 清理资源
- 保存状态
- 关闭打开的文件/进程

```javascript
async deactivate() {
  // 1. 取消事件监听
  this.context.off('app:quit', this.onQuit)

  // 2. 保存配置
  await this.saveConfig()

  // 3. 清理临时文件
  await this.cleanup()

  this.context.logger.info('插件停用完成')
}
```

## 插件开发

### 开发流程

1. **创建插件目录**

```bash
mkdir plugins/my-plugin
cd plugins/my-plugin
```

2. **创建 package.json**

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "main": "index.js",
  "permissions": []
}
```

3. **实现插件类**

```javascript
// index.js
class MyPlugin {
  constructor(metadata, context) {
    this.metadata = metadata
    this.context = context
  }

  async activate() {
    this.context.logger.info('MyPlugin 已激活')
  }

  async deactivate() {
    this.context.logger.info('MyPlugin 已停用')
  }
}

module.exports = MyPlugin
```

4. **测试插件**

```bash
pnpm dev
# 在应用中启用插件查看效果
```

5. **添加文档**

创建 README.md 说明:
- 插件功能
- 使用方法
- 配置选项
- 示例代码

### 使用模板

使用插件模板快速开始:

```bash
cp -r plugins/plugin-template plugins/my-plugin
cd plugins/my-plugin
# 编辑 package.json 和 index.js
```

### 调试技巧

1. **查看日志**

```javascript
this.context.logger.info('调试信息')
```

2. **捕获错误**

```javascript
try {
  await this.doSomething()
} catch (error) {
  this.context.logger.error('操作失败:', error.message)
}
```

3. **测试权限**

```javascript
const granted = await this.context.api.permission.request('fs:write', {
  reason: '测试权限请求'
})
this.context.logger.info(`权限${granted ? '已授予' : '被拒绝'}`)
```

## 最佳实践

### 1. 错误处理

始终使用 try-catch:

```javascript
async activate() {
  try {
    await this.initialize()
  } catch (error) {
    this.context.logger.error('初始化失败:', error)
    throw error  // 重新抛出让加载器知道失败
  }
}
```

### 2. 资源清理

确保 deactivate() 清理所有资源:

```javascript
async deactivate() {
  // 清理定时器
  if (this.timer) {
    clearInterval(this.timer)
  }

  // 清理事件监听
  this.context.off('app:quit', this.onQuit)

  // 关闭文件
  if (this.fileHandle) {
    await this.fileHandle.close()
  }
}
```

### 3. 权限请求

提前请求权限,说明原因:

```javascript
async activate() {
  const granted = await this.context.api.permission.request('fs:write', {
    reason: '需要创建配置文件以保存插件设置',
    context: {
      operation: '创建配置文件',
      target: this.configPath
    }
  })

  if (!granted) {
    throw new Error('没有必需的权限,插件无法正常工作')
  }
}
```

### 4. 配置管理

使用数据目录存储配置:

```javascript
class MyPlugin {
  constructor(metadata, context) {
    super(metadata, context)
    this.configPath = path.join(context.dataPath, 'config.json')
  }

  async loadConfig() {
    try {
      const content = await this.context.api.fs.readFile(this.configPath, 'utf-8')
      this.config = JSON.parse(content)
    } catch (error) {
      // 使用默认配置
      this.config = { key: 'value' }
    }
  }

  async saveConfig() {
    await this.context.api.fs.writeFile(
      this.configPath,
      JSON.stringify(this.config, null, 2)
    )
  }
}
```

### 5. 版本兼容性

检查插件版本:

```javascript
const PKG_VERSION = '1.0.0'

async activate() {
  const savedVersion = await this.loadSavedVersion()
  if (savedVersion !== PKG_VERSION) {
    await this.migrate(savedVersion, PKG_VERSION)
  }
}

async migrate(fromVersion, toVersion) {
  this.context.logger.info(`迁移配置: ${fromVersion} → ${toVersion}`)
  // 迁移逻辑
}
```

### 6. 日志规范

使用合适的日志级别:

```javascript
this.context.logger.info('正常信息')   // 用户可见的信息
this.context.logger.warn('警告信息')   // 可能的问题
this.context.logger.error('错误信息')  // 严重的错误
```

### 7. 异步操作

始终返回 Promise:

```javascript
async activate() {
  await Promise.all([
    this.initConfig(),
    this.initDatabase(),
    this.registerHandlers()
  ])
}
```

## 示例插件

### 简单插件

```javascript
// plugins/hello-world/index.js
class HelloWorldPlugin {
  async activate() {
    this.context.logger.info('Hello World 插件已激活')

    // 每天打印问候
    this.timer = setInterval(() => {
      this.context.logger.info('Hello, World!')
    }, 24 * 60 * 60 * 1000)
  }

  async deactivate() {
    if (this.timer) {
      clearInterval(this.timer)
    }
    this.context.logger.info('Hello World 插件已停用')
  }
}

module.exports = HelloWorldPlugin
```

### 复杂插件

```javascript
// plugins/file-watcher/index.js
const chokidar = require('chokidar')

class FileWatcherPlugin {
  async activate() {
    const granted = await this.context.api.permission.request('fs:read', {
      reason: '需要监控文件变化'
    })

    if (!granted) {
      throw new Error('需要 fs:read 权限')
    }

    this.watcher = chokidar.watch(this.context.dataPath, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true
    })

    this.watcher
      .on('add', path => this.context.logger.info(`文件 ${path} 已添加`))
      .on('change', path => this.context.logger.info(`文件 ${path} 已修改`))
      .on('unlink', path => this.context.logger.info(`文件 ${path} 已删除`))
  }

  async deactivate() {
    if (this.watcher) {
      await this.watcher.close()
    }
  }
}

module.exports = FileWatcherPlugin
```

---

**相关文档**:
- [系统架构](architecture.md)
- [编码规范](coding-standards.md)
- [插件开发指南](../plugins/)
