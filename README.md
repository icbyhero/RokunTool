# RokunTool - 跨平台插件式工具应用平台

## 项目概述

创建一个基于 Electron 的跨平台插件式工具应用平台,提供统一的底层框架来加载和管理各种功能插件。

**注意**: 本项目中的"微信创建副本"功能仅用于创建微信应用的独立副本供个人使用,请遵守微信用户协议。

## 技术架构选型 (已确认)

### 核心技术栈
- **跨平台框架**: Electron ✓ (基于成熟生态系统和插件优势)
- **前端框架**: React + TypeScript ✓ (类型安全,生态完善)
- **构建工具**: Vite (快速开发体验)
- **状态管理**: Zustand (轻量级,现代化)
- **UI组件库**: shadcn/ui + TailwindCSS (现代化设计系统)
- **包管理器**: pnpm (节省空间,性能优化)

### 开发策略 (已确认)
- **开发方式**: 渐进式开发 - 先实现插件系统和微信创建副本插件,验证架构可行性后再扩展
- **项目初始化**: 使用 electron-vite 模板 (现代化 Vite 构建速度,优秀的 TypeScript 支持)

## 开发阶段 (渐进式)

### Phase 1: 项目初始化和框架搭建 (当前阶段)
**目标**: 使用 electron-vite 模板快速搭建基础框架

1. **项目初始化**
   ```bash
   npm create @quick-start/electron@latest rokun-tool
   # 选择: TypeScript + React + Vite
   cd rokun-tool
   pnpm install
   ```

2. **项目结构调整**
   - 创建 `packages/` 目录结构
   - 设置 monorepo 工作区 (pnpm-workspace.yaml)
   - 配置路径别名 (@core, @main, @renderer)

3. **验证运行**
   ```bash
   pnpm dev
   ```
   确保应用可以正常启动

### Phase 2: 核心插件系统实现
**目标**: 实现插件系统的核心功能

1. **插件管理器**
   - 创建 `PluginManager` 类
   - 实现插件加载、卸载机制
   - 建立插件注册表

2. **基础服务层**
   - 文件系统服务 (FileService)
   - 配置管理服务 (ConfigService)
   - 权限管理服务 (PermissionService)

3. **IPC 通信**
   - 设置主进程和渲染进程通信
   - 创建安全的消息通道
   - 实现插件间事件总线

4. **测试插件**
   - 创建示例插件验证系统
   - 测试插件加载和通信

**里程碑**: 可加载和运行测试插件的框架

### Phase 3: 微信创建副本插件开发
**目标**: 实现第一个实用插件

1. **功能实现**
   - 迁移 `微信双开.sh` 到 Node.js
   - 实现副本管理 API
   - 进程监控和控制

2. **UI 界面**
   - 副本列表展示
   - 创建/删除副本按钮
   - 状态指示器 (运行中/已停止)
   - 操作反馈和错误提示

3. **优化和完善**
   - 添加日志记录
   - 实现配置持久化
   - 添加更新重建提示
   - 错误处理和重试机制

**里程碑**: 功能完整可用的微信副本管理器

### Phase 4: 用户界面完善 (可选)
**目标**: 优化用户体验,根据使用情况决定

1. **主界面优化**
   - 侧边栏导航
   - 插件卡片展示
   - 搜索和筛选

2. **设置页面**
   - 主题切换 (深色/浅色)
   - 插件启用/禁用
   - 权限管理

### Phase 5: Rime 插件开发 (未来)
**条件**: 微信插件稳定运行后,根据需求决定是否开发

1. **Rime 集成研究**
   - 分析 Rime Plum API
   - 理解配方系统

2. **功能实现**
   - 配方浏览和搜索
   - 一键安装/卸载
   - 配置文件编辑
   - 备份和恢复

## 项目结构

```
RokunTool/
├── src/
│   ├── main/              # 主进程
│   │   ├── index.ts
│   │   └── ipc/
│   ├── preload/           # 预加载脚本
│   │   └── index.ts
│   └── renderer/          # 渲染进程 (React)
│       ├── App.tsx
│       ├── components/
│       ├── hooks/
│       └── stores/
├── plugins/               # 插件目录
│   ├── core/              # 核心插件系统
│   └── wechat-cloner/     # 微信创建副本插件
├── package.json
├── tsconfig.json
└── electron.vite.config.ts
```

## 微信创建副本插件详细设计

### 功能映射 (从 shell 脚本到 Node.js)

| Shell 命令 | Node.js 实现 | 说明 |
|-----------|-------------|------|
| `sudo rm -rf /Applications/WeChat2.app` | `fs.rm(path, { recursive: true })` | 删除旧副本 |
| `sudo cp -R /Applications/WeChat.app /Applications/WeChat2.app` | `fs.cp(src, dest, { recursive: true })` | 复制应用 |
| `sudo /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.tencent.xinWeChat2"` | `plist.stringify()` | 修改 Bundle ID |
| `sudo codesign --force --deep --sign - /Applications/WeChat2.app` | `exec('codesign', args)` | 代码签名 |
| `nohup /Applications/WeChat2.app/Contents/MacOS/WeChat` | `spawn(execPath, args, { detached: true })` | 启动应用 |

### 关键实现点

1. **权限处理**
   - 使用 `electron-sudo` 或 `sudo-prompt` 处理 sudo 命令
   - 或者修改应用所有者为当前用户避免每次输入密码

2. **副本管理**
   - 保存副本配置到 `~/Library/Application Support/RokunTool/plugins/wechat-multi-instance/instances.json`
   - 支持多个副本: WeChat2, WeChat3, WeChat4...
   - 每个副本有独立的 Bundle ID

3. **进程监控**
   - 使用 `ps-list` 检测运行中的微信实例
   - 实时更新状态指示器

4. **更新保护**
   - 检测原始 WeChat.app 的修改时间
   - 如果更新,提示用户重新创建副本
   - 备份用户数据目录

## 开发路径

```
第1步: 项目初始化 (electron-vite 模板) ⬅️ 当前阶段
    ↓
第2步: 插件系统核心 (PluginManager + Services)
    ↓
第3步: 微信创建副本插件 (从 shell 脚本迁移到 GUI)
    ↓
(可选) 第4步: UI 完善和主题系统
    ↓
(未来) 第5步: Rime 配置管理器插件
```

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```

### 构建应用
```bash
pnpm build
```

## 许可证

MIT

## 文档

### 核心系统文档

- [📘 权限系统指南](rokun-tool/docs/PERMISSION-SYSTEM.md) - 增强权限系统完整文档,包括风险评估和功能级权限请求
- [📗 事务系统指南](docs/TRANSACTION-SYSTEM.md) - 事务执行引擎和回滚策略完整文档
- [📙 事务式权限指南](docs/TRANSACTIONAL-PERMISSIONS-GUIDE.md) - 事务式权限设计指南
- [📔 UI 设计系统](docs/UI-DESIGN-SYSTEM.md) - UI 组件和设计规范

### 插件开发文档

- [📘 插件权限最佳实践](docs/PLUGIN-PERMISSION-BEST-PRACTICES.md) - 如何在插件中正确使用权限系统
- [📗 AI 助手使用指南](docs/AI-ASSISTANT-GUIDE.md) - Claude Code AI 助手使用说明

### 插件文档

- [微信创建副本插件](rokun-tool/docs/plugins/wechat-multi-instance/README.md) - 创建微信应用独立副本
- [Rime 配置插件](rokun-tool/docs/plugins/rime-config/README.md) - Rime 输入法配置管理插件

### 开发规范

- [构建指南](rokun-tool/docs/BUILD.md) - 项目构建和打包说明

## 系统架构

### 已实现功能

✅ **Phase 1: 权限预检查与增强** (已完成)
- 增强版批量权限检查 API (`checkPermissionsEnhanced`)
- 功能级权限请求对话框 (`FeaturePermissionDialog`)
- 风险评估和智能推荐策略
- 插件 Context API 扩展

✅ **Phase 2: 事务执行引擎** (已完成)
- `TransactionExecutor` - 原子性执行和自动回滚
- `TransactionBuilder` - 流式 API 构建事务
- `TransactionLogger` - 完整的事务日志系统
- 自动进度报告集成

✅ **Phase 3: 回滚策略库** (已完成)
- 文件操作回滚 (复制、写入、移动、目录操作)
- 进程操作回滚 (启动、终止、超时控制)
- 配置修改回滚 (JSON 配置、验证、自动恢复)
- 统一回滚辅助工具导出

### 技术特性

- 🔐 **安全**: 完整的权限系统,支持风险评估和永久拒绝
- 🔄 **可靠**: 事务式操作,失败自动回滚
- 📊 **可观测**: 完整的进度报告和操作日志
- 🎨 **现代化**: React + TypeScript + shadcn/ui
- 📦 **模块化**: 插件式架构,易于扩展

---

**准备开始实施!** ✨
