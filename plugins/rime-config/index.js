/**
 * Rime 配置管理插件
 *
 * 可视化管理 Rime 输入法配置、方案和词库
 * 集成 Plum(东风破)配方管理功能
 */

const { readFile, access, readdir, stat, mkdir } = require('fs/promises')
const { join } = require('path')

const RIME_DIRS = [
  join(process.env.HOME, 'Library', 'Rime'),
  join(process.env.HOME, '.local', 'share', 'fcitx5', 'rime'),
  join(process.env.HOME, '.config', 'ibus', 'rime')
]

// Plum 配方定义
const PLUM_RECIPES = [
  {
    id: 'full',
    name: '全部文件',
    description: '安装或更新 rime-ice 的全部文件',
    recipe: 'iDvel/rime-ice:others/recipes/full',
    installed: false
  },
  {
    id: 'all_dicts',
    name: '所有词库',
    description: '安装或更新所有词库文件',
    recipe: 'iDvel/rime-ice:others/recipes/all_dicts',
    installed: false
  },
  {
    id: 'cn_dicts',
    name: '拼音词库',
    description: '安装或更新拼音词库文件',
    recipe: 'iDvel/rime-ice:others/recipes/cn_dicts',
    installed: false
  },
  {
    id: 'en_dicts',
    name: '英文词库',
    description: '安装或更新英文词库文件',
    recipe: 'iDvel/rime-ice:others/recipes/en_dicts',
    installed: false
  },
  {
    id: 'opencc',
    name: 'OpenCC',
    description: '安装或更新 OpenCC 简繁转换配置',
    recipe: 'iDvel/rime-ice:others/recipes/opencc',
    installed: false
  }
]

class RimeConfigPlugin {
  constructor(context) {
    this.context = context
    this.rimeDir = null
    this.recipes = []
    this.backupDir = null
  }

  async onLoad(context) {
    this.context = context
    context.logger.info('Rime 配置管理插件加载中...')

    await this.detectRimeInstallation()
    await this.loadRecipes()

    if (this.rimeDir) {
      this.backupDir = join(this.rimeDir, 'backups')
      try {
        await mkdir(this.backupDir, { recursive: true })
      } catch (error) {}
    }

    context.logger.info('Rime 配置管理插件加载完成')
  }

  async onEnable(context) {
    context.logger.info('Rime 配置管理插件已启用')
  }

  async onDisable(context) {
    context.logger.info('Rime 配置管理插件已禁用')
  }

  async onUnload(context) {
    context.logger.info('Rime 配置管理插件已卸载')
  }

  async detectRimeInstallation() {
    for (const dir of RIME_DIRS) {
      try {
        await access(dir)
        const stats = await stat(dir)
        if (stats.isDirectory()) {
          this.rimeDir = dir
          this.context.logger.info(`检测到 Rime 目录: ${dir}`)
          return true
        }
      } catch (error) {
        continue
      }
    }

    this.context.logger.warn('未检测到 Rime 安装')
    return false
  }

  async loadRecipes() {
    // 复制 Plum 配方定义
    this.recipes = PLUM_RECIPES.map(recipe => ({ ...recipe }))

    if (this.rimeDir) {
      await this.checkInstalledRecipes()
    }
  }

  async checkInstalledRecipes() {
    // 检查配方是否已安装(通过检查相关文件是否存在)
    const files = await readdir(this.rimeDir)

    // full 配方检查
    const fullRecipe = this.recipes.find(r => r.id === 'full')
    if (fullRecipe) {
      fullRecipe.installed = files.includes('rime_ice.dict.yaml') || files.includes('melt_eng.dict.yaml')
    }

    // all_dicts 配方检查
    const allDictsRecipe = this.recipes.find(r => r.id === 'all_dicts')
    if (allDictsRecipe) {
      allDictsRecipe.installed = files.includes('rime_ice.dict.yaml')
    }

    // cn_dicts 配方检查
    const cnDictsRecipe = this.recipes.find(r => r.id === 'cn_dicts')
    if (cnDictsRecipe) {
      cnDictsRecipe.installed = files.some(f => f.startsWith('cn_dicts_'))
    }

    // en_dicts 配方检查
    const enDictsRecipe = this.recipes.find(r => r.id === 'en_dicts')
    if (enDictsRecipe) {
      enDictsRecipe.installed = files.includes('melt_eng.dict.yaml')
    }

    // opencc 配方检查
    const openccRecipe = this.recipes.find(r => r.id === 'opencc')
    if (openccRecipe) {
      openccRecipe.installed = files.some(f => f.includes('opencc'))
    }
  }

  /**
   * 获取 Plum 配方列表
   */
  async getRecipes() {
    return {
      success: true,
      data: {
        recipes: this.recipes
      }
    }
  }

  /**
   * 安装 Plum 配方
   * 通过插件系统的 context.api.process.exec() 安全执行
   */
  async installRecipe(recipeString) {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    const recipe = this.recipes.find(r => r.recipe === recipeString)
    if (!recipe) {
      throw new Error('配方不存在')
    }

    this.context.logger.info(`安装配方: ${recipe.name} (${recipeString})`)

    try {
      // 请求进程执行权限
      const hasPermission = await this.context.api.permission.request('process:exec', {
        reason: '安装 Plum 配方需要执行 rime-install 命令',
        context: {
          operation: '安装配方',
          target: recipe.name
        }
      })

      if (!hasPermission) {
        throw new Error('未授予进程执行权限，无法安装配方')
      }

      // 使用插件系统的进程 API,自动进行权限检查
      const result = await this.context.api.process.exec(`rime-install ${recipeString}`)

      if (result.stderr) {
        this.context.logger.warn('安装警告:', result.stderr)
      }

      this.context.logger.info(`配方安装成功: ${recipe.name}`)

      // 重新检查安装状态
      await this.checkInstalledRecipes()

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

  /**
   * 更新 Plum 配方
   */
  async updateRecipe(recipeString) {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    const recipe = this.recipes.find(r => r.recipe === recipeString)
    if (!recipe) {
      throw new Error('配方不存在')
    }

    this.context.logger.info(`更新配方: ${recipe.name} (${recipeString})`)

    try {
      // 请求进程执行权限
      const hasPermission = await this.context.api.permission.request('process:exec', {
        reason: '更新 Plum 配方需要执行 rime-install 命令',
        context: {
          operation: '更新配方',
          target: recipe.name
        }
      })

      if (!hasPermission) {
        throw new Error('未授予进程执行权限，无法更新配方')
      }

      // 更新配方和安装配方使用相同的命令
      const result = await this.context.api.process.exec(`rime-install ${recipeString}`)

      if (result.stderr) {
        this.context.logger.warn('更新警告:', result.stderr)
      }

      this.context.logger.info(`配方更新成功: ${recipe.name}`)

      // 重新检查安装状态
      await this.checkInstalledRecipes()

      return {
        success: true,
        message: `配方 ${recipe.name} 更新成功`,
        output: result.stdout
      }
    } catch (error) {
      this.context.logger.error('配方更新失败:', error)
      throw error
    }
  }

  /**
   * 卸载 Plum 配方
   */
  async uninstallRecipe(recipeString) {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    const recipe = this.recipes.find(r => r.recipe === recipeString)
    if (!recipe) {
      throw new Error('配方不存在')
    }

    this.context.logger.info(`卸载配方: ${recipe.name} (${recipeString})`)

    try {
      // 请求文件写入权限
      const hasPermission = await this.context.api.permission.request('fs:write', {
        reason: '卸载 Plum 配方需要删除相关文件',
        context: {
          operation: '删除配方文件',
          target: recipe.name
        }
      })

      if (!hasPermission) {
        throw new Error('未授予文件写入权限，无法卸载配方')
      }

      // Plum 没有专门的卸载命令,需要手动删除相关文件
      const files = await readdir(this.rimeDir)

      // 根据配方类型删除相关文件
      let filesToDelete = []

      if (recipe.id === 'full' || recipe.id === 'all_dicts') {
        filesToDelete = files.filter(f =>
          f.startsWith('rime_ice') ||
          f.startsWith('melt_eng') ||
          f.includes('cn_dicts') ||
          f.includes('en_dicts')
        )
      } else if (recipe.id === 'cn_dicts') {
        filesToDelete = files.filter(f => f.includes('cn_dicts'))
      } else if (recipe.id === 'en_dicts') {
        filesToDelete = files.filter(f => f.startsWith('melt_eng'))
      } else if (recipe.id === 'opencc') {
        filesToDelete = files.filter(f => f.includes('opencc'))
      }

      // 使用插件系统的文件 API 删除文件
      for (const file of filesToDelete) {
        const filePath = join(this.rimeDir, file)
        await this.context.api.process.exec(`rm "${filePath}"`)
      }

      this.context.logger.info(`配方卸载成功: ${recipe.name}`)

      // 重新检查安装状态
      await this.checkInstalledRecipes()

      return {
        success: true,
        message: `配方 ${recipe.name} 卸载成功`
      }
    } catch (error) {
      this.context.logger.error('配方卸载失败:', error)
      throw error
    }
  }

  /**
   * 部署 Rime
   */
  async deployRime() {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    this.context.logger.info('部署 Rime...')

    try {
      // 请求进程执行权限
      const hasPermission = await this.context.api.permission.request('process:exec', {
        reason: '部署 Rime 需要执行 rime_deployer 命令',
        context: {
          operation: '部署 Rime',
          target: 'Rime 配置'
        }
      })

      if (!hasPermission) {
        throw new Error('未授予进程执行权限，无法部署 Rime')
      }

      // 使用插件系统的进程 API 执行部署命令
      const result = await this.context.api.process.exec('rime_deployer --build')

      if (result.stderr) {
        this.context.logger.warn('部署警告:', result.stderr)
      }

      this.context.logger.info('Rime 部署成功')

      return {
        success: true,
        message: 'Rime 部署成功',
        output: result.stdout
      }
    } catch (error) {
      this.context.logger.error('Rime 部署失败:', error)
      throw error
    }
  }

  /**
   * 获取输入方案列表
   */
  async getSchemes() {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    const files = await readdir(this.rimeDir)
    const schemeFiles = files.filter((file) => file.endsWith('.schema.yaml'))

    const schemes = []

    for (const file of schemeFiles) {
      try {
        const content = await readFile(join(this.rimeDir, file), 'utf-8')
        const nameMatch = content.match(/^schema_name:\s*(.+)$/m)
        const displayNameMatch = content.match(/^name:\s*(.+)$/m)

        if (nameMatch) {
          schemes.push({
            id: nameMatch[1].trim(),
            file,
            displayName: displayNameMatch ? displayNameMatch[1].trim() : nameMatch[1].trim(),
            enabled: false
          })
        }
      } catch (error) {
        this.context.logger.warn(`读取方案文件失败: ${file}`, error)
      }
    }

    try {
      const defaultContent = await readFile(join(this.rimeDir, 'default.custom.yaml'), 'utf-8')
      const activeSchemes = defaultContent.match(/^schema_list:\s*$/m)

      if (activeSchemes) {
        for (const scheme of schemes) {
          if (defaultContent.includes(`- ${scheme.id}`)) {
            scheme.enabled = true
          }
        }
      }
    } catch (error) {
      // default.custom.yaml 不存在是正常的
    }

    return schemes
  }

  /**
   * 启用输入方案
   */
  async enableScheme(schemeId) {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    const defaultCustomPath = join(this.rimeDir, 'default.custom.yaml')
    let content = ''

    try {
      content = await readFile(defaultCustomPath, 'utf-8')
    } catch (error) {
      // 文件不存在,创建新文件
    }

    const schemaListMatch = content.match(/^schema_list:\s*$/m)

    if (!schemaListMatch) {
      content += '\nschema_list:\n'
    }

    if (!content.includes(`- ${schemeId}`)) {
      // 请求文件写入权限
      const hasPermission = await this.context.api.permission.request('fs:write', {
        reason: '启用输入方案需要修改配置文件',
        context: {
          operation: '修改配置文件',
          target: defaultCustomPath
        }
      })

      if (!hasPermission) {
        throw new Error('未授予文件写入权限，无法启用输入方案')
      }

      const insertIndex = content.indexOf('schema_list:')
      const insertPosition = insertIndex + 'schema_list:'.length

      content =
        content.slice(0, insertPosition) + `\n  - ${schemeId}` + content.slice(insertPosition)

      await this.context.api.fs.writeFile(defaultCustomPath, content)
      await this.deployRime()

      this.context.logger.info(`方案已启用: ${schemeId}`)
    }
  }

  /**
   * 禁用输入方案
   */
  async disableScheme(schemeId) {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    const defaultCustomPath = join(this.rimeDir, 'default.custom.yaml')
    let content = ''

    try {
      content = await readFile(defaultCustomPath, 'utf-8')
    } catch (error) {
      return
    }

    // 请求文件写入权限
    const hasPermission = await this.context.api.permission.request('fs:write', {
      reason: '禁用输入方案需要修改配置文件',
      context: {
        operation: '修改配置文件',
        target: defaultCustomPath
      }
    })

    if (!hasPermission) {
      throw new Error('未授予文件写入权限，无法禁用输入方案')
    }

    const lines = content.split('\n')
    const newLines = lines.filter((line) => !line.trim().includes(`- ${schemeId}`))

    await this.context.api.fs.writeFile(defaultCustomPath, newLines.join('\n'))
    await this.deployRime()

    this.context.logger.info(`方案已禁用: ${schemeId}`)
  }
}

// 创建插件实例的单例
let pluginInstance = null

module.exports = {
  onLoad: (context) => {
    if (!pluginInstance) {
      pluginInstance = new RimeConfigPlugin(context)
    }
    return pluginInstance.onLoad(context)
  },
  onEnable: (context) => {
    if (!pluginInstance) {
      pluginInstance = new RimeConfigPlugin(context)
    }
    return pluginInstance.onEnable(context)
  },
  onDisable: (context) => {
    if (pluginInstance) {
      return pluginInstance.onDisable(context)
    }
  },
  onUnload: (context) => {
    if (pluginInstance) {
      const result = pluginInstance.onUnload(context)
      pluginInstance = null
      return result
    }
  },
  getRecipes: () => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.getRecipes()
  },
  installRecipe: (_context, recipe) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.installRecipe(recipe)
  },
  updateRecipe: (_context, recipe) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.updateRecipe(recipe)
  },
  uninstallRecipe: (_context, recipe) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.uninstallRecipe(recipe)
  },
  deployRime: (_context) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.deployRime()
  },
  getSchemes: (_context) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.getSchemes()
  },
  enableScheme: (_context, schemeId) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.enableScheme(schemeId)
  },
  disableScheme: (_context, schemeId) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.disableScheme(schemeId)
  }
}
