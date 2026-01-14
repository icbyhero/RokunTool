/**
 * 配置修改回滚辅助类
 *
 * 提供带自动回滚能力的配置文件修改方法
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'

export interface ConfigModifyOptions<T> {
  validate?: (config: T) => boolean
  backup?: boolean
  backupPath?: string
}

/**
 * 修改JSON配置(带回滚)
 *
 * @param filePath 配置文件路径
 * @param modifier 修改函数
 * @param options 选项
 * @returns Promise<回滚函数>
 *
 * @example
 * ```typescript
 * const rollback = await modifyJsonWithRollback(
 *   '/path/to/config.json',
 *   (config) => {
 *     config.setting = 'new value'
 *     return config
 *   },
 *   { validate: (c) => 'setting' in c }
 * )
 * try {
 *   // 使用新配置
 * } catch (error) {
 *   await rollback() // 恢复配置
 *   throw error
 * }
 * ```
 */
export async function modifyJsonWithRollback<T = any>(
  filePath: string,
  modifier: (config: T) => T,
  options: ConfigModifyOptions<T> = {}
): Promise<() => Promise<void>> {
  const { validate, backup = true, backupPath } = options

  // 检查文件是否存在
  if (!existsSync(filePath)) {
    throw new Error(`配置文件不存在: ${filePath}`)
  }

  // 读取原始配置
  let originalContent: string
  let originalConfig: T

  try {
    originalContent = readFileSync(filePath, 'utf-8')
    originalConfig = JSON.parse(originalContent)
  } catch (error) {
    throw new Error(`读取配置文件失败: ${error instanceof Error ? error.message : String(error)}`)
  }

  // 备份原始配置
  if (backup) {
    const backupFilePath = backupPath || `${filePath}.backup.${Date.now()}`
    try {
      writeFileSync(backupFilePath, originalContent, 'utf-8')
    } catch (error) {
      throw new Error(`备份配置文件失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  try {
    // 修改配置
    const newConfig = modifier(originalConfig)

    // 验证新配置
    if (validate && !validate(newConfig)) {
      throw new Error('新配置验证失败')
    }

    // 写入新配置
    const newContent = JSON.stringify(newConfig, null, 2)
    writeFileSync(filePath, newContent, 'utf-8')

    // 返回回滚函数
    return async () => {
      try {
        // 验证当前配置是否有效
        const currentContent = readFileSync(filePath, 'utf-8')
        let currentConfig: T
        try {
          currentConfig = JSON.parse(currentContent)
        } catch (error) {
          // 当前配置损坏,直接恢复
          console.warn('[modifyJsonWithRollback] 当前配置损坏,正在恢复...')
          writeFileSync(filePath, originalContent, 'utf-8')
          return
        }

        // 如果有验证函数且当前配置无效,恢复原始配置
        if (validate && !validate(currentConfig)) {
          console.warn('[modifyJsonWithRollback] 当前配置无效,正在恢复...')
          writeFileSync(filePath, originalContent, 'utf-8')
          return
        }

        // 否则恢复原始配置
        writeFileSync(filePath, originalContent, 'utf-8')
      } catch (error) {
        console.error(`[modifyJsonWithRollback] 回滚失败:`, error)
        throw error
      }
    }
  } catch (error) {
    // 如果修改失败,尝试恢复原始配置
    try {
      writeFileSync(filePath, originalContent, 'utf-8')
    } catch (restoreError) {
      console.error('[modifyJsonWithRollback] 恢复配置失败:', restoreError)
    }
    throw error
  }
}

/**
 * 修改配置项(带回滚)
 *
 * @param filePath 配置文件路径
 * @param key 配置键(支持点号分隔的嵌套路径,如 'server.port')
 * @param value 新值
 * @param options 选项
 * @returns Promise<回滚函数>
 *
 * @example
 * ```typescript
 * const rollback = await modifyConfigValueWithRollback(
 *   '/path/to/config.json',
 *   'server.port',
 *   8080
 * )
 * try {
 *   // 使用新配置
 * } catch (error) {
 *   await rollback() // 恢复配置
 *   throw error
 * }
 * ```
 */
export async function modifyConfigValueWithRollback<T = any>(
  filePath: string,
  key: string,
  value: any,
  options: ConfigModifyOptions<T> = {}
): Promise<() => Promise<void>> {
  return modifyJsonWithRollback(
    filePath,
    (config) => {
      const keys = key.split('.')
      let current: any = config
      const keyPath = []

      for (let i = 0; i < keys.length - 1; i++) {
        keyPath.push(keys[i])
        if (!(keys[i] in current)) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return config
    },
    options
  )
}

/**
 * 批量修改配置项(带回滚)
 *
 * @param filePath 配置文件路径
 * @param changes 修改对象 { key: value }
 * @param options 选项
 * @returns Promise<回滚函数>
 *
 * @example
 * ```typescript
 * const rollback = await modifyConfigValuesWithRollback(
 *   '/path/to/config.json',
 *   {
 *     'server.port': 8080,
 *     'server.host': 'localhost'
 *   }
 * )
 * ```
 */
export async function modifyConfigValuesWithRollback<T = any>(
  filePath: string,
  changes: Record<string, any>,
  options: ConfigModifyOptions<T> = {}
): Promise<() => Promise<void>> {
  return modifyJsonWithRollback(
    filePath,
    (config) => {
      for (const [key, value] of Object.entries(changes)) {
        const keys = key.split('.')
        let current: any = config

        for (let i = 0; i < keys.length - 1; i++) {
          if (!(keys[i] in current)) {
            current[keys[i]] = {}
          }
          current = current[keys[i]]
        }

        current[keys[keys.length - 1]] = value
      }

      return config
    },
    options
  )
}

/**
 * 删除配置项(带回滚)
 *
 * @param filePath 配置文件路径
 * @param key 配置键
 * @param options 选项
 * @returns Promise<回滚函数>
 *
 * @example
 * ```typescript
 * const rollback = await deleteConfigValueWithRollback(
 *   '/path/to/config.json',
 *   'deprecated.setting'
 * )
 * ```
 */
export async function deleteConfigValueWithRollback<T = any>(
  filePath: string,
  key: string,
  options: ConfigModifyOptions<T> = {}
): Promise<() => Promise<void>> {
  // 先保存原始值
  let originalValue: any = null
  let valueExists = false

  try {
    const content = readFileSync(filePath, 'utf-8')
    const config = JSON.parse(content)
    const keys = key.split('.')
    let current: any = config

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        break
      }
      current = current[keys[i]]
    }

    const lastKey = keys[keys.length - 1]
    if (lastKey in current) {
      valueExists = true
      originalValue = current[lastKey]
    }
  } catch (error) {
    // 忽略错误
  }

  // 修改配置
  return modifyJsonWithRollback(
    filePath,
    (config) => {
      const keys = key.split('.')
      let current: any = config

      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          break
        }
        current = current[keys[i]]
      }

      const lastKey = keys[keys.length - 1]
      if (lastKey in current) {
        delete current[lastKey]
      }

      return config
    },
    options
  )
}
