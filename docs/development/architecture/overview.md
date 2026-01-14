# 系统架构

本文档描述 RokunTool 的整体架构设计。

## 目录

- [架构概览](#架构概览)
- [核心组件](#核心组件)
- [进程模型](#进程模型)
- [插件系统](#插件系统)
- [权限系统](#权限系统)
- [数据流](#数据流)
- [技术栈](#技术栈)

## 架构概览

RokunTool 采用 Electron 多进程架构,由主进程、渲染进程和预加载脚本组成。

```
┌─────────────────────────────────────────────────────────┐
│                        Electron 应用                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │  主进程       │◄────►│  插件系统     │                 │
│  │  Main        │      │  Plugins     │                 │
│  └──────────────┘      └──────────────┘                 │
│         ▲                                                │
│         │ IPC                                           │
│         ▼                                                │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │  预加载脚本   │      │  权限管理     │                 │
│  │  Preload     │      │  Permissions  │                 │
│  └──────────────┘      └──────────────┘                 │
│         ▲                                                │
│         │ Context Bridge                                 │
│         ▼                                                │
│  ┌──────────────┐      ┌──────────────┐                 │
│  │  渲染进程     │      │  服务管理     │                 │
│  │  Renderer    │      │  Services     │                 │
│  └──────────────┘      └──────────────┘                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. 主进程 (Main Process)

**位置**: `src/main/index.ts`

**职责**:
- 应用生命周期管理
- 窗口管理
- 插件加载器
- IPC 通信协调
- 系统级服务

**核心模块**:
```typescript
src/main/
├── index.ts              // 入口,窗口管理
├── plugins/              // 插件系统
│   ├── loader.ts        // 插件加载器
│   └── registry.ts      // 插件注册表
├── ipc/                  // IPC 处理
│   ├── handlers.ts      // IPC 处理器
│   └── index.ts         // IPC 路由
├── permissions/          // 权限管理
│   ├── permission-manager.ts
│   └── permission-service.ts
└── services/             // 基础服务
    ├── fs.ts            // 文件系统
    ├── process.ts       // 进程管理
    ├── clipboard.ts     // 剪贴板
    └── notification.ts  // 通知
```

### 2. 渲染进程 (Renderer Process)

**位置**: `src/renderer/`

**职责**:
- UI 渲染
- 用户交互
- 状态管理
- 插件 UI 容器

**核心模块**:
```typescript
src/renderer/src/
├── main.tsx              // 入口
├── App.tsx               // 根组件
├── components/           // UI 组件
│   ├── layout/          // 布局组件
│   ├── pages/           // 页面组件
│   ├── permissions/     // 权限对话框
│   └── ui/              // 基础 UI 组件
└── store/               // 状态管理
    ├── pluginStore.ts   // 插件状态
    ├── configStore.ts   // 配置状态
    ├── logStore.ts      // 日志状态
    └── uiStore.ts       // UI 状态
```

### 3. 预加载脚本 (Preload Script)

**位置**: `src/preload/ipc.ts`

**职责**:
- 暴露安全的 IPC API
- Context Bridge 连接
- 类型定义

**核心功能**:
```typescript
// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 插件 API
  plugin: {
    list: () => ipcRenderer.invoke('plugin:list'),
    enable: (id) => ipcRenderer.invoke('plugin:enable', id),
    disable: (id) => ipcRenderer.invoke('plugin:disable', id),
    // ...
  },
  // 权限 API
  permission: {
    onRequest: (callback) => ipcRenderer.on('permission:request', callback),
    respond: (requestId, granted) => ipcRenderer.send('permission:response', { requestId, granted })
  }
})
```

## 进程模型

### Electron 多进程架构

```
┌──────────────────────────────────────────────────┐
│                   主进程                           │
│  - 窗口管理                                       │
│  - 插件系统                                       │
│  - 文件系统访问                                   │
│  - 进程执行                                       │
│  - 系统级操作                                     │
└────────────┬─────────────────────────────────────┘
             │ IPC (Inter-Process Communication)
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼───┐
│渲染进程1│      │渲染进程2│ (可选)
│        │      │         │
│ - UI   │      │ - UI    │
│ - React│      │ - React │
└────────┘      └─────────┘
```

### IPC 通信模式

#### 1. 单向通信 (Renderer → Main)

```typescript
// 渲染进程
ipcRenderer.send('plugin:enable', { id: 'wechat' })

// 主进程
ipcMain.on('plugin:enable', (event, { id }) => {
  enablePlugin(id)
})
```

#### 2. 请求-响应 (Renderer ← → Main)

```typescript
// 渲染进程
const result = await ipcRenderer.invoke('plugin:list', {})

// 主进程
ipcMain.handle('plugin:list', async () => {
  return getPluginList()
})
```

#### 3. 推送 (Main → Renderer)

```typescript
// 主进程
mainWindow.webContents.send('permission:request', {
  permission: 'fs:write',
  reason: '创建文件需要写入权限'
})

// 渲染进程
ipcRenderer.on('permission:request', (event, request) => {
  showPermissionDialog(request)
})
```

## 插件系统

### 插件架构

```
┌──────────────────────────────────────────────────┐
│                    插件系统                        │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────┐    ┌──────────────┐           │
│  │ 插件加载器    │────│ 插件注册表    │           │
│  │ Loader       │    │ Registry     │           │
│  └──────────────┘    └──────────────┘           │
│         │                   │                    │
│         ▼                   ▼                    │
│  ┌────────────────────────────────┐             │
│  │         插件实例                 │             │
│  │  ┌─────────┐  ┌─────────┐       │             │
│  │  │ WeChat  │  │  Rime   │  ...  │             │
│  │  │ Plugin  │  │ Plugin  │       │             │
│  │  └─────────┘  └─────────┘       │             │
│  └────────────────────────────────┘             │
│                                                   │
└──────────────────────────────────────────────────┘
```

### 插件生命周期

```typescript
1. 发现插件
   └─> 扫描 plugins/ 目录

2. 加载插件元数据
   └─> 读取 package.json

3. 初始化插件
   └─> 创建插件实例
   └─> 注入上下文 (context)

4. 激活插件
   └─> 调用 activate()
   └─> 注册功能

5. 运行时
   └─> 响应事件
   └─> 执行功能

6. 停用插件
   └─> 调用 deactivate()
   └─> 清理资源

7. 卸载插件
   └─> 移除插件实例
```

### 插件上下文

每个插件在激活时获得一个上下文对象:

```typescript
interface PluginContext {
  // 基础信息
  id: string
  version: string
  dataPath: string

  // 日志
  logger: {
    info(message: string): void
    warn(message: string): void
    error(message: string): void
  }

  // API
  api: {
    fs: FileSystemAPI
    process: ProcessAPI
    clipboard: ClipboardAPI
    notification: NotificationAPI
    permission: PermissionAPI
  }

  // 事件
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
  emit(event: string, data: any): void
}
```

## 权限系统

### 权限模型

```
┌─────────────────────────────────────────────────┐
│                   权限系统                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐      ┌──────────────┐        │
│  │  权限定义     │      │  权限存储     │        │
│  │  - fs:write  │      │  state.json   │        │
│  │  - process:  │      │              │        │
│  │    exec      │      └──────────────┘        │
│  └──────────────┘              │                │
│         ▼                      ▼                │
│  ┌──────────────────────────────────┐          │
│  │       权限管理器                   │          │
│  │  - check()                        │          │
│  │  - request()                      │          │
│  │  - grant()                        │          │
│  │  - revoke()                       │          │
│  └──────────────────────────────────┘          │
│         │                                      │
│         ▼                                      │
│  ┌──────────────────────────────────┐          │
│  │       权限流程                     │          │
│  │  1. 插件请求权限                   │          │
│  │  2. 显示对话框                     │          │
│  │  3. 用户决定                      │          │
│  │  4. 保存决定                      │          │
│  │  5. 返回结果                      │          │
│  └──────────────────────────────────┘          │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 权限类型

| 权限 | 描述 | 风险级别 |
|------|------|----------|
| `fs:read` | 读取文件 | 低 |
| `fs:write` | 写入文件 | 中 |
| `process:exec` | 执行程序 | 高 |
| `network:http` | HTTP 请求 | 中 |
| `clipboard:read` | 读取剪贴板 | 中 |
| `clipboard:write` | 写入剪贴板 | 低 |

### 权限请求流程

```typescript
// 1. 插件请求权限
const granted = await context.api.permission.request('fs:write', {
  reason: '需要创建配置文件',
  context: {
    operation: '创建配置',
    target: '~/.rokun-tool/config.json'
  }
})

// 2. 权限管理器检查
if (!hasPermission(pluginId, 'fs:write')) {
  // 3. 发送请求到渲染进程
  sendRequestToRenderer({
    pluginId,
    permission: 'fs:write',
    reason: '需要创建配置文件'
  })

  // 4. 等待用户响应
  const response = await waitForUserResponse()

  // 5. 保存决定
  savePermissionDecision(pluginId, 'fs:write', response.granted)
}

// 6. 返回结果
return granted
```

## 数据流

### 启动流程

```
1. 启动主进程
   └─> main/index.ts

2. 初始化服务
   ├─> ServiceManager
   ├─> PermissionService
   └─> PluginLoader

3. 创建窗口
   ├─> BrowserWindow
   └─> 加载 index.html

4. 加载预加载脚本
   └─> preload/ipc.ts

5. 启动渲染进程
   ├─> React 挂载
   ├─> 加载插件列表
   └─> 显示主界面
```

### 插件加载流程

```
1. 扫描插件目录
   └─> plugins/

2. 读取元数据
   └─> package.json

3. 验证插件
   ├─> 检查必需字段
   ├─> 验证权限声明
   └─> 检查版本兼容性

4. 加载插件代码
   └─> require('plugins/xxx/index.js')

5. 创建插件实例
   └─> new PluginClass()

6. 激活插件
   └─> plugin.activate(context)

7. 注册插件功能
   └─> registry.register()
```

### 权限请求流程

```
1. 插件调用 API
   └─> context.api.fs.writeFile()

2. API 检查权限
   └─> permission.request('fs:write')

3. 显示权限对话框
   └─> PermissionRequestDialog

4. 用户选择
   ├─> 允许
   │   └─> 保存到 state.json
   │   └─> 继续执行 API
   └─> 拒绝
       └─> 保存到 state.json
       └─> 抛出错误
```

## 技术栈

### 前端

- **框架**: React 18.3.1
- **构建工具**: Vite 5.4.11
- **语言**: TypeScript 5.6.3
- **样式**: Tailwind CSS 3.4.17
- **状态管理**: Zustand 5.0.2
- **路由**: 自定义插件路由

### 后端

- **运行时**: Node.js 18+
- **框架**: Electron 33.2.1
- **语言**: TypeScript 5.6.3

### 开发工具

- **包管理器**: pnpm 10.27.0
- **测试**: Vitest 3.0.5, Playwright 1.49.1
- **代码规范**: ESLint 9, Prettier
- **类型检查**: TypeScript

## 设计原则

### 1. 安全优先

- 所有敏感操作通过主进程执行
- 渲染进程无直接系统访问
- 运行时权限请求

### 2. 插件化

- 核心功能最小化
- 功能通过插件扩展
- 插件独立开发和管理

### 3. 类型安全

- 全栈 TypeScript
- 严格的类型检查
- 接口即文档

### 4. 可测试性

- 单元测试覆盖核心逻辑
- 集成测试验证关键流程
- E2E 测试保障用户体验

## 扩展性

### 添加新插件

1. 在 `plugins/` 创建插件目录
2. 实现 `activate()` 和 `deactivate()`
3. 声明所需权限
4. 在 `package.json` 配置元数据

### 添加新权限

1. 在 `shared/types/plugin.ts` 定义权限类型
2. 在权限管理器注册
3. 更新文档

### 添加新服务

1. 在 `main/services/` 创建服务
2. 通过 ServiceManager 注册
3. 注入到插件上下文

---

**相关文档**:
- [插件系统文档](plugin-system.md)
- [编码规范](coding-standards.md)
- [插件开发指南](../plugins/)
