# Tasks: Documentation Restructure

## Phase 1: 创建新文档结构

### 1.1 创建目录结构
- [ ] 创建 `docs/development/standards/` 目录
- [ ] 创建 `docs/development/guides/` 目录
- [ ] 创建 `docs/development/api/` 目录
- [ ] 创建 `docs/development/architecture/` 目录

### 1.2 创建索引文档
- [ ] 创建 `docs/README.md`
  - 包含用户文档链接
  - 包含开发文档链接
  - 包含插件文档链接
- [ ] 创建 `docs/development/README.md`
  - 新手入门指南
  - 规范文档链接
  - API 参考链接
  - 架构文档链接
- [ ] 创建 `docs/development/standards/overview.md`
  - 规范层级说明
  - 规范检查清单
  - 决策树

## Phase 2: 整合权限文档

### 2.1 创建权限 API 参考
- [ ] 创建 `docs/development/api/permissions.md`
  - 从 `PERMISSION-SYSTEM.md` 提取 API 部分
  - 从 `PLUGIN-PERMISSION-BEST-PRACTICES.md` 提取最佳实践
  - 从 `TRANSACTIONAL-PERMISSIONS-GUIDE.md` 提取事务权限部分
  - 添加完整的 API 参考
  - 添加使用示例
  - 添加迁移指南

### 2.2 更新插件开发规范
- [ ] 更新 `docs/development/standards/plugin-development.md`
  - 保留 `PLUGIN-STANDARDS.md` 的核心内容
  - 添加指向 `api/permissions.md` 的链接
  - 添加指向 `api/transactions.md` 的链接
  - 简化示例,避免重复

### 2.3 清理旧文档
- [ ] 标记 `docs/PLUGIN-PERMISSION-BEST-PRACTICES.md` 为废弃(添加重定向链接)
- [ ] 标记 `docs/TRANSACTIONAL-PERMISSIONS-GUIDE.md` 为废弃(添加重定向链接)

## Phase 3: 整合事务文档

### 3.1 创建事务 API 参考
- [ ] 创建 `docs/development/api/transactions.md`
  - 从 `TRANSACTION-SYSTEM.md` 提取核心 API 文档
  - 移除与权限系统重复的部分
  - 添加完整的使用示例
  - 添加回滚策略库参考

### 3.2 创建架构文档
- [ ] 更新 `docs/development/architecture/plugin-system.md`
  - 从 `development/plugin-system.md` 保留架构部分
  - 移除 API 参考内容
  - 添加架构图
  - 添加设计决策

### 3.3 创建主应用架构文档
- [ ] 创建 `docs/development/architecture/main-app.md`
  - Electron 应用结构
  - 进程间通信
  - 状态管理
  - UI 组件结构

## Phase 4: 整合插件开发文档

### 4.1 整合插件开发指南
- [ ] 将 `plugin-development-guide.md` 内容整合到:
  - `development/standards/plugin-development.md` (规范部分)
  - `development/architecture/plugin-system.md` (架构部分)
  - `development/api/plugin-context.md` (API 部分,新建)

### 4.2 创建插件上下文 API 参考
- [ ] 创建 `docs/development/api/plugin-context.md`
  - 完整的 PluginContext API
  - 所有可用方法和属性
  - 使用示例
  - 类型定义

### 4.3 清理旧文档
- [ ] 标记 `docs/plugin-development-guide.md` 为废弃(添加重定向链接)
- [ ] 标记 `docs/development/plugin-system.md` 为废弃(添加重定向链接)

## Phase 5: 更新代码风格和 UI 规范

### 5.1 整合代码风格规范
- [ ] 更新 `docs/development/standards/coding-style.md`
  - 保留现有内容
  - 添加指向 `plugin-development.md` 的链接
  - 添加 TypeScript 特定规范
  - 添加 React 特定规范

### 5.2 创建 UI 组件规范
- [ ] 创建 `docs/development/standards/ui-components.md`
  - 从 `UI-DESIGN-SYSTEM.md` 提取关键部分
  - 添加组件使用规范
  - 添加可访问性要求
  - 添加深色模式要求

## Phase 6: 更新 CLAUDE.md

### 6.1 简化 CLAUDE.md
- [ ] 保留 OpenSpec 集成部分
- [ ] 添加文档引用部分
- [ ] 添加决策树
- [ ] 移除重复的规范内容
- [ ] 添加快速参考链接

### 6.2 删除 AI-ASSISTANT-GUIDE.md
- [ ] 将有用内容合并到 `docs/development/README.md`
- [ ] 删除 `docs/AI-ASSISTANT-GUIDE.md`

## Phase 7: 清理和验证

### 7.1 删除废弃文档
- [ ] 删除 `docs/PLUGIN-PERMISSION-BEST-PRACTICES.md`
- [ ] 删除 `docs/TRANSACTIONAL-PERMISSIONS-GUIDE.md`
- [ ] 删除 `docs/plugin-development-guide.md`
- [ ] 删除 `docs/development/plugin-system.md`
- [ ] 删除 `docs/AI-ASSISTANT-GUIDE.md`

### 7.2 验证文档完整性
- [ ] 检查所有内部链接
- [ ] 确保没有断链
- [ ] 验证所有代码示例
- [ ] 检查文档结构一致性

### 7.3 更新交叉引用
- [ ] 更新 `CLAUDE.md` 中的链接
- [ ] 更新 `PLUGIN-STANDARDS.md` 中的链接
- [ ] 更新 `PERMISSION-SYSTEM.md` 中的链接
- [ ] 更新 `TRANSACTION-SYSTEM.md` 中的链接

### 7.4 最终验证
- [ ] 从零开始的新手开发者测试
  - 能否在 5 分钟内找到所需文档?
  - 文档是否清晰易懂?
- [ ] AI 助手测试
  - 能否快速定位正确的规范?
  - 是否存在冲突的指导?

## Estimated Time

- **Phase 1**: 1-2 hours
- **Phase 2**: 2-3 hours
- **Phase 3**: 2-3 hours
- **Phase 4**: 1-2 hours
- **Phase 5**: 1 hour
- **Phase 6**: 1 hour
- **Phase 7**: 1-2 hours

**Total**: 9-14 hours

## Dependencies

- 无外部依赖
- 可以独立完成
- 不影响代码功能

## Success Metrics

- ✅ 文档总数减少 30% (从 18 个减少到 ~12 个)
- ✅ 没有重复内容
- ✅ 所有链接有效
- ✅ 新开发者能在 5 分钟内找到所需文档
- ✅ AI 助手能快速定位正确规范
