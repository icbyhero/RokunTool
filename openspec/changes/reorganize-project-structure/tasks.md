# 重组项目目录结构 - 任务清单

## 阶段1: 文档重组 (优先级: 高)

### 1.1 创建新的文档目录结构
- [ ] 在项目根目录创建 `docs/` 子目录:
  - [ ] `docs/user/` - 用户文档
  - [ ] `docs/development/` - 开发文档
  - [ ] `docs/plugins/` - 插件文档
  - [ ] `docs/daily-log/` - 开发日志 (迁移现有)
- [ ] 验证目录创建成功

### 1.2 创建用户文档模板
- [ ] 创建 `docs/user/getting-started.md`
  - 内容: 快速开始指南
  - 包含: 安装、首次运行、基本功能
- [ ] 创建 `docs/user/installation.md`
  - 内容: 详细安装步骤
  - 包含: 系统要求、依赖安装、常见问题
- [ ] 创建 `docs/user/faq.md`
  - 内容: 常见问题解答
  - 收集当前已知问题和解决方案

### 1.3 创建开发文档模板
- [ ] 创建 `docs/development/architecture.md`
  - 内容: 系统架构说明
  - 包含: 目录结构、模块关系、数据流
- [ ] 创建 `docs/development/plugin-system.md`
  - 内容: 插件系统文档
  - 包含: 插件开发指南、API 参考、最佳实践
- [ ] 创建 `docs/development/coding-standards.md`
  - 内容: 编码规范
  - 包含: 命名规范、文件组织、注释规范

### 1.4 迁移插件文档
- [ ] 微信分身插件文档
  - [ ] 复制 `plugins/wechat-multi-instance/README.md` 到 `docs/plugins/wechat-multi-instance/README.md`
  - [ ] 从 README.md 中提取 API 文档到 `docs/plugins/wechat-multi-instance/api.md`
  - [ ] 从 README.md 中提取使用指南到 `docs/plugins/wechat-multi-instance/guide.md`
  - [ ] 在插件目录保留简要 README.md (包含概述和文档链接)
- [ ] Rime 配置插件文档
  - [ ] 复制 `plugins/rime-config/README.md` 到 `docs/plugins/rime-config/README.md`
  - [ ] 提取 API 文档到 `docs/plugins/rime-config/api.md`
  - [ ] 提取使用指南到 `docs/plugins/rime-config/guide.md`
  - [ ] 在插件目录保留简要 README.md
- [ ] 验证所有文档迁移成功

### 1.5 迁移开发日志
- [ ] 确认 `docs/daily-log/` 中的文件完整
- [ ] 检查日志格式一致性
- [ ] 创建索引文件 `docs/daily-log/index.md`
  - 按时间倒序排列
  - 包含每天的主要工作摘要

### 1.6 更新主 README
- [ ] 更新根目录 `README.md`
  - 添加文档导航链接
  - 添加快速开始链接
  - 更新目录结构说明

## 阶段2: 源码重组 (优先级: 中)

### 2.1 移动插件目录
- [ ] 移动 `rokun-tool/plugins/` → `plugins/`
  - [ ] 移动 `wechat-multi-instance/`
  - [ ] 移动 `rime-config/`
  - [ ] 移动 `plugin-template/`
  - [ ] 移动 `test-plugin/`
- [ ] 更新插件加载器中的路径引用
  - [ ] `src/main/plugins/loader.ts` 中的路径
  - [ ] 配置文件中的路径
- [ ] 验证插件加载正常

### 2.2 整理测试目录
- [ ] 统一测试到 `tests/` 目录
  - [ ] 将 `rokun-tool/test/` 内容合并到 `tests/`
  - [ ] 保留 `tests/e2e/`
  - [ ] 创建 `tests/unit/` 和 `tests/fixtures/`
- [ ] 删除 `rokun-tool/test/` 空目录
- [ ] 更新测试配置和脚本
- [ ] 运行所有测试验证

### 2.3 清理构建产物
- [ ] 确认 `out/` 在 `.gitignore` 中
- [ ] 删除 `rokun-tool/out/` 目录
- [ ] 检查是否有其他构建产物目录需要清理

## 阶段3: 命名规范化 (优先级: 低)

### 3.1 统一命名规范
- [ ] 制定命名规范文档
  - 目录命名: kebab-case (小写连字符)
  - 文件命名: kebab-case
  - 组件命名: PascalCase (React)
  - 变量命名: camelCase
- [ ] 检查并记录不符合规范的文件

### 3.2 更新导入路径
- [ ] 更新插件导入路径
- [ ] 更新测试文件导入路径
- [ ] 更新文档中的路径引用
- [ ] TypeScript 编译检查
- [ ] 运行测试验证

### 3.3 更新文档引用
- [ ] 检查所有文档中的路径引用
- [ ] 更新为新的目录结构
- [ ] 验证所有链接有效

## 阶段4: 验证和优化 (优先级: 中)

### 4.1 功能验证
- [ ] 运行 `pnpm dev` 验证开发环境
- [ ] 运行 `pnpm build` 验证构建
- [ ] 运行所有测试
- [ ] 验证插件加载
- [ ] 验证文档链接

### 4.2 创建迁移脚本 (可选)
- [ ] 创建自动化迁移脚本
  - 文档迁移脚本
  - 路径更新脚本
  - 验证脚本
- [ ] 测试迁移脚本
- [ ] 文档化迁移流程

### 4.3 更新开发工具配置
- [ ] 更新 `.vscode/settings.json` 中的路径
- [ ] 更新 `.claude/commands/` 中的路径
- [ ] 更新构建脚本中的路径
- [ ] 更新 CI/CD 配置 (如果有)

## 阶段5: 文档和培训

### 5.1 更新项目文档
- [ ] 创建 `docs/development/migration-guide.md`
  - 说明目录结构变更
  - 提供迁移前后的对照
  - 包含常见问题
- [ ] 更新贡献指南
- [ ] 更新 README.md 中的目录结构部分

### 5.2 创建导航帮助
- [ ] 在 `docs/` 创建 `INDEX.md` 索引文件
- [ ] 在各主要目录创建 `README.md`
- [ ] 添加面包屑导航 (如果需要)

## 任务依赖关系

```
阶段1: 文档重组
  ├─ 1.1 创建目录 (必须首先完成)
  ├─ 1.2-1.3 创建模板 (可并行)
  ├─ 1.4 迁移插件文档 (依赖 1.1)
  ├─ 1.5 迁移日志 (依赖 1.1)
  └─ 1.6 更新主 README (依赖 1.1-1.5)

阶段2: 源码重组
  ├─ 2.1 移动插件 (可独立进行)
  ├─ 2.2 整理测试 (可独立进行)
  └─ 2.3 清理构建 (可独立进行)

阶段3: 命名规范化
  ├─ 3.1 制定规范 (必须首先完成)
  ├─ 3.2 更新导入路径 (依赖 3.1)
  └─ 3.3 更新文档引用 (依赖 3.1)

阶段4: 验证和优化
  ├─ 4.1 功能验证 (依赖阶段1-3)
  ├─ 4.2 迁移脚本 (可选,依赖阶段1-3)
  └─ 4.3 更新工具配置 (依赖阶段1-3)

阶段5: 文档和培训
  ├─ 5.1 更新项目文档 (依赖阶段1-4)
  └─ 5.2 创建导航帮助 (依赖阶段1-4)
```

## 时间估算

- 阶段1: 文档重组 - 2-3 小时
- 阶段2: 源码重组 - 1-2 小时
- 阶段3: 命名规范化 - 2-3 小时
- 阶段4: 验证和优化 - 1-2 小时
- 阶段5: 文档和培训 - 1 小时

**总计**: 7-11 小时

## 优先级说明

### 必须完成 (P0)
- 创建文档目录结构
- 迁移插件文档
- 移动插件目录
- 功能验证

### 建议完成 (P1)
- 创建用户和开发文档模板
- 整理测试目录
- 更新导入路径
- 更新主 README

### 可选完成 (P2)
- 命名规范化
- 创建迁移脚本
- 创建导航帮助
