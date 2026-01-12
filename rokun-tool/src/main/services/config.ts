/**
 * 配置存储服务
 *
 * 为插件提供配置持久化功能
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export class ConfigService {
  private configDir: string
  private cache: Map<string, any> = new Map()

  constructor(configDir: string) {
    this.configDir = configDir
  }

  /**
   * 获取配置值
   */
  async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    // 先从缓存读取
    if (this.cache.has(key)) {
      return this.cache.get(key) as T
    }

    try {
      const config = await this.loadConfig()
      const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], config)

      if (value === undefined) {
        return defaultValue as T
      }

      // 缓存值
      this.cache.set(key, value)
      return value as T
    } catch (error) {
      return defaultValue as T
    }
  }

  /**
   * 设置配置值
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const config = await this.loadConfig()

      // 将key转换为嵌套对象路径
      const keys = key.split('.')
      const lastKey = keys.pop()!
      let target = config

      for (const k of keys) {
        if (!target[k]) {
          target[k] = {}
        }
        target = target[k]
      }

      target[lastKey] = value

      // 保存配置
      await this.saveConfig(config)

      // 更新缓存
      this.cache.set(key, value)
    } catch (error) {
      console.error('Failed to set config:', error)
      throw error
    }
  }

  /**
   * 删除配置值
   */
  async delete(key: string): Promise<void> {
    try {
      const config = await this.loadConfig()

      // 将key转换为嵌套对象路径
      const keys = key.split('.')
      const lastKey = keys.pop()!
      let target = config

      for (const k of keys) {
        if (!target[k]) {
          return // 键不存在,直接返回
        }
        target = target[k]
      }

      delete target[lastKey]

      // 保存配置
      await this.saveConfig(config)

      // 清除缓存
      this.cache.delete(key)
    } catch (error) {
      console.error('Failed to delete config:', error)
      throw error
    }
  }

  /**
   * 检查配置是否存在
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key, undefined)
    return value !== undefined
  }

  /**
   * 加载配置文件
   */
  private async loadConfig(): Promise<any> {
    try {
      const configPath = join(this.configDir, 'config.json')
      const data = await readFile(configPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      // 配置文件不存在,返回空对象
      return {}
    }
  }

  /**
   * 保存配置文件
   */
  private async saveConfig(config: any): Promise<void> {
    try {
      // 确保配置目录存在
      await mkdir(this.configDir, { recursive: true })

      const configPath = join(this.configDir, 'config.json')
      await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to save config:', error)
      throw error
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }
}
