<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create or apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# File Location Guidelines

## 🚨 CRITICAL: Documentation Location Rules

**项目有多个目录,必须正确区分:**

```
RokunTool/                    # 项目根目录
├── docs/                     # ✅ 用户文档和开发文档 (正确位置)
│   ├── plugins/              # 插件文档
│   ├── development/          # 开发指南
│   └── *.md                  # 项目文档
├── rokun-tool/               # Electron 应用源码
│   ├── docs/                 # ❌ 构建相关文档 (仅BUILD.md等)
│   ├── src/                  # 源码
│   └── package.json
└── openspec/                 # OpenSpec 规范
```

### 文档创建规则

**❌ 错误的文档位置:**
- `rokun-tool/docs/XXX.md` - 这只用于构建相关文档
- `rokun-tool/src/docs/XXX.md` - 不存在

**✅ 正确的文档位置:**
- **用户/插件文档**: `docs/plugins/{plugin-name}/`
- **开发指南**: `docs/development/`
- **系统文档**: `docs/XXX.md` (如 PERMISSION-SYSTEM.md, TRANSACTION-SYSTEM.md)
- **OpenSpec**: `openspec/changes/{change-id}/`

### 创建文档前必须确认

1. **这是什么类型的文档?**
   - 用户指南 → `docs/user/` 或 `docs/plugins/`
   - 开发文档 → `docs/development/`
   - API文档 → `docs/` 或代码注释
   - 构建文档 → `rokun-tool/docs/BUILD.md`

2. **使用绝对路径创建**
   ```bash
   # ✅ 正确
   /Users/.../RokunTool/docs/TRANSACTION-SYSTEM.md
   /Users/.../RokunTool/docs/plugins/wechat-multi-instance/README.md

   # ❌ 错误
   /Users/.../RokunTool/rokun-tool/docs/TRANSACTION-SYSTEM.md
   ```

3. **验证目录结构**
   ```bash
   # 创建前先检查
   ls -la docs/              # 应该显示 plugins/, development/ 等
   ls -la rokun-tool/docs/  # 应该只有 BUILD.md 等
   ```

### 常见错误检查清单

创建文档时,必须确认:
- [ ] 文档类型正确(用户/开发/构建)
- [ ] 路径从项目根目录开始
- [ ] 不是 `rokun-tool/docs/` (除非是BUILD.md)
- [ ] 目录已存在或需要创建
- [ ] 使用 Write 工具时使用绝对路径

# UI Design Guidelines

**IMPORTANT**: When working on UI-related tasks, you MUST follow the project's UI design system documented in `@/docs/UI-DESIGN-SYSTEM.md`.

## Required Reading for UI Work

Before making any UI changes, read the complete UI design system:
- **File**: [docs/UI-DESIGN-SYSTEM.md](docs/UI-DESIGN-SYSTEM.md)
- **Covers**: Colors, typography, spacing, components, dark mode, accessibility

## Critical Rules

1. **Dark Mode Support is MANDATORY**
   - ALL text colors MUST have `dark:` variants
   - NEVER use hardcoded colors like `text-black`, `bg-white`
   - ALWAYS use semantic colors: `text-gray-900 dark:text-white`

2. **Text Color Patterns (STRICT)**
   - Headings: `text-gray-900 dark:text-white`
   - Body: `text-gray-700 dark:text-gray-300`
   - Secondary: `text-gray-600 dark:text-gray-400`
   - Muted: `text-gray-500 dark:text-gray-400`

3. **Component Standards**
   - Use existing UI components from `components/ui/` when possible
   - Follow component variant conventions (Button, Badge, etc.)
   - All icons must have dark mode support

4. **Accessibility**
   - Text contrast MUST meet WCAG AA (4.5:1 minimum)
   - Test in BOTH light and dark themes before completing work

## Quick Checklist

Before marking any UI-related task as complete, verify:
- [ ] All text has `dark:` variants
- [ ] No hardcoded colors (`text-black`, `bg-white`, etc.)
- [ ] Tested in light mode
- [ ] Tested in dark mode
- [ ] All text is readable in both themes
- [ ] Followed component patterns from UI design system

## Example: Correct vs Incorrect

```tsx
// ❌ WRONG - No dark mode support
<h1 className="text-gray-900 font-bold">Title</h1>
<p className="text-gray-600">Description</p>

// ✅ CORRECT - Full dark mode support
<h1 className="text-gray-900 dark:text-white font-bold">Title</h1>
<p className="text-gray-600 dark:text-gray-400">Description</p>
```

```tsx
// ❌ WRONG - Hardcoded colors
<div className="bg-white text-black border border-gray-300">

// ✅ CORRECT - Semantic colors with dark mode
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
```

## For More Information

See the complete UI design system: [docs/UI-DESIGN-SYSTEM.md](docs/UI-DESIGN-SYSTEM.md)

## OpenSpec Integration

When creating UI-related proposals:
- Reference `specs/ui-theme/spec.md` for theme requirements
- Check `openspec/changes/comprehensive-ui-polish/` for ongoing UI improvements
- Ensure all new UI work follows the established patterns
