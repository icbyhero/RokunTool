/**
 * 插件系统类型定义
 *
 * 定义了插件的所有核心类型,包括:
 * - 插件元数据
 * - 插件生命周期钩子
 * - 插件API
 * - 权限系统
 * - 插件状态
 */

/**
 * 插件元数据
 * 每个插件必须提供完整的元数据信息
 */
export interface PluginMetadata {
  /** 插件唯一标识符 (格式: publisher-name) */
  id: string

  /** 插件显示名称 */
  name: string

  /** 插件版本 (语义化版本) */
  version: string

  /** 插件描述 */
  description: string

  /** 插件作者 */
  author: string

  /** 插件许可证 */
  license: string

  /** 插件主页 URL */
  homepage?: string

  /** 插件图标 (相对路径或 base64) */
  icon?: string

  /** 最小要求的宿主应用版本 */
  minHostVersion?: string

  /** 插件所需的权限列表 */
  permissions: PluginPermission[]

  /** 插件入口文件路径 (相对于插件根目录) */
  main: string

  /** 插件类型 */
  type: 'tool' | 'extension' | 'theme'

  /** 插件标签 (用于分类和搜索) */
  tags?: string[]

  /** 插件依赖的其他插件 */
  dependencies?: string[]

  /** 插件是否已启用 */
  enabled?: boolean

  /** 插件是否正在加载 */
  loading?: boolean

  /** 插件错误信息 */
  error?: string

  /** 插件路由配置 (可选) */
  routes?: PluginRoute[]
}

/**
 * 插件权限类型
 */
export type PluginPermission =
  | 'fs:read' // 读取文件
  | 'fs:write' // 写入文件
  | 'process:spawn' // 启动进程
  | 'process:exec' // 执行命令
  | 'network:http' // HTTP 请求
  | 'shell:execute' // 执行 shell 命令
  | 'clipboard:read' // 读取剪贴板
  | 'clipboard:write' // 写入剪贴板
  | 'notification:show' // 显示通知
  | 'window:open' // 打开窗口
  | 'config:read' // 读取配置
  | 'config:write' // 写入配置

/**
 * 插件路由配置
 */
export interface PluginRoute {
  /** 路由路径 */
  path: string
  /** 路由组件 */
  component: any
  /** 路由标题 */
  title?: string
}

/**
 * 插件环境变量
 * 提供给插件的环境变量访问
 */
export interface PluginEnv {
  /** 用户主目录 */
  HOME: string
  /** 用户名 */
  USER?: string
  /** PATH 环境变量 */
  PATH?: string
  /** 其他环境变量 */
  [key: string]: string | undefined
}

/**
 * 插件上下文
 * 提供给插件的运行时环境
 */
export interface PluginContext {
  /** 插件元数据 */
  metadata: PluginMetadata

  /** 插件数据目录 (用于存储插件数据) */
  dataDir: string

  /** 插件环境变量 */
  env: PluginEnv

  /** 插件日志工具 */
  logger: {
    debug(message: string, ...args: any[]): void
    info(message: string, ...args: any[]): void
    warn(message: string, ...args: any[]): void
    error(message: string, ...args: any[]): void
  }

  /** 插件API */
  api: PluginAPI

  /** 插件路由 */
  router?: {
    push(path: string): void
    replace(path: string): void
    back(): void
  }
}

/**
 * 插件API
 * 插件可以调用的宿主应用功能
 */
export interface PluginAPI {
  /** 文件系统API */
  fs: {
    readFile(path: string): Promise<Buffer>
    writeFile(path: string, data: Buffer | string): Promise<void>
    readDir(path: string): Promise<string[]>
    stat(path: string): Promise<{ size: number; isFile: boolean; isDirectory: boolean }>
  }

  /** 进程管理API */
  process: {
    spawn(command: string, args?: string[]): Promise<number>
    exec(command: string): Promise<{ stdout: string; stderr: string }>
    kill(pid: number): Promise<void>
  }

  /** 剪贴板API */
  clipboard: {
    readText(): Promise<string>
    writeText(text: string): Promise<void>
    readImage(): Promise<Buffer>
    writeImage(buffer: Buffer): Promise<void>
    readHTML(): Promise<string>
    writeHTML(html: string, text?: string): Promise<void>
    clear(): Promise<void>
    readAvailableFormats(): Promise<string[]>
  }

  /** 通知API */
  notification: {
    show(options: {
      title: string
      body: string
      icon?: string
      silent?: boolean
      urgency?: 'normal' | 'critical' | 'low'
    }): Promise<void>
    close(notificationId: string): Promise<void>
    closeAll(): Promise<void>
  }

  /** 配置API */
  config: {
    get<T = any>(key: string): Promise<T>
    set(key: string, value: any): Promise<void>
    delete(key: string): Promise<void>
    has(key: string): Promise<boolean>
  }

  /** IPC通信API */
  ipc: {
    send(channel: string, ...args: any[]): void
    on(channel: string, callback: (...args: any[]) => void): void
    off(channel: string, callback: (...args: any[]) => void): void
  }

  /** UI API */
  ui: {
    showMessage(message: string, type?: 'info' | 'warning' | 'error'): void
    showNotification(title: string, body: string): void
    openWindow(url: string, options?: any): void
  }

  /** 权限 API */
  permission: {
    request(permission: PluginPermission, options?: {
      reason?: string
      context?: {
        operation: string
        target?: string
      }
    }): Promise<boolean>
    check(permission: PluginPermission): Promise<PermissionStatus>
    has(permission: PluginPermission): boolean

    /**
     * 批量检查权限(不弹出对话框)
     * 用于在执行功能前预检查所有需要的权限
     *
     * @param permissions 权限列表
     * @returns 权限检查结果
     */
    checkPermissions(permissions: PluginPermission[]): Promise<{
      hasPermanentDeny: boolean
      permanentlyDenied: PluginPermission[]
      pending: PluginPermission[]
      granted: PluginPermission[]
    }>

    /**
     * 批量请求权限
     * 用于一次性请求多个权限
     *
     * @param permissions 权限列表
     * @param reason 请求原因
     * @param context 操作上下文
     * @returns 权限请求结果
     */
    requestPermissions(
      permissions: PluginPermission[],
      reason?: string,
      context?: {
        operation: string
        target?: string
      }
    ): Promise<{
      allGranted: boolean
      results: Array<{
        permission: PluginPermission
        granted: boolean
        permanent?: boolean
      }>
    }>

    /**
     * 增强版批量检查权限 - 支持风险评估和推荐策略
     * 用于在执行功能前预检查所有需要的权限,并提供智能推荐
     *
     * @param featurePermissions 功能权限定义数组 (包含权限、是否必需、原因)
     * @returns 增强的权限检查结果 (包含风险等级和推荐策略)
     */
    checkPermissionsEnhanced(featurePermissions: Array<{
      permission: PluginPermission
      required: boolean
      reason?: string
    }>): Promise<{
      canProceed: boolean
      permanentlyDenied: Array<{
        permission: PluginPermission
        required: boolean
      }>
      pending: Array<{
        permission: PluginPermission
        required: boolean
      }>
      granted: Array<{
        permission: PluginPermission
        permanent: boolean
      }>
      riskLevel: 'low' | 'medium' | 'high'
      recommendation: 'auto_grant' | 'session_grant' | 'ask_user'
    }>

    /**
     * 功能级权限请求 - 显示包含风险评估和推荐策略的对话框
     * 用于在执行功能前一次性请求所有需要的权限
     *
     * @param featureName 功能名称 (如 "创建微信分身", "安装Rime配置")
     * @param featureDescription 功能描述 (可选)
     * @param featurePermissions 功能权限定义数组
     * @param context 操作上下文 (可选)
     * @returns 是否所有权限都已授予
     */
    requestFeaturePermissions(
      featureName: string,
      featurePermissions: Array<{
        permission: PluginPermission
        required: boolean
        reason?: string
      }>,
      featureDescription?: string,
      context?: {
        operation: string
        target?: string
      }
    ): Promise<boolean>
  }

  /** 进度反馈 API */
  progress: {
    /**
     * 报告操作开始
     * @param operation 操作名称 (如 "创建分身", "更新版本")
     * @param totalSteps 总步骤数 (可选,用于计算进度百分比)
     */
    start(operation: string, totalSteps?: number): void

    /**
     * 报告操作进度
     * @param currentStep 当前步骤 (从1开始)
     * @param stepName 当前步骤名称 (如 "复制微信应用", "修改Bundle ID")
     * @param details 详细信息 (可选,插件可以提供额外的日志信息)
     */
    update(currentStep: number, stepName?: string, details?: string): void

    /**
     * 报告操作完成
     * @param result 操作结果 (成功/失败)
     * @param error 错误信息 (如果失败)
     */
    complete(result: 'success' | 'error', error?: string): void
  }

  /** 事务 API */
  transaction: {
    /**
     * 执行事务 - 原子性执行多个操作步骤,失败时自动回滚
     *
     * @param transaction 事务对象 (包含步骤和配置)
     * @returns 事务执行结果
     *
     * @example
     * ```typescript
     * const result = await this.context.api.transaction.execute({
     *   id: 'install-recipe-123',
     *   name: '安装 Rime 配置方案',
     *   pluginId: this.context.metadata.id,
     *   steps: [
     *     {
     *       name: '检查冲突',
     *       execute: async () => { ... },
     *       rollback: async () => { ... }
     *     },
     *     {
     *       name: '安装方案',
     *       execute: async () => { ... },
     *       rollback: async () => { ... }
     *     }
     *   ]
     * })
     *
     * if (result.success) {
     *   this.context.ui.showMessage('安装成功!', 'info')
     * } else {
     *   this.context.ui.showMessage(`安装失败: ${result.error}`, 'error')
     * }
     * ```
     */
    execute(transaction: import('../../main/transactions').Transaction): Promise<import('../../main/transactions').TransactionResult>

    /**
     * 创建事务构建器 - 提供流式 API 来构建复杂事务
     *
     * @returns 事务构建器实例
     *
     * @example
     * ```typescript
     * const transaction = this.context.api.transaction.createBuilder()
     *   .id('create-instance-123')
     *   .name('创建微信分身')
     *   .pluginId(this.context.metadata.id)
     *   .addStep({
     *     name: '检查源文件',
     *     execute: async () => { ... }
     *   })
     *   .addStep({
     *     name: '复制应用',
     *     execute: async () => { ... },
     *     rollback: async () => { ... }
     *   })
     *   .addStep({
     *     name: '修改配置',
     *     execute: async () => { ... },
     *     rollback: async () => { ... }
     *   })
     *   .build()
     *
     * const result = await this.execute(transaction)
     * ```
     */
    createBuilder(): import('../../main/transactions').TransactionBuilder
  }

  /** 系统 API */
  system: {
    /**
     * 获取操作系统平台
     * @returns 平台标识符 ('darwin' | 'linux' | 'win32')
     */
    getPlatform(): Promise<'darwin' | 'linux' | 'win32'>

    /**
     * 获取系统架构
     * @returns 架构标识符 ('x64' | 'arm64' | 'arm' | 'ia32')
     */
    getArch(): Promise<'x64' | 'arm64' | 'arm' | 'ia32'>

    /**
     * 获取用户主目录
     * @returns 用户主目录路径
     */
    getHomeDir(): Promise<string>

    /**
     * 获取用户信息
     * @returns 用户信息对象
     */
    getUserInfo(): Promise<{
      username: string
      homedir: string
    }>
  }

  /** 路径工具 API */
  path: {
    /**
     * 连接路径片段
     * @param parts 路径片段
     * @returns 连接后的路径
     */
    join(...parts: string[]): string

    /**
     * 获取路径的 basename
     * @param path 路径
     * @returns basename
     */
    basename(path: string): string

    /**
     * 获取路径的 dirname
     * @param path 路径
     * @returns dirname
     */
    dirname(path: string): string

    /**
     * 解析为绝对路径
     * @param parts 路径片段
     * @returns 绝对路径
     */
    resolve(...parts: string[]): string
  }
}

/**
 * 权限状态
 */
export type PermissionStatus = 'pending' | 'granted' | 'denied'

/**
 * 插件生命周期钩子
 */
export interface PluginHooks {
  /** 插件加载时调用 */
  onLoad?(context: PluginContext): Promise<void> | void

  /** 插件启用时调用 */
  onEnable?(context: PluginContext): Promise<void> | void

  /** 插件禁用时调用 */
  onDisable?(context: PluginContext): Promise<void> | void

  /** 插件卸载时调用 */
  onUnload?(context: PluginContext): Promise<void> | void
}

/**
 * 插件实例
 * 运行时的插件对象
 */
export interface PluginInstance {
  /** 插件元数据 */
  metadata: PluginMetadata

  /** 插件状态 */
  status: PluginStatus

  /** 插件路径 */
  path: string

  /** 插件加载时间 */
  loadedAt: Date

  /** 插件导出的内容 */
  exports?: any

  /** 插件上下文 */
  context: PluginContext

  /** 插件钩子 */
  hooks: PluginHooks

  /** 启用插件 */
  enable(): Promise<void>

  /** 禁用插件 */
  disable(): Promise<void>

  /** 卸载插件 */
  unload(): Promise<void>
}

/**
 * 插件状态
 */
export type PluginStatus = 'loaded' | 'enabled' | 'disabled' | 'error'

/**
 * 插件包
 * 从磁盘加载的插件包,未实例化
 */
export interface PluginPackage {
  /** 插件元数据 */
  metadata: PluginMetadata

  /** 插件路径 */
  path: string

  /** 加载插件 */
  load(): Promise<PluginInstance>
}

/**
 * 插件加载选项
 */
export interface PluginLoadOptions {
  /** 是否自动启用 */
  autoEnable?: boolean

  /** 是否验证权限 */
  validatePermissions?: boolean

  /** 插件数据目录 */
  dataDir?: string
}

/**
 * 插件注册表
 * 管理所有已加载的插件
 */
export interface PluginRegistry {
  /** 所有已加载的插件 */
  plugins: Map<string, PluginInstance>

  /** 注册插件 */
  register(plugin: PluginInstance): void

  /** 注销插件 */
  unregister(pluginId: string): void

  /** 获取插件 */
  get(pluginId: string): PluginInstance | undefined

  /** 检查插件是否存在 */
  has(pluginId: string): boolean

  /** 获取所有插件 */
  getAll(): PluginInstance[]

  /** 获取启用的插件 */
  getEnabled(): PluginInstance[]

  /** 获取禁用的插件 */
  getDisabled(): PluginInstance[]
}
