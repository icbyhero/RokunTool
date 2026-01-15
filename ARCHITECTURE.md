# RokunTool 系统架构

## 概述

RokunTool 采用 Electron 多进程架构,通过插件系统实现模块化和可扩展性。

```
┌──────────────────────────────────────────────────┐
│                  Main Process                    │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Plugin       │  │ Permission   │            │
│  │ Manager      │◄─┤ Manager      │            │
│  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                     │
│  ┌──────▼───────┐  ┌──────▼───────┐            │
│  │ Transaction  │  │   Plugin     │            │
│  │  Executor    │  │   Sandbox    │            │
│  └──────────────┘  └──────────────┘            │
└──────────────────────────────────────────────────┘
                    ▲
                    │ IPC
┌──────────────────────────────────────────────────┐
│              Renderer Process                    │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  React UI    │  │  Plugin UI   │            │
│  └──────────────┘  └──────────────┘            │
└──────────────────────────────────────────────────┘
```

## 核心组件

### 1. Plugin Manager (插件管理器)

**职责**:
- 插件加载和卸载
- 插件生命周期管理
- 插件注册表维护

**文件**: `src/main/plugins/manager.ts`

**关键方法**:
- `loadPlugin()`: 加载插件
- `unloadPlugin()`: 卸载插件
- `getPlugin()`: 获取插件实例

### 2. Permission Manager (权限管理器)

**职责**:
- 权限检查和验证
- 权限请求对话框管理
- 权限状态持久化

**文件**: `src/main/permissions/permission-manager.ts`

**关键方法**:
- `checkPermission()`: 检查单个权限
- `checkPermissions()`: 批量检查权限
- `requestPermission()`: 请求权限

### 3. Transaction Executor (事务执行器)

**职责**:
- 事务步骤执行
- 自动回滚
- 进度报告集成

**文件**: `src/main/transactions/transaction-executor.ts`

**关键方法**:
- `execute()`: 执行事务
- `rollback()`: 回滚事务

### 4. Plugin Sandbox (插件沙箱)

**职责**:
- VM 隔离执行
- 代码静态验证
- 超时保护

**文件**: `src/main/plugins/sandbox.ts`

**关键方法**:
- `runInSandbox()`: 在沙箱中执行代码

## 数据流

### 插件加载流程

```
1. 用户触发插件加载
   ↓
2. Plugin Manager 读取插件元数据
   ↓
3. Plugin Validator 验证代码
   ↓
4. Plugin Sandbox 创建隔离环境
   ↓
5. 插件代码在沙箱中执行
   ↓
6. 插件注册到 Plugin Registry
```

### 权限请求流程

```
1. 插件调用 requestFeaturePermissions()
   ↓
2. Permission Manager 检查权限状态
   ↓
3. 如果需要,显示权限对话框
   ↓
4. 用户授权或拒绝
   ↓
5. Permission Manager 保存结果
   ↓
6. 插件收到授权结果
```

### 事务执行流程

```
1. 插件定义事务步骤
   ↓
2. Transaction Executor 开始执行
   ↓
3. 逐个执行步骤,报告进度
   ↓
4. 如果失败,按相反顺序回滚
   ↓
5. 记录事务日志
   ↓
6. 返回执行结果
```

## 安全边界

### 1. 主进程与渲染进程

**通信**: IPC (Inter-Process Communication)

**安全措施**:
- 渲染进程无法直接访问主进程 API
- 所有 IPC 调用经过验证
- 敏感操作需要权限检查

### 2. 插件与系统

**隔离**: Node.js VM

**安全措施**:
- 插件代码在 VM 中执行
- 只能访问提供的 API
- 静态验证危险模式

### 3. 权限检查

**强制执行**: 在主进程

**安全措施**:
- 所有敏感操作需要权限
- 权限不可绕过
- 永久拒绝不可更改

## 技术栈

- **Electron**: 跨平台桌面应用框架
- **React**: UI 框架
- **TypeScript**: 类型安全
- **Node.js VM**: 沙箱隔离
- **Zustand**: 状态管理

## 扩展性

### 添加新插件

1. 创建插件目录
2. 实现 `index.js`
3. 定义 `package.json`
4. 声明所需权限
5. 测试功能

### 添加新权限

1. 在 `PermissionType` 中定义
2. 更新权限对话框
3. 更新文档
4. 添加测试

---

**详细文档**:
- [插件系统架构](docs/development/architecture/plugin-system.md)
- [主应用架构](docs/development/architecture/main-app.md)

**最后更新**: 2026-01-15
