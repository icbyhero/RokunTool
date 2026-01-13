# RokunTool UI设计规范

> 本文档定义了RokunTool项目的UI设计规范,所有开发者(包括AI助手)在开发UI组件时都必须遵循这些规范。

## 目录

- [核心原则](#核心原则)
- [主题系统](#主题系统)
- [颜色规范](#颜色规范)
- [排版规范](#排版规范)
- [间距规范](#间距规范)
- [组件规范](#组件规范)
- [暗色模式支持](#暗色模式支持)
- [可访问性](#可访问性)
- [开发指南](#开发指南)

---

## 核心原则

### 1. 一致性优先
- 相同的UI元素在不同页面必须保持一致的视觉表现
- 使用相同的状态指示器颜色(成功=绿色,错误=红色,警告=黄色)
- 组件的间距、圆角、阴影等视觉效果保持统一

### 2. 明暗双主题
- **所有**UI组件必须同时支持明色模式和暗色模式
- 不得使用硬编码的颜色(如 `text-black`, `bg-white`)
- 必须使用Tailwind的 `dark:` 变体前缀

### 3. 可访问性
- 文本对比度必须符合WCAG AA标准(至少4.5:1)
- 所有交互元素必须有明确的焦点状态
- 颜色不能作为传达信息的唯一方式

### 4. 渐进增强
- 先实现核心功能,再考虑视觉效果
- 保持组件简单,避免过度设计
- 优先使用Tailwind内置样式,而非自定义CSS

---

## 主题系统

### 主题切换机制

应用使用Tailwind CSS的 `dark` 类来实现主题切换:

```typescript
// 主题切换逻辑 (uiStore.ts)
const newTheme = state.theme === 'light' ? 'dark' : 'light'
if (newTheme === 'dark') {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}
```

### 主题存储

- 主题偏好保存在 `localStorage.getItem('theme')`
- 页面加载时从localStorage读取并应用

---

## 颜色规范

### 文本颜色模式

所有文本颜色**必须**遵循以下模式:

| 用途 | 明色模式 | 暗色模式 | Tailwind类 |
|-----|---------|---------|-----------|
| 标题文本 | gray-900 | white | `text-gray-900 dark:text-white` |
| 正文文本 | gray-700 | gray-300 | `text-gray-700 dark:text-gray-300` |
| 次要文本 | gray-600 | gray-400 | `text-gray-600 dark:text-gray-400` |
| 弱化文本 | gray-500 | gray-400 | `text-gray-500 dark:text-gray-400` |
| 禁用文本 | gray-400 | gray-600 | `text-gray-400 dark:text-gray-600` |
| 链接文本 | primary-600 | primary-400 | `text-primary-600 dark:text-primary-400` |

### 背景颜色模式

| 用途 | 明色模式 | 暗色模式 | Tailwind类 |
|-----|---------|---------|-----------|
| 主要表面 | white | gray-900 | `bg-white dark:bg-gray-900` |
| 次要表面 | gray-50 | gray-800 | `bg-gray-50 dark:bg-gray-800` |
| 第三表面 | gray-100 | gray-700 | `bg-gray-100 dark:bg-gray-700` |

### 边框颜色模式

| 用途 | 明色模式 | 暗色模式 | Tailwind类 |
|-----|---------|---------|-----------|
| 默认边框 | gray-200 | gray-700 | `border-gray-200 dark:border-gray-700` |
| 浅色边框 | gray-100 | gray-800 | `border-gray-100 dark:border-gray-800` |
| 深色边框 | gray-300 | gray-600 | `border-gray-300 dark:border-gray-600` |

### 状态颜色

| 状态 | 颜色 | 用途 |
|-----|-----|-----|
| 成功 | green | 已授权、已完成、成功状态 |
| 错误 | red | 已拒绝、错误、破坏性操作 |
| 警告 | yellow | 警告、敏感权限 |
| 信息 | blue | 信息提示 |
| 中性 | gray | 待处理、次要信息 |

---

## 排版规范

### 字体大小

```tsx
<h1 className="text-2xl font-bold">     // 24px - 页面主标题
<h2 className="text-xl font-semibold">   // 20px - 区块标题
<h3 className="text-lg font-semibold">   // 18px - 小节标题
<p className="text-sm">                  // 14px - 正文
<span className="text-xs">              // 12px - 辅助文本
```

### 字重

```tsx
font-bold        // 700 - 主标题
font-semibold    // 600 - 次要标题
font-medium      // 500 - 强调文本
font-normal      // 400 - 正文
```

---

## 间距规范

### 组件间距

```tsx
// 垂直间距
space-y-2   // 8px  - 紧密相关元素
space-y-4   // 16px - 一般相关元素
space-y-6   // 24px - 区块间距
space-y-8   // 32px - 大区块间距

// 水平间距
space-x-2   // 8px  - 紧密相关元素
space-x-4   // 16px - 一般相关元素
```

### 内边距

```tsx
p-4  // 16px - 卡片默认内边距
p-6  // 24px - 大卡片内边距
px-4 py-2  // 按钮默认内边距
```

---

## 组件规范

### Button组件

#### 变体(Variants)

Button 组件提供 6 种变体,每种都支持完整的暗色模式:

| 变体 | 用途 | 明色模式样式 | 暗色模式样式 | 使用场景 |
|-----|-----|-------------|-------------|---------|
| `default` | 主要操作 | bg-primary-600 text-white | bg-primary-600 text-white | 保存、提交、确认 |
| `destructive` | 破坏性操作 | bg-red-600 text-white | bg-red-600 text-white | 删除、卸载、取消 |
| `secondary` | 次要操作 | bg-gray-200 text-gray-900 | bg-gray-700 text-white | 备选操作 |
| `outline` | 边框按钮 | border-gray-300 bg-white | border-gray-600 bg-gray-800 | 取消、返回 |
| `ghost` | 幽灵按钮 | hover:bg-gray-100 | hover:bg-gray-800 | 工具栏、图标按钮 |
| `link` | 链接按钮 | text-primary-600 | text-primary-400 | 文字链接、辅助操作 |

#### 尺寸(Sizes)

| 尺寸 | 高度 | 内边距 | 使用场景 |
|-----|-----|-------|---------|
| `sm` | h-9 (36px) | px-3 | 紧凑布局、表单 |
| `default` | h-10 (40px) | px-4 py-2 | 默认按钮 |
| `lg` | h-11 (44px) | px-8 | 重要操作、CTA |
| `icon` | h-10 w-10 (40px) | - | 图标按钮 |

#### 状态规范

**禁用状态**:
- 自动应用 `disabled:opacity-50`
- 自动禁用指针事件 `disabled:pointer-events-none`
- 保持可读性,但明显不可交互

**焦点状态**:
- 自动应用 `focus-visible:ring-2 focus-visible:ring-primary-500`
- 确保键盘导航可见性

**悬停状态**:
- `default`: hover:bg-primary-700
- `destructive`: hover:bg-red-700
- `outline`: hover:bg-gray-100 (明色) / hover:bg-gray-700 (暗色)
- `ghost`: hover:bg-gray-100 (明色) / hover:bg-gray-800 (暗色)

#### 使用示例

**基础用法**:
```tsx
// 主要操作
<Button variant="default" onClick={handleSave}>
  保存
</Button>

// 破坏性操作
<Button variant="destructive" onClick={handleDelete}>
  删除
</Button>

// 次要操作
<Button variant="outline" onClick={handleCancel}>
  取消
</Button>
```

**不同尺寸**:
```tsx
<Button size="sm">小按钮</Button>
<Button size="default">默认按钮</Button>
<Button size="lg">大按钮</Button>
```

**图标按钮**:
```tsx
<Button size="icon" variant="ghost" aria-label="设置">
  <Settings className="h-4 w-4" />
</Button>
```

**带图标和文字**:
```tsx
<Button variant="default">
  <Download className="mr-2 h-4 w-4" />
  下载
</Button>
```

**加载状态**:
```tsx
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  处理中...
</Button>
```

#### 最佳实践

1. **主要操作 vs 次要操作**
   - 每个视图通常只有一个主要操作按钮
   - 使用 `default` 变体突出主要操作
   - 使用 `outline` 或 `ghost` 处理次要操作

2. **破坏性操作**
   - 必须使用 `destructive` 变体
   - 考虑添加确认对话框
   - 提供清晰的后果说明

3. **按钮组合**
   ```tsx
   // 对话框按钮组 - 正确的层级
   <div className="flex justify-end gap-2">
     <Button variant="outline">取消</Button>
     <Button variant="default">确认</Button>
   </div>
   ```

4. **可访问性**
   - 图标按钮必须添加 `aria-label`
   - 使用语义化动词(保存、删除、取消)
   - 确保颜色对比度符合 WCAG AA 标准

### Badge组件

**变体使用规范**:

- `success`: 成功状态、已授权权限
- `destructive`: 错误状态、已拒绝权限
- `warning`: 警告状态、敏感权限
- `info`: 信息状态
- `secondary`: 中性状态、待处理
- `outline`: 微妙的指示器

**示例**:
```tsx
// 权限状态
<Badge variant="success">已授权</Badge>
<Badge variant="destructive">已拒绝</Badge>
<Badge variant="secondary">待处理</Badge>

// 信息提示
<Badge variant="warning">敏感权限</Badge>
<Badge variant="info">基础权限</Badge>
```

### Card组件

**结构规范**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>
    内容
  </CardContent>
</Card>
```

### Input组件

**必须包含**:
- `label`: 标签(使用适当的文本颜色)
- 占位符(可选)
- 错误状态支持

**示例**:
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-gray-900 dark:text-white">
    用户名
  </label>
  <Input placeholder="请输入用户名" />
</div>
```

---

## 暗色模式支持

### 强制规则

1. **所有颜色类必须有 `dark:` 变体**
   ```tsx
   // ✅ 正确
   className="text-gray-900 dark:text-white"

   // ❌ 错误
   className="text-gray-900"
   ```

2. **不得使用字面颜色**
   ```tsx
   // ✅ 正确
   className="text-gray-900 dark:text-white"

   // ❌ 错误
   className="text-black"
   className="text-white"
   ```

3. **图标颜色也要遵循规范**
   ```tsx
   // ✅ 正确
   <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />

   // ❌ 错误
   <CheckCircle className="h-5 w-5 text-green-600" />
   ```

### 检查清单

创建新UI组件时,必须确保:

- [ ] 所有文本颜色都有 `dark:` 变体
- [ ] 所有背景颜色都有 `dark:` 变体
- [ ] 所有边框颜色都有 `dark:` 变体
- [ ] 在明色模式下测试
- [ ] 在暗色模式下测试
- [ ] 所有文本在两种主题下都可读
- [ ] 对比度符合WCAG AA标准

---

## 可访问性

### 对比度要求

- 普通文本: 最小 4.5:1
- 大文本(18px+): 最小 3:1
- 图标和图形元素: 最小 3:1

### 焦点状态

所有交互元素必须有清晰的焦点指示:

```tsx
// Tailwind的focus-ring会自动处理
<Button>保存</Button>
<Input />
```

### 语义化HTML

```tsx
// ✅ 使用语义化元素
<button>点击</button>
<nav>...</nav>
<main>...</main>

// ❌ 避免纯div
<div onClick={handleClick}>点击</div>
```

### ARIA属性

必要时添加ARIA属性:

```tsx
<button aria-label="关闭" onClick={handleClose}>
  <X className="h-4 w-4" />
</button>
```

---

## 开发指南

### 创建新UI组件

1. **使用现有组件库**: 优先使用 `components/ui/` 中已有的组件

2. **遵循命名规范**:
   - 组件文件名: PascalCase (如 `UserProfile.tsx`)
   - 样式类: kebab-case (如 `text-gray-900`)

3. **使用TypeScript**: 所有组件必须有明确的类型定义

4. **组合优于继承**: 使用组件组合而非复杂的继承

### 示例: 创建新的状态卡片

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { CheckCircle } from 'lucide-react'

interface StatusCardProps {
  title: string
  status: 'success' | 'error' | 'warning'
  description: string
}

export function StatusCard({ title, status, description }: StatusCardProps) {
  const badgeVariant = {
    success: 'success' as const,
    error: 'destructive' as const,
    warning: 'warning' as const,
  }[status]

  const iconColor = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
  }[status]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white">
            {title}
          </CardTitle>
          <CheckCircle className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 dark:text-gray-300">{description}</p>
      </CardContent>
    </Card>
  )
}
```

### 审查清单

提交PR前,确保:

- [ ] 所有新组件都有 `dark:` 变体
- [ ] 在明暗两种主题下都测试过
- [ ] 遵循了组件命名规范
- [ ] 使用了TypeScript类型
- [ ] 对比度符合可访问性标准
- [ ] 没有硬编码颜色
- [ ] 代码已格式化

---

## 工具和资源

### 颜色对比度检查

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio](https://contrast-ratio.com/)

### Tailwind CSS文档

- [Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Color Reference](https://tailwindcss.com/docs/customizing-colors)

### 项目内部参考

- `rokun-tool/src/renderer/src/components/ui/` - 现有UI组件
- `rokun-tool/src/renderer/src/components/pages/` - 页面组件示例
- `openspec/changes/comprehensive-ui-polish/AUDIT-FINDINGS.md` - 常见问题参考

---

## 更新日志

- **2026-01-14**: 补充 Button 组件详细规范(变体、尺寸、状态、最佳实践)
- **2026-01-13**: 初始版本,定义核心规范
- 后续更新将记录在此

---

## 贡献指南

如果发现规范中的问题或有改进建议:

1. 提交issue描述问题
2. 在修改前先讨论
3. 更新此文档并通知团队
4. 确保所有AI助手和开发者都了解变更

---

**重要**: 所有开发者(包括AI助手)在编写UI代码时,都必须遵循本规范。如有疑问,请参考本文档或询问项目维护者。
