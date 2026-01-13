# UI问题审计报告

生成时间: 2026-01-13
审计范围: `rokun-tool/src/renderer/src`

## 问题统计

### 按严重程度分类

**严重 (文本不可见)**: 0个
**高 (对比度差)**: 约60+处
**中 (不一致)**: 约20+处

### 需要修复的文件列表

#### 优先级1: 高频使用组件

1. **App.tsx** (4处)
   - Toast通知图标缺少dark模式

2. **components/ui/AlertDialog.tsx** (2处)
   - 标题和描述文本缺少dark变体

3. **components/ui/ProgressDialog.tsx** (1处)
   - 进度文本缺少dark变体

#### 优先级2: 页面组件

4. **components/pages/PluginDetail.tsx** (10+处)
   - 权限状态图标
   - 历史记录文本
   - 多处text-gray-500

5. **components/pages/RimeConfig.tsx** (4处)
   - 状态图标

6. **components/pages/WeChatMultiInstance.tsx** (3处)

7. **components/pages/PluginStatus.tsx** (1处)
   - 颜色定义

8. **components/pages/PluginLoading.tsx** (2处)

#### 优先级3: RIME相关组件

9. **components/rime/InstalledRecipes.tsx** (6处)

10. **components/rime/PlumRecipeManager.tsx** (5处)

11. **components/rime/BackupManager.tsx** (5处)

12. **components/rime/InstallProgress.tsx** (3处)

## 问题类型汇总

### 1. 图标状态颜色 (高优先级)
```tsx
// ❌ 当前 (30+处)
<CheckCircle className="h-5 w-5 text-green-600" />
<AlertCircle className="h-5 w-5 text-red-600" />

// ✅ 应该是
<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
```

### 2. 文本颜色 (中优先级)
```tsx
// ❌ 当前 (40+处)
<p className="text-gray-600">...</p>
<p className="text-gray-500">...</p>

// ✅ 应该是
<p className="text-gray-600 dark:text-gray-400">...</p>
<p className="text-gray-500 dark:text-gray-400">...</p>
```

### 3. 标题文本 (高优先级)
```tsx
// ❌ 当前 (1处)
<h2 className="text-lg font-semibold text-gray-900">

// ✅ 应该是
<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
```

## 修复优先级

### Phase 1 - 核心组件 (立即修复)
1. App.tsx - Toast通知图标
2. AlertDialog.tsx - 标题和描述
3. ProgressDialog.tsx - 进度文本

### Phase 2 - 页面组件 (高优先级)
4. PluginDetail.tsx
5. PluginLoading.tsx
6. PluginStatus.tsx
7. RimeConfig.tsx

### Phase 3 - 其他组件 (中优先级)
8. WeChatMultiInstance.tsx
9. RIME相关组件

## 预期工作量

- **总文件数**: 12个
- **总修复点**: 约60-70处
- **预估时间**: 2-3小时
- **风险评估**: 低(纯样式修改,不涉及功能变更)

## 验证清单

修复后需要验证:
- [ ] 明色模式下所有文本清晰可读
- [ ] 暗色模式下所有文本清晰可读
- [ ] 主题切换无闪烁或故障
- [ ] 对比度符合WCAG AA标准
- [ ] 无回归问题
