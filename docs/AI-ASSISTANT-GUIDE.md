# AI助手快速参考指南 - RokunTool UI开发

> 本文档为AI助手(Claude Code等)提供RokunTool项目UI开发的快速参考指南

## 🎯 核心原则

### 1️⃣ 暗色模式是强制的
- **所有**UI组件必须同时支持明色和暗色模式
- 没有例外,没有协商余地

### 2️⃣ 使用语义化颜色
```tsx
// ✅ 正确
className="text-gray-900 dark:text-white"
className="bg-white dark:bg-gray-900"
className="border-gray-200 dark:border-gray-700"

// ❌ 错误
className="text-black"
className="bg-white"
className="text-gray-900"  // 缺少dark变体
```

### 3️⃣ 遵循既定模式
不要重新发明轮子,使用 `components/ui/` 中已有的组件

---

## 📋 快速参考卡片

### 文本颜色(必须记住)

| 用途 | 类名 |
|-----|------|
| 标题 | `text-gray-900 dark:text-white` |
| 正文 | `text-gray-700 dark:text-gray-300` |
| 次要 | `text-gray-600 dark:text-gray-400` |
| 弱化 | `text-gray-500 dark:text-gray-400` |

### 图标颜色(重要!)

```tsx
// ✅ 正确 - 图标也需要dark模式
<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
<Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />

// ❌ 错误
<CheckCircle className="h-5 w-5 text-green-600" />
```

### Badge变体映射

| 状态 | 变体 | 用途 |
|-----|------|-----|
| 已授权/成功 | `success` | 绿色 |
| 已拒绝/错误 | `destructive` | 红色 |
| 警告 | `warning` | 黄色 |
| 待处理/中性 | `secondary` | 灰色 |

---

## ⚠️ 常见错误(避免!)

### 错误1: 忘记dark变体
```tsx
// ❌ 常见错误
<p className="text-gray-900">标题</p>

// ✅ 正确
<p className="text-gray-900 dark:text-white">标题</p>
```

### 错误2: 硬编码颜色
```tsx
// ❌ 永远不要这样
<div className="bg-white text-black">

// ✅ 应该这样
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
```

### 错误3: 图标忘记dark模式
```tsx
// ❌ 错误
<Icon className="h-5 w-5 text-blue-600" />

// ✅ 正确
<Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
```

### 错误4: 链接颜色
```tsx
// ❌ 错误
<a className="text-primary-600">链接</a>

// ✅ 正确
<a className="text-primary-600 dark:text-primary-400">链接</a>
```

---

## ✅ 开发新组件步骤

1. **查看现有组件**
   ```bash
   # 先看看是否已有类似组件
   ls rokun-tool/src/renderer/src/components/ui/
   ```

2. **使用正确的颜色模式**
   ```tsx
   function MyComponent() {
     return (
       <Card>
         <CardHeader>
           <CardTitle className="text-gray-900 dark:text-white">
             标题
           </CardTitle>
           <CardDescription className="text-gray-600 dark:text-gray-400">
             描述
           </CardDescription>
         </CardHeader>
         <CardContent>
           <p className="text-gray-700 dark:text-gray-300">
             内容
           </p>
         </CardContent>
       </Card>
     )
   }
   ```

3. **测试两种主题**
   - 明色模式: 所有文本清晰可读
   - 暗色模式: 所有文本清晰可读
   - 切换主题: 没有闪烁或不可见内容

---

## 🔍 检查清单

完成UI工作前,逐项检查:

- [ ] 所有 `text-*` 类都有对应的 `dark:text-*` 变体
- [ ] 所有 `bg-*` 类都有对应的 `dark:bg-*` 变体
- [ ] 所有 `border-*` 类都有对应的 `dark:border-*` 变体
- [ ] 所有图标都有dark模式颜色
- [ ] 没有使用 `text-black`, `bg-white` 等硬编码颜色
- [ ] 在明色模式下测试通过
- [ ] 在暗色模式下测试通过
- [ ] 对比度看起来足够(WCAG AA)

---

## 📚 必读文档

### 完整UI设计系统
📄 [docs/UI-DESIGN-SYSTEM.md](UI-DESIGN-SYSTEM.md)

包含:
- 完整的颜色系统
- 排版规范
- 间距标准
- 所有组件的详细说明
- 可访问性要求

### OpenSpec规范
📄 [openspec/changes/comprehensive-ui-polish/specs/ui-theme/spec.md](../openspec/changes/comprehensive-ui-polish/specs/ui-theme/spec.md)

### 项目说明
📄 [CLAUDE.md](../CLAUDE.md)

---

## 🚨 紧急情况

### 如果不确定用什么颜色?

**默认选择**:
- 文本: `text-gray-700 dark:text-gray-300`
- 标题: `text-gray-900 dark:text-white`
- 次要: `text-gray-600 dark:text-gray-400`
- 背景: `bg-white dark:bg-gray-900`
- 边框: `border-gray-200 dark:border-gray-700`

### 如果组件太复杂?

1. 拆分成更小的组件
2. 使用组合而非继承
3. 参考现有组件实现

### 如果发现现有代码不遵循规范?

1. 不要在当前任务中修复(除非是任务目标)
2. 记录下来
3. 建议创建单独的修复任务

---

## 💡 实用技巧

### 1. 使用VSCode搜索检查
```bash
# 查找可能缺少dark变体的文本
grep -r "text-gray-[0-9]" --exclude="*.md" rokun-tool/src/renderer/src

# 查找硬编码的黑色
grep -r "text-black\|text-white" rokun-tool/src/renderer/src
```

### 2. 测试主题切换
```tsx
// 在浏览器控制台快速测试
document.documentElement.classList.toggle('dark')
```

### 3. 对比度检查
使用在线工具: https://webaim.org/resources/contrastchecker/

---

## 📞 需要帮助?

1. **先查文档**: [UI-DESIGN-SYSTEM.md](UI-DESIGN-SYSTEM.md)
2. **看现有代码**: `rokun-tool/src/renderer/src/components/ui/`
3. **参考示例**: `rokun-tool/src/renderer/src/components/pages/`

---

**记住**: 遵循规范可以避免90%的UI问题。当你不确定时,选择最保守的做法(完整的dark模式支持)。

**最后更新**: 2026-01-13
