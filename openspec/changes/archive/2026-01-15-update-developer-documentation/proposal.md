# Proposal: 更新开发者文档和项目说明

## Why

### 当前问题

RokunTool 项目已经完成了核心系统的开发(权限系统、事务系统、插件沙箱等),但文档存在以下问题:

1. **根目录 README.md 过时**
   - 仍显示"Phase 1: 项目初始化"为当前阶段,但实际已完成
   - 技术架构部分未反映已实现的完整系统
   - 缺少对权限系统、事务系统等核心功能的准确描述
   - 文档链接路径错误(指向 `rokun-tool/docs/` 但实际在 `docs/`)

2. **缺少关键文档**
   - 没有 CONTRIBUTING.md - 新贡献者不知道如何参与
   - 没有 ARCHITECTURE.md - 系统架构分散在各处
   - openspec/project.md 是空的模板 - 没有项目上下文
   - 缺少项目进展状态的统一文档

3. **文档组织不一致**
   - 用户文档路径不明确(`docs/user/` vs 根目录)
   - 开发者文档分散在多个位置
   - API 文档链接断链

4. **对误解的担忧**
   - 新开发者可能不知道必须阅读插件开发规范
   - 主应用开发者可能不知道 UI 深色模式是强制的
   - 贡献者可能不清楚代码风格要求
   - 用户可能不理解权限系统的重要性

## What Changes

本次变更将系统性地更新和重组项目文档,确保:

1. **清晰的项目入口**
   - 更新根目录 README.md 反映真实的项目状态
   - 添加准确的已实现功能列表
   - 修正所有文档链接

2. **完整的贡献者指南**
   - 创建 CONTRIBUTING.md - 贡献流程和行为准则
   - 更新 openspec/project.md - 项目上下文和技术栈
   - 创建 ARCHITECTURE.md - 系统架构总览

3. **文档结构优化**
   - 明确用户文档路径
   - 优化开发者文档导航
   - 修复所有断链

4. **避免误解的关键信息**
   - 在显眼位置标注必读文档
   - 强调关键规范(插件开发、UI 深色模式等)
   - 提供决策树帮助快速定位文档

## Change Metadata

- **ID**: `update-developer-documentation`
- **Title**: 更新开发者文档和项目说明
- **Status**: `proposed`
- **Created**: 2026-01-15
- **Priority**: P1 (重要)
- **Related Specs**:
  - (不修改规格,仅更新文档)

## 当前文档问题清单

### 根目录 README.md

**问题**:
- ❌ 第 25 行: "Phase 1: 项目初始化和框架搭建 (当前阶段)" - 已过时
- ❌ 第 213-227 行: 文档链接路径错误 (`rokun-tool/docs/` 应为 `docs/`)
- ❌ 第 234-253 行: "已实现功能" 部分不完整,缺少沙箱系统等
- ❌ 缺少对已归档功能的总结

**需要**:
- ✅ 更新项目阶段为"生产就绪"
- ✅ 添加所有已完成系统的描述
- ✅ 修正文档链接
- ✅ 添加最新的项目统计

### 缺失的关键文档

**1. openspec/project.md**
- 当前: 空模板
- 需要: 填充项目上下文、技术栈、代码风格、架构模式等

**2. CONTRIBUTING.md (根目录)**
- 当前: 不存在
- 需要: 贡献指南、行为准则、PR 流程

**3. ARCHITECTURE.md (根目录)**
- 当前: 不存在
- 需要: 系统架构总览、核心组件关系

**4. PROJECT-STATUS.md**
- 当前: 不存在
- 需要: 项目进展、已完成功能、待办事项

### 文档组织问题

**问题**:
- ❌ 用户文档入口不清晰
- ❌ 开发者文档路径分散
- ❌ API 文档在多处重复
- ❌ 缺少文档更新日期

## Proposed Solution

### 方案 1: 更新根目录 README.md (P0)

**目标**: 让 README.md 成为准确的项目门面

**更新内容**:
1. **项目概述** - 简洁描述 RokunTool 是什么
2. **功能特性** - 列出所有已实现的核心功能
3. **快速开始** - 用户和开发者的快速入口
4. **技术架构** - 准确的技术栈描述
5. **文档导航** - 修正所有链接,按角色分类
6. **项目状态** - 当前的开发状态和里程碑

### 方案 2: 创建缺失的关键文档 (P0)

**2.1 openspec/project.md**
填充模板,包含:
- **Purpose**: RokunTool 的目标和愿景
- **Tech Stack**: Electron + React + TypeScript + Vite
- **Code Style**: TypeScript 严格模式、ESLint、Prettier
- **Architecture Patterns**: 插件式架构、权限系统、事务系统
- **Testing Strategy**: 单元测试、集成测试
- **Git Workflow**: main 分支保护、PR review、commit 规范
- **Domain Context**: 插件系统、沙箱隔离
- **Constraints**: 安全性、性能、向后兼容

**2.2 CONTRIBUTING.md**
- 如何报告问题
- 如何提交 PR
- 代码审查标准
- 行为准则
- 获得帮助的途径

**2.3 ARCHITECTURE.md**
- 系统分层架构
- 核心组件关系图
- 数据流说明
- 安全边界

**2.4 PROJECT-STATUS.md**
- 已完成功能清单
- 当前开发重点
- 已知问题
- 路线图

### 方案 3: 优化文档导航结构 (P1)

**3.1 更新 docs/README.md**
- 添加"从零开始"路径
- 按角色重新组织
- 添加"5分钟快速了解"章节

**3.2 更新 docs/development/README.md**
- 添加强制阅读的标记
- 优化学习路径
- 添加决策树

**3.3 创建文档索引**
- 快速参考卡片
- 常见任务指南
- 故障排查指南

### 方案 4: 添加关键信息提示 (P1)

**4.1 在 README.md 添加警告框**
```markdown
> ⚠️ **重要**: 如果您是插件开发者,必须阅读 [插件开发规范](docs/development/standards/plugin-development.md)
> ⚠️ **重要**: 如果您修改 UI,必须支持深色模式,详见 [UI 设计系统](docs/UI-DESIGN-SYSTEM.md)
```

**4.2 在 CLAUDE.md 添加快速参考**
- 项目状态速查
- 关键规范索引
- 常见任务决策树

## Implementation Plan

### Phase 1: 更新核心文档 (P0 - 必须)

#### 1.1 更新根目录 README.md
- [ ] 重写项目概述,准确描述当前状态
- [ ] 更新功能特性列表,包含所有已完成系统
- [ ] 修正所有文档链接路径
- [ ] 添加项目状态和统计信息
- [ ] 添加"重要提示"警告框

#### 1.2 填充 openspec/project.md
- [ ] 填写 Purpose 和 Tech Stack
- [ ] 描述 Code Style 和 Architecture Patterns
- [ ] 说明 Testing Strategy 和 Git Workflow
- [ ] 添加 Domain Context 和 Constraints

#### 1.3 创建 CONTRIBUTING.md
- [ ] 编写贡献流程说明
- [ ] 添加代码审查标准
- [ ] 添加行为准则
- [ ] 提供获取帮助的途径

#### 1.4 创建 ARCHITECTURE.md
- [ ] 绘制系统架构图
- [ ] 描述核心组件
- [ ] 说明数据流和安全边界

#### 1.5 创建 PROJECT-STATUS.md
- [ ] 列出所有已完成功能
- [ ] 标注当前开发重点
- [ ] 记录已知问题
- [ ] 绘制未来路线图

### Phase 2: 优化文档导航 (P1 - 重要)

#### 2.1 更新 docs/README.md
- [ ] 添加"快速了解 RokunTool"章节
- [ ] 优化按角色的导航结构
- [ ] 添加文档更新日期

#### 2.2 更新 docs/development/README.md
- [ ] 添加必读文档标记
- [ ] 优化学习路径
- [ ] 添加快速决策树

#### 2.3 创建快速参考卡片
- [ ] 创建 QUICK-REFERENCE.md
- [ ] 添加常见任务指南
- [ ] 添加故障排查指南

### Phase 3: 验证和发布 (P2 - 完善)

#### 3.1 验证文档质量
- [ ] 检查所有链接有效性
- [ ] 验证代码示例准确性
- [ ] 确保术语一致性

#### 3.2 提交到 GitHub
- [ ] 创建 PR: "docs: 更新开发者文档和项目说明"
- [ ] 请求 review
- [ ] 合并到 main 分支

#### 3.3 发布说明
- [ ] 在 Release Notes 中说明文档更新
- [ ] 通知社区

## Success Criteria

- ✅ 根目录 README.md 准确反映项目当前状态
- ✅ 所有文档链接都有效
- ✅ 新贡献者能在 5 分钟内找到需要的文档
- ✅ openspec/project.md 完整填充
- ✅ CONTRIBUTING.md 清晰说明贡献流程
- ✅ 没有断链或过时信息
- ✅ 关键规范有明显的"必读"标记

## Alternatives Considered

### 方案 A: 仅更新 README.md
**优点**: 工作量小
**缺点**: 无法解决文档分散问题,容易再次过时

**结论**: 不采用 - 需要系统性的文档重组

### 方案 B: 创建完整的新文档站点
**优点**: 体验更好
**缺点**: 工作量大,维护成本高

**结论**: 不采用 - 当前阶段 Markdown 文档已足够

### 方案 C: 更新核心文档 + 优化导航 (推荐)
**优点**: 平衡了效果和工作量
**缺点**: 需要仔细组织

**结论**: 采用此方案

## Estimated Effort

- Phase 1: 2-3 小时
- Phase 2: 1-2 小时
- Phase 3: 1 小时

**Total**: 4-6 小时

## Related Changes

- 不依赖其他变更
- 可以独立完成
- 不影响代码功能

---

**最后更新**: 2026-01-15
