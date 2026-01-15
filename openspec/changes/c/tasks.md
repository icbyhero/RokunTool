## 1. 审计和文档化问题

- [x] 1.1 全面审计所有存在暗色模式问题的组件
  - 搜索硬编码的文本颜色 (`text-gray-900`、`text-black`、`text-gray-800` 不带 `dark:` 的)
  - 识别所有缺少正确暗色模式支持的组件
  - 记录每个组件中发现的具体问题
  - 按严重程度优先处理修复(文本不可见=严重,对比度差=高)

- [x] 1.2 审计整个应用中的徽章变体使用情况
  - 查找所有使用Badge组件的地方
  - 记录哪些变体在何处使用
  - 识别徽章使用模式中的不一致之处
  - 为标准化创建建议

## 2. 修复UI组件

- [x] 2.1 修复Badge组件的暗色模式支持
  - 更新 [Badge.tsx](rokun-tool/src/renderer/src/components/ui/Badge.tsx) 变体
  - 确保所有变体都有正确的暗色模式颜色
  - 测试两种主题下所有徽章变体的对比度

- [x] 2.2 修复Button组件的暗色模式支持
  - 审查 [Button.tsx](rokun-tool/src/renderer/src/components/ui/Button.tsx) 变体
  - 确保所有按钮状态都有正确的暗色模式样式
  - 特别修复ghost和link变体

- [x] 2.3 修复其余UI组件
  - AlertDialog.tsx ✅
  - ProgressDialog.tsx ✅
  - Toast通知(App.tsx) ✅

## 3. 修复页面组件

- [x] 3.1 修复PluginDetail页面的权限选项卡
  - 修复权限列表项中的硬编码文本颜色 ✅
  - 确保状态徽章保持一致
  - 修复权限历史记录项 ✅
  - 修复安全警告卡片颜色

- [x] 3.2 修复App.tsx的Toast通知
  - 更新暗色模式下的Toast图标颜色 ✅
  - 确保两种主题下的Toast文本都可读
  - 修复不同Toast类型的背景颜色

- [x] 3.3 修复其余页面组件
  - [PluginLoading.tsx](rokun-tool/src/renderer/src/components/pages/PluginLoading.tsx) ✅
  - [RimeConfig.tsx](rokun-tool/src/renderer/src/components/pages/RimeConfig.tsx) ✅
  - [WeChatMultiInstance.tsx](rokun-tool/src/renderer/src/components/pages/WeChatMultiInstance.tsx) ✅
  - [PluginStatus.tsx](rokun-tool/src/renderer/src/components/pages/PluginStatus.tsx) ✅
  - RIME相关组件(InstallProgress, InstalledRecipes, PlumRecipeManager, BackupManager) ✅

## 4. 标准化徽章使用

- [ ] 4.1 创建徽章变体文档
  - 记录何时使用每个徽章变体(default、secondary、destructive、outline、success、warning、info)
  - 创建视觉示例
  - 为权限状态徽章添加使用指南

- [x] 4.2 更新权限徽章使用
  - 标准化权限状态徽章(已授权=success、已拒绝=destructive、待处理=secondary)
  - 确保所有状态徽章的图标使用保持一致
  - 更新任何不一致的徽章使用

## 5. 主题指南和文档

- [x] 5.1 创建UI设计系统文档
  - 编写完整的 [docs/UI-DESIGN-SYSTEM.md](../../docs/UI-DESIGN-SYSTEM.md) ✅
  - 包含颜色、排版、间距等标准 ✅
  - 添加组件使用示例 ✅
  - 建立可访问性指南 ✅

- [x] 5.2 更新CLAUDE.md项目说明
  - 引用UI设计系统文档 ✅
  - 要求AI助手遵循UI规范 ✅
  - 添加UI开发检查清单 ✅

- [ ] 5.3 创建组件开发检查清单
  - 暗色模式支持要求
  - 颜色对比度要求
  - 新组件的测试检查清单

## 6. 测试和验证

- [ ] 6.1 明色模式手动测试
  - 在明色模式下测试所有页面和组件
  - 验证没有回归问题
  - 检查所有悬停状态和交互

- [ ] 6.2 暗色模式手动测试
  - 在暗色模式下测试所有页面和组件
  - 验证所有文本都可读
  - 检查对比度是否符合可访问性标准
  - 测试主题切换不会造成视觉故障

- [ ] 6.3 跨组件一致性检查
  - 验证相似组件的外观保持一致
  - 检查状态指示器遵循相同的模式
  - 确保间距和大小保持一致

## 7. 代码审查和清理

- [ ] 7.1 移除未使用的颜色类
  - 识别任何冗余或未使用的颜色工具类
  - 清理不一致的颜色使用

- [ ] 7.2 验证所有更改遵循模式
  - 确保所有修复都遵循既定的主题模式
  - 检查没有引入新的硬编码颜色

- [ ] 7.3 更新组件示例和注释
  - 在需要的地方添加解释暗色模式颜色选择的注释
  - 更新任何组件文档
