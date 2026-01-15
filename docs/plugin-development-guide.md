# 插件开发指南

## 概述

RokunTool 插件系统允许开发者创建功能丰富的插件来扩展应用能力。插件可以访问系统资源、与其他插件通信，并集成到主应用的 UI 中。

## 插件结构

一个标准的插件目录结构如下：

```
my-plugin/
├── package.json          # 插件配置文件
├── index.js             # 插件入口文件
├── icon.png             # 插件图标 (可选)
├── data/                # 插件数据目录 (运行时自动创建)
└── README.md            # 插件说明文档 (可选)
```

## package.json 配置

插件必须包含 `rokun` 字段来定义插件元数据：

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "rokun": {
    "id": "publisher-name",
    "name": "插件显示名称",
    "version": "1.0.0",
    "description": "插件描述",
    "author": "作者名称",
    "license": "MIT",
    "icon": "icon.png",
    "minHostVersion": "1.0.0",
    "permissions": [
      "fs:read",
      "fs:write",
      "process:spawn",
      "notification:show"
    ],
    "type": "tool",
    "tags": ["分类", "标签"],
    "routes": [
      {
        "path": "/my-plugin",
        "title": "插件页面"
      }
    ]
  }
}
```

### 元数据字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| id | string | 是 | 插件唯一标识符 (格式: publisher-name) |
| name | string | 是 | 插件显示名称 |
| version | string | 是 | 插件版本 (语义化版本) |
| description | string | 是 | 插件描述 |
| author | string | 是 | 插件作者 |
| license | string | 是 | 插件许可证 |
| icon | string | 否 | 插件图标文件名 |
| minHostVersion | string | 否 | 最低要求的宿主应用版本 |
| permissions | array | 是 | 插件所需的权限列表 |
| type | string | 是 | 插件类型: 'tool' \| 'extension' \| 'theme' |
| tags | array | 否 | 插件标签 (用于分类和搜索) |
| routes | array | 否 | 插件路由配置 |

## 权限系统

插件必须声明所需的权限才能访问系统资源：

| 权限 | 说明 |
|------|------|
| fs:read | 读取文件系统 |
| fs:write | 写入文件系统 |
| process:spawn | 启动外部进程 |
| process:exec | 执行 shell 命令 |
| process:kill | 终止进程 |
| network:http | 发起 HTTP 请求 |
| shell:execute | 执行 shell 命令 |
| clipboard:read | 读取剪贴板 |
| clipboard:write | 写入剪贴板 |
| notification:show | 显示系统通知 |
| window:open | 打开新窗口 |
| config:read | 读取配置 |
| config:write | 写入配置 |

## 插件生命周期

插件提供以下生命周期钩子：

### onLoad(context)
插件加载时调用，用于初始化插件。

```javascript
async function onLoad(context) {
  context.logger.info('插件加载中...')
  
  // 初始化插件数据
  await this.loadConfig()
  
  context.logger.info('插件加载完成')
}
```

### onEnable(context)
插件启用时调用。

```javascript
async function onEnable(context) {
  context.logger.info('插件已启用')
  
  // 启用插件功能
  await this.startServices()
}
```

### onDisable(context)
插件禁用时调用。

```javascript
async function onDisable(context) {
  context.logger.info('插件已禁用')
  
  // 禁用插件功能
  await this.stopServices()
}
```

### onUnload(context)
插件卸载时调用，用于清理资源。

```javascript
async function onUnload(context) {
  context.logger.info('插件已卸载')
  
  // 清理资源
  await this.cleanup()
}
```

## 插件 API

### context 对象

`context` 对象提供插件运行时环境：

```javascript
{
  metadata: PluginMetadata,    // 插件元数据
  dataDir: string,          // 插件数据目录
  logger: Logger,           // 日志工具
  api: PluginAPI,           // 插件 API
  router: Router            // 路由 API (可选)
}
```

### Logger API

```javascript
context.logger.debug(message, ...args)
context.logger.info(message, ...args)
context.logger.warn(message, ...args)
context.logger.error(message, ...args)
```

### Plugin API

#### 文件系统 API

```javascript
// 读取文件
const buffer = await context.api.fs.readFile('/path/to/file')

// 写入文件
await context.api.fs.writeFile('/path/to/file', 'content')

// 读取目录
const files = await context.api.fs.readDir('/path/to/dir')

// 获取文件状态
const stats = await context.api.fs.stat('/path/to/file')
```

#### 进程管理 API

```javascript
// 启动进程
const pid = await context.api.process.spawn('command', ['arg1', 'arg2'])

// 执行命令
const result = await context.api.process.exec('ls -la')

// 终止进程
await context.api.process.kill(pid)
```

#### 剪贴板 API

```javascript
// 读取文本
const text = await context.api.clipboard.readText()

// 写入文本
await context.api.clipboard.writeText('Hello, World!')

// 读取图片
const image = await context.api.clipboard.readImage()

// 写入图片
await context.api.clipboard.writeImage(buffer)

// 清空剪贴板
await context.api.clipboard.clear()
```

#### 通知 API

```javascript
// 显示通知
await context.api.notification.show({
  title: '通知标题',
  body: '通知内容',
  icon: 'icon.png',
  urgency: 'normal'
})
```

#### 配置 API

```javascript
// 获取配置
const value = await context.api.config.get('key')

// 设置配置
await context.api.config.set('key', 'value')

// 删除配置
await context.api.config.delete('key')

// 检查配置是否存在
const exists = await context.api.config.has('key')
```

#### IPC 通信 API

```javascript
// 发送消息
context.api.ipc.send('channel-name', data)

// 监听消息
context.api.ipc.on('channel-name', (data) => {
  console.log('Received:', data)
})

// 取消监听
context.api.ipc.off('channel-name', callback)
```

#### UI API

```javascript
// 显示消息
context.api.ui.showMessage('操作成功', 'info')

// 显示通知
context.api.ui.showNotification('标题', '内容')

// 打开窗口
context.api.ui.openWindow('https://example.com', { width: 800, height: 600 })
```

## 示例插件

### 简单的 Hello World 插件

```javascript
module.exports = {
  async onLoad(context) {
    context.logger.info('Hello World 插件加载中...')
    
    context.api.ui.showMessage('Hello World!', 'info')
    
    context.logger.info('Hello World 插件加载完成')
  },

  async onEnable(context) {
    context.logger.info('Hello World 插件已启用')
  },

  async onDisable(context) {
    context.logger.info('Hello World 插件已禁用')
  },

  async onUnload(context) {
    context.logger.info('Hello World 插件已卸载')
  }
}
```

### 文件管理插件

```javascript
const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')

class FilePlugin {
  constructor(context) {
    this.context = context
    this.configPath = join(context.dataDir, 'config.json')
  }

  async onLoad(context) {
    this.context = context
    context.logger.info('文件管理插件加载中...')
    
    await this.loadConfig()
    
    context.logger.info('文件管理插件加载完成')
  }

  async loadConfig() {
    try {
      const data = await readFile(this.configPath, 'utf-8')
      this.config = JSON.parse(data)
    } catch (error) {
      this.config = {}
    }
  }

  async saveConfig() {
    await writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')
  }

  async readFile(path) {
    const buffer = await this.context.api.fs.readFile(path)
    return buffer.toString('utf-8')
  }

  async writeFile(path, content) {
    await this.context.api.fs.writeFile(path, content)
  }
}

module.exports = {
  onLoad: (context) => {
    const plugin = new FilePlugin(context)
    return plugin.onLoad(context)
  },
  readFile: (context, path) => {
    const plugin = new FilePlugin(context)
    return plugin.readFile(path)
  },
  writeFile: (context, path, content) => {
    const plugin = new FilePlugin(context)
    return plugin.writeFile(path, content)
  }
}
```

## 最佳实践

### 1. 错误处理

始终使用 try-catch 块处理异步操作：

```javascript
async function someFunction(context) {
  try {
    await context.api.fs.readFile('/path/to/file')
  } catch (error) {
    context.logger.error('读取文件失败:', error)
    throw error
  }
}
```

### 2. 日志记录

使用适当的日志级别记录关键操作：

```javascript
context.logger.debug('调试信息')
context.logger.info('一般信息')
context.logger.warn('警告信息')
context.logger.error('错误信息')
```

### 3. 配置管理

使用插件数据目录存储配置：

```javascript
const configPath = join(context.dataDir, 'config.json')
```

### 4. 权限声明

只声明必需的权限：

```json
{
  "permissions": [
    "fs:read",
    "fs:write"
  ]
}
```

### 5. 资源清理

在 onUnload 钩子中清理所有资源：

```javascript
async function onUnload(context) {
  // 清理临时文件
  await this.cleanupTempFiles()
  
  // 关闭所有连接
  await this.closeConnections()
  
  context.logger.info('插件已卸载')
}
```

## 调试

### 启用调试模式

在插件配置中设置调试选项：

```javascript
context.logger.setLevel('debug')
```

### 查看日志

日志文件位于：
- macOS: `~/Library/Application Support/RokunTool/logs/`
- Windows: `%APPDATA%/RokunTool/logs/`
- Linux: `~/.local/share/RokunTool/logs/`

## 测试

### 单元测试

使用 Vitest 进行单元测试：

```javascript
import { describe, it, expect } from 'vitest'

describe('MyPlugin', () => {
  it('should initialize correctly', async () => {
    const context = createMockContext()
    const plugin = new MyPlugin(context)
    
    await plugin.onLoad(context)
    
    expect(plugin.initialized).toBe(true)
  })
})
```

### 集成测试

在真实环境中测试插件功能：

```javascript
describe('MyPlugin Integration', () => {
  it('should work with real API', async () => {
    const context = createRealContext()
    const plugin = new MyPlugin(context)
    
    await plugin.onLoad(context)
    const result = await plugin.someMethod()
    
    expect(result).toBeDefined()
  })
})
```

## 常见问题

### Q: 如何获取插件数据目录路径？

A: 使用 `context.dataDir` 属性获取插件专属的数据目录。

### Q: 如何在插件之间通信？

A: 使用 `context.api.ipc` 进行插件间通信。

### Q: 如何持久化配置？

A: 将配置保存到 `context.dataDir` 目录的 JSON 文件中。

### Q: 插件如何访问网络？

A: 声明 `network:http` 权限后，使用标准的 HTTP 库（如 axios）发起请求。

### Q: 如何调试插件？

A: 使用 `context.logger.debug()` 记录调试信息，并在日志文件中查看。

## 更多资源

- [插件规范](../openspec/changes/add-plugin-platform/specs/plugin-system/spec.md)
- [API 参考](../openspec/changes/add-plugin-platform/specs/plugin-system/spec.md)
- [示例插件](../plugins/)
- [类型定义](../rokun-tool/src/shared/types/plugin.ts)
