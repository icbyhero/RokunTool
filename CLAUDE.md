<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

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