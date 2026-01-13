/**
 * 微信分身插件
 *
 * 支持创建和管理多个微信实例
 */

const { readFile, writeFile, access, mkdir, readdir, stat } = require('fs/promises')
const { join, basename, dirname } = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

const WECHAT_PATH = '/Applications/WeChat.app'
// 实际分身文件存储在用户目录下
const INSTANCES_DIR = join(process.env.HOME, 'Applications')
// 在 /Applications 创建符号链接
const SYSTEM_APPS_DIR = '/Applications'
const CONFIG_FILE = 'instances.json'

// 分身标记,用于识别由本插件创建的分身
const INSTANCE_MARKER = 'rokun-wechat-instance'
const INSTANCE_VERSION = '1.0'

class WeChatMultiInstancePlugin {
  constructor(context) {
    this.context = context
    this.instances = new Map()
    this.configPath = join(context.dataDir, CONFIG_FILE)
  }

  async onLoad(context) {
    this.context = context
    context.logger.info('微信分身插件加载中...')

    await this.loadConfig()
    // 扫描并自动纳入已存在的分身(用于程序重装后恢复管理)
    await this.autoDiscoverInstances()

    context.logger.info('微信分身插件加载完成')
  }

  async onEnable(context) {
    context.logger.info('微信分身插件已启用')
  }

  async onDisable(context) {
    context.logger.info('微信分身插件已禁用')
  }

  async onUnload(context) {
    await this.saveConfig()
    context.logger.info('微信分身插件已卸载')
  }

  async loadConfig() {
    try {
      const data = await readFile(this.configPath, 'utf-8')
      const config = JSON.parse(data)

      for (const instance of config.instances || []) {
        this.instances.set(instance.id, instance)
      }

      this.context.logger.info(`加载配置: ${this.instances.size} 个实例`)

      // 检查微信版本是否变化
      const currentVersion = await this.getWeChatVersion()
      const savedVersion = config.wechatVersion

      if (savedVersion && currentVersion && savedVersion !== currentVersion) {
        this.context.logger.warn(`微信版本已更新: ${savedVersion} → ${currentVersion}`)
        this.context.logger.warn('建议重建所有分身以避免兼容性问题')

        // 保存版本变化信息,供 UI 使用
        this.wechatVersionChanged = {
          oldVersion: savedVersion,
          newVersion: currentVersion,
          needsRebuild: true
        }
      }
    } catch (error) {
      this.context.logger.warn('配置文件不存在或解析失败，将创建新配置')
    }
  }

  async saveConfig() {
    const config = {
      wechatVersion: await this.getWeChatVersion(),
      instances: Array.from(this.instances.values())
    }

    try {
      // 确保目录存在
      const { dirname } = require('path')
      const { mkdir } = require('fs/promises')

      await mkdir(dirname(this.configPath), { recursive: true })

      await writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8')
      this.context.logger.info('配置已保存')
    } catch (error) {
      this.context.logger.error('保存配置失败:', error)
      throw error
    }
  }

  async checkWeChatInstalled() {
    try {
      await access(WECHAT_PATH)
      return true
    } catch (error) {
      return false
    }
  }

  async getWeChatVersion() {
    try {
      const { stdout } = await execAsync(
        `defaults read "${WECHAT_PATH}/Contents/Info.plist" CFBundleShortVersionString`
      )
      return stdout.trim()
    } catch (error) {
      this.context.logger.error('获取微信版本失败:', error)
      return null
    }
  }

  async createInstance() {
    const totalSteps = 7

    // 1. 开始进度报告
    this.context.api.progress.start('创建分身', totalSteps)

    try {
      // 2. 检查微信安装
      this.context.api.progress.update(1, '检查微信安装', '正在检查微信是否已安装...')
      const isInstalled = await this.checkWeChatInstalled()

      if (!isInstalled) {
        throw new Error('微信未安装，请先安装微信应用')
      }

      const instanceNumber = this.getNextInstanceNumber()
      const instanceName = `WeChat${instanceNumber}`
      const instancePath = join(INSTANCES_DIR, `${instanceName}.app`)
      const symlinkPath = join(SYSTEM_APPS_DIR, `${instanceName}.app`)
      const bundleId = `com.tencent.xinWeChat${instanceNumber}`

      this.context.logger.info(`创建分身: ${instanceName}`)

      // 3. 请求文件写入权限
      this.context.api.progress.update(2, '请求权限', '请求文件写入权限...')
      const hasPermission = await this.context.api.permission.request('fs:write', {
        reason: '创建微信分身需要复制和修改文件',
        context: {
          operation: '复制微信应用',
          target: instancePath
        }
      })

      if (!hasPermission) {
        throw new Error('未授予文件写入权限，无法创建微信分身')
      }

      // 4. 复制应用
      this.context.api.progress.update(3, '复制微信应用', `正在复制到 ${instancePath}...`)
      await this.copyWeChatApp(instancePath)

      // 5. 修改 Bundle ID
      this.context.api.progress.update(4, '修改应用标识', `修改 Bundle ID 为 ${bundleId}...`)
      await this.modifyBundleId(instancePath, bundleId, instanceName)

      // 6. 请求进程执行权限(用于签名)
      this.context.api.progress.update(5, '请求权限', '请求进程执行权限...')
      const hasExecPermission = await this.context.api.permission.request('process:exec', {
        reason: '签名微信分身需要执行系统命令',
        context: {
          operation: '签名应用',
          target: instancePath
        }
      })

      if (!hasExecPermission) {
        throw new Error('未授予进程执行权限，无法签名微信分身')
      }

      // 7. 签名应用
      this.context.api.progress.update(6, '签名应用', '正在对应用进行代码签名...')
      await this.signApp(instancePath)

      // 8. 修改微信显示名称为中文名+数字
      this.context.api.progress.update(7, '修改显示名称', `设置为: 微信${instanceNumber}`)
      await this.modifyWeChatDisplayName(instancePath, instanceNumber)

      // 在 /Applications 创建符号链接
      this.context.logger.info(`创建符号链接: ${symlinkPath} -> ${instancePath}`)
      try {
        // 先删除可能存在的旧链接
        await execAsync(`rm -f "${symlinkPath}"`)
        // 创建符号链接
        await execAsync(`ln -s "${instancePath}" "${symlinkPath}"`)
        this.context.logger.info(`符号链接创建成功`)
      } catch (linkError) {
        this.context.logger.warn('创建符号链接失败(分身仍可用):', linkError.message)
        // 符号链接创建失败不影响分身使用,只记录警告
      }

      const instance = {
        id: `instance-${Date.now()}`,
        name: instanceName,
        path: symlinkPath, // 保存符号链接路径,这样用户可以直接打开
        realPath: instancePath, // 保存实际路径,删除时需要删除实际文件
        bundleId,
        createdAt: new Date().toISOString(),
        wechatVersion: await this.getWeChatVersion(), // 保存创建时的微信版本
        rebuiltAt: null
      }

      this.instances.set(instance.id, instance)
      await this.saveConfig()

      this.context.logger.info(`分身创建成功: ${instanceName}`)

      // 9. 完成进度报告
      this.context.api.progress.complete('success')

      return instance
    } catch (error) {
      this.context.logger.error('创建分身失败:', error)
      this.context.api.progress.complete('error', error.message)
      throw error
    }
  }

  getNextInstanceNumber() {
    let number = 3
    while (this.instancesHasName(`WeChat${number}`)) {
      number++
    }
    return number
  }

  instancesHasName(name) {
    return Array.from(this.instances.values()).some((instance) => instance.name === name)
  }

  async copyWeChatApp(targetPath) {
    this.context.logger.info(`复制微信应用到: ${targetPath}`)

    const { stdout, stderr } = await execAsync(`cp -R "${WECHAT_PATH}" "${targetPath}"`)

    if (stderr) {
      this.context.logger.warn('复制警告:', stderr)
    }
  }

  async modifyBundleId(appPath, bundleId, appName) {
    this.context.logger.info(`修改 Bundle ID: ${bundleId}`)

    const plistPath = join(appPath, 'Contents/Info.plist')

    let content = await readFile(plistPath, 'utf-8')

    content = content.replace(
      /<key>CFBundleIdentifier<\/key>\s*<string>.*?<\/string>/,
      `<key>CFBundleIdentifier</key>\n\t<string>${bundleId}</string>`
    )

    content = content.replace(
      /<key>CFBundleName<\/key>\s*<string>.*?<\/string>/,
      `<key>CFBundleName</key>\n\t<string>${appName}</string>`
    )

    content = content.replace(
      /<key>CFBundleDisplayName<\/key>\s*<string>.*?<\/string>/,
      `<key>CFBundleDisplayName</key>\n\t<string>${appName}</string>`
    )

    // 添加分身标记,让其他插件能够识别这是由本插件创建的分身
    // 在 </dict> 之前添加标记
    const markerKey = INSTANCE_MARKER
    const markerEntry = `\t<key>${markerKey}</key>\n\t<string>${INSTANCE_VERSION}</string>\n`

    // 检查是否已经存在标记
    if (!content.includes(`<key>${markerKey}</key>`)) {
      content = content.replace(
        /<\/dict>/,
        `${markerEntry}</dict>`
      )
    }

    await writeFile(plistPath, content, 'utf-8')
  }

  async modifyWeChatDisplayName(appPath, instanceNumber) {
    this.context.logger.info(`修改微信显示名称: 微信${instanceNumber}`)

    const plistPath = join(appPath, 'Contents/Info.plist')
    let content = await readFile(plistPath, 'utf-8')

    // 修改显示名称为中文名+数字
    const chineseName = `微信${instanceNumber}`

    content = content.replace(
      /<key>CFBundleDisplayName<\/key>\s*<string>.*?<\/string>/,
      `<key>CFBundleDisplayName</key>\n\t<string>${chineseName}</string>`
    )

    // 同时修改 CFBundleName
    content = content.replace(
      /<key>CFBundleName<\/key>\s*<string>.*?<\/string>/,
      `<key>CFBundleName</key>\n\t<string>${chineseName}</string>`
    )

    await writeFile(plistPath, content, 'utf-8')

    // 也修改 zh_CN.lproj 中的本地化字符串
    const stringsPath = join(appPath, 'Contents/Resources/zh_CN.lproj/InfoPlist.strings')
    try {
      let stringsContent = await readFile(stringsPath, 'utf-8')

      // 修改 CFBundleDisplayName 和 CFBundleName 的本地化字符串
      stringsContent = stringsContent.replace(
        /CFBundleDisplayName\s*=\s*".*?";/,
        `CFBundleDisplayName = "${chineseName}";`
      )

      stringsContent = stringsContent.replace(
        /CFBundleName\s*=\s*".*?";/,
        `CFBundleName = "${chineseName}";`
      )

      await writeFile(stringsPath, stringsContent, 'utf-8')
      this.context.logger.info('本地化字符串已更新')
    } catch (error) {
      // 本地化文件可能不存在,记录警告但不中断流程
      this.context.logger.warn('更新本地化字符串失败(可忽略):', error.message)
    }
  }

  async signApp(appPath) {
    this.context.logger.info(`签名应用: ${appPath}`)

    try {
      // 1. 清除扩展属性
      this.context.logger.info('清除扩展属性...')
      const { stdout: xattrOutput, stderr: xattrError } = await execAsync(`xattr -cr "${appPath}"`)
      if (xattrError) {
        this.context.logger.warn('xattr 警告:', xattrError)
      }

      // 2. 移除根目录的未密封文件
      this.context.logger.info('清理未密封内容...')
      try {
        await execAsync(`find "${appPath}" -maxdepth 1 -type f -delete`)
      } catch (error) {
        this.context.logger.warn('清理未密封文件时出现警告(可忽略):', error.message)
      }

      // 3. 先签名内部组件
      this.context.logger.info('签名内部组件...')
      try {
        await execAsync(`codesign --force --deep --sign - "${appPath}/Contents"`)
      } catch (error) {
        this.context.logger.warn('签名 Contents 警告:', error.message)
      }

      // 4. 最后签名整个应用
      this.context.logger.info('应用代码签名...')
      const { stdout: codesignOutput, stderr: codesignError } = await execAsync(`codesign --force --deep --sign - "${appPath}"`)

      if (codesignError && !codesignError.includes('replacing existing signature')) {
        this.context.logger.warn('codesign 警告:', codesignError)
      }

      this.context.logger.info('应用签名成功')
      this.context.logger.info('codesign 输出:', codesignOutput)
    } catch (error) {
      this.context.logger.error('应用签名失败:', error)
      this.context.logger.error('错误详情:', {
        message: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
        code: error.code
      })
      throw new Error(`应用签名失败: ${error.message}`)
    }
  }

  async deleteInstance(instanceId, deleteData = false) {
    const instance = this.instances.get(instanceId)

    if (!instance) {
      throw new Error('实例不存在')
    }

    this.context.logger.info(`删除实例: ${instance.name}`)

    try {
      // 请求文件写入权限
      const hasPermission = await this.context.api.permission.request('fs:write', {
        reason: '删除微信分身需要删除文件',
        context: {
          operation: '删除应用',
          target: instance.path
        }
      })

      if (!hasPermission) {
        throw new Error('未授予文件写入权限，无法删除微信分身')
      }

      // 1. 删除符号链接(如果存在)
      if (instance.path !== instance.realPath) {
        try {
          await access(instance.path)
          await execAsync(`rm -f "${instance.path}"`)
          this.context.logger.info(`符号链接已删除: ${instance.path}`)
        } catch (error) {
          this.context.logger.warn('删除符号链接时出现警告:', error.message)
        }
      }

      // 2. 删除实际文件
      try {
        await access(instance.realPath)
        await execAsync(`rm -rf "${instance.realPath}"`)
        this.context.logger.info(`实际文件已删除: ${instance.realPath}`)
      } catch (accessError) {
        // 文件不存在,直接从配置中删除
        this.context.logger.info(`应用文件已不存在,从配置中移除: ${instance.name}`)
      }

      this.instances.delete(instanceId)
      await this.saveConfig()

      this.context.logger.info(`实例删除成功: ${instance.name}`)
    } catch (error) {
      this.context.logger.error('删除实例失败:', error)
      throw error
    }
  }

  /**
   * 重建分身实例
   * 用于微信版本更新后,基于新版本重建分身,保留配置
   */
  async rebuildInstance(instanceId) {
    const totalSteps = 9

    const instance = this.instances.get(instanceId)

    if (!instance) {
      throw new Error('实例不存在')
    }

    this.context.logger.info(`重建实例: ${instance.name}`)

    // 1. 开始进度报告
    this.context.api.progress.start(`更新版本 - ${instance.name}`, totalSteps)

    try {
      // 2. 检查微信安装
      this.context.api.progress.update(1, '检查微信安装', '正在检查微信是否已安装...')
      const isInstalled = await this.checkWeChatInstalled()
      if (!isInstalled) {
        throw new Error('微信未安装，无法重建分身')
      }

      // 3. 请求文件写入权限
      this.context.api.progress.update(2, '请求权限', '请求文件写入权限...')
      const hasPermission = await this.context.api.permission.request('fs:write', {
        reason: '重建微信分身需要删除旧文件并创建新文件',
        context: {
          operation: '重建应用',
          target: instance.name
        }
      })

      if (!hasPermission) {
        throw new Error('未授予文件写入权限，无法重建微信分身')
      }

      // 4. 删除旧分身(但不删除配置)
      this.context.api.progress.update(3, '删除旧文件', '正在删除旧的分身文件...')

      // 删除符号链接
      if (instance.path !== instance.realPath) {
        try {
          await access(instance.path)
          await execAsync(`rm -f "${instance.path}"`)
          this.context.logger.info(`旧符号链接已删除: ${instance.path}`)
        } catch (error) {
          this.context.logger.warn('删除旧符号链接时出现警告:', error.message)
        }
      }

      // 删除实际文件
      try {
        await access(instance.realPath)
        await execAsync(`rm -rf "${instance.realPath}"`)
        this.context.logger.info(`旧实际文件已删除: ${instance.realPath}`)
      } catch (error) {
        this.context.logger.warn('删除旧实际文件时出现警告:', error.message)
      }

      // 5. 请求进程执行权限
      this.context.api.progress.update(4, '请求权限', '请求进程执行权限...')
      const hasExecPermission = await this.context.api.permission.request('process:exec', {
        reason: '重建微信分身需要执行系统命令进行复制和签名',
        context: {
          operation: '重建应用',
          target: instance.name
        }
      })

      if (!hasExecPermission) {
        throw new Error('未授予进程执行权限，无法重建微信分身')
      }

      // 6. 创建新分身(使用相同的实例编号)
      const instanceNumber = parseInt(instance.name.replace('WeChat', ''))
      const instanceName = instance.name
      const instancePath = join(INSTANCES_DIR, `${instanceName}.app`)
      const symlinkPath = join(SYSTEM_APPS_DIR, `${instanceName}.app`)
      const bundleId = instance.bundleId

      this.context.logger.info(`创建新分身: ${instanceName}`)

      // 7. 复制应用
      this.context.api.progress.update(5, '复制微信应用', `正在复制到 ${instancePath}...`)
      await this.copyWeChatApp(instancePath)

      // 8. 修改 Bundle ID
      this.context.api.progress.update(6, '修改应用标识', `修改 Bundle ID 为 ${bundleId}...`)
      await this.modifyBundleId(instancePath, bundleId, instanceName)

      // 9. 修改显示名称
      this.context.api.progress.update(7, '修改显示名称', `设置为: 微信${instanceNumber}`)
      await this.modifyWeChatDisplayName(instancePath, instanceNumber)

      // 10. 签名
      this.context.api.progress.update(8, '签名应用', '正在对应用进行代码签名...')
      await this.signApp(instancePath)

      // 创建符号链接
      this.context.logger.info(`创建符号链接: ${symlinkPath} -> ${instancePath}`)
      try {
        await execAsync(`rm -f "${symlinkPath}"`)
        await execAsync(`ln -s "${instancePath}" "${symlinkPath}"`)
        this.context.logger.info(`符号链接创建成功`)
      } catch (linkError) {
        this.context.logger.warn('创建符号链接失败(分身仍可用):', linkError.message)
      }

      // 11. 更新实例配置(保留原有的 id 和 createdAt)
      this.context.api.progress.update(9, '保存配置', '正在保存配置...')
      instance.path = symlinkPath
      instance.realPath = instancePath
      instance.wechatVersion = await this.getWeChatVersion() // 更新微信版本
      instance.rebuiltAt = new Date().toISOString() // 记录重建时间

      await this.saveConfig()

      this.context.logger.info(`分身重建成功: ${instanceName}`)

      // 12. 完成进度报告
      this.context.api.progress.complete('success')

      return {
        ...instance,
        wasRebuilt: true
      }
    } catch (error) {
      this.context.logger.error('重建分身失败:', error)
      this.context.api.progress.complete('error', error.message)
      throw error
    }
  }

  /**
   * 检查指定的应用路径是否是微信分身
   * 其他插件可以通过此方法识别由本插件创建的分身
   */
  static async isWeChatInstance(appPath) {
    try {
      const plistPath = join(appPath, 'Contents/Info.plist')
      const content = await readFile(plistPath, 'utf-8')

      // 检查是否包含分身标记
      return content.includes(`<key>${INSTANCE_MARKER}</key>`)
    } catch (error) {
      return false
    }
  }

  /**
   * 获取所有微信分身的路径
   * 其他插件可以用此方法扫描系统中的所有分身
   */
  static async scanInstances() {
    const instances = []

    try {
      const appsDir = INSTANCES_DIR
      const files = await readdir(appsDir)

      for (const file of files) {
        // 匹配 WeChat*.app 格式
        if (file.startsWith('WeChat') && file.endsWith('.app')) {
          const appPath = join(appsDir, file)

          // 检查是否是分身
          if (await this.isWeChatInstance(appPath)) {
            instances.push(appPath)
          }
        }
      }
    } catch (error) {
      console.error('扫描微信分身失败:', error)
    }

    return instances
  }

  async refreshInstancesStatus() {
    for (const [id, instance] of this.instances) {
      try {
        const { stdout } = await execAsync(`pgrep -f "${instance.name}"`)
        const isRunning = stdout.trim().length > 0

        if (instance.running !== isRunning) {
          instance.running = isRunning
          if (!isRunning) {
            instance.pid = undefined
          }
        }
      } catch (error) {
        instance.running = false
        instance.pid = undefined
      }
    }

    await this.saveConfig()
  }

  /**
   * 自动发现并纳入已存在的分身
   * 用于程序重装后恢复管理
   */
  async autoDiscoverInstances() {
    try {
      const discoveredInstances = await WeChatMultiInstancePlugin.scanInstances()
      this.context.logger.info(`扫描到 ${discoveredInstances.length} 个分身`)

      let addedCount = 0
      for (const appPath of discoveredInstances) {
        // 提取实例名称(如 WeChat3)
        const appName = basename(appPath, '.app')

        // 检查是否已经在管理中
        const alreadyManaged = Array.from(this.instances.values()).some(
          instance => instance.realPath === appPath || instance.path === appPath
        )

        if (!alreadyManaged) {
          // 读取 Info.plist 获取 Bundle ID
          const plistPath = join(appPath, 'Contents/Info.plist')
          const content = await readFile(plistPath, 'utf-8')

          // 提取 Bundle ID
          const bundleIdMatch = content.match(/<key>CFBundleIdentifier<\/key>\s*<string>(.+?)<\/string>/)
          const bundleId = bundleIdMatch ? bundleIdMatch[1] : `com.tencent.xin${appName}`

          // 符号链接路径
          const symlinkPath = join(SYSTEM_APPS_DIR, `${appName}.app`)

          // 创建实例对象
          const instance = {
            id: `instance-${Date.now()}-${addedCount}`,
            name: appName,
            path: symlinkPath,
            realPath: appPath,
            bundleId,
            createdAt: new Date().toISOString(), // 重新纳入管理的日期
            running: false,
            autoDiscovered: true // 标记为自动发现
          }

          this.instances.set(instance.id, instance)
          addedCount++
          this.context.logger.info(`自动纳入分身: ${appName}`)
        }
      }

      if (addedCount > 0) {
        await this.saveConfig()
        this.context.logger.info(`成功纳入 ${addedCount} 个分身`)
      }
    } catch (error) {
      this.context.logger.warn('自动发现分身失败:', error.message)
    }
  }

  getInstances() {
    return Array.from(this.instances.values())
  }

  getInstance(instanceId) {
    return this.instances.get(instanceId)
  }

  /**
   * 获取微信版本变化信息
   * 用于提示用户重建分身
   */
  getWeChatVersionChange() {
    return this.wechatVersionChanged || null
  }

  /**
   * 批量重建所有分身实例
   * 用于微信版本更新后,一次性更新所有分身
   */
  async rebuildAllInstances() {
    const instances = Array.from(this.instances.values())
    const totalInstances = instances.length

    if (totalInstances === 0) {
      throw new Error('没有可更新的分身')
    }

    this.context.logger.info(`批量重建 ${totalInstances} 个分身`)

    const results = {
      total: totalInstances,
      success: 0,
      failed: 0,
      errors: []
    }

    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i]
      const stepNumber = i + 1

      try {
        this.context.logger.info(`[${stepNumber}/${totalInstances}] 重建 ${instance.name}`)

        // 重建单个分身
        await this.rebuildInstance(instance.id)

        results.success++
        this.context.logger.info(`[${stepNumber}/${totalInstances}] ${instance.name} 重建成功`)
      } catch (error) {
        results.failed++
        results.errors.push({
          instance: instance.name,
          error: error.message
        })
        this.context.logger.error(`[${stepNumber}/${totalInstances}] ${instance.name} 重建失败:`, error)
      }
    }

    this.context.logger.info(`批量重建完成: 成功 ${results.success}, 失败 ${results.failed}`)

    return results
  }
}

// 创建插件实例的单例
let pluginInstance = null

module.exports = {
  onLoad: (context) => {
    if (!pluginInstance) {
      pluginInstance = new WeChatMultiInstancePlugin(context)
    }
    return pluginInstance.onLoad(context)
  },
  onEnable: (context) => {
    if (!pluginInstance) {
      pluginInstance = new WeChatMultiInstancePlugin(context)
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
  createInstance: (_context) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.createInstance()
  },
  deleteInstance: (_context, instanceId, deleteData) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.deleteInstance(instanceId, deleteData)
  },
  rebuildInstance: (_context, instanceId) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.rebuildInstance(instanceId)
  },
  getInstances: (_context) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.getInstances()
  },
  checkWeChatInstalled: (_context) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.checkWeChatInstalled()
  },
  getWeChatVersion: (_context) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.getWeChatVersion()
  },
  getInstance: (_context, instanceId) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.getInstance(instanceId)
  },
  getWeChatVersionChange: (_context) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.getWeChatVersionChange()
  },
  rebuildAllInstances: (_context) => {
    if (!pluginInstance) {
      throw new Error('Plugin not loaded')
    }
    return pluginInstance.rebuildAllInstances()
  },
  // 导出静态工具方法,供其他插件使用
  isWeChatInstance: WeChatMultiInstancePlugin.isWeChatInstance,
  scanInstances: WeChatMultiInstancePlugin.scanInstances
}
