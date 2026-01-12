# 目录结构迁移问题修复 - 实施摘要

**文档版本**: 1.0
**创建日期**: 2026-01-12
**状态**: 🟡 待实施

---

## 📋 快速开始

```bash
# 1. 更新 TypeScript 配置
pnpm typecheck

# 2. 运行测试
pnpm test

# 3. 启动开发服务器
pnpm dev
```

---

## 🔍 问题诊断

### 当前状态

基于代码审查，发现以下导入路径问题：

#### 主进程（4 个文件）
| 文件 | 当前导入 | 问题 |
|------|---------|------|
| `src/main/plugins/loader.ts` | `'../../shared/types/plugin'` | 路径解析问题 |
| `src/main/plugins/registry.ts` | `'../../shared/types/plugin'` | 路径解析问题 |
| `src/main/ipc/handlers.ts` | `'../../shared/types/ipc'` | 路径解析问题 |
| `src/main/ipc/index.ts` | `'../../shared/types/ipc'` | 路径解析问题 |

#### 渲染进程（8 个文件）
| 文件 | 当前导入 | 问题 |
|------|---------|------|
| `src/renderer/src/components/pages/PluginDetail.tsx` | `'../../../shared/types/plugin'` | 路径解析问题 |
| `src/renderer/src/components/pages/WeChatMultiInstance.tsx` | `'../../../shared/types/plugin'` | 路径解析问题 |
| `src/renderer/src/components/pages/RimeConfig.tsx` | `'../../../shared/types/plugin'` | 路径解析问题 |
| `src/renderer/src/components/plugin/PluginContainer.tsx` | `'../../../shared/types/plugin'` | 路径解析问题 |
| `src/renderer/src/components/plugin/PluginRouter.tsx` | `'../../../../shared/types/plugin'` | 路径解析问题 |
| `src/renderer/src/store/pluginStore.ts` | `'../../../shared/types/plugin'` | 路径解析问题 |
| `src/renderer/src/utils/plugin-helpers.ts` | `'../../../shared/types/plugin'` | 路径解析问题 |
| `src/renderer/src/__tests__/plugin-helpers.test.ts` | `'../../../shared/types/plugin'` | 路径解析问题 |

#### 预加载脚本（1 个文件）
| 文件 | 当前导入 | 问题 |
|------|---------|------|
| `src/preload/ipc.ts` | `'../shared/types/ipc'` | 路径解析问题 |

#### TypeScript 配置（3 个文件）
| 文件 | 问题 |
|------|------|
| `tsconfig.json` | 缺少路径别名配置 |
| `tsconfig.node.json` | 路径解析配置不完整 |
| `tsconfig.web.json` | 路径解析配置不完整 |

#### Vite 配置（2 个文件）
| 文件 | 问题 |
|------|------|
| `electron.vite.config.ts` | 缺少完整的路径别名 |
| `src/renderer/vitest.config.ts` | 路径别名未在代码中使用 |

---

## 🔧 具体修复步骤

### Step 1: 更新 TypeScript 配置

#### 1.1 更新 `tsconfig.json`

**文件**: `rokun-tool/tsconfig.json`

**修改内容**:
```diff
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ],
+ "compilerOptions": {
+   "baseUrl": ".",
+   "paths": {
+     "@shared/*": ["src/shared/*"],
+     "@main/*": ["src/main/*"],
+     "@preload/*": ["src/preload/*"],
+     "@renderer/*": ["src/renderer/src/*"]
+   }
+ }
}
```

#### 1.2 更新 `tsconfig.node.json`

**文件**: `rokun-tool/tsconfig.node.json`

**修改内容**:
```diff
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.node.json",
  "include": [
    "electron.vite.config.*",
    "src/main/**/*",
    "src/preload/**/*",
    "src/shared/**/*"
  ],
  "compilerOptions": {
    "composite": true,
    "types": ["electron-vite/node"],
+   "baseUrl": ".",
+   "paths": {
+     "@shared/*": ["src/shared/*"],
+     "@main/*": ["src/main/*"],
+     "@preload/*": ["src/preload/*"]
+   }
  }
}
```

#### 1.3 更新 `tsconfig.web.json`

**文件**: `rokun-tool/tsconfig.web.json`

**修改内容**:
```diff
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.web.json",
  "include": [
    "src/renderer/**/*",
    "src/shared/**/*"
  ],
  "compilerOptions": {
    "composite": true,
+   "baseUrl": ".",
+   "paths": {
+     "@shared/*": ["src/shared/*"],
+     "@renderer/*": ["src/renderer/src/*"]
+   }
  }
}
```

---

### Step 2: 更新 Vite 配置

#### 2.1 更新 `electron.vite.config.ts`

**文件**: `rokun-tool/electron.vite.config.ts`

**修改内容**:
```typescript
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@main': path.resolve(__dirname, 'src/main')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@preload': path.resolve(__dirname, 'src/preload')
      }
    }
  },
  renderer: {
    root: path.join(__dirname, 'src/renderer/src'),
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@renderer': path.resolve(__dirname, 'src/renderer/src')
      }
    }
  }
})
```

#### 2.2 更新 `src/renderer/vitest.config.ts`

**文件**: `rokun-tool/src/renderer/vitest.config.ts`

**修改内容**:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, './src/renderer'),
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['**/*.{test,spec}.{js,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer/src'),
      '@shared': path.resolve(__dirname, '../../shared'),
      '@renderer': path.resolve(__dirname, './src/renderer/src')
    }
  }
})
```

---

### Step 3: 修复主进程导入（4 个文件）

#### 3.1 修复 `src/main/plugins/loader.ts`

**文件**: `rokun-tool/src/main/plugins/loader.ts`

**修改内容**:
```diff
- import type {
-   PluginInstance,
-   PluginMetadata,
-   PluginPackage,
-   PluginLoadOptions,
-   PluginContext,
-   PluginHooks,
-   PermissionStatus
- } from '../../shared/types/plugin'
+ import type {
+   PluginInstance,
+   PluginMetadata,
+   PluginPackage,
+   PluginLoadOptions,
+   PluginContext,
+   PluginHooks,
+   PermissionStatus
+ } from '@shared/types/plugin'
```

#### 3.2 修复 `src/main/plugins/registry.ts`

**文件**: `rokun-tool/src/main/plugins/registry.ts`

**修改内容**:
```diff
- import type { PluginInstance, PluginRegistry as IPluginRegistry } from '../../shared/types/plugin'
+ import type { PluginInstance, PluginRegistry as IPluginRegistry } from '@shared/types/plugin'
```

#### 3.3 修复 `src/main/ipc/handlers.ts`

**文件**: `rokun-tool/src/main/ipc/handlers.ts`

**修改内容**:
```diff
- import type {
-   PluginListRequest,
-   PluginListResponse,
-   PluginGetRequest,
-   PluginGetResponse,
-   PluginGetLogsRequest,
-   PluginGetLogsResponse,
-   PluginActionRequest,
-   PluginActionResponse,
-   PluginCallMethodRequest,
-   PluginCallMethodResponse,
-   ClipboardReadTextResponse,
-   ClipboardWriteTextRequest,
-   ClipboardReadImageResponse,
-   ClipboardWriteImageRequest,
-   ClipboardReadHTMLResponse,
-   ClipboardWriteHTMLRequest,
-   ClipboardReadFormatsResponse,
-   NotificationShowRequest,
-   NotificationShowResponse,
-   NotificationCloseRequest
- } from '../../shared/types/ipc'
+ import type {
+   PluginListRequest,
+   PluginListResponse,
+   PluginGetRequest,
+   PluginGetResponse,
+   PluginGetLogsRequest,
+   PluginGetLogsResponse,
+   PluginActionRequest,
+   PluginActionResponse,
+   PluginCallMethodRequest,
+   PluginCallMethodResponse,
+   ClipboardReadTextResponse,
+   ClipboardWriteTextRequest,
+   ClipboardReadImageResponse,
+   ClipboardWriteImageRequest,
+   ClipboardReadHTMLResponse,
+   ClipboardWriteHTMLRequest,
+   ClipboardReadFormatsResponse,
+   NotificationShowRequest,
+   NotificationShowResponse,
+   NotificationCloseRequest
+ } from '@shared/types/ipc'
```

#### 3.4 修复 `src/main/ipc/index.ts`

**文件**: `rokun-tool/src/main/ipc/index.ts`

**修改内容**:
```diff
- export * from '../../shared/types/ipc'
+ export * from '@shared/types/ipc'
```

---

### Step 4: 修复渲染进程导入（8 个文件）

#### 4.1 修复 `src/renderer/src/components/pages/PluginDetail.tsx`

**文件**: `rokun-tool/src/renderer/src/components/pages/PluginDetail.tsx`

**修改内容**:
```diff
- import type { PluginMetadata, PluginPermission } from '../../../shared/types/plugin'
+ import type { PluginMetadata, PluginPermission } from '@shared/types/plugin'
```

#### 4.2 修复 `src/renderer/src/components/pages/WeChatMultiInstance.tsx`

**文件**: `rokun-tool/src/renderer/src/components/pages/WeChatMultiInstance.tsx`

**修改内容**:
```diff
- import type { PluginMetadata, PluginPermission } from '../../../shared/types/plugin'
+ import type { PluginMetadata, PluginPermission } from '@shared/types/plugin'
```

#### 4.3 修复 `src/renderer/src/components/pages/RimeConfig.tsx`

**文件**: `rokun-tool/src/renderer/src/components/pages/RimeConfig.tsx`

**修改内容**:
```diff
- import type { PluginMetadata, PluginPermission } from '../../../shared/types/plugin'
+ import type { PluginMetadata, PluginPermission } from '@shared/types/plugin'
```

#### 4.4 修复 `src/renderer/src/components/plugin/PluginContainer.tsx`

**文件**: `rokun-tool/src/renderer/src/components/plugin/PluginContainer.tsx`

**修改内容**:
```diff
- import type { PluginMetadata, PluginPermission } from '../../../shared/types/plugin'
+ import type { PluginMetadata, PluginPermission } from '@shared/types/plugin'
```

#### 4.5 修复 `src/renderer/src/components/plugin/PluginRouter.tsx`

**文件**: `rokun-tool/src/renderer/src/components/plugin/PluginRouter.tsx`

**修改内容**:
```diff
- import type { PluginRoute } from '../../../../shared/types/plugin'
+ import type { PluginRoute } from '@shared/types/plugin'
```

#### 4.6 修复 `src/renderer/src/store/pluginStore.ts`

**文件**: `rokun-tool/src/renderer/src/store/pluginStore.ts`

**修改内容**:
```diff
- import type { PluginMetadata } from '../../../shared/types/plugin'
+ import type { PluginMetadata } from '@shared/types/plugin'
```

#### 4.7 修复 `src/renderer/src/utils/plugin-helpers.ts`

**文件**: `rokun-tool/src/renderer/src/utils/plugin-helpers.ts`

**修改内容**:
```diff
- import type { PluginMetadata, PluginPermission } from '../../../shared/types/plugin'
+ import type { PluginMetadata, PluginPermission } from '@shared/types/plugin'
```

#### 4.8 修复 `src/renderer/src/__tests__/plugin-helpers.test.ts`

**文件**: `rokun-tool/src/renderer/src/__tests__/plugin-helpers.test.ts`

**修改内容**:
```diff
- import type { PluginMetadata, PluginPermission } from '../../../shared/types/plugin'
+ import type { PluginMetadata, PluginPermission } from '@shared/types/plugin'
```

---

### Step 5: 修复预加载脚本导入（1 个文件）

#### 5.1 修复 `src/preload/ipc.ts`

**文件**: `rokun-tool/src/preload/ipc.ts`

**修改内容**:
```diff
- import type {
-   PluginListRequest,
-   PluginListResponse,
-   PluginGetRequest,
-   PluginGetResponse,
-   PluginActionRequest,
-   PluginActionResponse,
-   PluginCallMethodRequest,
-   PluginCallMethodResponse,
-   PluginStatusChangedEvent,
-   PluginLoadedEvent,
-   PluginLoadingEvent,
-   PluginErrorEvent,
-   ClipboardReadTextResponse,
-   ClipboardWriteTextRequest,
-   ClipboardReadImageResponse,
-   ClipboardWriteImageRequest,
-   ClipboardReadHTMLResponse,
-   ClipboardWriteHTMLRequest,
-   ClipboardReadFormatsResponse,
-   NotificationShowRequest,
-   NotificationShowResponse,
-   NotificationCloseRequest
- } from '../shared/types/ipc'
+ import type {
+   PluginListRequest,
+   PluginListResponse,
+   PluginGetRequest,
+   PluginGetResponse,
+   PluginActionRequest,
+   PluginActionResponse,
+   PluginCallMethodRequest,
+   PluginCallMethodResponse,
+   PluginStatusChangedEvent,
+   PluginLoadedEvent,
+   PluginLoadingEvent,
+   PluginErrorEvent,
+   ClipboardReadTextResponse,
+   ClipboardWriteTextRequest,
+   ClipboardReadImageResponse,
+   ClipboardWriteImageRequest,
+   ClipboardReadHTMLResponse,
+   ClipboardWriteHTMLRequest,
+   ClipboardReadFormatsResponse,
+   NotificationShowRequest,
+   NotificationShowResponse,
+   NotificationCloseRequest
+ } from '@shared/types/ipc'
```

---

## 📝 执行命令

### 1. 更新 TypeScript 配置
```bash
cd rokun-tool
# 编辑 tsconfig.json, tsconfig.node.json, tsconfig.web.json
```

### 2. 更新 Vite 配置
```bash
# 编辑 electron.vite.config.ts
# 编辑 src/renderer/vitest.config.ts
```

### 3. 批量修复导入
```bash
# 使用 sed 或其他工具批量替换
find src/main -name "*.ts" -type f -exec sed -i '' "s|from '\.\./\.\./shared/|from '@shared/|g" {} \;
find src/renderer/src -name "*.tsx" -type f -exec sed -i '' "s|from '\.\./\.\./\.\./shared/|from '@shared/|g" {} \;
find src/preload -name "*.ts" -type f -exec sed -i '' "s|from '\.\./shared/|from '@shared/|g" {} \;
```

### 4. 验证修复
```bash
# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 启动开发服务器
pnpm dev
```

---

## ✅ 验收标准

### 技术验收
- [ ] `pnpm typecheck` 无错误
- [ ] `pnpm test` 全部通过（78 个测试）
- [ ] `pnpm dev` 正常启动
- [ ] `pnpm build` 成功构建
- [ ] IDE 中无 TypeScript 错误

### 功能验收
- [ ] 主进程正确编译
- [ ] 渲染进程正确编译
- [ ] 预加载脚本正确编译
- [ ] 所有导入路径正确解析
- [ ] 应用正常启动和运行

### 代码质量验收
- [ ] 所有导入使用路径别名
- [ ] 无相对路径混乱
- [ ] 代码可读性提高
- [ ] 维护成本降低

---

## 📊 修复统计

### 文件修改统计
| 类型 | 文件数 | 代码行数 |
|------|---------|---------|
| TypeScript 配置 | 3 | ~50 行 |
| Vite 配置 | 2 | ~80 行 |
| 主进程文件 | 4 | ~20 行 |
| 渲染进程文件 | 8 | ~40 行 |
| 预加载脚本 | 1 | ~30 行 |
| **总计** | **18** | **~220 行** |

### 时间估算
| 阶段 | 预计时间 |
|------|---------|
| TypeScript 配置 | 30 分钟 |
| Vite 配置 | 30 分钟 |
| 主进程修复 | 1 小时 |
| 渲染进程修复 | 1 小时 |
| 预加载脚本修复 | 30 分钟 |
| 验证和测试 | 1 小时 |
| **总计** | **约 4 小时** |

---

## 🚨 风险评估

### 高风险
1. **路径解析失败**
   - 影响: 所有代码无法编译
   - 缓解: 逐步验证，先运行 typecheck

2. **测试失败**
   - 影响: 验收不通过
   - 缓解: 运行所有测试套件

### 中风险
1. **IDE 索引失败**
   - 影响: 开发体验下降
   - 缓解: 重启 IDE，清理缓存

2. **构建失败**
   - 影响: 无法打包应用
   - 缓解: 逐步验证构建

---

## 📚 参考资料

- [TypeScript Path Mapping](https://www.typescriptlang.org/docs/handbook/module-resolution#path-mapping)
- [Vite Path Alias](https://vitejs.dev/config/shared-options.html#resolve-alias)
- [Electron TypeScript Config](https://www.electronjs.org/docs/latest/tutorial/typescript)

---

**文档状态**: 🟡 待实施
**最后更新**: 2026-01-12
**审核人**: 待定
