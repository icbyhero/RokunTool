# enhance-rime-recipe-market Design

## Overview

本文档描述了 Rime 配方市场功能增强的技术设计,包括配方数据结构、分类系统、互斥逻辑、配置备份系统和用户界面设计。

## Architecture

### 系统组件

```
┌─────────────────────────────────────────────────┐
│          Frontend (React + TypeScript)          │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ PlumRecipe  │  │  Installed  │  │ Rime    │ │
│  │  Manager    │  │  Recipes    │  │ Config  │ │
│  └──────┬──────┘  └──────┬──────┘  └────┬────┘ │
│         │                │               │       │
│         └────────────────┴───────────────┘       │
│                    ↓                              │
│          IPC Communication                       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│        Backend (Node.js Plugin)                 │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │     RimeConfigPlugin                     │   │
│  │  ┌─────────────────────────────────┐    │   │
│  │  │ PLUM_RECIPES (配方定义)          │    │   │
│  │  │ RECIPE_CATEGORIES (分类定义)     │    │   │
│  │  └─────────────────────────────────┘    │   │
│  │                                          │   │
│  │  Methods:                                │   │
│  │  - getRecipes()                          │   │
│  │  - installRecipe()                       │   │
│  │  - updateRecipe()                        │   │
│  │  - uninstallRecipe()                     │   │
│  │  - checkExclusiveConflicts() [NEW]       │   │
│  │  - detectInstalledRecipes() [ENHANCED]   │   │
│  │  - backupBeforeUpdate() [NEW]            │   │
│  │  - getBackupList() [NEW]                 │   │
│  │  - restoreBackup() [NEW]                 │   │
│  │  - cleanupOldBackups() [NEW]             │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│           Backup Storage                        │
├─────────────────────────────────────────────────┤
│  ${RIME_DIR}/backups/                           │
│    ├── backup-2026-01-13-10-30-00/             │
│    ├── backup-2026-01-12-15-20-00/             │
│    └── backup-permanent-2026-01-01/ [长期]     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│           External Tools                        │
├─────────────────────────────────────────────────┤
│  - rime-install (Plum)                          │
│  - rime_deployer                                │
└─────────────────────────────────────────────────┘
```

## Data Structures

### Recipe Object

```typescript
interface Recipe {
  // 基础信息
  id: string                  // 唯一标识,如 'rime_ice', 'luna_pinyin'
  name: string                // 显示名称,如 '雾凇拼音', '朙月拼音'
  description: string         // 描述信息
  recipe: string             // Plum 配方标识,如 'iDvel/rime-ice:others/recipes/full'

  // 分类
  category: RecipeCategory   // 配方分类

  // 文件冲突检测
  files: string[]            // 此配方会创建/修改的文件列表

  // 状态
  installed: boolean         // 是否已安装

  // 元数据(未来扩展)
  version?: string           // 配方版本
  size?: string             // 配方大小
  dependencies?: string[]    // 依赖的其他配方
}

type RecipeCategory =
  | 'basic'         // 基础配置
  | 'vocabulary'    // 词库配方
  | 'input_method'  // 拼音输入
  | 'double_pinyin' // 双拼方案
  | 'dialect'       // 方言输入
  | 'stroke'        // 笔画输入
  | 'symbol'        // 符号输入
  | 'tool'          // 工具类
```

### Category Definition

```typescript
interface RecipeCategoryInfo {
  name: string              // 分类名称
  description: string       // 分类描述
  icon: string             // 图标名称
  exclusive?: boolean      // 是否为互斥分类
}

const RECIPE_CATEGORIES: Record<RecipeCategory, RecipeCategoryInfo>
```

## Core Logic

### 1. 文件冲突检测与自动卸载

每个配方定义它会创建/修改的文件列表。当安装新配方时,系统检测哪些已安装的配方会生成冲突文件,并自动卸载这些配方。

```javascript
/**
 * 检测配方冲突(基于文件列表)
 * @param {string} recipeId - 要安装的配方ID
 * @returns {Object} 冲突信息
 */
async checkFileConflicts(recipeId) {
  const recipe = this.recipes.find(r => r.id === recipeId)

  // 获取新配方的文件列表
  const newRecipeFiles = recipe.files || []

  // 查找已安装的配方中,哪些会生成相同的文件
  const conflictingRecipes = []

  for (const installedRecipe of this.recipes.filter(r => r.installed)) {
    if (installedRecipe.id === recipeId) continue

    // 检查文件列表是否有交集
    const fileOverlap = this.findFileOverlap(newRecipeFiles, installedRecipe.files || [])

    if (fileOverlap.length > 0) {
      conflictingRecipes.push({
        recipeId: installedRecipe.id,
        recipeName: installedRecipe.name,
        conflictingFiles: fileOverlap
      })
    }
  }

  return {
    hasConflict: conflictingRecipes.length > 0,
    conflictingRecipes: conflictingRecipes,
    allConflictingFiles: conflictingRecipes.flatMap(r => r.conflictingFiles)
  }
}

/**
 * 查找两个文件列表的交集
 */
findFileOverlap(files1, files2) {
  return files1.filter(file => files2.includes(file))
}

/**
 * 配方文件列表定义示例
 */
const PLUM_RECIPES = [
  {
    id: 'rime_ice',
    name: '雾凇拼音',
    recipe: 'iDvel/rime-ice:others/recipes/full',
    category: 'vocabulary',
    // 定义此配方会创建/修改的文件
    files: [
      'rime_ice.dict.yaml',
      'rime_ice.schema.yaml',
      'default.custom.yaml',
      'symbols.yaml'
    ]
  },
  {
    id: 'essay',
    name: '八股文词汇表',
    recipe: 'lotem/rime-essay:master',
    category: 'vocabulary',
    files: [
      'essay.dict.yaml',
      'essay.schema.yaml',
      'default.custom.yaml'  // 与 rime_ice 冲突
    ]
  },
  // ... 更多配方
]
```

### 2. 安装配方流程 (自动卸载冲突配方)

```javascript
async installRecipe(recipeString) {
  const recipe = this.recipes.find(r => r.recipe === recipeString)

  // 1. 检测文件冲突(查找会生成相同文件的已安装配方)
  const conflictCheck = await this.checkFileConflicts(recipe.id)

  if (conflictCheck.hasConflict) {
    // 记录冲突信息
    const conflictNames = conflictCheck.conflictingRecipes
      .map(r => r.recipeName)
      .join('、')

    this.context.logger.warn(
      `检测到 ${conflictCheck.conflictingRecipes.length} 个冲突配方: ${conflictNames}` +
      `\n冲突文件: ${conflictCheck.allConflictingFiles.join(', ')}`
    )

    // 自动卸载冲突的配方
    for (const conflictRecipe of conflictCheck.conflictingRecipes) {
      this.context.logger.info(
        `正在卸载冲突配方: ${conflictRecipe.recipeName} ` +
        `(冲突文件: ${conflictRecipe.conflictingFiles.join(', ')})`
      )

      // 只删除标记文件,不删除其他配方文件
      // (文件会被新配方自然覆盖)
      await this.unmarkRecipeInstalled(conflictRecipe.recipeId)

      this.context.logger.info(`已卸载配方: ${conflictRecipe.recipeName}`)
    }
  }

  // 2. 安装前自动备份
  await this.createBackup(
    `安装前备份 - ${recipe.name}` +
    (conflictCheck.hasConflict ?
      ` (已卸载 ${conflictCheck.conflictingRecipes.length} 个冲突配方)` : ''),
    false
  )

  // 3. 执行安装
  this.context.api.progress.start(`安装配方 - ${recipe.name}`, totalSteps)

  try {
    // 调用 rime-install 安装配方
    await this.context.api.process.exec(`rime-install ${recipeString}`)

    // 4. 创建配方安装标记文件
    await this.markRecipeInstalled(recipe.id)

    // 5. 更新配方状态(重新检测所有配方)
    await this.checkInstalledRecipes()

    // 6. 重新部署 Rime
    await this.deployRime()

    this.context.logger.info(`配方 ${recipe.name} 安装成功`)

    return {
      success: true,
      message: `配方 ${recipe.name} 安装成功`,
      uninstalledRecipes: conflictCheck.conflictingRecipes.map(r => r.recipeId)
    }
  } catch (error) {
    this.context.logger.error(`配方安装失败: ${error.message}`)
    throw new Error(`安装配方失败: ${error.message}`)
  }
}
```

### 3. 配方检测逻辑 (混合方案)

```javascript
/**
 * 检查配方安装状态 - 混合检测方案
 * 优先使用标记文件,回退到特征文件检测
 */
async checkInstalledRecipes() {
  const files = await readdir(this.rimeDir)

  // 检查每个配方是否已安装
  for (const recipe of this.recipes) {
    recipe.installed = await this.isRecipeInstalled(recipe.id, files)
  }
}

/**
 * 检测配方是否已安装 (标记 + 文件混合检测)
 * @param {string} recipeId - 配方ID
 * @param {string[]} files - Rime目录文件列表 (可选,用于回退检测)
 * @returns {Promise<boolean>}
 */
async isRecipeInstalled(recipeId, files = null) {
  // 方法1: 优先检查标记文件 (最准确)
  const markerFile = join(this.rimeDir, `.recipe-${recipeId}.installed`)
  try {
    await access(markerFile)
    return true
  } catch {
    // 标记文件不存在,尝试方法2
  }

  // 方法2: 回退到特征文件检测 (兼容手动安装)
  if (!files) {
    files = await readdir(this.rimeDir)
  }

  return this.detectByCharacteristicFiles(recipeId, files)
}

/**
 * 基于特征文件的配方检测 (回退方案)
 * 用于检测手动安装的配方(无标记文件)
 */
detectByCharacteristicFiles(recipeId, files) {
  const detectionRules = {
    'rime_ice': () => files.includes('rime_ice.dict.yaml'),
    'essay': () => files.includes('essay.dict.yaml'),
    'octagram': () => files.includes('octagram.dict.yaml'),
    'prelude': () => files.includes('default.custom.yaml'),
    'opencc': () => files.includes('t2s.json') || files.includes('s2t.json'),
    'luna_pinyin': () => files.includes('luna_pinyin.schema.yaml'),
    'terra_pinyin': () => files.includes('terra_pinyin.schema.yaml'),
    'double_pinyin': () => files.includes('double_pinyin.schema.yaml'),
    'combo_pinyin': () => files.includes('combo_pinyin.schema.yaml'),
    'stroke': () => files.includes('stroke.schema.yaml'),
    'wubi': () => files.includes('wubi86.schema.yaml') || files.includes('wubi.schema.yaml'),
    'wubi98': () => files.includes('wubi98.schema.yaml'),
    'cangjie': () => files.includes('cangjie.schema.yaml'),
    'quick': () => files.includes('quick.schema.yaml'),
    'sancang': () => files.includes('sancang.schema.yaml'),
    'zhengma': () => files.includes('zhengma.schema.yaml'),
    'jyutping': () => files.includes('jyutping.schema.yaml'),
    'wugniu': () => files.includes('wugniu.schema.yaml'),
    'emoji': () => files.includes('emoji.schema.yaml'),
    'ipa': () => files.includes('ipa.schema.yaml') || files.includes('ipa_x-sampa.schema.yaml'),
  }

  const detector = detectionRules[recipeId]
  return detector ? detector() : false
}

/**
 * 创建配方安装标记文件
 * @param {string} recipeId - 配方ID
 */
async markRecipeInstalled(recipeId) {
  const markerFile = join(this.rimeDir, `.recipe-${recipeId}.installed`)
  const installData = {
    recipeId: recipeId,
    installedAt: new Date().toISOString(),
    version: '1.0'
  }
  await writeFile(markerFile, JSON.stringify(installData, null, 2))
  this.context.logger.info(`已创建配方标记: ${recipeId}`)
}

/**
 * 移除配方安装标记文件
 * @param {string} recipeId - 配方ID
 */
async unmarkRecipeInstalled(recipeId) {
  const markerFile = join(this.rimeDir, `.recipe-${recipeId}.installed`)
  try {
    await unlink(markerFile)
    this.context.logger.info(`已移除配方标记: ${recipeId}`)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      this.context.logger.warn(`移除标记文件失败: ${error.message}`)
    }
  }
}
```

**混合检测方案的优势:**

1. **准确性**: 标记文件明确记录通过插件安装的配方
2. **兼容性**: 特征文件检测支持手动安装的配方(无标记文件)
3. **可靠性**: 两种方法结合,提供更全面的检测覆盖
4. **灵活性**: 即使标记文件丢失,仍可通过特征文件检测

### 4. 配置备份系统

```javascript
/**
 * 备份配置数据结构
 */
interface BackupInfo {
  id: string              // 备份ID (时间戳)
  name: string            // 备份名称
  timestamp: number       // 创建时间 (Unix timestamp)
  path: string           // 备份目录路径
  size: number           // 备份大小 (bytes)
  isPermanent: boolean   // 是否为长期备份
  description?: string   // 备份描述
}

interface BackupConfig {
  maxBackups: number           // 最大备份数量 (10)
  maxAge: number               // 最大保留时间 (90天)
  backupDir: string            // 备份目录路径
}

/**
 * 创建配置备份
 * @param {string} description - 备份描述
 * @param {boolean} isPermanent - 是否为长期备份
 */
async createBackup(description, isPermanent = false) {
  const timestamp = new Date()
  const backupId = isPermanent
    ? `backup-permanent-${timestamp.getTime()}`
    : `backup-${formatTimestamp(timestamp)}`

  const backupPath = join(this.backupDir, backupId)

  // 1. 创建备份目录
  await mkdir(backupPath, { recursive: true })

  // 2. 复制配置文件到备份目录
  const configFiles = await readdir(this.rimeDir)
  for (const file of configFiles) {
    if (file === 'backups') continue // 跳过备份目录本身

    const srcPath = join(this.rimeDir, file)
    const destPath = join(backupPath, file)

    const stats = await stat(srcPath)
    if (stats.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await copyFile(srcPath, destPath)
    }
  }

  // 3. 创建备份元数据
  const metadata = {
    id: backupId,
    name: description || '自动备份',
    timestamp: timestamp.getTime(),
    path: backupPath,
    size: await getDirectorySize(backupPath),
    isPermanent: isPermanent,
    description: description
  }

  await writeFile(
    join(backupPath, 'backup-metadata.json'),
    JSON.stringify(metadata, null, 2)
  )

  // 4. 清理旧备份
  await this.cleanupOldBackups()

  return metadata
}

/**
 * 清理旧备份
 */
async cleanupOldBackups() {
  const backups = await this.getBackupList()
  const now = Date.now()
  const maxAge = 90 * 24 * 60 * 60 * 1000 // 90天
  const maxBackups = 10

  // 1. 删除过期的非长期备份
  for (const backup of backups) {
    if (!backup.isPermanent) {
      const age = now - backup.timestamp
      if (age > maxAge) {
        await this.deleteBackup(backup.id)
      }
    }
  }

  // 2. 如果备份数超过限制,删除最旧的非长期备份
  const regularBackups = backups.filter(b => !b.isPermanent)
  if (regularBackups.length > maxBackups) {
    const toDelete = regularBackups
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, regularBackups.length - maxBackups)

    for (const backup of toDelete) {
      await this.deleteBackup(backup.id)
    }
  }
}

/**
 * 恢复备份
 * @param {string} backupId - 备份ID
 */
async restoreBackup(backupId) {
  const backup = await this.getBackup(backupId)
  if (!backup) {
    throw new Error('备份不存在')
  }

  // 1. 创建当前配置的备份 (安全措施)
  await this.createBackup('恢复前自动备份', false)

  // 2. 清空当前配置目录
  const files = await readdir(this.rimeDir)
  for (const file of files) {
    if (file === 'backups') continue
    await remove(join(this.rimeDir, file))
  }

  // 3. 恢复备份文件
  const backupFiles = await readdir(backup.path)
  for (const file of backupFiles) {
    if (file === 'backup-metadata.json') continue

    const srcPath = join(backup.path, file)
    const destPath = join(this.rimeDir, file)

    if ((await stat(srcPath)).isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await copyFile(srcPath, destPath)
    }
  }

  // 4. 重新部署 Rime
  await this.deployRime()

  this.context.logger.info(`配置已从备份恢复: ${backup.name}`)
}

/**
 * 格式化时间戳
 */
function formatTimestamp(date) {
  const pad = (n) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
}
```

### 5. 安装前自动备份

修改现有的 `installRecipe()` 方法,在安装前自动备份:

```javascript
async installRecipe(recipeString) {
  const recipe = this.recipes.find(r => r.recipe === recipeString)

  // 1. 安装前自动备份
  await this.createBackup(`安装前备份 - ${recipe.name}`, false)

  // 2. 检查互斥冲突
  const conflictCheck = this.checkExclusiveConflicts(recipe.id)

  if (conflictCheck.hasConflict) {
    // 自动卸载冲突的配方
    for (const conflictId of conflictCheck.conflictingRecipes) {
      await this.uninstallRecipeById(conflictId, false)
    }
  }

  // 3. 执行安装
  // ... 现有安装逻辑 ...
}
```

## User Interface Design

### 1. 分类标签页布局

```
┌─────────────────────────────────────────────────┐
│  Rime 配方市场                                   │
├─────────────────────────────────────────────────┤
│  [全部] [基础] [词库] [拼音] [双拼] [方言]      │
│  [笔画] [符号] [工具]                            │
├─────────────────────────────────────────────────┤
│  🔍 [搜索框...]                                 │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │ 📘 雾凇拼音                    [安装]    │   │
│  │    一个针对现代汉语拼音输入法优化的词库   │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ 📗 八股文词汇表                [安装]    │   │
│  │    古汉语、成语、俗语等传统文化词汇      │   │
│  └─────────────────────────────────────────┘   │
│  ...                                          │
└─────────────────────────────────────────────────┘
```

### 2. 配方卡片设计

```
┌────────────────────────────────────────────┐
│ [图标] 雾凇拼音                   已安装 ✓ │
│        针对现代汉语拼音优化               │
│                                            │
│ 分类: 词库配方                             │
│ 大小: 15.2 MB                              │
│ 描述: 包含大量现代汉语词汇,支持简拼、     │
│       整句输入等高级功能                   │
│                                            │
│ [更新] [卸载] [详情]                       │
└────────────────────────────────────────────┘
```

### 3. 互斥提示对话框

```
┌────────────────────────────────────────────┐
│  ⚠️  配方冲突                              │
├────────────────────────────────────────────┤
│                                            │
│  "雾凇拼音" 与以下已安装的词库冲突:       │
│                                            │
│  • 八股文词汇表                            │
│                                            │
│  同一时间只能安装一种词库配方。            │
│  是否继续安装?(将自动卸载冲突的配方)       │
│                                            │
│  [取消]               [继续安装]           │
└────────────────────────────────────────────┘
```

### 4. 备份管理界面

```
┌─────────────────────────────────────────────────┐
│  配置备份                                       │
├─────────────────────────────────────────────────┤
│  [+ 创建备份]  [+ 清理旧备份]                   │
├─────────────────────────────────────────────────┤
│  📦 backup-2026-01-13-10-30-00  [15.2 MB]      │
│     创建于: 2026-01-13 10:30:00                │
│     描述: 安装前备份 - 雾凇拼音                  │
│     [恢复] [删除] [设为长期]                    │
├─────────────────────────────────────────────────┤
│  📦 backup-2026-01-12-15-20-00  [14.8 MB]      │
│     创建于: 2026-01-12 15:20:00                │
│     描述: 安装前备份 - 朙月拼音                  │
│     [恢复] [删除] [设为长期]                    │
├─────────────────────────────────────────────────┤
│  ⭐ backup-permanent-2026-01-01  [16.0 MB]     │
│     创建于: 2026-01-01 00:00:00                │
│     描述: 初始配置 (长期保存)                    │
│     [恢复] [取消长期]                           │
└─────────────────────────────────────────────────┘
```

## Error Handling

### 1. 网络错误

```javascript
try {
  await this.context.api.process.exec(`rime-install ${recipeString}`)
} catch (error) {
  if (error.message.includes('network')) {
    throw new Error('网络连接失败,请检查网络设置')
  }
  throw error
}
```

### 2. 权限错误

```javascript
if (!hasPermission) {
  throw new Error('未授予文件写入权限,无法安装配方')
}
```

### 3. 冲突错误

```javascript
if (conflictCheck.hasConflict) {
  const names = conflictCheck.conflictingRecipes.map(id =>
    this.recipes.find(r => r.id === id).name
  ).join('、')

  throw new Error(`与已安装的词库冲突: ${names}`)
}
```

## Performance Considerations

### 1. 配方列表缓存

```javascript
// 缓存配方列表,避免频繁调用
async getRecipes() {
  if (this.cachedRecipes && !this.cacheExpired) {
    return { success: true, data: { recipes: this.cachedRecipes } }
  }

  await this.loadRecipes()
  this.cacheTimestamp = Date.now()

  return { success: true, data: { recipes: this.recipes } }
}
```

### 2. 延迟加载

```javascript
// 前端: 虚拟滚动,只渲染可见配方
const RecipeList = ({ recipes }) => {
  return (
    <VirtualizedList
      items={recipes}
      itemHeight={120}
      renderItem={(recipe) => <RecipeCard recipe={recipe} />}
    />
  )
}
```

### 3. 后台操作

```javascript
// 所有耗时操作在后台执行
async installRecipe(recipeString) {
  // 使用进度反馈 API
  this.context.api.progress.start(...)

  // 异步执行,不阻塞 UI
  await this.context.api.process.exec(...)
}
```

## Testing Strategy

### 单元测试

1. 测试配方互斥检查逻辑
2. 测试配方检测逻辑
3. 测试配方安装/卸载流程

### 集成测试

1. 测试完整的配方安装流程
2. 测试冲突检测和处理
3. 测试 UI 交互

### 手动测试清单

- [ ] 安装基础配置配方
- [ ] 安装词库配方,检查是否自动卸载旧词库
- [ ] 安装多个输入方案配方
- [ ] 搜索配方功能
- [ ] 分类筛选功能
- [ ] 配方更新功能
- [ ] 配方卸载功能
- [ ] 错误处理(网络、权限、冲突)

## Future Enhancements

1. **配方版本管理**
   - 检测配方更新
   - 显示版本差异
   - 支持回滚

2. **配方依赖管理**
   - 自动安装依赖
   - 显示依赖树
   - 解决依赖冲突

3. **配方预览**
   - 显示配方文件列表
   - 预览配置内容
   - 查看词库统计

4. **自定义配方**
   - 用户创建配方
   - 导出配方配置
   - 分享配方

## Migration Path

### 阶段1: 核心功能 (当前)
- ✅ 扩展配方列表
- ✅ 实现分类系统
- ✅ 实现互斥逻辑
- ✅ 改进 UI

### 阶段2: 增强功能
- 配方版本管理
- 依赖检查
- 详细信息显示

### 阶段3: 高级功能
- 自定义配方
- 配方分享
- 社区功能
