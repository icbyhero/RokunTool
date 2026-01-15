/**
 * 环境配置管理
 *
 * 统一管理开发和生产环境配置,避免配置分散和遗漏
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { app } from 'electron'

/**
 * 环境类型
 */
export type Environment = 'development' | 'production'

/**
 * 配置接口
 */
export interface AppConfig {
  // 应用模式
  nodeEnv: Environment

  // 沙箱配置
  sandbox: {
    enabled: boolean
    timeout: number
    strict: boolean
  }

  // 插件配置
  plugin: {
    hotReload: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }

  // 权限配置
  permission: {
    enabled: boolean
    autoGrant: boolean
  }

  // UI 和调试配置
  ui: {
    devToolsAutoOpen: boolean
    showDebugInfo: boolean
  }

  // 性能监控
  performance: {
    monitoring: boolean
  }

  // 错误报告
  errorReporting: {
    enabled: boolean
  }

  // 文件系统
  fs: {
    userDataPath: string
  }

  // 更新配置
  update: {
    autoCheck: boolean
    checkInterval: number // 小时
  }
}

/**
 * 解析环境变量
 */
function parseEnvValue(value: string | undefined, defaultValue: any): any {
  if (value === undefined) return defaultValue

  // 布尔值
  if (value === 'true') return true
  if (value === 'false') return false

  // Infinity
  if (value === 'Infinity') return Infinity

  // 数字
  const num = Number(value)
  if (!isNaN(num)) return num

  // 字符串
  return value
}

/**
 * 读取 .env 文件
 */
function loadEnvFile(): Record<string, string> {
  const env: Record<string, string> = {}

  try {
    const envFile = app.isPackaged
      ? resolve(process.resourcesPath, '.env.production')
      : resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`)

    const content = readFileSync(envFile, 'utf-8')

    content.split('\n').forEach(line => {
      // 跳过注释和空行
      if (line.trim().startsWith('#') || !line.trim()) return

      // 解析 KEY=VALUE
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const [, key, value] = match
        env[key.trim()] = value.trim()
      }
    })

    console.log(`✅ 已加载环境配置: ${envFile}`)
  } catch (error) {
    console.warn(`⚠️  未找到环境配置文件,使用默认值`)
  }

  return env
}

/**
 * 获取配置
 */
export function getConfig(): AppConfig {
  // 加载环境变量
  const env = loadEnvFile()

  // 确定环境
  const nodeEnv: Environment = (parseEnvValue(env.NODE_ENV, process.env.NODE_ENV) || 'development') as Environment

  console.log(`🔧 当前环境: ${nodeEnv}`)

  // 沙箱配置
  const sandboxEnabled = parseEnvValue(env.SANDBOX_ENABLED, nodeEnv === 'production')
  const sandboxTimeout = parseEnvValue(env.SANDBOX_TIMEOUT, nodeEnv === 'production' ? 30000 : Infinity)
  const sandboxStrict = parseEnvValue(env.SANDBOX_STRICT, nodeEnv === 'production')

  console.log(`🛡️  沙箱配置: ${sandboxEnabled ? '✅ 启用' : '❌ 禁用'} (超时: ${sandboxTimeout === Infinity ? '无限制' : `${sandboxTimeout}ms`}, 严格: ${sandboxStrict})`)

  // 构建配置对象
  const config: AppConfig = {
    nodeEnv,

    sandbox: {
      enabled: sandboxEnabled,
      timeout: sandboxTimeout,
      strict: sandboxStrict
    },

    plugin: {
      hotReload: parseEnvValue(env.PLUGIN_HOT_RELOAD, nodeEnv === 'development'),
      logLevel: parseEnvValue(env.PLUGIN_LOG_LEVEL, nodeEnv === 'development' ? 'debug' : 'info')
    },

    permission: {
      enabled: parseEnvValue(env.PERMISSION_ENABLED, true),
      autoGrant: parseEnvValue(env.PERMISSION_AUTO_GRANT, nodeEnv === 'development')
    },

    ui: {
      devToolsAutoOpen: parseEnvValue(env.DEVTOOLS_AUTO_OPEN, nodeEnv === 'development'),
      showDebugInfo: parseEnvValue(env.SHOW_DEBUG_INFO, nodeEnv === 'development')
    },

    performance: {
      monitoring: parseEnvValue(env.PERFORMANCE_MONITORING, true)
    },

    errorReporting: {
      enabled: parseEnvValue(env.ERROR_REPORTING_ENABLED, nodeEnv === 'production')
    },

    fs: {
      userDataPath: parseEnvValue(
        env.USER_DATA_PATH,
        nodeEnv === 'development'
          ? '~/Library/Application Support/RokunTool/dev'
          : app.getPath('userData')
      )
    },

    update: {
      autoCheck: parseEnvValue(env.AUTO_UPDATE_ENABLED, nodeEnv === 'production'),
      checkInterval: parseEnvValue(env.UPDATE_CHECK_INTERVAL, 24)
    }
  }

  return config
}

/**
 * 全局配置实例(懒加载)
 */
let _config: AppConfig | null = null

/**
 * 获取全局配置(单例)
 */
export function getGlobalConfig(): AppConfig {
  if (!_config) {
    _config = getConfig()
  }
  return _config
}

/**
 * 检查是否为开发模式
 */
export function isDevelopment(): boolean {
  return getGlobalConfig().nodeEnv === 'development'
}

/**
 * 检查是否为生产模式
 */
export function isProduction(): boolean {
  return getGlobalConfig().nodeEnv === 'production'
}

/**
 * 是否启用沙箱
 */
export function isSandboxEnabled(): boolean {
  return getGlobalConfig().sandbox.enabled
}

/**
 * 获取沙箱配置
 */
export function getSandboxConfig() {
  const config = getGlobalConfig()
  return {
    enabled: config.sandbox.enabled,
    timeout: config.sandbox.timeout,
    strict: config.sandbox.strict
  }
}
