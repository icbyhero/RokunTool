# UI Theme Specification

This specification defines requirements for theme support (light/dark mode) and visual consistency across the RokunTool application.

## ADDED Requirements

### Requirement: Dark Mode Text Visibility

All text SHALL be visible and readable in both light and dark themes with proper contrast ratios meeting WCAG AA standards (minimum 4.5:1 for normal text).

#### Scenario: 暗色模式下的标题文本

- **WHEN** user switches to dark mode
- **THEN** all heading text using `text-gray-900 dark:text-white` MUST be clearly visible against dark backgrounds
- **AND** contrast ratio MUST meet or exceed 4.5:1

#### Scenario: 暗色模式下的正文文本

- **WHEN** user views content in dark mode
- **THEN** all body text using `text-gray-700 dark:text-gray-300` MUST be clearly readable
- **AND** text MUST NOT use hardcoded black colors

#### Scenario: 次要文本可见性

- **WHEN** descriptive or secondary text is displayed in dark mode
- **THEN** text using `text-gray-600 dark:text-gray-400` MUST be visible
- **AND** MUST maintain visual hierarchy (lighter than body text)

### Requirement: Component Dark Mode Support

All UI components MUST support both light and dark themes with appropriate styling variants.

#### Scenario: 暗色模式下的Badge组件

- **WHEN** a Badge is displayed in dark mode
- **THEN** all badge variants (default, secondary, destructive, outline, success, warning, info) MUST be clearly visible
- **AND** badge text MUST have proper contrast against badge background
- **AND** badge borders (if present) MUST be visible

#### Scenario: 暗色模式下的Button组件

- **WHEN** a Button is displayed in dark mode
- **THEN** all button variants MUST maintain proper contrast
- **AND** hover states MUST be clearly visible
- **AND** disabled state MUST be distinguishable from enabled state

#### Scenario: 暗色模式下的Card组件

- **WHEN** a Card is displayed in dark mode
- **THEN** card background MUST contrast with page background
- **AND** card borders (if present) MUST be visible
- **AND** all card content MUST be readable

### Requirement: Theme Switching

Users SHALL be able to switch between light and dark themes without visual glitches or invisible content.

#### Scenario: 从明色模式切换到暗色模式

- **WHEN** user activates dark mode
- **THEN** `dark` class MUST be applied to `document.documentElement`
- **AND** all components MUST immediately reflect dark mode styling
- **AND** no text MUST become invisible
- **AND** theme preference MUST be persisted to localStorage

#### Scenario: 从暗色模式切换到明色模式

- **WHEN** user switches back to light mode
- **THEN** `dark` class MUST be removed from `document.documentElement`
- **AND** all components MUST immediately reflect light mode styling
- **AND** no text MUST become invisible

### Requirement: Badge Variant Consistency

Badge components MUST follow consistent semantic patterns for status indication.

#### Scenario: 权限状态徽章

- **WHEN** displaying plugin permission status
- **THEN** granted permissions MUST use `success` variant (green)
- **AND** denied permissions MUST use `destructive` variant (red)
- **AND** pending permissions MUST use `secondary` variant (gray)
- **AND** all badges MUST include appropriate icons

#### Scenario: 状态指示器徽章

- **WHEN** displaying component or system status
- **THEN** success/active states MUST use `success` variant
- **AND** error/inactive states MUST use `destructive` variant
- **AND** warning states MUST use `warning` variant
- **AND** informational states MUST use `info` or `secondary` variant

### Requirement: Text Color Patterns

Text colors MUST follow established patterns to maintain visual hierarchy and theme support.

#### Scenario: 标题文本模式

- **WHEN** displaying heading text (h1-h6)
- **THEN** MUST use `text-gray-900 dark:text-white` class pattern
- **AND** MUST NOT use `text-black` or other non-theme-aware colors

#### Scenario: 正文文本模式

- **WHEN** displaying primary body content
- **THEN** SHOULD use `text-gray-700 dark:text-gray-300` class pattern
- **AND** MUST have proper contrast in both themes

#### Scenario: 次要文本模式

- **WHEN** displaying secondary or descriptive text
- **THEN** SHOULD use `text-gray-600 dark:text-gray-400` class pattern
- **AND** MUST be visually lighter than body text

#### Scenario: 弱化/禁用文本模式

- **WHEN** displaying muted or disabled text
- **THEN** SHOULD use `text-gray-500 dark:text-gray-500` class pattern
- **AND** MUST be clearly distinguishable from enabled text

### Requirement: UI Component Development Guidelines

New UI components MUST follow theme support patterns to prevent introducing accessibility issues.

#### Scenario: 组件开发检查清单

- **WHEN** developer creates a new UI component
- **THEN** component MUST include `dark:` variants for all color classes
- **AND** component MUST be tested in both light and dark themes
- **AND** text contrast MUST meet WCAG AA standards in both themes
- **AND** hover/active/focus states MUST work in both themes

#### Scenario: 组件文档

- **WHEN** developer documents a UI component
- **THEN** documentation SHOULD include examples in both themes
- **AND** SHOULD list any theme-specific behaviors
- **AND** SHOULD reference theme usage guidelines

### Requirement: Visual Hierarchy Consistency

Similar UI elements MUST maintain consistent visual treatment across the application.

#### Scenario: 一致的状态指示器

- **WHEN** displaying status information
- **THEN** similar statuses MUST use same color patterns across all pages
- **AND** success states MUST use green/success variants
- **AND** error states MUST use red/destructive variants
- **AND** warning states MUST use yellow/warning variants

#### Scenario: 交互元素样式

- **WHEN** displaying interactive elements (buttons, links)
- **THEN** similar elements MUST use consistent hover states
- **AND** focus indicators MUST be visible in both themes
- **AND** disabled states MUST be consistently styled
