# Proposal: Documentation Restructure

## Meta

- **Change ID**: documentation-restructure
- **Status**: Draft
- **Created**: 2026-01-14
- **Owner**: RokunTool Team

## Problem Statement

当前项目文档存在以下问题:

1. **重复内容严重**:
   - `PLUGIN-PERMISSION-BEST-PRACTICES.md` (345行) vs `PERMISSION-SYSTEM.md` (891行)
   - `TRANSACTIONAL-PERMISSIONS-GUIDE.md` (771行) vs `TRANSACTION-SYSTEM.md` (807行)
   - `plugin-development-guide.md` (513行) vs `development/plugin-system.md` (639行)

2. **结构混乱**:
   - 规范性文档散落在根目录 (`docs/`) 和子目录 (`docs/development/`)
   - 缺少清晰的文档层次结构
   - AI 助手不知道应该参考哪个文档

3. **缺少统一索引**:
   - 没有集中的 README 或索引文件
   - 新开发者难以找到所需文档
   - AI 助手无法快速定位正确的规范

4. **文档定位不清晰**:
   - `AI-ASSISTANT-GUIDE.md` 的角色不明确
   - `CLAUDE.md` (项目根) vs `docs/AI-ASSISTANT-GUIDE.md` 功能重叠
   - 用户文档和开发文档混杂

## Impact

- **开发者体验**: 新开发者需要阅读多个重复的文档才能理解系统
- **AI 助手效率**: AI 助手不知道应该遵循哪个规范,导致不一致的实现
- **维护成本**: 更新功能时需要同步修改多个文档
- **代码质量**: 由于规范不统一,代码风格和模式不一致

## Proposed Solution

### 1. 新的文档结构

```
docs/
├── README.md                          # 📚 文档索引(新建)
│
├── user/                              # 👤 用户文档
│   ├── README.md                      # 用户指南首页
│   ├── getting-started.md
│   ├── installation.md
│   └── faq.md
│
├── development/                       # 👨‍💻 开发文档
│   ├── README.md                      # 开发指南首页(新建)
│   │
│   ├── standards/                     # 📋 编码规范
│   │   ├── overview.md                # 规范总览(新建)
│   │   ├── plugin-development.md      # 插件开发规范(整合)
│   │   ├── coding-style.md            # 代码风格规范
│   │   └── ui-components.md           # UI 组件规范
│   │
│   ├── architecture/                  # 🏗️ 架构文档
│   │   ├── overview.md                # 架构总览
│   │   ├── plugin-system.md           # 插件系统架构
│   │   └── main-app.md                # 主应用架构(新建)
│   │
│   ├── guides/                        # 📖 开发指南
│   │   ├── github-setup.md
│   │   ├── environment-check.md
│   │   └── testing.md                 # 测试指南(新建)
│   │
│   └── api/                           # 🔌 API 参考
│       ├── permissions.md             # 权限 API(整合)
│       ├── transactions.md            # 事务 API(整合)
│       └── plugin-context.md          # 插件上下文 API
│
├── plugins/                           # 🔌 插件文档
│   ├── rime-config/
│   │   ├── README.md
│   │   ├── TUTORIAL.md
│   │   └── TEMPLATES.md
│   └── wechat-multi-instance/
│       ├── README.md
│       ├── CONFIG_EXAMPLES.md
│       └── TECHNICAL.md
│
└── daily-log/                         # 📝 开发日志
    └── ...
```

### 2. 文档整合计划

#### 权限文档整合
**删除**:
- `PLUGIN-PERMISSION-BEST-PRACTICES.md`
- `TRANSACTIONAL-PERMISSIONS-GUIDE.md`

**创建**:
- `docs/development/api/permissions.md` - 权限 API 完整参考
  - 从 `PERMISSION-SYSTEM.md` 提取 API 部分
  - 从 `PLUGIN-PERMISSION-BEST-PRACTICES.md` 提取最佳实践
  - 从 `TRANSACTIONAL-PERMISSIONS-GUIDE.md` 提取事务权限部分

- `docs/development/standards/plugin-development.md` - 插件开发规范
  - 从 `PLUGIN-STANDARDS.md` 整合
  - 从 `plugin-development-guide.md` 提取核心部分
  - 添加强制性的权限请求规范

#### 事务文档整合
**删除**:
- `TRANSACTIONAL-PERMISSIONS-GUIDE.md`

**更新**:
- `docs/development/api/transactions.md` - 事务 API 完整参考
  - 保留 `TRANSACTION-SYSTEM.md` 的核心内容
  - 移除与权限系统的重复部分

#### 插件开发文档整合
**删除**:
- `plugin-development-guide.md`
- `development/plugin-system.md`

**创建**:
- `docs/development/architecture/plugin-system.md` - 插件系统架构
  - 从 `development/plugin-system.md` 保留架构部分
  - 移除与 API 参考重复的内容

### 3. 关键文档内容

#### docs/README.md (新建)
```markdown
# RokunTool 文档

## 快速导航

### 👤 用户
- [入门指南](user/README.md)
- [安装说明](user/installation.md)
- [常见问题](user/faq.md)

### 👨‍💻 开发者
- [开发指南](development/README.md)
- [插件开发规范](development/standards/plugin-development.md)
- [API 参考](development/api/README.md)

### 🔌 插件
- [Rime 配置插件](plugins/rime-config/README.md)
- [微信分身插件](plugins/wechat-multi-instance/README.md)
```

#### docs/development/README.md (新建)
```markdown
# 开发指南

## 新手入门

1. 环境设置: [环境检查](guides/environment-check.md)
2. GitHub 设置: [GitHub 配置](guides/github-setup.md)
3. 架构概览: [系统架构](architecture/overview.md)

## 开发规范

**⚠️ 强制要求**: 所有开发必须遵循:
- [插件开发规范](standards/plugin-development.md)
- [代码风格规范](standards/coding-style.md)
- [UI 组件规范](standards/ui-components.md)

## API 参考

- [权限系统 API](api/permissions.md)
- [事务系统 API](api/transactions.md)
- [插件上下文 API](api/plugin-context.md)

## 架构文档

- [插件系统架构](architecture/plugin-system.md)
- [主应用架构](architecture/main-app.md)
```

#### docs/development/standards/overview.md (新建)
```markdown
# 开发规范总览

## 规范层级

### 1. 强制性规范 (MUST)
- **插件开发规范**: 所有插件必须遵守
  - 功能级权限请求
  - 进度报告模式
  - 错误处理标准

### 2. 推荐性规范 (SHOULD)
- **代码风格规范**: 代码格式和命名
- **UI 组件规范**: UI/UX 一致性

### 3. 参考规范 (MAY)
- **测试指南**: 测试最佳实践
- **性能指南**: 性能优化建议

## 规范检查清单

在提交代码前,请确认:
- [ ] 遵循插件开发规范
- [ ] 代码通过 TypeScript 类型检查
- [ ] UI 组件在明暗主题下都正常
- [ ] 添加了必要的错误处理
- [ ] 更新了相关文档
```

### 4. CLAUDE.md 更新

**简化为**: 仅包含 OpenSpec 集成和文档引用

```markdown
# AI Assistant Guidelines

## OpenSpec Integration
[现有内容保持不变]

## Documentation References

**⚠️ CRITICAL**: Before making any changes, read:

### For Plugin Development
1. **[Plugin Development Standards](docs/development/standards/plugin-development.md)** - MANDATORY
2. **[Permission API Reference](docs/development/api/permissions.md)** - API docs
3. **[Transaction API Reference](docs/development/api/transactions.md)** - API docs

### For Main App Development
1. **[Coding Standards](docs/development/standards/coding-style.md)** - Code style
2. **[UI Component Standards](docs/development/standards/ui-components.md)** - UI patterns
3. **[Main App Architecture](docs/development/architecture/main-app.md)** - Architecture

### For UI Work
1. **[UI Design System](docs/UI-DESIGN-SYSTEM.md)** - MANDATORY for UI changes

## Quick Decision Tree

```
What are you working on?
├─ Plugin Development?
│  └─> Read: [Plugin Development Standards](docs/development/standards/plugin-development.md)
│
├─ Main App Development?
│  ├─ UI Changes?
│  │  └─> Read: [UI Design System](docs/UI-DESIGN-SYSTEM.md)
│  └─ Backend/Architecture?
│     └─> Read: [Coding Standards](docs/development/standards/coding-style.md)
│
└─ Creating Proposal?
   └─> Read: [OpenSpec AGENTS.md](openspec/AGENTS.md)
```
```

### 5. 删除文档清单

```
删除以下文档(内容已整合):
- docs/PLUGIN-PERMISSION-BEST-PRACTICES.md
- docs/TRANSACTIONAL-PERMISSIONS-GUIDE.md
- docs/plugin-development-guide.md
- docs/development/plugin-system.md
- docs/AI-ASSISTANT-GUIDE.md (功能合并到 CLAUDE.md 和 docs/development/README.md)
```

## Success Criteria

1. ✅ 没有重复内容的文档
2. ✅ 文档结构清晰,易于导航
3. ✅ 新开发者可以在 5 分钟内找到所需文档
4. ✅ AI 助手能够快速定位正确的规范
5. ✅ 每个文档都有明确的定位和受众

## Migration Plan

Phase 1: 创建新结构 (1-2 hours)
- [ ] 创建目录结构
- [ ] 创建索引文档 (docs/README.md, development/README.md)
- [ ] 创建规范总览 (development/standards/overview.md)

Phase 2: 整合现有文档 (2-3 hours)
- [ ] 整合权限文档
- [ ] 整合事务文档
- [ ] 整合插件开发文档

Phase 3: 删除冗余文档 (30 min)
- [ ] 删除重复文档
- [ ] 更新内部链接

Phase 4: 验证和测试 (1 hour)
- [ ] 检查所有链接有效性
- [ ] 验证文档完整性
- [ ] 更新 CLAUDE.md

## Risks & Mitigation

**Risk**: 删除文档可能导致外部链接失效
**Mitigation**:
1. 保留旧文档的重定向(在删除前添加指向新文档的链接)
2. 使用 git 历史恢复被误删的内容

**Risk**: 整合过程可能丢失重要信息
**Mitigation**:
1. 整合前对比文档内容
2. 保留所有场景和示例
3. 人工审核整合后的文档

## Related Changes

None
