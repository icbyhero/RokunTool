# 插件沙箱迁移清单

**创建时间**: 2025-01-15
**目标**: 为所有插件迁移到沙箱环境做准备

---

## 迁移任务清单

### Phase 1: API 扩展 (必需)

- [ ] 1.1 扩展 `PluginContext` 接口
  - [ ] 添加 `env: { HOME, USER, PATH, ... }` 属性
  - [ ] 更新 TypeScript 类型定义
  - [ ] 更新插件上下文创建逻辑

- [ ] 1.2 新增 `context.api.system` 模块
  - [ ] 实现 `getPlatform()` 方法
  - [ ] 实现 `getArch()` 方法
  - [ ] 实现 `getHomeDir()` 方法
  - [ ] 添加权限检查 (system:read)

- [ ] 1.3 新增 `context.api.path` 工具
  - [ ] 实现 `join()` 方法
  - [ ] 实现 `basename()` 方法
  - [ ] 实现 `dirname()` 方法
  - [ ] 实现 `resolve()` 方法

### Phase 2: rime-config 插件迁移 (P0)

- [ ] 2.1 修复 `require()` 违规
  - [ ] Line 8-9: 移除 `fs/promises` 和 `path` 的 `require()`
  - [ ] Line 54: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 308: `access()` → `context.api.fs.stat()`
  - [ ] Line 348: `readdir()` → `context.api.fs.readDir()`
  - [ ] Line 902: `access()` → `context.api.fs.stat()`
  - [ ] Line 1031: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 1110: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 1128: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 1157: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 1442: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 1483: `readFile()` → `context.api.fs.readFile()`

- [ ] 2.2 修复 `process.` 违规
  - [ ] Line 12-14: `process.env.HOME` → `context.env.HOME` (3处)
  - [ ] Line 978: `process.platform` → `context.api.system.getPlatform()`
  - [ ] Line 1003: `process.env.HOME` → `context.env.HOME`

- [ ] 2.3 测试
  - [ ] 单元测试: 验证所有 API 调用
  - [ ] 集成测试: 在沙箱环境中加载插件
  - [ ] 功能测试: 测试主要功能 (安装配方, 部署, 备份等)

### Phase 3: wechat-multi-instance 插件迁移 (P0)

- [ ] 3.1 修复 `require()` 违规
  - [ ] Line 7-8: 移除 `fs/promises` 和 `path` 的 `require()`
  - [ ] Line 54: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 96: `writeFile()` → `context.api.fs.writeFile()`
  - [ ] Line 106: `access()` → `context.api.fs.stat()`
  - [ ] Line 259: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 289: `writeFile()` → `context.api.fs.writeFile()`
  - [ ] Line 296: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 330: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 331: `writeFile()` → `context.api.fs.writeFile()`
  - [ ] Line 585: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 603: `readdir()` → `context.api.fs.readDir()`
  - [ ] Line 666: `readFile()` → `context.api.fs.readFile()`
  - [ ] Line 91-92: 移除重复的 `require()` (在 saveConfig 内)

- [ ] 3.2 修复 `process.` 违规
  - [ ] Line 12: `process.env.HOME` → `context.env.HOME`

- [ ] 3.3 测试
  - [ ] 单元测试: 验证所有 API 调用
  - [ ] 集成测试: 在沙箱环境中加载插件
  - [ ] 功能测试: 测试创建分身, 删除分身, 重建分身

### Phase 4: test-plugin 插件迁移 (P1, 可选)

- [ ] 4.1 修复 `require()` 违规
  - [ ] Line 7: `require('path')` → 使用字符串拼接或 `context.api.path`
  - [ ] Line 8: `require('os')` → 移除或使用 `context.api.system`
  - [ ] Line 54: `require('fs')` → 使用 `context.api.fs`

- [ ] 4.2 测试
  - [ ] 验证测试套件仍然正常运行

### Phase 5: 验证和部署

- [ ] 5.1 静态代码检查
  - [ ] 运行检测脚本,确认无违规
  - [ ] 生成最终检查报告

- [ ] 5.2 沙箱测试
  - [ ] 在沙箱环境中加载所有插件
  - [ ] 验证插件功能正常
  - [ ] 检查性能影响

- [ ] 5.3 文档更新
  - [ ] 更新插件开发指南
  - [ ] 添加沙箱限制说明
  - [ ] 更新 API 文档

- [ ] 5.4 发布
  - [ ] 提交代码变更
  - [ ] 发布新版本
  - [ ] 通知插件开发者

---

## 详细修复说明

### rime-config 插件 - Line 12-14

**当前代码**:
```javascript
const RIME_DIRS = [
  join(process.env.HOME, 'Library', 'Rime'),
  join(process.env.HOME, '.local', 'share', 'fcitx5', 'rime'),
  join(process.env.HOME, '.config', 'ibus', 'rime')
]
```

**修复后 (推荐方案 2 - 使用波浪号)**:
```javascript
const RIME_DIRS = [
  '~/Library/Rime',
  '~/.local/share/fcitx5/rime',
  '~/.config/ibus/rime'
]
```

**注意**: 如果使用波浪号,需要在运行时扩展。可以在 `onLoad()` 中添加:
```javascript
async onLoad(context) {
  this.context = context

  // 扩展波浪号
  const home = context.env.HOME
  this.RIME_DIRS = [
    `${home}/Library/Rime`,
    `${home}/.local/share/fcitx5/rime`,
    `${home}/.config/ibus/rime`
  ]

  // ... 其余代码
}
```

### rime-config 插件 - Line 978

**当前代码**:
```javascript
const platform = process.platform
```

**修复后**:
```javascript
const platform = await context.api.system.getPlatform()
```

### wechat-multi-instance 插件 - Line 7-8

**当前代码**:
```javascript
const { readFile, writeFile, access, mkdir, readdir, stat } = require('fs/promises')
const { join, basename, dirname } = require('path')
```

**修复后**:
```javascript
// 移除这些 require,使用 context.api
// const { readFile, writeFile, access, mkdir, readdir, stat } = require('fs/promises')
// const { join, basename, dirname } = require('path')
```

**然后在代码中使用**:
```javascript
// 原代码 (Line 54)
const data = await readFile(this.configPath, 'utf-8')

// 修复后
const data = await context.api.fs.readFile(this.configPath, 'utf-8')

// 原代码 (Line 106)
await access(WECHAT_PATH)

// 修复后
try {
  await context.api.fs.stat(WECHAT_PATH)
  // 文件存在
} catch (error) {
  // 文件不存在
}

// 原代码 (Line 54) - 使用 join
const testDataDir = path.join(context.dataDir, 'test-data')

// 修复后 - 使用字符串拼接
const testDataDir = `${context.dataDir}/test-data`

// 或者使用新的 API
const testDataDir = context.api.path.join(context.dataDir, 'test-data')
```

---

## 测试检查清单

### rime-config 插件测试

- [ ] 测试 1: 检测 Rime 安装
- [ ] 测试 2: 安装 Plum 配方
- [ ] 测试 3: 更新 Plum 配方
- [ ] 测试 4: 卸载 Plum 配方
- [ ] 测试 5: 启用输入方案
- [ ] 测试 6: 禁用输入方案
- [ ] 测试 7: 创建备份
- [ ] 测试 8: 恢复备份
- [ ] 测试 9: 删除备份
- [ ] 测试 10: 部署 Rime

### wechat-multi-instance 插件测试

- [ ] 测试 1: 检查微信安装
- [ ] 测试 2: 获取微信版本
- [ ] 测试 3: 创建分身
- [ ] 测试 4: 删除分身
- [ ] 测试 5: 重建分身
- [ ] 测试 6: 批量重建分身
- [ ] 测试 7: 自动发现分身
- [ ] 测试 8: 刷新实例状态

### test-plugin 测试

- [ ] 测试 1: 文件系统 API 测试
- [ ] 测试 2: 进程管理 API 测试
- [ ] 测试 3: 配置 API 测试
- [ ] 测试 4: 权限系统测试

---

## 风险和注意事项

### 风险 1: 路径处理不一致

**问题**: 移除 `path.join()` 后,不同操作系统的路径分隔符可能不同

**缓解措施**:
- 使用 `context.api.path.join()` (推荐)
- 或使用字符串拼接时统一使用 `/` (Node.js 会自动处理)

### 风险 2: 环境变量访问

**问题**: `process.env` 可能包含其他插件需要的变量

**缓解措施**:
- 在 `context.env` 中提供常用变量 (HOME, USER, PATH)
- 允许插件通过权限请求访问特定环境变量

### 风险 3: 性能影响

**问题**: 所有文件操作都需要通过插件 API,可能有性能损失

**缓解措施**:
- 在 Phase 1 前进行性能基准测试
- 优化插件 API 的性能
- 如果性能损失过大,考虑添加缓存

### 风险 4: 兼容性

**问题**: 第三方插件可能无法及时迁移

**缓解措施**:
- 提供迁移工具和详细文档
- 在沙箱中提供"警告模式" (只记录违规,不阻止)
- 给插件开发者足够的迁移时间 (建议 2-4 周)

---

## 完成标准

迁移工作被认为完成,当且仅当:

1. ✅ 所有 P0 插件已迁移完成 (rime-config, wechat-multi-instance)
2. ✅ 静态检查无 CRITICAL 或 HIGH 违规
3. ✅ 所有插件在沙箱环境中正常工作
4. ✅ 性能测试显示加载时间增加 < 20%
5. ✅ 所有测试用例通过
6. ✅ 文档已更新

---

## 后续步骤

完成迁移后:

1. **开始 Phase 1 实施**
   - 创建 PluginSandbox 类
   - 创建 PluginValidator 类
   - 集成到 PluginLoader

2. **监控和反馈**
   - 收集插件开发者反馈
   - 修复发现的问题
   - 优化性能

3. **推广到社区**
   - 发布迁移指南
   - 提供技术支持
   - 收集社区反馈

---

**迁移清单结束**

**下一步**: 开始实施 Phase 1 - API 扩展
