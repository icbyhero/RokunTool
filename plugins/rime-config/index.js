/**
 * Rime 配置管理插件
 *
 * 可视化管理 Rime 输入法配置、方案和词库
 * 集成 Plum(东风破)配方管理功能
 */

// 移除直接的 require() 调用,改用插件 API
// const { readFile, access, readdir, stat, mkdir, writeFile, unlink, cp, rm } = require('fs/promises')
// const { join } = require('path')

// 使用环境变量占位符,将在 onLoad 时通过 context.env.HOME 替换
const RIME_DIRS_TEMPLATE = [
  '~/Library/Rime',
  '~/.local/share/fcitx5/rime',
  '~/.config/ibus/rime'
]

// Rime 目录将在 onLoad 时初始化
let RIME_DIRS = []

// 配方分类定义
const RECIPE_CATEGORIES = {
  basic: {
    id: 'basic',
    name: '基础配置',
    description: 'Rime 基础配置和工具',
    icon: 'settings'
  },
  vocabulary: {
    id: 'vocabulary',
    name: '词库配方',
    description: '词库和词汇表',
    icon: 'book'
  },
  input_method: {
    id: 'input_method',
    name: '拼音输入',
    description: '各类拼音输入方案',
    icon: 'keyboard'
  },
  double_pinyin: {
    id: 'double_pinyin',
    name: '双拼方案',
    description: '双拼输入方案',
    icon: 'keyboard'
  },
  dialect: {
    id: 'dialect',
    name: '方言输入',
    description: '方言输入方案',
    icon: 'globe'
  },
  stroke: {
    id: 'stroke',
    name: '笔画输入',
    description: '笔画和字形输入方案',
    icon: 'edit'
  },
  symbol: {
    id: 'symbol',
    name: '符号输入',
    description: '符号和特殊字符输入',
    icon: 'smile'
  },
  tool: {
    id: 'tool',
    name: '工具类',
    description: '实用工具和辅助配置',
    icon: 'tool'
  }
}

// Plum 配方定义 (扩展版)
const PLUM_RECIPES = [
  // === 词库配方 ===
  {
    id: 'rime_ice',
    name: '雾凇拼音',
    description: '一个针对现代汉语拼音输入法优化的词库,包含大量现代汉语词汇',
    recipe: 'iDvel/rime-ice:others/recipes/full',
    category: 'vocabulary',
    files: ['rime_ice.dict.yaml', 'rime_ice.schema.yaml', 'default.custom.yaml', 'symbols.yaml'],
    installed: false
  },
  {
    id: 'essay',
    name: '八股文词汇表',
    description: '古汉语、成语、俗语等传统文化词汇',
    recipe: 'lotem/rime-essay:master',
    category: 'vocabulary',
    files: ['essay.dict.yaml', 'essay.schema.yaml', 'default.custom.yaml'],
    installed: false
  },
  {
    id: 'octagram',
    name: '八股文语言模型',
    description: '基于八股文的统计语言模型,提供智能输入建议',
    recipe: 'lotem/rime-octagram:master',
    category: 'vocabulary',
    files: ['octagram.dict.yaml', 'essay.dict.yaml'],
    installed: false
  },

  // === 拼音输入 ===
  {
    id: 'luna_pinyin',
    name: '朙月拼音',
    description: 'Rime 官方提供的拼音输入方案,标准且稳定',
    recipe: 'rime-installer/rime-luna-pinyin:master',
    category: 'input_method',
    files: ['luna_pinyin.schema.yaml'],
    installed: false
  },
  {
    id: 'terra_pinyin',
    name: '地球拼音',
    description: '拼音输入方案的改进版,提供更好的输入体验',
    recipe: 'rime-installer/rime-terra-pinyin:master',
    category: 'input_method',
    files: ['terra_pinyin.schema.yaml'],
    installed: false
  },

  // === 双拼方案 ===
  {
    id: 'double_pinyin',
    name: '双拼',
    description: '标准的双拼输入方案',
    recipe: 'rime-installer/rime-double-pinyin:master',
    category: 'double_pinyin',
    files: ['double_pinyin.schema.yaml'],
    installed: false
  },
  {
    id: 'combo_pinyin',
    name: '宫保拼音',
    description: '智能双拼输入方案,支持多种双拼布局',
    recipe: 'rime-installer/rime-combo-pinyin:master',
    category: 'double_pinyin',
    files: ['combo_pinyin.schema.yaml'],
    installed: false
  },

  // === 笔画输入 ===
  {
    id: 'stroke',
    name: '五笔画',
    description: '基于汉字五笔画的输入方案',
    recipe: 'rime-installer/rime-stroke:master',
    category: 'stroke',
    files: ['stroke.schema.yaml'],
    installed: false
  },
  {
    id: 'wubi',
    name: '五笔',
    description: '经典五笔输入方案',
    recipe: 'rime-installer/rime-wubi:master',
    category: 'stroke',
    files: ['wubi86.schema.yaml', 'wubi.schema.yaml'],
    installed: false
  },
  {
    id: 'wubi98',
    name: '五笔98版',
    description: '五笔98版输入方案',
    recipe: 'rime-installer/rime-wubi98:master',
    category: 'stroke',
    files: ['wubi98.schema.yaml'],
    installed: false
  },
  {
    id: 'cangjie',
    name: '仓颉',
    description: '仓颉输入方案',
    recipe: 'rime-installer/rime-cangjie:master',
    category: 'stroke',
    files: ['cangjie.schema.yaml'],
    installed: false
  },
  {
    id: 'quick',
    name: '速成',
    description: '速成输入方案(简易仓颉)',
    recipe: 'rime-installer/rime-quick:master',
    category: 'stroke',
    files: ['quick.schema.yaml'],
    installed: false
  },
  {
    id: 'sancang',
    name: '三码仓颉',
    description: '三码仓颉输入方案',
    recipe: 'rime-installer/rime-sancang:master',
    category: 'stroke',
    files: ['sancang.schema.yaml'],
    installed: false
  },
  {
    id: 'zhengma',
    name: '郑码',
    description: '郑码输入方案',
    recipe: 'rime-installer/rime-zhengma:master',
    category: 'stroke',
    files: ['zhengma.schema.yaml'],
    installed: false
  },

  // === 方言输入 ===
  {
    id: 'jyutping',
    name: '粤拼',
    description: '粤语拼音输入方案',
    recipe: 'rime-installer/rime-jyutping:master',
    category: 'dialect',
    files: ['jyutping.schema.yaml'],
    installed: false
  },
  {
    id: 'wugniu',
    name: '吴语上海话',
    description: '上海话吴语输入方案',
    recipe: 'rime-installer/rime-wugniu:master',
    category: 'dialect',
    files: ['wugniu.schema.yaml'],
    installed: false
  },

  // === 符号输入 ===
  {
    id: 'emoji',
    name: '绘文字',
    description: 'Emoji 表情符号输入',
    recipe: 'rime-installer/rime-emoji:master',
    category: 'symbol',
    files: ['emoji.schema.yaml'],
    installed: false
  },
  {
    id: 'ipa',
    name: '国际音标',
    description: '国际音标(IPA)输入方案',
    recipe: 'rime-installer/rime-ipa:master',
    category: 'symbol',
    files: ['ipa.schema.yaml', 'ipa_x-sampa.schema.yaml'],
    installed: false
  },

  // === 工具类 ===
  {
    id: 'prelude',
    name: '基础配置',
    description: 'Rime 基础配置文件,提供默认配置模板',
    recipe: 'rime-installer/rime-prelude:master',
    category: 'basic',
    files: ['default.custom.yaml'],
    installed: false
  },
  {
    id: 'opencc',
    name: 'OpenCC',
    description: 'OpenCC 简繁转换配置',
    recipe: 'iDvel/rime-ice:others/recipes/opencc',
    category: 'basic',
    files: ['t2s.json', 's2t.json'],
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

    // 初始化 RIME_DIRS,将波浪号扩展为实际路径
    const homeDir = context.env.HOME
    RIME_DIRS = RIME_DIRS_TEMPLATE.map(dir => dir.replace('~', homeDir))

    await this.detectRimeInstallation()
    await this.loadRecipes()

    if (this.rimeDir) {
      this.backupDir = context.api.path.join(this.rimeDir, 'backups')
      try {
        await context.api.fs.writeFile(this.backupDir + '/.gitkeep', '') // 创建目录
      } catch (error) {
        // 如果目录已存在,忽略错误
        try {
          await context.api.fs.stat(this.backupDir)
        } catch (e) {
          // 目录不存在,尝试其他方式创建
        }
      }
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
        const stats = await this.context.api.fs.stat(dir)
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

    // 扫描本地方案(只添加本地已存在的)
    if (this.rimeDir) {
      await this.scanLocalSchemes()
      await this.checkInstalledRecipes()
    }

    // 过滤:移除未安装的本地方案
    this.recipes = this.recipes.filter(recipe => {
      // 如果是本地方案(recipe为空),只保留已安装的
      if (!recipe.recipe) {
        return recipe.installed
      }
      // Plum 配方都保留
      return true
    })
  }

  /**
   * 扫描本地方案,自动添加到配方列表
   */
  async scanLocalSchemes() {
    try {
      const files = await this.context.api.fs.readDir(this.rimeDir)
      const schemaFiles = files.filter(f => f.endsWith('.schema.yaml'))

      // 已知的 Plum 配方文件列表(排除这些)
      const plumRecipeFiles = new Set()
      for (const recipe of PLUM_RECIPES) {
        recipe.files?.forEach(file => plumRecipeFiles.add(file))
      }

      // 本地方案映射表
      const localSchemeNames = {
        'double_pinyin_mspy.schema.yaml': { id: 'double_pinyin_mspy', name: '微软双拼', description: '微软双拼输入方案' },
        'double_pinyin_flypy.schema.yaml': { id: 'double_pinyin_flypy', name: '小鹤双拼', description: '小鹤双拼输入方案' },
        'double_pinyin_abc.schema.yaml': { id: 'double_pinyin_abc', name: 'ABC双拼', description: 'ABC双拼输入方案' },
        'double_pinyin_jiajia.schema.yaml': { id: 'double_pinyin_jiajia', name: '加加双拼', description: '加加双拼输入方案' },
        'double_pinyin_sogou.schema.yaml': { id: 'double_pinyin_sogou', name: '搜狗双拼', description: '搜狗双拼输入方案' },
        'double_pinyin_ziguang.schema.yaml': { id: 'double_pinyin_ziguang', name: '紫光双拼', description: '紫光双拼输入方案' }
      }

      // 扫描本地双拼方案
      for (const schemaFile of schemaFiles) {
        // 跳过已知的 Plum 配方
        if (plumRecipeFiles.has(schemaFile)) continue

        // 检查是否是已知的本地方案
        if (localSchemeNames[schemaFile]) {
          const schemeInfo = localSchemeNames[schemaFile]

          // 检查是否已经存在
          const exists = this.recipes.find(r => r.id === schemeInfo.id)
          if (!exists) {
            this.recipes.push({
              id: schemeInfo.id,
              name: schemeInfo.name,
              description: schemeInfo.description,
              recipe: '', // 本地方案,无 recipe
              category: 'double_pinyin',
              files: [schemaFile],
              installed: false,
              updatable: false // 本地方案,不可更新
            })
            this.context.logger.info(`检测到本地方案: ${schemeInfo.name}`)
          }
        }
      }
    } catch (error) {
      this.context.logger.warn(`扫描本地方案失败: ${error.message}`)
    }
  }

  async checkInstalledRecipes() {
    // 检查配方是否已安装 (混合检测方案)
    const files = await this.context.api.fs.readDir(this.rimeDir)

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
    const markerFile = this.context.api.path.join(this.rimeDir, `.recipe-${recipeId}.installed`)
    try {
      await this.context.api.fs.stat(markerFile)
      return true
    } catch {
      // 标记文件不存在,尝试方法2
    }

    // 方法2: 回退到特征文件检测 (兼容手动安装)
    if (!files) {
      files = await this.context.api.fs.readDir(this.rimeDir)
    }

    return this.detectByCharacteristicFiles(recipeId, files)
  }

  /**
   * 基于特征文件的配方检测 (回退方案)
   * 用于检测手动安装的配方(无标记文件)
   * @param {string} recipeId - 配方ID
   * @param {string[]} files - 文件列表
   * @returns {boolean}
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
      'ipa': () => files.includes('ipa.schema.yaml') || files.includes('ipa_x-sampa.schema.yaml')
    }

    const detector = detectionRules[recipeId]
    return detector ? detector() : false
  }

  /**
   * 查找两个文件列表的交集
   * @param {string[]} files1 - 文件列表1
   * @param {string[]} files2 - 文件列表2
   * @returns {string[]} 交集文件列表
   */
  findFileOverlap(files1, files2) {
    return files1.filter(file => files2.includes(file))
  }

  /**
   * 检测配方冲突(基于文件列表)
   * @param {string} recipeId - 要安装的配方ID
   * @returns {Promise<Object>} 冲突信息
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
   * 创建配方安装标记文件
   * @param {string} recipeId - 配方ID
   */
  async markRecipeInstalled(recipeId) {
    const markerFile = this.context.api.path.join(this.rimeDir, `.recipe-${recipeId}.installed`)
    const installData = {
      recipeId: recipeId,
      installedAt: new Date().toISOString(),
      version: '1.0'
    }
    await this.context.api.fs.writeFile(markerFile, JSON.stringify(installData, null, 2))
    this.context.logger.info(`已创建配方标记: ${recipeId}`)
  }

  /**
   * 移除配方安装标记文件
   * @param {string} recipeId - 配方ID
   */
  async unmarkRecipeInstalled(recipeId) {
    const markerFile = this.context.api.path.join(this.rimeDir, `.recipe-${recipeId}.installed`)
    try {
      await this.context.api.process.exec(`rm "${markerFile}"`)
      this.context.logger.info(`已移除配方标记: ${recipeId}`)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.context.logger.warn(`移除标记文件失败: ${error.message}`)
      }
    }
  }

  /**
   * 获取 Plum 配方列表
   * 注意: IPC 层会自动包装返回值,所以这里直接返回数据对象即可
   */
  async getRecipes() {
    return {
      recipes: this.recipes,
      categories: RECIPE_CATEGORIES
    }
  }

  /**
   * 获取配方分类列表
   */
  async getRecipeCategories() {
    return {
      success: true,
      data: {
        categories: RECIPE_CATEGORIES
      }
    }
  }

  /**
   * 安装 Plum 配方 (增强版: 包含冲突检测和自动卸载)
   * 通过插件系统的 context.api.process.exec() 安全执行
   * @param {string|object} recipeParam - Plum 配方标识(如 'iDvel/rime-ice:others/recipes/full') 或 { recipe: string } 对象
   */
  async installRecipe(recipeParam) {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    // 兼容两种参数格式: 字符串 或 { recipe: string } 对象
    const recipeString = typeof recipeParam === 'string' ? recipeParam : recipeParam?.recipe

    const recipe = this.recipes.find(r => r.recipe === recipeString)
    if (!recipe) {
      throw new Error('配方不存在')
    }

    // 检查是否为本地方案(不可更新)
    if (!recipe.recipe) {
      throw new Error(`${recipe.name} 是本地方案,不支持通过 Plum 安装`)
    }

    this.context.logger.info(`安装配方: ${recipe.name} (${recipeString})`)

    // 开始进度报告
    this.context.api.progress.start(`安装配方 - ${recipe.name}`, 5)

    try {
      // 0. 安装前自动备份
      this.context.api.progress.update(1, '创建备份', '正在创建安装前备份...')
      try {
        await this.createBackup(`安装前备份 - ${recipe.name}`, false)
        this.context.logger.info('安装前备份创建成功')
      } catch (backupError) {
        this.context.logger.error('安装前备份失败,中止安装:', backupError)
        throw new Error('安装前备份失败,操作已中止')
      }

      // 1. 检测文件冲突(查找会生成相同文件的已安装配方)
      this.context.api.progress.update(2, '检查冲突', '正在检测文件冲突...')
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

      // 2. 完成进度报告(权限请求在进度报告之前)
      this.context.api.progress.complete('success')

      // 3. 请求进程执行权限(功能级权限请求)
      const granted = await this.context.api.permission.requestFeaturePermissions(
        `安装 Rime 配方: ${recipe.name}`,
        [
          {
            permission: 'process:exec',
            required: true,
            reason: '执行 rime-install 命令以下载和安装 Plum 配方'
          }
        ],
        `将安装配方"${recipe.name}"(${recipeString}),这可能需要一些时间下载组件。`,
        {
          operation: '安装配方',
          target: recipe.name
        }
      )

      if (!granted) {
        this.context.ui.showMessage('未授予所需权限,操作已取消', 'warning')
        this.context.logger.info('用户拒绝了安装配方的权限请求')
        return { success: false, message: '未授予进程执行权限' }
      }

      // 4. 重新开始进度报告并执行安装
      this.context.api.progress.start(`安装配方 - ${recipe.name}`, 2)
      this.context.api.progress.update(1, '安装配方', `正在执行 rime-install ${recipeString}...`)
      const result = await this.context.api.process.exec(`rime-install ${recipeString}`)

      if (result.stderr) {
        this.context.logger.warn('安装警告:', result.stderr)
      }

      // 4. 创建配方安装标记文件
      this.context.api.progress.update(5, '完成安装', '正在创建配方安装标记...')
      await this.markRecipeInstalled(recipe.id)

      this.context.logger.info(`配方安装成功: ${recipe.name}`)

      // 5. 重新检查安装状态
      await this.checkInstalledRecipes()

      // 完成进度报告
      this.context.api.progress.complete('success')

      return {
        success: true,
        message: `配方 ${recipe.name} 安装成功`,
        output: result.stdout,
        uninstalledRecipes: conflictCheck.conflictingRecipes.map(r => r.recipeId)
      }
    } catch (error) {
      this.context.logger.error('配方安装失败:', error)
      // 失败时也更新进度
      this.context.api.progress.complete('error', error.message)
      throw error
    }
  }

  /**
   * 更新 Plum 配方
   * @param {string|object} recipeParam - Plum 配方标识 或 { recipe: string } 对象
   */
  async updateRecipe(recipeParam) {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    // 兼容两种参数格式: 字符串 或 { recipe: string } 对象
    const recipeString = typeof recipeParam === 'string' ? recipeParam : recipeParam?.recipe

    const recipe = this.recipes.find(r => r.recipe === recipeString)
    if (!recipe) {
      throw new Error('配方不存在')
    }

    // 检查是否为本地方案(不可更新)
    if (!recipe.recipe) {
      throw new Error(`${recipe.name} 是本地方案,不支持更新`)
    }

    this.context.logger.info(`更新配方: ${recipe.name} (${recipeString})`)

    // 开始进度报告
    this.context.api.progress.start(`更新配方 - ${recipe.name}`, 3)

    try {
      // 请求进程执行权限
      this.context.api.progress.update(1, '请求权限', '请求进程执行权限...')
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
      this.context.api.progress.update(2, '更新配方', `正在执行 rime-install ${recipeString}...`)
      const result = await this.context.api.process.exec(`rime-install ${recipeString}`)

      if (result.stderr) {
        this.context.logger.warn('更新警告:', result.stderr)
      }

      this.context.logger.info(`配方更新成功: ${recipe.name}`)

      // 重新检查安装状态
      this.context.api.progress.update(3, '检查状态', '正在检查安装状态...')
      await this.checkInstalledRecipes()

      // 完成进度报告
      this.context.api.progress.complete('success')

      return {
        success: true,
        message: `配方 ${recipe.name} 更新成功`,
        output: result.stdout
      }
    } catch (error) {
      this.context.logger.error('配方更新失败:', error)
      // 失败时也更新进度
      this.context.api.progress.complete('error', error.message)
      throw error
    }
  }

  /**
   * 卸载 Plum 配方
   * @param {string|object} recipeParam - Plum 配方标识 或 { recipe: string } 对象
   */
  async uninstallRecipe(recipeParam) {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    // 兼容两种参数格式: 字符串 或 { recipe: string } 对象
    const recipeString = typeof recipeParam === 'string' ? recipeParam : recipeParam?.recipe

    const recipe = this.recipes.find(r => r.recipe === recipeString)
    if (!recipe) {
      throw new Error('配方不存在')
    }

    this.context.logger.info(`卸载配方: ${recipe.name} (${recipeString})`)

    try {
      // 0. 卸载前自动备份
      try {
        await this.createBackup(`卸载前备份 - ${recipe.name}`, false)
        this.context.logger.info('卸载前备份创建成功')
      } catch (backupError) {
        this.context.logger.error('卸载前备份失败,中止卸载:', backupError)
        throw new Error('卸载前备份失败,操作已中止')
      }

      // 1. 请求文件写入权限
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
      const files = await this.context.api.fs.readDir(this.rimeDir)

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
        const filePath = this.context.api.path.join(this.rimeDir, file)
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
   * 获取 Rime 安装状态
   */
  async getRimeStatus() {
    const diagnostics = await this.diagnoseRimeInstallation()

    return {
      installed: diagnostics.installed,
      rimeDir: diagnostics.rimeDir || null,
      version: diagnostics.version || null
    }
  }

  /**
   * 诊断 Rime 安装
   */
  async diagnoseRimeInstallation() {
    const diagnostics = {
      installed: false,
      rimeDir: null,
      version: null,
      errors: [],
      warnings: [],
      info: {}
    }

    // 检查 Rime 目录
    for (const dir of RIME_DIRS) {
      try {
        await this.context.api.fs.stat(dir)
        diagnostics.rimeDir = dir
        diagnostics.installed = true
        diagnostics.info.rimeDir = dir
        this.context.logger.info(`找到 Rime 目录: ${dir}`)
        break
      } catch (error) {
        // 目录不存在,继续检查下一个
      }
    }

    if (!diagnostics.installed) {
      diagnostics.errors.push('未找到 Rime 配置目录')
      diagnostics.errors.push('请先安装 Rime 输入法')
      // 直接返回 diagnostics 对象,不要包装
      return diagnostics
    }

    // 检查必要文件
    try {
      const defaultCustomPath = this.context.api.path.join(diagnostics.rimeDir, 'default.custom.yaml')
      await this.context.api.fs.stat(defaultCustomPath)
      diagnostics.info.defaultCustomYaml = '存在'
    } catch (error) {
      diagnostics.warnings.push('default.custom.yaml 不存在,将自动创建')
    }

    // 检测 Rime 版本 (跨平台)
    await this.detectRimeVersion(diagnostics)

    // 检查 Plum
    try {
      const plumResult = await this.context.api.process.exec('which rime-install')
      if (plumResult.stdout.trim()) {
        diagnostics.info.plumInstalled = true
        diagnostics.info.rimeInstall = plumResult.stdout.trim()
      } else {
        diagnostics.warnings.push('未安装 Plum (东风破),配方功能可能受限')
      }
    } catch (error) {
      diagnostics.warnings.push('无法检查 Plum: ' + error.message)
    }

    // 直接返回 diagnostics 对象,不要包装
    // IPC 层会自动包装成 { success: true, data: diagnostics }
    return diagnostics
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
   * 检测 Rime 版本 (跨平台)
   */
  async detectRimeVersion(diagnostics) {
    const platform = await this.context.api.system.getPlatform()

    try {
      if (platform === 'darwin') {
        // macOS: 尝试从 Squirrel.app 读取版本
        await this.getSquirrelVersion(diagnostics)
      } else if (platform === 'linux') {
        // Linux: 使用 rime_deployer --version
        await this.getRimeDeployerVersion(diagnostics)
      } else if (platform === 'win32') {
        // Windows: Weasel (预留)
        await this.getWeaselVersion(diagnostics)
      }
    } catch (error) {
      this.context.logger.warn('版本检测失败:', error.message)
      diagnostics.version = null
    }
  }

  /**
   * 获取 macOS Squirrel 版本
   */
  async getSquirrelVersion(diagnostics) {
    const squirrelPaths = [
      '/Applications/Squirrel.app',
      this.context.api.path.join(this.context.env.HOME, 'Applications/Squirrel.app')
    ]

    for (const squirrelPath of squirrelPaths) {
      try {
        // 方法1: 使用 defaults read 命令
        const result = await this.context.api.process.exec(
          `defaults read "${squirrelPath}/Contents/Info.plist" CFBundleShortVersionString`
        )

        if (result.stdout && result.stdout.trim()) {
          const version = result.stdout.trim()
          diagnostics.version = `Squirrel ${version}`
          diagnostics.info.squirrelPath = squirrelPath
          diagnostics.info.squirrelVersion = version
          this.context.logger.info(`检测到 Squirrel 版本: ${version}`)
          return
        }
      } catch (error) {
        // defaults read 失败,尝试方法2
        continue
      }
    }

    // 方法2: 直接读取 Info.plist 文件
    for (const squirrelPath of squirrelPaths) {
      try {
        const plistPath = this.context.api.path.join(squirrelPath, 'Contents/Info.plist')
        const buffer = await this.context.api.fs.readFile(plistPath)
        const plistContent = buffer.toString('utf8')

        // 解析 XML 格式的 Info.plist
        const versionMatch = plistContent.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/)
        const fallbackMatch = plistContent.match(/<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/)

        if (versionMatch) {
          const version = versionMatch[1]
          diagnostics.version = `Squirrel ${version}`
          diagnostics.info.squirrelPath = squirrelPath
          diagnostics.info.squirrelVersion = version
          this.context.logger.info(`从 Info.plist 读取到 Squirrel 版本: ${version}`)
          return
        } else if (fallbackMatch) {
          const version = fallbackMatch[1]
          diagnostics.version = `Squirrel ${version}`
          diagnostics.info.squirrelPath = squirrelPath
          diagnostics.info.squirrelVersion = version
          this.context.logger.info(`从 Info.plist 读取到 Squirrel 版本 (fallback): ${version}`)
          return
        }
      } catch (error) {
        // 文件读取失败,继续下一个路径
        continue
      }
    }

    diagnostics.warnings.push('无法检测 Squirrel 版本')
  }

  /**
   * 获取 Linux rime_deployer 版本
   */
  async getRimeDeployerVersion(diagnostics) {
    try {
      const result = await this.context.api.process.exec('which rime_deployer')
      if (result.stdout.trim()) {
        diagnostics.info.rimeDeployer = result.stdout.trim()

        try {
          const versionResult = await this.context.api.process.exec('rime_deployer --version')
          if (versionResult.stdout) {
            diagnostics.version = versionResult.stdout.trim().split('\n')[0]
            this.context.logger.info(`检测到 rime_deployer 版本: ${diagnostics.version}`)
          }
        } catch (error) {
          diagnostics.version = null
        }
      } else {
        diagnostics.warnings.push('未找到 rime_deployer 命令')
      }
    } catch (error) {
      diagnostics.warnings.push('无法检查 rime_deployer: ' + error.message)
    }
  }

  /**
   * 获取 Windows Weasel 版本 (预留)
   */
  async getWeaselVersion(diagnostics) {
    diagnostics.warnings.push('Windows Weasel 版本检测尚未实现')
    diagnostics.version = null
  }

  /**
   * 获取输入方案列表
   */
  async getSchemes() {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    const files = await this.context.api.fs.readDir(this.rimeDir)
    const schemeFiles = files.filter((file) => file.endsWith('.schema.yaml'))

    const schemes = []

    for (const file of schemeFiles) {
      try {
        const buffer = await this.context.api.fs.readFile(this.context.api.path.join(this.rimeDir, file))
        const content = buffer.toString('utf-8')
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
      const buffer = await this.context.api.fs.readFile(this.context.api.path.join(this.rimeDir, 'default.custom.yaml'))
      const defaultContent = buffer.toString('utf-8')
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

    const defaultCustomPath = this.context.api.path.join(this.rimeDir, 'default.custom.yaml')
    let content = ''

    try {
      const buffer = await this.context.api.fs.readFile(defaultCustomPath)
      content = buffer.toString('utf-8')
    } catch (error) {
      // 文件不存在,创建新文件
    }

    const schemaListMatch = content.match(/^schema_list:\s*$/m)

    if (!schemaListMatch) {
      content += '\nschema_list:\n'
    }

    if (!content.includes(`- ${schemeId}`)) {
      // 0. 启用方案前自动备份
      try {
        await this.createBackup(`启用方案前备份 - ${schemeId}`, false)
        this.context.logger.info('启用方案前备份创建成功')
      } catch (backupError) {
        this.context.logger.error('启用方案前备份失败,中止操作:', backupError)
        throw new Error('启用方案前备份失败,操作已中止')
      }

      // 1. 请求文件写入权限
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

    const defaultCustomPath = this.context.api.path.join(this.rimeDir, 'default.custom.yaml')
    let content = ''

    try {
      const buffer = await this.context.api.fs.readFile(defaultCustomPath)
      content = buffer.toString('utf-8')
    } catch (error) {
      return
    }

    // 0. 禁用方案前自动备份
    try {
      await this.createBackup(`禁用方案前备份 - ${schemeId}`, false)
      this.context.logger.info('禁用方案前备份创建成功')
    } catch (backupError) {
      this.context.logger.error('禁用方案前备份失败,中止操作:', backupError)
      throw new Error('禁用方案前备份失败,操作已中止')
    }

    // 1. 请求文件写入权限
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

  /**
   * 创建配置备份
   * @param {string} description - 备份描述
   * @param {boolean} isPermanent - 是否为长期备份
   * @returns {Promise<object>} 备份信息
   */
  async createBackup(description = '手动备份', isPermanent = false) {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    if (!this.backupDir) {
      throw new Error('备份目录未初始化')
    }

    try {
      // 生成备份目录名
      const now = new Date()
      let backupId

      if (isPermanent) {
        // 长期备份使用 Unix 时间戳
        backupId = `backup-permanent-${now.getTime()}`
      } else {
        // 普通备份使用格式化的日期时间
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hour = String(now.getHours()).padStart(2, '0')
        const minute = String(now.getMinutes()).padStart(2, '0')
        const second = String(now.getSeconds()).padStart(2, '0')
        backupId = `backup-${year}-${month}-${day}-${hour}-${minute}-${second}`
      }

      const backupPath = this.context.api.path.join(this.backupDir, backupId)

      // 创建备份目录 (通过写入 .gitkeep 文件)
      await this.context.api.fs.writeFile(`${backupPath}/.gitkeep`, '')

      // 复制所有配置文件到备份目录 (使用 rsync)
      await this.context.api.process.exec(
        `rsync -a "${this.rimeDir}/" "${backupPath}/" --exclude="backups"`
      )

      // 计算备份大小
      const backupSize = await this.getDirectorySize(backupPath)

      // 创建备份元数据
      const metadata = {
        backupId,
        description,
        createdAt: now.getTime(),
        size: backupSize,
        isPermanent
      }

      // 写入元数据文件
      const metadataPath = this.context.api.path.join(backupPath, 'backup-metadata.json')
      await this.context.api.fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

      this.context.logger.info(`备份创建成功: ${backupId} (${description})`)

      // 异步清理旧备份
      this.cleanupOldBackups().catch(error => {
        this.context.logger.warn(`清理旧备份失败: ${error.message}`)
      })

      return {
        success: true,
        data: metadata
      }
    } catch (error) {
      this.context.logger.error('创建备份失败:', error)
      throw error
    }
  }

  /**
   * 计算目录大小
   * @param {string} dirPath - 目录路径
   * @returns {Promise<number>} 目录大小(字节)
   */
  async getDirectorySize(dirPath) {
    let totalSize = 0

    const calculateSize = async (path) => {
      const stats = await this.context.api.fs.stat(path)

      if (stats.isDirectory()) {
        const files = await this.context.api.fs.readDir(path)
        for (const file of files) {
          const filePath = this.context.api.path.join(path, file)
          // 跳过备份目录本身
          if (!filePath.includes('backups')) {
            await calculateSize(filePath)
          }
        }
      } else {
        totalSize += stats.size
      }
    }

    await calculateSize(dirPath)
    return totalSize
  }

  /**
   * 清理旧备份
   * 删除超过限制数量的普通备份和超过3个月的备份
   */
  async cleanupOldBackups() {
    if (!this.backupDir) {
      return
    }

    try {
      const backups = await this.getBackupList()
      if (!backups.success || !backups.data.backups) {
        return
      }

      const allBackups = backups.data.backups
      const now = Date.now()
      const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000 // 3个月
      const toDelete = []

      // 规则1: 删除超过3个月的普通备份
      for (const backup of allBackups) {
        if (!backup.isPermanent && backup.createdAt < threeMonthsAgo) {
          toDelete.push(backup.backupId)
        }
      }

      // 规则2: 限制普通备份数量为10个
      const normalBackups = allBackups
        .filter(b => !b.isPermanent)
        .sort((a, b) => b.createdAt - a.createdAt)

      if (normalBackups.length > 10) {
        const excessBackups = normalBackups.slice(10)
        for (const backup of excessBackups) {
          if (!toDelete.includes(backup.backupId)) {
            toDelete.push(backup.backupId)
          }
        }
      }

      // 执行删除
      for (const backupId of toDelete) {
        await this.deleteBackup(backupId)
        this.context.logger.info(`已清理旧备份: ${backupId}`)
      }

      if (toDelete.length > 0) {
        this.context.logger.info(`备份清理完成,删除了 ${toDelete.length} 个旧备份`)
      }
    } catch (error) {
      this.context.logger.warn(`清理旧备份时出错: ${error.message}`)
    }
  }

  /**
   * 获取备份列表
   * @returns {Promise<object>} 备份列表
   */
  async getBackupList() {
    if (!this.backupDir) {
      return {
        success: false,
        message: '备份目录未初始化'
      }
    }

    try {
      const backupDirs = await this.context.api.fs.readDir(this.backupDir)
      const backups = []

      for (const dirName of backupDirs) {
        if (!dirName.startsWith('backup-')) {
          continue
        }

        const backupPath = this.context.api.path.join(this.backupDir, dirName)
        const metadataPath = this.context.api.path.join(backupPath, 'backup-metadata.json')

        try {
          const buffer = await this.context.api.fs.readFile(metadataPath)
          const metadataContent = buffer.toString('utf-8')
          const metadata = JSON.parse(metadataContent)
          backups.push(metadata)
        } catch (error) {
          // 元数据文件缺失或损坏,标记为无效备份
          this.context.logger.warn(`备份元数据无效: ${dirName}`)
        }
      }

      // 按创建时间倒序排列
      backups.sort((a, b) => b.createdAt - a.createdAt)

      return {
        success: true,
        data: {
          backups
        }
      }
    } catch (error) {
      this.context.logger.error('获取备份列表失败:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * 获取单个备份信息
   * @param {string} backupId - 备份ID
   * @returns {Promise<object>} 备份信息
   */
  async getBackup(backupId) {
    if (!this.backupDir) {
      throw new Error('备份目录未初始化')
    }

    const backupPath = this.context.api.path.join(this.backupDir, backupId)
    const metadataPath = this.context.api.path.join(backupPath, 'backup-metadata.json')

    try {
      const buffer = await this.context.api.fs.readFile(metadataPath)
      const metadataContent = buffer.toString('utf-8')
      const metadata = JSON.parse(metadataContent)

      return {
        success: true,
        data: metadata
      }
    } catch (error) {
      this.context.logger.error('获取备份信息失败:', error)
      throw new Error('备份不存在或元数据损坏')
    }
  }

  /**
   * 恢复备份
   * @param {string} backupId - 备份ID
   * @returns {Promise<object>} 恢复结果
   */
  async restoreBackup(backupId) {
    if (!this.rimeDir) {
      throw new Error('Rime 未安装')
    }

    if (!this.backupDir) {
      throw new Error('备份目录未初始化')
    }

    try {
      // 获取备份信息
      const backupInfo = await this.getBackup(backupId)
      if (!backupInfo.success) {
        throw new Error('备份不存在')
      }

      const backupPath = this.context.api.path.join(this.backupDir, backupId)

      // 先创建当前配置的备份
      await this.createBackup(`恢复前备份 - 恢复 ${backupId}`, false)

      // 删除当前配置文件(保留备份目录)
      const files = await this.context.api.fs.readDir(this.rimeDir)
      for (const file of files) {
        if (file !== 'backups') {
          const filePath = this.context.api.path.join(this.rimeDir, file)
          await this.context.api.process.exec(`rm -rf "${filePath}"`)
        }
      }

      // 从备份目录恢复文件
      const backupFiles = await this.context.api.fs.readDir(backupPath)
      for (const file of backupFiles) {
        if (file !== 'backup-metadata.json' && file !== '.gitkeep') {
          const srcPath = this.context.api.path.join(backupPath, file)
          const destPath = this.context.api.path.join(this.rimeDir, file)
          await this.context.api.process.exec(`cp -R "${srcPath}" "${destPath}"`)
        }
      }

      // 重新部署 Rime
      await this.deployRime()

      this.context.logger.info(`备份恢复成功: ${backupId}`)

      return {
        success: true,
        message: '备份恢复成功'
      }
    } catch (error) {
      this.context.logger.error('恢复备份失败:', error)
      throw error
    }
  }

  /**
   * 删除备份
   * @param {string} backupId - 备份ID
   * @returns {Promise<object>} 删除结果
   */
  async deleteBackup(backupId) {
    if (!this.backupDir) {
      throw new Error('备份目录未初始化')
    }

    try {
      const backupPath = this.context.api.path.join(this.backupDir, backupId)

      // 删除备份目录
      await this.context.api.process.exec(`rm -rf "${backupPath}"`)

      this.context.logger.info(`备份已删除: ${backupId}`)

      return {
        success: true,
        message: '备份删除成功'
      }
    } catch (error) {
      this.context.logger.error('删除备份失败:', error)
      throw error
    }
  }

  /**
   * 切换备份的长期保存标记
   * @param {string} backupId - 备份ID
   * @returns {Promise<object>} 切换结果
   */
  async togglePermanent(backupId) {
    if (!this.backupDir) {
      throw new Error('备份目录未初始化')
    }

    try {
      const backupInfo = await this.getBackup(backupId)
      if (!backupInfo.success) {
        throw new Error('备份不存在')
      }

      const metadata = backupInfo.data
      const backupPath = this.context.api.path.join(this.backupDir, backupId)
      const metadataPath = this.context.api.path.join(backupPath, 'backup-metadata.json')

      // 切换 isPermanent 标记
      metadata.isPermanent = !metadata.isPermanent

      // 更新元数据文件
      await this.context.api.fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

      this.context.logger.info(
        `备份 ${backupId} 已${metadata.isPermanent ? '标记为长期' : '取消长期'}保存`
      )

      return {
        success: true,
        data: metadata,
        message: metadata.isPermanent ? '已标记为长期备份' : '已取消长期备份标记'
      }
    } catch (error) {
      this.context.logger.error('切换长期标记失败:', error)
      throw error
    }
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
  getRimeStatus: (_context) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.getRimeStatus()
  },
  diagnoseRimeInstallation: (_context) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.diagnoseRimeInstallation()
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
  },
  // 备份相关 API
  createBackup: (_context, description, isPermanent) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.createBackup(description, isPermanent)
  },
  getBackupList: (_context) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.getBackupList()
  },
  getBackup: (_context, backupId) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.getBackup(backupId)
  },
  restoreBackup: (_context, backupId) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.restoreBackup(backupId)
  },
  deleteBackup: (_context, backupId) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.deleteBackup(backupId)
  },
  togglePermanent: (_context, backupId) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.togglePermanent(backupId)
  }
}
