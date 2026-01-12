# 重新组织项目目录结构

## 概述

重新设计和整理 RokunTool 项目的目录结构,解决当前存在的文档分散、文件组织混乱、命名不一致等问题。

## 问题分析

### 当前问题

1. **文档分散**
   - 开发日志在 `docs/daily-log/`
   - 插件文档在 `rokun-tool/docs/plugins/`
   - 项目文档在 `docs/`
   - 插件自述文档在各插件目录
   - OpenSpec 文档在 `openspec/`

2. **文件组织混乱**
   - 根目录包含过多文件夹
   - `rokun-tool/` 下有 `docs/` 和 `docs/plugins/` 重复
   - 测试相关文件分散在多处 (`test/`, `tests/`, `tests/e2e/`)
   - 构建产物 `out/` 与源码混在一起

3. **命名不一致**
   - 有些目录用连字符 (`wechat-multi-instance`)
   - 有些目录用下划线 (`daily-log`)
   - 文档命名不统一 (README.md, CHANGELOG.md, DAILY_SUMMARY.md)

### 影响范围

- 开发者: 难以快速定位文件和文档
- 用户: 不知道如何查找需要的文档
- 维护者: 新增内容时不确定应该放在哪里

## 目标

### 主要目标

1. **统一文档组织** - 所有文档集中管理,分类清晰
2. **清晰的目录分层** - 源码、构建、配置、文档明确分离
3. **一致的命名规范** - 使用统一的命名约定
4. **易于导航** - 开发者和用户都能快速找到需要的内容

### 非目标

- 修改代码逻辑 (只重组文件)
- 修改构建流程
- 修改插件系统架构

## 设计方案

### 新目录结构

```
RokunTool/
├── docs/                           # 所有文档
│   ├── user/                       # 用户文档
│   │   ├── getting-started.md      # 快速开始
│   │   ├── installation.md          # 安装指南
│   │   └── faq.md                  # 常见问题
│   │
│   ├── development/                # 开发文档
│   │   ├── architecture.md         # 架构设计
│   │   ├── plugin-system.md        # 插件系统
│   │   └── coding-standards.md     # 编码规范
│   │
│   ├── plugins/                    # 插件文档
│   │   ├── wechat-multi-instance/
│   │   │   ├── README.md            # 插件概述
│   │   │   ├── api.md               # API 文档
│   │   │   └── guide.md             # 使用指南
│   │   │
│   │   └── rime-config/
│   │       ├── README.md
│   │       ├── api.md
│   │       └── guide.md
│   │
│   └── daily-log/                  # 开发日志
│       ├── 2026-01-08.md
│       └── 2026-01-12.md
│
├── openspec/                       # OpenSpec 规范
│   ├── specs/                      # 当前规格
│   │   ├── plugin-system/
│   │   ├── rime-config/
│   │   └── wechat-multi-instance/
│   │
│   ├── changes/                    # 变更提案
│   │   ├── archive/                # 已归档
│   │   └── reorganize-project-structure/
│   │
│   ├── AGENTS.md                   # OpenSpec 指南
│   └── project.md                  # 项目元信息
│
├── src/                            # 源代码
│   ├── main/                       # Electron 主进程
│   │   ├── plugins/                # 插件系统
│   │   ├── ipc/                    # IPC 处理
│   │   ├── permissions/            # 权限管理
│   │   └── services/               # 基础服务
│   │
│   ├── renderer/                   # 渲染进程 (React)
│   │   ├── components/             # UI 组件
│   │   ├── pages/                  # 页面
│   │   └── store/                  # 状态管理
│   │
│   ├── preload/                    # 预加载脚本
│   │   └── ipc.ts                 # IPC API
│   │
│   └── shared/                     # 共享代码
│       └── types/                  # 类型定义
│
├── plugins/                        # 插件实现
│   ├── wechat-multi-instance/     # 微信分身
│   ├── rime-config/               # Rime 配置
│   ├── plugin-template/           # 插件模板
│   └── test-plugin/               # 测试插件
│
├── scripts/                        # 脚本工具
│   ├── check-env.sh               # 环境检查
│   ├── smoke-test.sh              # 冒烟测试
│   └── build.sh                   # 构建脚本
│
├── tests/                          # 测试文件
│   ├── unit/                       # 单元测试
│   ├── e2e/                        # E2E 测试
│   └── fixtures/                   # 测试数据
│
├── build/                          # 构建产物 (gitignore)
│   └── release/                    # 发布包
│
├── config/                         # 配置文件
│   ├── env.example                 # 环境变量示例
│   └── plugins.json               # 插件配置
│
├── tools/                          # 开发工具
│   └── generator/                  # 代码生成器
│
├── .claude/                        # Claude Code 配置
│   └── commands/                  # 自定义命令
│
├── .vscode/                        # VSCode 配置
│   ├── settings.json
│   └── extensions.json
│
├── package.json                    # 项目配置
├── pnpm-workspace.yaml            # pnpm 工作空间
├── tsconfig.json                   # TypeScript 配置
├── vite.config.ts                  # Vite 配置
├── electron.vite.config.ts         # Electron Vite 配置
├── .gitignore
├── CLAUDE.md                       # Claude 指令
└── README.md                       # 项目 README

## 迁移计划

### 阶段1: 文档重组 (高优先级)

1. 创建新的文档目录结构
2. 迁移和重组文档:
   - `rokun-tool/docs/plugins/*` → `docs/plugins/*`
   - 插件内的 README.md 复制到 `docs/plugins/*`
   - 保留插件内的 README.md 作为简要说明
3. 统一文档命名和格式

### 阶段2: 源码重组 (中优先级)

1. 移动 `plugins/` 到项目根目录
2. 整理测试目录
3. 移除 `out/` 目录 (已在 gitignore)

### 阶段3: 命名规范化 (低优先级)

1. 统一文件命名规范
2. 更新导入路径
3. 更新文档引用

## 风险评估

- **低风险**: 只是重组文件,不修改代码逻辑
- **可控风险**: 导入路径需要更新,但有 TypeScript 和测试保障
- **缓解措施**: 分阶段执行,每阶段后运行测试验证

## 验收标准

### 成功标准

1. ✅ 所有文档可以在 `docs/` 目录下找到
2. ✅ 开发者可以在 30 秒内找到任何文档
3. ✅ 用户文档和开发文档明确分离
4. ✅ 目录命名遵循一致规范
5. ✅ 所有测试通过
6. ✅ 构建成功
7. ✅ TypeScript 无错误

### 回滚计划

如果出现问题:
1. Git 可以轻松回滚到重组前的状态
2. 文档迁移是复制而非移动,原始位置保留备份
