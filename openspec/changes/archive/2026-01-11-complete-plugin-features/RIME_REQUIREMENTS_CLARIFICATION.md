# Rime Plum 插件需求澄清

## 📌 原始需求

根据 `openspec/changes/add-plugin-platform/proposal.md` 第15行的说明:

> 东风破 plum
> 选择配方(others/recipes/*.recipe.yaml)来进行安装或更新。

### 核心功能

Rime插件应该集成**plum(东风破)**功能,用于管理Rime输入法的配方(recipes):

1. **配方列表展示** - 显示可用的配方
2. **配方安装** - 通过`rime-install`命令安装配方
3. **配方更新** - 更新已安装的配方
4. **配方卸载** - 卸载不需要的配方

### 配方类型

根据简易安装教程:

```bash
# 安装或更新全部文件
rime-install iDvel/rime-ice:others/recipes/full

# 安装或更新所有词库文件
rime-install iDvel/rime-ice:others/recipes/all_dicts

# 安装或更新拼音词库文件
rime-install iDvel/rime-ice:others/recipes/cn_dicts

# 安装或更新英文词库文件
rime-install iDvel/rime-ice:others/recipes/en_dicts

# 安装或更新 opencc
rime-install iDvel/rime-ice:others/recipes/opencc
```

### 重要说明

- **词库配方只更新词库文件**,不更新`rime_ice.dict.yaml`和`melt_eng.dict.yaml`
- 如果更新后部署报错,需要检查文件对应关系
- 配方文件位于: `others/recipes/*.recipe.yaml`

## ❌ 错误实现

之前 `complete-plugin-features` 变更中实现的功能是**错误的**:

1. **ConfigurationEditor** - YAML配置文件编辑器 ❌
   - 不需要手动编辑YAML配置文件
   - plum应该自动处理配置

2. **DictionaryList/DictionaryEditor** - 词库管理组件 ❌
   - 不需要手动管理词库文件
   - plum通过配方自动安装词库

3. **DiffViewer** - diff对比功能 ❌
   - 不需要配置文件版本对比
   - plum应该自动处理更新

## ✅ 正确实现

Rime插件应该实现:

### 1. Plum配方管理器

**组件**: `PlumRecipeManager.tsx`

**功能**:
- 显示可用的配方列表
- 显示已安装的配方
- 配方安装/更新按钮
- 配方卸载按钮
- 安装进度显示

**API调用**:
```typescript
// 获取配方列表
await window.electronAPI.plugin.callMethod({
  pluginId: 'rokun-rime-config',
  method: 'getRecipes',
  args: []
})

// 安装配方
await window.electronAPI.plugin.callMethod({
  pluginId: 'rokun-rime-config',
  method: 'installRecipe',
  args: [{ recipe: 'iDvel/rime-ice:others/recipes/full' }]
})

// 更新配方
await window.electronAPI.plugin.callMethod({
  pluginId: 'rokun-rime-config',
  method: 'updateRecipe',
  args: [{ recipe: 'iDvel/rime-ice:others/recipes/cn_dicts' }]
})

// 卸载配方
await window.electronAPI.plugin.callMethod({
  pluginId: 'rokun-rime-config',
  method: 'uninstallRecipe',
  args: [{ recipe: 'iDvel/rime-ice:others/recipes/en_dicts' }]
})
```

### 2. 插件后端实现

**文件**: `plugins/rime-config/index.js`

**方法**:
```javascript
// 获取配方列表
async getRecipes() {
  // 返回预定义的配方列表
  return [
    { id: 'full', name: '全部文件', recipe: 'iDvel/rime-ice:others/recipes/full', installed: false },
    { id: 'all_dicts', name: '所有词库', recipe: 'iDvel/rime-ice:others/recipes/all_dicts', installed: false },
    { id: 'cn_dicts', name: '拼音词库', recipe: 'iDvel/rime-ice:others/recipes/cn_dicts', installed: false },
    { id: 'en_dicts', name: '英文词库', recipe: 'iDvel/rime-ice:others/recipes/en_dicts', installed: false },
    { id: 'opencc', name: 'OpenCC', recipe: 'iDvel/rime-ice:others/recipes/opencc', installed: false }
  ]
}

// 安装配方
async installRecipe(recipe) {
  const { exec } = require('child_process')
  return new Promise((resolve, reject) => {
    exec(`rime-install ${recipe}`, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve({ success: true, output: stdout })
      }
    })
  })
}
```

### 3. UI界面设计

**布局**:
- 配方市场页面
  - 配方列表卡片
  - 每个配方显示:名称、描述、安装状态、操作按钮
- 配方详情页面(可选)
  - 配置说明
  - 文件列表
  - 安装历史

## 🔄 下一步行动

1. **创建新的变更提案** - `implement-rime-plum`
   - 替代错误的`complete-plugin-features`
   - 聚焦于plum配方管理

2. **清理错误的代码**:
   - 删除`ConfigurationEditor.tsx`
   - 删除`DictionaryList.tsx`
   - 删除`DictionaryEditor.tsx`
   - 删除`DiffViewer.tsx`

3. **实现正确的功能**:
   - 创建`PlumRecipeManager.tsx`
   - 更新`RimeConfig.tsx`使用配方管理器
   - 在插件中实现plum命令调用

需要我创建正确的实施计划吗?
