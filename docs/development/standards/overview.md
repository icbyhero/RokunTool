# 开发规范总览

本文档提供 RokunTool 项目所有开发规范的快速参考。

## 📋 规范层级

### 1. 强制性规范 (MUST)

**必须遵守**,不遵守会导致代码被拒绝:

- **[插件开发规范](plugin-development.md)**
  - 所有插件开发必须遵守
  - 功能级权限请求 (强制)
  - 进度报告模式
  - 错误处理标准

### 2. 推荐性规范 (SHOULD)

**强烈推荐遵守**,特殊情况下可以偏离但需说明理由:

- **[代码风格规范](coding-style.md)**
  - TypeScript 代码风格
  - React 组件模式
  - 命名约定

- **[UI 组件规范](ui-components.md)**
  - UI/UX 一致性
  - 深色模式支持
  - 可访问性要求

### 3. 参考规范 (MAY)

**建议遵守**,可根据具体情况调整:

- 测试指南 (待添加)
- 性能指南 (待添加)
- 安全指南 (待添加)

## 🎯 按开发类型查找规范

### 插件开发

**强制要求**:
- ✅ 使用 `requestFeaturePermissions()` API
- ✅ 权限请求在进度报告之前
- ✅ 提供清晰的功能名称和描述
- ❌ 不使用已废弃的 `permission.request()` API

**详细规范**: [插件开发规范](plugin-development.md)

### 主应用开发

**强制要求**:
- ✅ TypeScript 严格模式
- ✅ 明暗主题都测试
- ✅ WCAG AA 可访问性

**详细规范**: [代码风格规范](coding-style.md)

### UI 开发

**强制要求**:
- ✅ 所有文本有 `dark:` 变体
- ✅ 不使用硬编码颜色
- ✅ 遵循 UI 设计系统

**详细规范**:
- [UI 组件规范](ui-components.md)
- [UI 设计系统](UI-DESIGN-SYSTEM.md)

## ✅ 代码提交检查清单

在提交任何代码前,请确认:

### 通用检查

- [ ] 代码通过 TypeScript 类型检查 (`npm run typecheck`)
- [ ] 代码通过 Lint 检查 (`npm run lint`)
- [ ] 遵循了相关开发规范
- [ ] 添加了必要的错误处理
- [ ] 添加了日志记录

### 插件开发额外检查

- [ ] 使用了 `requestFeaturePermissions()` API
- [ ] 权限请求在 `progress.start()` 之前
- [ ] 提供了清晰的功能名称和描述
- [ ] 添加了进度报告
- [ ] 测试了权限被拒绝的情况

### UI 开发额外检查

- [ ] 在浅色主题下测试
- [ ] 在深色主题下测试
- [ ] 检查了文本对比度
- [ ] 测试了键盘导航
- [ ] 测试了屏幕阅读器

## 🚨 常见违规

### 插件开发常见错误

❌ **错误**: 逐个请求权限
```javascript
const perm1 = await context.api.permission.request('fs:write', {...})
const perm2 = await context.api.permission.request('process:exec', {...})
```

✅ **正确**: 功能级权限请求
```javascript
const granted = await context.api.permission.requestFeaturePermissions(
  '功能名称',
  [
    { permission: 'fs:write', required: true, reason: '...' },
    { permission: 'process:exec', required: true, reason: '...' }
  ],
  '功能描述...'
)
```

### UI 开发常见错误

❌ **错误**: 硬编码颜色
```tsx
<h1 className="text-gray-900 font-bold">标题</h1>
```

✅ **正确**: 语义化颜色带深色模式
```tsx
<h1 className="text-gray-900 dark:text-white font-bold">标题</h1>
```

### TypeScript 开发常见错误

❌ **错误**: 使用 `any`
```typescript
const data: any = await fetchData()
```

✅ **正确**: 定义具体类型
```typescript
interface Data {
  id: string
  name: string
}
const data: Data = await fetchData()
```

## 📖 规范对比

| 规范 | 适用对象 | 强制性 | 主要内容 |
|------|---------|--------|----------|
| [插件开发规范](plugin-development.md) | 插件开发者 | **强制** | 权限请求、进度报告、错误处理 |
| [代码风格规范](coding-style.md) | 所有开发者 | **推荐** | TypeScript、React、命名 |
| [UI 组件规范](ui-components.md) | UI 开发者 | **推荐** | 组件模式、深色模式、可访问性 |

## 🔗 相关文档

### API 参考
- [权限系统 API](api/permissions.md)
- [事务系统 API](api/transactions.md)
- [插件上下文 API](api/plugin-context.md)

### 架构文档
- [插件系统架构](architecture/plugin-system.md)
- [主应用架构](architecture/main-app.md)

### 指南
- [环境检查](guides/environment-check.md)
- [GitHub 设置](guides/github-setup.md)

## 🎓 学习路径

### 新插件开发者

1. **必读**: [插件开发规范](plugin-development.md) (30 分钟)
2. **实践**: [权限 API](api/permissions.md) (1 小时)
3. **示例**: 查看现有插件代码 (2 小时)

### 新主应用开发者

1. **必读**: [代码风格规范](coding-style.md) (30 分钟)
2. **UI**: [UI 设计系统](UI-DESIGN-SYSTEM.md) (1 小时)
3. **架构**: [主应用架构](architecture/main-app.md) (1 小时)

## 💬 规范问题?

如果您对规范有疑问:

1. 先查阅相关规范的详细文档
2. 查看 Issue 中是否有类似讨论
3. 提交 Issue 寻求澄清
4. 在 PR 中提出问题

---

**提示**: 将此页面作为快速参考,但请务必阅读详细规范文档!

**最后更新**: 2026-01-14
