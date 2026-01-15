# 修复开发环境插件加载路径

## Why

在项目目录重组后,插件从 `rokun-tool/plugins/` 移动到根目录 `plugins/`,导致开发环境(`pnpm dev`)下插件无法加载。

**根本原因**:
- `__dirname` 在开发环境指向 `out/main/`
- 相对路径 `../../plugins` 解析为 `rokun-tool/plugins/`
- 但实际插件在项目根目录的 `plugins/`

## What Changes

修改插件目录路径解析逻辑,使其在开发和生产环境都能正确工作:

```typescript
// 修改前
const pluginsDir = join(__dirname, '../../plugins')

// 修改后
const isDev = process.env.NODE_ENV === 'development'
const pluginsDir = isDev
  ? join(__dirname, '../../../plugins')  // 开发环境
  : join(__dirname, '../../plugins')     // 生产环境
```

添加路径验证和调试日志:
- 输出当前环境
- 输出 `__dirname` 值
- 输出计算后的插件目录路径
- 验证目录是否存在

## Impact

- **修改文件**: `src/main/index.ts`
- **影响功能**: 插件加载器,开发环境启动
- **兼容性**: 向后兼容,生产环境行为不变
- **风险**: 低风险 - 只修改路径计算逻辑

## Success Criteria

- [ ] `pnpm dev` 后插件列表正确显示
- [ ] 所有插件都能正常加载
- [ ] 插件可以启用和禁用
- [ ] 生产环境功能不受影响
