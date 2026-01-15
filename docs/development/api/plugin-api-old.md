# 插件API文档

## 概述

RokunTool提供了一套完整的插件API,允许插件安全地访问系统功能。

## 插件上下文

每个插件在加载时会收到一个上下文对象,包含以下属性:

- **metadata**: 插件元数据
- **dataDir**: 插件数据目录
- **logger**: 日志工具
- **api**: 插件API集合

## 插件API

### 1. 文件系统API

**权限**: `fs:read`, `fs:write`

```typescript
// 读取文件
const content = await api.fs.readFile('/path/to/file')

// 写入文件
await api.fs.writeFile('/path/to/file', 'Hello World')

// 读取目录
const files = await api.fs.readDir('/path/to/dir')

// 获取文件状态
const stats = await api.fs.stat('/path/to/file')
```

### 2. 进程管理API

**权限**: `process:spawn`, `process:exec`

```typescript
// 启动进程
const pid = await api.process.spawn('node', ['script.js'])

// 执行命令
const result = await api.process.exec('ls -la')

// 终止进程
await api.process.kill(pid)
```

### 3. 配置API

**权限**: `config:read`, `config:write`

```typescript
// 获取配置
const value = await api.config.get('key')

// 设置配置
await api.config.set('key', 'value')

// 删除配置
await api.config.delete('key')

// 检查配置是否存在
const exists = await api.config.has('key')
```

### 4. IPC通信API

```typescript
// 发送消息
api.ipc.send('channel', { data: 'value' })

// 监听消息
api.ipc.on('channel', (data) => console.log(data))

// 移除监听
api.ipc.off('channel', callback)
```

### 5. UI API

**权限**: `notification:show`, `window:open`

```typescript
// 显示消息
api.ui.showMessage('Hello World')

// 显示通知
api.ui.showNotification('Title', 'Body')

// 打开窗口
api.ui.openWindow('https://example.com')
```

## 权限系统

### 权限类型

- `fs:read` / `fs:write` - 文件系统
- `process:spawn` / `process:exec` - 进程管理
- `network:http` - 网络请求
- `notification:show` - 通知
- `window:open` - 窗口
- `config:read` / `config:write` - 配置

### 权限声明

在`package.json`中声明:

```json
{
  "id": "my-plugin",
  "permissions": ["fs:read", "fs:write", "process:exec"]
}
```

## 插件示例

```typescript
export default {
  async onLoad(context) {
    context.logger.info('Plugin loaded')
    
    // 使用API
    await context.api.fs.writeFile(
      context.dataDir + '/data.txt',
      'Hello'
    )
  },
  
  async onEnable(context) {
    const result = await context.api.process.exec('ls')
    context.logger.info(result.stdout)
  }
}
```

## 更多信息

查看 [插件开发指南](./plugin-development.md) 了解更多详情。
