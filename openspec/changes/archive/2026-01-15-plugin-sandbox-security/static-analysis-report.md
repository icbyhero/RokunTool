# 插件静态安全分析报告

**生成时间**: 2025-01-15
**分析范围**: 所有已安装插件
**分析方法**: 静态代码扫描

## 执行摘要

本报告记录了在实施插件沙箱之前,对所有现有插件的安全分析结果。这是 Phase 1 实施的前置条件。

### 关键发现

- **扫描插件总数**: 3个
- **严重违规**: 2个插件
- **需要迁移**: 2个插件
- **已合规**: 1个插件 (test-plugin)

## 违规模式定义

根据 `openspec/changes/plugin-sandbox-security/design.md` 中的定义,以下模式将被沙箱禁止:

### 1. 直接 `require()` 调用 (CRITICAL)
- **模式**: `require('module-name')`
- **风险**: 绕过插件 API,直接访问 Node.js 模块
- **沙箱行为**: `require` 将在沙箱中移除
- **修复方法**: 使用插件 API 替代

### 2. `process.` 访问 (HIGH)
- **模式**: `process.env`, `process.platform` 等
- **风险**: 访问系统信息,可能泄露敏感数据
- **沙箱行为**: `process` 对象将被移除
- **修复方法**: 通过插件 API 间接访问

### 3. `eval()` 调用 (CRITICAL)
- **模式**: `eval(code)`
- **风险**: 动态代码执行,严重安全风险
- **沙箱行为**: `eval` 将被代理拦截
- **修复方法**: 移除或使用替代方案

### 4. `new Function()` 调用 (CRITICAL)
- **模式**: `new Function(args, body)`
- **风险**: 动态代码生成,严重安全风险
- **沙箱行为**: `Function` 构造器将被代理拦截
- **修复方法**: 移除或使用替代方案

---

## 插件详细分析

### 1. test-plugin (测试插件)

**状态**: ✅ **已合规** - 无需修改

**插件ID**: `test-plugin`
**主文件**: `plugins/test-plugin/index.js`
**版本**: 1.0.0

#### 违规检测

| 违规模式 | 检测结果 | 行号 | 详情 |
|---------|---------|------|------|
| `require()` | ⚠️ 轻微 | 7, 8, 54 | 仅用于基础模块 (path, os, fs) |
| `process.` | ✅ 安全 | - | 仅通过 `api.process.exec()` 使用 |
| `eval()` | ✅ 无 | - | - |
| `new Function()` | ✅ 无 | - | - |

#### 详细分析

**违规 `require()` 调用**:
```javascript
// Line 7-8
const path = require('path')
const os = require('os')

// Line 54
const fs = require('fs')
```

**风险评估**: 低
- 这些是 Node.js 基础模块
- 仅用于测试目的
- 未直接调用敏感 API (如 `fs.writeFile`, `child_process.exec`)

**修复建议**: 可选修复
- 选项 1: 移除这些 `require`,使用插件 API (推荐)
- 选项 2: 在沙箱中提供 `path` 和 `os` 模块的白名单访问

**代码示例**:
```javascript
// 当前代码 (Line 47)
const testDataDir = path.join(context.dataDir, 'test-data')

// 修复后
const testDataDir = `${context.dataDir}/test-data`
```

---

### 2. rime-config (Rime 配置管理)

**状态**: ❌ **需要迁移** - 3 个违规项

**插件ID**: `rokun-rime-config`
**主文件**: `plugins/rime-config/index.js`
**版本**: 1.0.0

#### 违规检测

| 违规模式 | 检测结果 | 行号 | 严重性 |
|---------|---------|------|--------|
| `require()` | ❌ 违规 | 8, 9 | **CRITICAL** |
| `process.` | ❌ 违规 | 12-14, 978, 1003 | **HIGH** |
| `eval()` | ✅ 无 | - | - |
| `new Function()` | ✅ 无 | - | - |

#### 详细分析

**1. 直接 `require()` 调用 (CRITICAL)**

```javascript
// Line 8-9
const { readFile, access, readdir, stat, mkdir, writeFile, unlink, cp, rm } = require('fs/promises')
const { join } = require('path')
```

**影响**: 插件绕过了插件 API,直接使用 Node.js 的文件系统模块

**修复方案**:
```javascript
// 当前代码 (Line 308)
await access(dir)

// 修复后 - 使用插件 API
const files = await context.api.fs.readDir(dir)

// 当前代码 (Line 1031)
const plistContent = await readFile(plistPath, 'utf8')

// 修复后 - 使用插件 API
const plistContent = await context.api.fs.readFile(plistPath, 'utf8')
```

**需要修改的代码位置**:
- Line 308: `await access(dir)` → 使用 `context.api.fs.stat()`
- Line 348: `await readdir(this.rimeDir)` → 使用 `context.api.fs.readDir()`
- Line 902: `await access(defaultCustomPath)` → 使用 `context.api.fs.stat()`
- Line 1031: `await readFile(plistPath, 'utf8')` → 使用 `context.api.fs.readFile()`
- Line 1110: `await readFile(join(this.rimeDir, file), 'utf-8')` → 使用 `context.api.fs.readFile()`
- Line 1128: `await readFile(join(this.rimeDir, 'default.custom.yaml'), 'utf-8')` → 使用 `context.api.fs.readFile()`
- Line 1157: `await readFile(defaultCustomPath, 'utf-8')` → 使用 `context.api.fs.readFile()`
- Line 1442: `await readFile(metadataPath, 'utf-8')` → 使用 `context.api.fs.readFile()`
- Line 1483: `await readFile(metadataPath, 'utf-8')` → 使用 `context.api.fs.readFile()`

**2. `process.` 访问 (HIGH)**

```javascript
// Line 12-14 - 用于路径拼接
const RIME_DIRS = [
  join(process.env.HOME, 'Library', 'Rime'),  // ❌ 违规
  join(process.env.HOME, '.local', 'share', 'fcitx5', 'rime'),  // ❌ 违规
  join(process.env.HOME, '.config', 'ibus', 'rime')  // ❌ 违规
]

// Line 978 - 用于平台检测
const platform = process.platform  // ❌ 违规

// Line 1003 - 用于路径拼接
join(process.env.HOME, 'Applications/Squirrel.app')  // ❌ 违规
```

**影响**:
- 访问环境变量 `process.env.HOME`
- 访问平台信息 `process.platform`

**修复方案**:
```javascript
// 当前代码 (Line 12-14)
const RIME_DIRS = [
  join(process.env.HOME, 'Library', 'Rime'),
  ...
]

// 修复后 - 方案 1: 通过插件 API 提供 HOME 路径
const RIME_DIRS = [
  `${context.env.HOME}/Library/Rime`,
  ...
]

// 修复后 - 方案 2: 简化为相对路径
const RIME_DIRS = [
  '~/Library/Rime',
  '~/.local/share/fcitx5/rime',
  '~/.config/ibus/rime'
]

// 当前代码 (Line 978)
const platform = process.platform

// 修复后 - 通过插件 API 提供
const platform = await context.api.system.getPlatform()
```

**需要修改的代码位置**:
- Line 12-14: `process.env.HOME` → 使用 `context.env.HOME` 或简化为 `~`
- Line 978: `process.platform` → 使用插件 API 提供的平台信息
- Line 1003: `process.env.HOME` → 同上

#### 优先级: **P0 (必须修复)**

---

### 3. wechat-multi-instance (微信分身)

**状态**: ✅ **已修复** - 但仍有残留违规

**插件ID**: `rokun-wechat-multi-instance`
**主文件**: `plugins/wechat-multi-instance/index.js`
**版本**: 1.0.0

#### 违规检测

| 违规模式 | 检测结果 | 行号 | 严重性 |
|---------|---------|------|--------|
| `require()` | ❌ 违规 | 7, 8, 91, 92 | **CRITICAL** |
| `process.` | ❌ 违规 | 12 | **HIGH** |
| `eval()` | ✅ 无 | - | - |
| `new Function()` | ✅ 无 | - | - |

#### 详细分析

**1. 直接 `require()` 调用 (CRITICAL)**

```javascript
// Line 7-8 - 文件顶部
const { readFile, writeFile, access, mkdir, readdir, stat } = require('fs/promises')
const { join, basename, dirname } = require('path')

// Line 91-92 - 在 saveConfig() 方法内
const { dirname } = require('path')
const { mkdir } = require('fs/promises')
```

**影响**: 插件直接使用 Node.js 的 `fs/promises` 和 `path` 模块

**修复方案**:
```javascript
// 当前代码 (Line 54)
const data = await readFile(this.configPath, 'utf-8')

// 修复后 - 使用插件 API
const data = await context.api.fs.readFile(this.configPath, 'utf-8')

// 当前代码 (Line 96)
await writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8')

// 修复后 - 使用插件 API
await context.api.fs.writeFile(this.configPath, JSON.stringify(config, null, 2))
```

**需要修改的代码位置**:
- Line 54: `await readFile(this.configPath, 'utf-8')` → `context.api.fs.readFile()`
- Line 96: `await writeFile(...)` → `context.api.fs.writeFile()`
- Line 106: `await access(WECHAT_PATH)` → `context.api.fs.stat()`
- Line 259: `await readFile(plistPath, 'utf-8')` → `context.api.fs.readFile()`
- Line 289: `await writeFile(plistPath, content, 'utf-8')` → `context.api.fs.writeFile()`
- Line 296: `await readFile(plistPath, 'utf-8')` → `context.api.fs.readFile()`
- Line 330: `await readFile(stringsPath, 'utf-8')` → `context.api.fs.readFile()`
- Line 331: `await writeFile(stringsPath, stringsContent, 'utf-8')` → `context.api.fs.writeFile()`
- Line 585: `await readFile(plistPath, 'utf-8')` → `context.api.fs.readFile()`
- Line 603: `await readdir(appsDir)` → `context.api.fs.readDir()`
- Line 666: `await readFile(plistPath, 'utf-8')` → `context.api.fs.readFile()`

**2. `process.` 访问 (HIGH)**

```javascript
// Line 12
const INSTANCES_DIR = join(process.env.HOME, 'Applications')
```

**影响**: 访问环境变量 `process.env.HOME`

**修复方案**:
```javascript
// 当前代码
const INSTANCES_DIR = join(process.env.HOME, 'Applications')

// 修复后 - 方案 1: 通过插件 API
const INSTANCES_DIR = `${context.env.HOME}/Applications`

// 修复后 - 方案 2: 简化为波浪号
const INSTANCES_DIR = '~/Applications'
```

#### 优先级: **P0 (必须修复)**

---

## 迁移优先级

根据违规严重性和影响范围,插件修复应按以下顺序进行:

### P0 - 立即修复 (实施沙箱前必须完成)

1. **rime-config** (rokun-rime-config)
   - **违规数**: 3 (2 CRITICAL + 1 HIGH)
   - **影响范围**: 20+ 处代码
   - **预估工作量**: 2-3 小时

2. **wechat-multi-instance** (rokun-wechat-multi-instance)
   - **违规数**: 3 (2 CRITICAL + 1 HIGH)
   - **影响范围**: 12+ 处代码
   - **预估工作量**: 1-2 小时

### P1 - 可选修复 (不影响核心功能)

3. **test-plugin** (test-plugin)
   - **违规数**: 1 (LOW)
   - **影响范围**: 3 处代码
   - **预估工作量**: 30 分钟
   - **说明**: 仅用于测试,可以直接移除或保留违规

---

## 修复指南

### 1. 修复 `require()` 违规

#### 原则
- 移除所有直接的 `require()` 调用
- 使用插件提供的 `context.api` 替代

#### 常见替换模式

| 原代码 | 修复后 |
|--------|--------|
| `require('fs').readFile(path)` | `context.api.fs.readFile(path)` |
| `require('fs').writeFile(path, data)` | `context.api.fs.writeFile(path, data)` |
| `require('fs').readdir(path)` | `context.api.fs.readDir(path)` |
| `require('fs').access(path)` | `context.api.fs.stat(path)` (捕获 ENOENT) |
| `require('path').join(a, b)` | `${a}/${b}` 或自定义工具函数 |
| `require('os').platform()` | `context.api.system.getPlatform()` |

#### 示例

**rime-config 插件 - Line 348**:
```javascript
// ❌ 当前代码
const files = await readdir(this.rimeDir)

// ✅ 修复后
const files = await context.api.fs.readDir(this.rimeDir)
```

**wechat-multi-instance 插件 - Line 54**:
```javascript
// ❌ 当前代码
const data = await readFile(this.configPath, 'utf-8')

// ✅ 修复后
const data = await context.api.fs.readFile(this.configPath, 'utf-8')
```

### 2. 修复 `process.` 违规

#### 原则
- 移除所有 `process.env` 和 `process.platform` 访问
- 通过插件 API 或简化的路径表示

#### 常见替换模式

| 原代码 | 修复后 |
|--------|--------|
| `process.env.HOME` | `context.env.HOME` 或 `~` |
| `process.platform` | `context.api.system.getPlatform()` |
| `process.arch` | `context.api.system.getArch()` |

#### 示例

**rime-config 插件 - Line 12-14**:
```javascript
// ❌ 当前代码
const RIME_DIRS = [
  join(process.env.HOME, 'Library', 'Rime'),
  join(process.env.HOME, '.local', 'share', 'fcitx5', 'rime'),
  join(process.env.HOME, '.config', 'ibus', 'rime')
]

// ✅ 修复后 - 方案 1: 使用 context.env
const RIME_DIRS = [
  `${context.env.HOME}/Library/Rime`,
  `${context.env.HOME}/.local/share/fcitx5/rime`,
  `${context.env.HOME}/.config/ibus/rime`
]

// ✅ 修复后 - 方案 2: 使用波浪号 (推荐)
const RIME_DIRS = [
  '~/Library/Rime',
  '~/.local/share/fcitx5/rime',
  '~/.config/ibus/rime'
]
```

**注意**: 如果使用波浪号 `~`,需要在插件加载时扩展为实际路径。

---

## 插件 API 扩展建议

为了支持插件的沙箱迁移,建议扩展以下 API:

### 1. 新增 `context.env` 对象

```typescript
interface PluginContext {
  env: {
    HOME: string
    USER: string
    PATH?: string
    [key: string]: string | undefined
  }
}
```

### 2. 新增 `context.api.system` 模块

```typescript
interface PluginAPI {
  system: {
    getPlatform(): 'darwin' | 'linux' | 'win32'
    getArch(): 'x64' | 'arm64' | 'arm' | 'ia32'
    getHomeDir(): string
    getUserInfo(): { username: string, homedir: string }
  }
}
```

### 3. 新增 `context.api.path` 工具

```typescript
interface PluginAPI {
  path: {
    join(...parts: string[]): string
    basename(path: string): string
    dirname(path: string): string
    resolve(...parts: string[]): string
  }
}
```

---

## 测试计划

### 1. 单元测试
- 测试所有修复后的 API 调用
- 验证权限请求正常工作
- 验证文件操作正常工作

### 2. 集成测试
- 在沙箱环境中加载插件
- 执行插件的主要功能
- 验证没有违规调用

### 3. 回归测试
- 确保修复后的插件功能与之前一致
- 验证用户体验没有下降

---

## 时间估算

| 插件 | 预估工作量 | 优先级 |
|------|-----------|--------|
| rime-config | 2-3 小时 | P0 |
| wechat-multi-instance | 1-2 小时 | P0 |
| test-plugin | 30 分钟 | P1 |
| **总计** | **4-6 小时** | - |

---

## 建议

### 1. 立即行动
- ✅ 完成 rime-config 插件的迁移 (P0)
- ✅ 完成 wechat-multi-instance 插件的迁移 (P0)
- ✅ 实施插件 API 扩展 (context.env, context.api.system)

### 2. 并行工作
- ⚠️ 开发插件沙箱系统 (Phase 1)
- ⚠️ 创建迁移工具 (自动检测和修复)

### 3. 后续优化
- 📋 创建插件开发最佳实践文档
- 📋 添加静态代码检查到 CI/CD
- 📋 实施插件审查流程

---

## 附录: 检测脚本

```bash
#!/bin/bash
# static-security-check.sh

echo "插件静态安全检查"
echo "================"

# 检查 require() 调用
echo "检查 require() 调用..."
grep -rn "require(" plugins/*/index.js | grep -v "node_modules"

# 检查 process. 访问
echo "检查 process. 访问..."
grep -rn "process\." plugins/*/index.js | grep -v "api.process"

# 检查 eval() 调用
echo "检查 eval() 调用..."
grep -rn "\beval(" plugins/*/index.js

# 检查 new Function() 调用
echo "检查 new Function() 调用..."
grep -rn "new Function(" plugins/*/index.js
```

---

**报告结束**

**下一步**: 根据 P0 优先级,开始修复 rime-config 和 wechat-multi-instance 插件。
