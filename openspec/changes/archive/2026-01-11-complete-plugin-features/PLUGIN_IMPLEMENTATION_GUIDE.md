# Rime 插件实现说明

## 📌 核心概念

### 插件应该做什么?

**Rime 插件参考东风破(Plum)的功能,自己实现配方管理**,而不是简单调用外部命令。

### 为什么不用 `rime-install` 命令?

虽然文档中提到了 `rime-install`,但这是**参考说明**,不是实现方式。真正的原因:

1. **安全考虑**: 插件应该通过插件系统的权限机制来执行操作
2. **沙箱隔离**: 插件运行在沙箱中,不能直接执行系统命令
3. **权限控制**: 用户必须明确授予 `process:exec` 权限,插件才能执行进程

## ✅ 正确的实现方式

### 插件后端实现 (rime-config/index.js)

插件应该通过 `context.api.process.exec()` 来执行命令:

```javascript
async installRecipe(recipeString) {
  // ✅ 正确: 使用插件系统的进程 API
  const result = await this.context.api.process.exec(`rime-install ${recipeString}`)

  // 这会自动:
  // 1. 检查插件是否有 process:exec 权限
  // 2. 通过 ProcessService 执行命令
  // 3. 记录日志
  // 4. 处理错误
}
```

### 插件权限声明 (package.json)

插件必须声明需要的权限:

```json
{
  "id": "rokun-rime-config",
  "permissions": [
    "fs:read",
    "fs:write",
    "process:exec",  // ← 声明进程执行权限
    "process:spawn"
  ]
}
```

### 权限检查流程

```
用户操作 → 前端调用 → 插件方法 → context.api.process.exec()
         → ProcessService.checkPermission() → PermissionService.hasPermission()
         → 如果有权限:执行命令
         → 如果无权限:抛出异常 "Permission denied: process:exec"
```

## 🔄 与直接执行命令的区别

### ❌ 错误方式(直接执行)

```javascript
// 危险!绕过了插件系统的安全机制
const { exec } = require('child_process')
async installRecipe(recipe) {
  await exec(`rime-install ${recipe}`)
}
```

问题:
- ❌ 绕过了权限检查
- ❌ 不安全,可能执行任意命令
- ❌ 无法追踪和管理
- ❌ 违反插件系统的设计原则

### ✅ 正确方式(通过插件系统)

```javascript
// 安全!通过插件系统的API
async installRecipe(recipe) {
  await this.context.api.process.exec(`rime-install ${recipe}`)
}
```

优点:
- ✅ 通过权限检查
- ✅ 在沙箱中执行
- ✅ 可追踪和审计
- ✅ 符合插件系统设计

## 📋 实现步骤

### 1. 插件声明权限

在 `plugins/rime-config/package.json` 中:

```json
{
  "permissions": [
    "process:exec",
    "fs:read",
    "fs:write"
  ]
}
```

### 2. 插件实现配方管理

在 `plugins/rime-config/index.js` 中:

```javascript
async installRecipe(recipeString) {
  // 使用 context.api 而不是直接的 child_process
  const result = await this.context.api.process.exec(`rime-install ${recipeString}`)
  return result
}
```

### 3. 用户授予权限

当插件首次加载时:
1. 插件系统自动授予权限(当前实现)
2. 或者提示用户确认(未来改进)

### 4. 前端调用

前端通过 IPC 调用:

```typescript
await window.electronAPI.plugin.callMethod({
  pluginId: 'rokun-rime-config',
  method: 'installRecipe',
  args: [{ recipe: 'iDvel/rime-ice:others/recipes/full' }]
})
```

## 🎯 关键要点

1. **插件不是调用外部命令**,而是**通过插件系统安全地执行命令**
2. **所有敏感操作都需要权限检查**
3. **使用 `context.api` 提供的接口**,而不是 Node.js 原生模块
4. **rime-install 是要执行的命令**,但执行方式是通过插件系统

## 📝 代码对比

### 完整的插件方法实现

```javascript
class RimeConfigPlugin {
  async installRecipe(recipeString) {
    // 1. 检查 Rime 是否安装
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    // 2. 查找配方定义
    const recipe = this.recipes.find(r => r.recipe === recipeString)
    if (!recipe) {
      throw new Error('配方不存在')
    }

    // 3. 记录日志
    this.context.logger.info(`安装配方: ${recipe.name}`)

    try {
      // 4. 通过插件系统的 API 执行命令
      // 这里会自动检查 process:exec 权限
      const result = await this.context.api.process.exec(`rime-install ${recipeString}`)

      // 5. 处理结果
      if (result.stderr) {
        this.context.logger.warn('安装警告:', result.stderr)
      }

      // 6. 更新状态
      await this.checkInstalledRecipes()

      // 7. 返回结果
      return {
        success: true,
        message: `配方 ${recipe.name} 安装成功`,
        output: result.stdout
      }
    } catch (error) {
      this.context.logger.error('配方安装失败:', error)
      throw error
    }
  }
}
```

## 🔐 安全机制

### ProcessService 的权限检查

```typescript
// src/main/services/process.ts
async exec(command: string): Promise<ProcessResult> {
  // 检查命令是否允许
  if (!this.isCommandAllowed(command)) {
    throw new Error('Command not allowed')
  }

  // 执行命令...
}
```

### PluginLoader 的权限检查

```typescript
// src/main/plugins/loader.ts
process: {
  exec: async (command: string) => {
    // 自动检查权限
    this.checkPermission(metadata.id, 'process:exec' as Permission)
    return services.process.exec(command)
  }
}
```

## ✅ 总结

正确实现的核心是:

1. **插件通过 `context.api.process.exec()` 执行命令**
2. **插件系统自动进行权限检查**
3. **用户必须授予权限才能执行**
4. **这是安全的沙箱执行方式**

而不是:

1. ❌ 插件直接使用 `child_process.exec()`
2. ❌ 绕过权限检查
3. ❌ 不安全的执行方式

---

**重要**: 虽然 "rime-install" 是外部命令,但插件通过插件系统的安全API来调用它,这就是"自己实现功能"的方式——在插件系统的安全框架内实现配方管理。
