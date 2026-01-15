# 目录结构迁移问题修复方案

**提案日期**: 2026-01-12
**提案类型**: Bug 修复
**优先级**: P0 - 紧急

---

## 📋 问题概述

由于项目目录结构从单目录（`src/`）迁移到多目录（`src/main/`, `src/preload/`, `src/renderer/`, `src/shared/`），导致大量导入路径失效，需要系统性修复。

---

## 🗂️ 当前目录结构

```
rokun-tool/
├── src/
│   ├── main/              # 主进程代码
│   │   ├── ipc/
│   │   ├── permissions/
│   │   ├── plugins/
│   │   ├── services/
│   │   └── index.ts
│   ├── preload/            # 预加载脚本
│   │   ├── index.ts
│   │   └── ipc.ts
│   ├── renderer/           # 渲染进程代码
│   │   └── src/
│   │       ├── __tests__/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── store/
│   │       ├── utils/
│   │       ├── App.tsx
│   │       └── main.tsx
│   └── shared/             # 共享类型定义
│       └── types/
│           ├── ipc.ts
│           └── plugin.ts
├── docs/
├── plugins/
└── resources/
```

---

## 🔍 问题分析

### 问题 1：渲染进程导入路径错误

**严重程度**: 🔴 严重

**影响文件**: 
- `src/renderer/src/components/pages/PluginDetail.tsx`
- `src/renderer/src/components/pages/WeChatMultiInstance.tsx`
- `src/renderer/src/components/pages/RimeConfig.tsx`
- `src/renderer/src/components/plugin/PluginContainer.tsx`
- `src/renderer/src/components/plugin/PluginRouter.tsx`
- `src/renderer/src/store/pluginStore.ts`
- `src/renderer/src/utils/plugin-helpers.ts`
- `src/renderer/src/__tests__/plugin-helpers.test.ts`

**问题**：
```typescript
// ❌ 错误路径
import type { PluginMetadata } from '../../../shared/types/plugin'
```

**实际路径**：
```
src/renderer/src/utils/plugin-helpers.ts
   → ../../../shared/types/plugin
   → src/shared/types/plugin.ts ✅ 正确
```

**分析**: 这些路径实际上看起来是正确的，但 TypeScript 可能无法正确解析。

---

### 问题 2：主进程导入路径错误

**严重程度**: 🔴 严重

**影响文件**:
- `src/main/plugins/loader.ts`
- `src/main/plugins/registry.ts`
- `src/main/ipc/handlers.ts`
- `src/main/ipc/index.ts`

**问题**：
```typescript
// ❌ 错误路径
import type { PluginInstance } from '../../shared/types/plugin'
```

**实际路径**：
```
src/main/plugins/loader.ts
   → ../../shared/types/plugin
   → src/shared/types/plugin.ts ✅ 正确
```

**分析**: 这些路径实际上看起来是正确的，但 TypeScript 可能无法正确解析。

---

### 问题 3：TypeScript 配置问题

**严重程度**: 🟡 中等

**问题文件**:
- `tsconfig.json`
- `tsconfig.node.json`
- `tsconfig.web.json`

**当前配置**:
```json
// tsconfig.json
{
  "files": [],
  "references": [{ "path": "./tsconfig.node.json" }, { "path": "./tsconfig.web.json" }]
}

// tsconfig.node.json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.node.json",
  "include": ["electron.vite.config.*", "src/main/**/*", "src/preload/**/*", "src/shared/**/*"],
  "compilerOptions": {
    "composite": true,
    "types": ["electron-vite/node"]
  }
}
```

**问题**:
1. `tsconfig.node.json` 的 `include` 没有包含 `src/renderer/**/*`
2. 缺少路径别名配置
3. TypeScript 可能无法正确解析跨目录导入

---

### 问题 4：Vite 配置问题

**严重程度**: 🟡 中等

**问题文件**: `src/renderer/vitest.config.ts`

**当前配置**:
```typescript
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, './src/renderer'),
  test: {
    setupFiles: ['./src/setupTests.ts'],
    include: ['**/*.{test,spec}.{js,ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer/src'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  }
})
```

**问题**:
1. 路径别名 `@` 和 `@shared` 没有在代码中使用
2. 代码中仍然使用相对路径导入
3. 路径解析可能不一致

---

## 🔧 修复方案

### 方案 A：修复 TypeScript 配置（推荐）

**优点**:
- 不需要修改代码
- 配置统一管理
- 易于维护

**步骤**:

1. **更新 `tsconfig.json`**:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@main/*": ["src/main/*"],
      "@preload/*": ["src/preload/*"],
      "@renderer/*": ["src/renderer/src/*"]
    }
  }
}
```

2. **更新 `tsconfig.node.json`**:
```json
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
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@main/*": ["src/main/*"],
      "@preload/*": ["src/preload/*"]
    }
  }
}
```

3. **更新 `tsconfig.web.json`**:
```json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.web.json",
  "include": [
    "src/renderer/**/*",
    "src/shared/**/*"
  ],
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@renderer/*": ["src/renderer/src/*"]
    }
  }
}
```

4. **更新 `electron.vite.config.ts`**:
```typescript
export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@main': path.resolve(__dirname, 'src/main')
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@preload': path.resolve(__dirname, 'src/preload')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@renderer': path.resolve(__dirname, 'src/renderer/src')
      }
    }
  }
})
```

---

### 方案 B：统一使用路径别名（长期方案）

**优点**:
- 代码更清晰
- 路径更易维护
- 减少相对路径混乱

**步骤**:

1. **创建路径别名规则**:
```typescript
// 主进程使用
import type { PluginMetadata } from '@shared/types/plugin'

// 渲染进程使用
import type { PluginMetadata } from '@shared/types/plugin'

// 同级目录使用
import { usePluginStore } from '@renderer/store/pluginStore'
import { Button } from '@renderer/ui/Button'
```

2. **需要修改的文件列表**:

#### 主进程文件 (4 个):
- `src/main/plugins/loader.ts`
- `src/main/plugins/registry.ts`
- `src/main/ipc/handlers.ts`
- `src/main/ipc/index.ts`

**修改前**:
```typescript
import type { PluginInstance } from '../../shared/types/plugin'
```

**修改后**:
```typescript
import type { PluginInstance } from '@shared/types/plugin'
```

#### 渲染进程文件 (4 个):
- `src/renderer/src/components/pages/PluginDetail.tsx`
- `src/renderer/src/store/pluginStore.ts`
- `src/renderer/src/utils/plugin-helpers.ts`
- `src/renderer/src/components/plugin/PluginRouter.tsx`
- `src/renderer/src/__tests__/plugin-helpers.test.ts`

**修改前**:
```typescript
import type { PluginMetadata } from '../../../shared/types/plugin'
```

**修改后**:
```typescript
import type { PluginMetadata } from '@shared/types/plugin'
```

#### 预加载脚本文件 (1 个):
- `src/preload/ipc.ts`

**修改前**:
```typescript
import type { PluginListRequest } from '../shared/types/ipc'
```

**修改后**:
```typescript
import type { PluginListRequest } from '@shared/types/ipc'
```

---

### 方案 C：验证和测试

**步骤**:

1. **运行类型检查**:
```bash
pnpm typecheck
```

2. **运行测试**:
```bash
pnpm test
```

3. **运行开发服务器**:
```bash
pnpm dev
```

4. **验证导入**:
   - 检查编译日志是否有错误
   - 检查 IDE 中是否有红线错误
   - 检查应用是否正常启动

---

## 📝 实施计划

### Phase 1: TypeScript 配置修复（30 分钟）

1. ✅ 更新 `tsconfig.json`
2. ✅ 更新 `tsconfig.node.json`
3. ✅ 更新 `tsconfig.web.json`
4. ✅ 更新 `electron.vite.config.ts`
5. ✅ 更新 `src/renderer/vitest.config.ts`

### Phase 2: 主进程导入修复（1 小时）

1. ✅ 修复 `src/main/plugins/loader.ts`
2. ✅ 修复 `src/main/plugins/registry.ts`
3. ✅ 修复 `src/main/ipc/handlers.ts`
4. ✅ 修复 `src/main/ipc/index.ts`

### Phase 3: 渲染进程导入修复（1 小时）

1. ✅ 修复 `src/renderer/src/components/pages/PluginDetail.tsx`
2. ✅ 修复 `src/renderer/src/components/pages/WeChatMultiInstance.tsx`
3. ✅ 修复 `src/renderer/src/components/pages/RimeConfig.tsx`
4. ✅ 修复 `src/renderer/src/components/plugin/PluginContainer.tsx`
5. ✅ 修复 `src/renderer/src/components/plugin/PluginRouter.tsx`
6. ✅ 修复 `src/renderer/src/store/pluginStore.ts`
7. ✅ 修复 `src/renderer/src/utils/plugin-helpers.ts`
8. ✅ 修复 `src/renderer/src/__tests__/plugin-helpers.test.ts`

### Phase 4: 预加载脚本导入修复（30 分钟）

1. ✅ 修复 `src/preload/ipc.ts`

### Phase 5: 验证和测试（1 小时）

1. ✅ 运行 `pnpm typecheck`
2. ✅ 运行 `pnpm test`
3. ✅ 运行 `pnpm dev`
4. ✅ 验证应用正常启动

**总预计时间**: 约 4 小时

---

## 🎯 优先级

### P0 - 紧急（立即修复）

1. **TypeScript 配置修复**
   - 影响: 所有导入路径都无法正确解析
   - 阻塞: 开发、测试、构建
   - 时间: 30 分钟

### P1 - 高优先级（今天修复）

1. **主进程导入修复**
   - 影响: 主进程无法编译
   - 阻塞: 应用启动
   - 时间: 1 小时

2. **渲染进程导入修复**
   - 影响: 渲染进程无法编译
   - 阻塞: UI 渲染
   - 时间: 1 小时

### P2 - 中优先级（本周修复）

1. **统一使用路径别名**
   - 影响: 代码可维护性
   - 时间: 2 小时

---

## 📊 影响评估

### 代码影响
- **主进程文件**: 4 个
- **渲染进程文件**: 8 个
- **预加载脚本文件**: 1 个
- **配置文件**: 5 个
- **总计**: 18 个文件

### 功能影响
- **开发**: 🔴 阻塞
- **测试**: 🔴 阻塞
- **构建**: 🔴 阻塞
- **生产环境**: 🟡 风险

### 用户影响
- **开发体验**: 🔴 严重影响
- **应用功能**: 🟡 部分影响
- **维护成本**: 🟢 降低（修复后）

---

## 📚 相关文档

- [TypeScript Path Mapping](https://www.typescriptlang.org/docs/handbook/module-resolution#path-mapping)
- [Vite Path Alias](https://vitejs.dev/config/shared-options.html#resolve-alias)
- [Electron TypeScript Config](https://www.electronjs.org/docs/latest/tutorial/typescript)

---

## ✅ 验收标准

1. ✅ `pnpm typecheck` 无错误
2. ✅ `pnpm test` 全部通过
3. ✅ `pnpm dev` 正常启动
4. ✅ `pnpm build` 成功构建
5. ✅ IDE 中无 TypeScript 错误
6. ✅ 所有导入路径正确解析

---

**提案状态**: 🟡 待审核
**预计完成时间**: 2026-01-12
**审核人**: 待定
