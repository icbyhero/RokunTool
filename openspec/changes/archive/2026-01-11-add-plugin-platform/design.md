# 设计文档: 跨平台插件式工具应用平台

## Context

### 背景
当前工具应用生态中存在以下问题:
1. 各类工具分散在不同应用中,缺乏统一管理
2. 每个工具都需要独立安装和更新
3. 用户体验不一致,学习成本高
4. 新工具开发缺乏统一平台和规范

### 约束条件
- 必须支持三大桌面平台(Windows、macOS、Linux)
- 插件系统要足够灵活,支持多种类型的工具
- 主应用体积需要控制在合理范围内
- 安全性要求高,涉及系统级操作

### 利益相关者
- **最终用户**: 需要易用、稳定、安全的工具集合
- **插件开发者**: 需要清晰的开发文档和API
- **平台维护者**: 需要可维护、可扩展的架构

## Goals / Non-Goals

### 目标 ✅
1. **统一的插件平台**: 提供标准化的插件开发框架
2. **跨平台支持**: 一套代码,三大平台运行
3. **安全可控**: 沙箱机制,权限管理
4. **优秀体验**: 现代化UI,流畅交互
5. **易于扩展**: 插件开发简单,API清晰
6. **热插拔**: 支持插件的动态加载和卸载

### 非目标 ❌
1. ~~插件市场功能~~ (Phase 1不需要,后续可考虑)
2. ~~云端同步配置~~ (Phase 2考虑)
3. ~~插件间复杂依赖管理~~ (初期保持简单)
4. ~~移动端支持~~ (仅桌面平台)
5. ~~Web版本~~ (原生桌面应用)

## Decisions

### 决策1: 选择 Electron 作为跨平台框架

**选择内容**: 使用 Electron 而非 Tauri 或 NW.js

**理由**:
- ✅ 成熟稳定,被VSCode、Slack、Discord等大型应用验证
- ✅ 活跃的社区和丰富的生态系统
- ✅ 完善的文档和开发工具
- ✅ 强大的Node.js集成能力,适合系统级操作
- ✅ 支持所有主流操作系统

**替代方案**:
- **Tauri**: 更小的体积,但生态系统不够成熟,系统API相对有限
- **NW.js**: 与Electron类似,但社区和生态较小
- **Qt/C++**: 原生性能,但开发成本高,UI开发复杂

### 决策2: 使用 React + TypeScript 作为前端技术栈

**选择内容**: React + TypeScript + Vite

**理由**:
- ✅ TypeScript提供类型安全,减少运行时错误
- ✅ React组件化开发,便于插件UI开发
- ✅ Vite提供极快的开发体验和构建速度
- ✅ 丰富的UI组件库可选
- ✅ 状态管理灵活(Zustand/Redux/Jotai)

**替代方案**:
- **Vue + TypeScript**: 同样优秀,但React生态更大
- **Svelte**: 性能更好,但生态相对较小
- **纯JavaScript**: 失去类型安全保障

### 决策3: 插件架构采用进程隔离模型

**选择内容**: 插件运行在独立的渲染进程中

**架构设计**:
```
┌─────────────────────────────────────┐
│         主进程 (Main Process)         │
│  - 插件生命周期管理                    │
│  - 权限控制                           │
│  - 系统API调用                        │
│  - IPC消息路由                        │
└──────────┬──────────────────────────┘
           │ IPC通信
    ┌──────┴──────┬──────────┬──────────┐
    │             │          │          │
┌───▼────┐  ┌────▼────┐ ┌──▼─────┐ ┌─▼──────┐
│渲染进程 │  │渲染进程  │ │渲染进程 │ │渲染进程 │
│(主UI)  │  │(插件A)  │ │(插件B)  │ │(插件C)  │
└────────┘  └─────────┘ └────────┘ └────────┘
```

**理由**:
- ✅ 插件崩溃不影响主应用和其他插件
- ✅ 更好的安全性,通过IPC限制访问
- ✅ 可以独立控制插件权限
- ✅ 便于调试和错误隔离

### 决策4: 插件API设计

**核心API结构**:
```typescript
interface Plugin {
  // 插件元信息
  id: string;                    // 唯一标识
  name: string;                  // 显示名称
  version: string;               // 语义化版本
  description?: string;          // 描述
  author?: string;               // 作者

  // 生命周期钩子
  onLoad?(): Promise<void>;      // 加载时
  onUnload?(): Promise<void>;    // 卸载时

  // 入口组件
  Component: React.ComponentType;

  // 权限声明
  permissions: Permission[];

  // 配置schema
  configSchema?: JSONSchema;
}

interface PluginAPI {
  // 文件系统API (需要权限)
  fs: {
    readFile: (path: string) => Promise<Buffer>;
    writeFile: (path: string, data: Buffer) => Promise<void>;
    readdir: (path: string) => Promise<string[]>;
  };

  // 进程管理API (需要权限)
  process: {
    spawn: (command: string, args?: string[]) => Promise<ChildProcess>;
    exec: (command: string) => Promise<string>;
  };

  // 配置API
  config: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };

  // UI交互API
  ui: {
    showMessage: (message: string) => void;
    showNotification: (title: string, body: string) => void;
  };

  // 插件间通信
  ipc: {
    send: (channel: string, data: any) => void;
    on: (channel: string, callback: (data: any) => void) => void;
  };
}
```

**权限类型**:
```typescript
enum Permission {
  FS_READ = 'fs:read',           // 文件读取
  FS_WRITE = 'fs:write',         // 文件写入
  PROCESS_SPAWN = 'process:spawn', // 启动进程
  NETWORK = 'network',            // 网络访问
  CLIPBOARD = 'clipboard',        // 剪贴板访问
  NOTIFICATION = 'notification'   // 系统通知
}
```

### 决策5: UI设计系统

**选择内容**: Radix UI + TailwindCSS

**理由**:
- ✅ Radix UI提供无障碍访问的原生组件
- ✅ TailwindCSS实用优先,快速开发
- ✅ 深色模式原生支持
- ✅ 高度可定制化

**设计规范**:
- **颜色主题**: 支持浅色/深色模式切换
- **布局响应式**: 适配不同窗口大小
- **组件一致性**: 所有插件使用统一的UI组件库
- **交互反馈**: 清晰的状态提示和加载反馈

### 决策6: 项目结构

```
rokun-tool/
├── packages/
│   ├── main/                    # 主进程
│   │   ├── src/
│   │   │   ├── plugins/         # 插件管理器
│   │   │   ├── ipc/             # IPC处理器
│   │   │   ├── services/        # 系统服务
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── renderer/                # 渲染进程(主UI)
│   │   ├── src/
│   │   │   ├── components/      # UI组件
│   │   │   ├── pages/           # 页面
│   │   │   ├── store/           # 状态管理
│   │   │   └── main.tsx
│   │   └── package.json
│   │
│   ├── shared/                  # 共享代码
│   │   ├── src/
│   │   │   ├── types/           # TypeScript类型
│   │   │   ├── constants/       # 常量
│   │   │   └── utils/           # 工具函数
│   │   └── package.json
│   │
│   └── plugins/                 # 内置插件
│       ├── wechat-multi-instance/
│       │   ├── src/
│       │   ├── package.json
│       │   └── plugin.ts
│       │
│       └── rime-config/
│           ├── src/
│           ├── package.json
│           └── plugin.ts
│
├── package.json                 # Monorepo根配置
├── pnpm-workspace.yaml          # pnpm工作空间
├── vite.config.ts               # Vite配置
└── tsconfig.json                # TypeScript配置
```

**Monorepo工具**: pnpm workspace
- ✅ 节省磁盘空间(硬链接依赖)
- ✅ 严格的依赖管理
- ✅ 快速的安装速度

## Risks / Trade-offs

### 风险1: Electron应用体积较大

**风险描述**: 打包后应用约150-200MB,相比原生应用较大

**影响**: 用户下载时间长,占用磁盘空间大

**缓解措施**:
- 使用 `electron-builder` 的压缩选项
- 只打包必需的依赖
- 提供增量更新机制
- 优化代码分割,按需加载

### 风险2: 插件安全性

**风险描述**: 恶意插件可能利用系统权限造成危害

**影响**: 用户数据泄露或系统损坏

**缓解措施**:
- 严格的权限审查机制
- 插件沙箱隔离
- IPC通信验证
- 敏感操作需要用户确认
- 插件代码签名验证(Phase 2)

### 风险3: 跨平台兼容性

**风险描述**: 不同平台的系统API差异可能导致功能不一致

**影响**: 某些插件在特定平台不可用

**缓解措施**:
- 使用Electron的跨平台API
- 编写平台检测代码
- 在插件元数据中声明平台兼容性
- 提供平台特定的替代实现

### 风险4: 性能问题

**风险描述**: 多个插件同时运行可能导致性能下降

**影响**: 应用卡顿,用户体验差

**缓解措施**:
- 插件按需加载,不使用的插件不运行
- 性能监控和资源限制
- 提供性能分析工具
- 优化IPC通信频率

## Migration Plan

### Phase 1: 核心框架 (4-6周)
1. 搭建Electron项目结构
2. 实现插件加载器
3. 实现基础UI框架
4. 实现IPC通信机制
5. 实现权限管理系统

### Phase 2: 微信分身插件 (2-3周)
1. 实现shell脚本执行封装
2. 开发插件UI界面
3. 实现多实例管理
4. 添加错误处理和日志

### Phase 3: Rime配置插件 (3-4周)
1. 集成rime/plum功能
2. 实现配置文件编辑器
3. 实现配方(recipe)管理
4. 实现字典文件管理

### Phase 4: 测试和优化 (2-3周)
1. 单元测试覆盖
2. 集成测试
3. 性能优化
4. 安全审计
5. 文档完善

### Phase 5: 打包和发布 (1-2周)
1. 配置自动化构建
2. 代码签名
3. 发布到GitHub Releases
4. 用户文档编写

**回滚计划**:
- 使用Git版本控制,可随时回退
- 每个Phase结束后打Tag
- 保留关键分支作为稳定版本

## Open Questions

1. **插件分发方式**?
   - ❓ 是否需要内置插件市场?
   - ❓ 初期支持本地安装插件包?

   → **Phase 1决策**: 仅支持本地安装,提供示例插件

2. **插件更新机制**?
   - ❓ 是否需要自动更新插件?
   - ❓ 如何处理插件版本兼容性?

   → **Phase 1决策**: 手动更新,版本兼容性检查

3. **配置文件存储位置**?
   - ❓ 用户配置存放位置?
   - ❓ 插件数据目录结构?

   → **决策**:
   ```
   ~/Library/Application Support/RokunTool/  (macOS)
   %APPDATA%/RokunTool/                      (Windows)
   ~/.config/RokunTool/                      (Linux)
   ```

4. **插件开发语言**?
   - ❓ 仅支持TypeScript/JavaScript?
   - ❓ 是否支持WebAssembly?

   → **Phase 1决策**: TypeScript/JavaScript,WebAssembly Phase 2考虑

## Technical Considerations

### 开发工具链
- **包管理器**: pnpm (快速、节省空间)
- **构建工具**: Vite (开发体验好)
- **代码规范**: ESLint + Prettier
- **Git Hooks**: husky + lint-staged
- **测试框架**: Vitest + Testing Library

### 性能优化策略
- 懒加载插件代码
- 虚拟滚动长列表
- 防抖/节流用户输入
- Web Worker处理密集计算
- 优化Electron启动时间

### 安全最佳实践
- Content Security Policy (CSP)
- 禁用Node.js集成在渲染进程(上下文隔离)
- 验证所有IPC消息来源
- 限制外部资源加载
- 敏感数据加密存储

### 日志和监控
- Electron Log (日志记录)
- 错误上报机制 (Sentry集成,可选)
- 性能监控 (性能指标收集)
- 用户行为分析(可选,需用户同意)

## Success Metrics

- ✅ 插件加载时间 < 1秒
- ✅ 应用启动时间 < 3秒
- ✅ UI响应时间 < 100ms
- ✅ 内存占用 < 300MB (空载)
- ✅ 0安全漏洞
- ✅ 测试覆盖率 > 80%
- ✅ 文档完整性 100%

## 测试策略

### 冒烟测试 (Smoke Testing)

每个主要开发阶段完成后必须运行冒烟测试,确保基础功能正常:

#### 阶段0: 环境验证
- Node.js和pnpm版本检查
- Electron基础运行测试
- IPC通信测试
- 文件系统访问测试
- 进程管理测试

#### 阶段1: 核心框架
- 插件加载器测试
- IPC双向通信测试
- 权限系统测试
- 文件API测试
- 进程API测试

#### 阶段2: UI框架
- 组件渲染测试
- 路由导航测试
- 状态管理测试
- 深色模式测试
- 插件容器测试

#### 阶段3: 微信分身插件
- 应用检测测试
- 实例创建测试(模拟)
- 进程控制测试
- UI交互测试
- 错误处理测试

### 测试工具

- **单元测试**: Vitest
- **E2E测试**: Playwright for Electron
- **组件测试**: Testing Library
- **冒烟测试**: 自定义脚本

### 测试自动化

```bash
# 运行所有测试
pnpm test

# 运行冒烟测试
pnpm smoke-test

# 运行环境检查
pnpm check-env
```

### 持续验证

- 每个功能开发完成后立即测试
- 每个阶段结束运行完整测试套件
- 发现问题立即修复,不拖延
- 保持测试通过率100%
