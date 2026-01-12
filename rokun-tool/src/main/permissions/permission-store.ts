/**
 * 权限存储
 *
 * 负责权限状态的持久化存储
 */

import { app } from 'electron'
import { join } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { PermissionStatus, type PluginPermissionState } from './permission-manager'

/**
 * 存储数据格式
 */
interface PermissionStoreData {
  version: number
  plugins: Record<string, PluginPermissionState>
}

export class PermissionStore {
  private storeFile: string
  private cache: Record<string, PluginPermissionState> = {}
  private initialized = false

  constructor() {
    const userData = app.getPath('userData')
    const permissionsDir = join(userData, 'permissions')
    this.storeFile = join(permissionsDir, 'state.json')
  }

  /**
   * 初始化存储
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      await this.load()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize permission store:', error)
      // 如果加载失败,创建空存储
      this.cache = {}
      this.initialized = true
    }
  }

  /**
   * 加载存储数据
   */
  private async load(): Promise<void> {
    try {
      const data = await readFile(this.storeFile, 'utf-8')
      const storeData: PermissionStoreData = JSON.parse(data)

      // 验证版本
      if (storeData.version !== 1) {
        console.warn(`Unsupported permission store version: ${storeData.version}`)
        this.cache = {}
        return
      }

      this.cache = storeData.plugins
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to load permission store:', error)
      }
      this.cache = {}
    }
  }

  /**
   * 保存存储数据
   */
  private async save(): Promise<void> {
    try {
      const dir = join(this.storeFile, '..')
      await mkdir(dir, { recursive: true })

      const storeData: PermissionStoreData = {
        version: 1,
        plugins: this.cache
      }

      await writeFile(this.storeFile, JSON.stringify(storeData, null, 2))
    } catch (error) {
      console.error('Failed to save permission store:', error)
      throw error
    }
  }

  /**
   * 获取插件权限状态
   */
  getPluginState(pluginId: string): PluginPermissionState | null {
    if (!this.initialized) {
      console.warn('PermissionStore not initialized')
      return null
    }

    const state = this.cache[pluginId]
    if (!state) {
      return null
    }

    // 返回副本,避免直接修改缓存
    return {
      pluginId: state.pluginId,
      permissions: { ...state.permissions },
      requestedAt: state.requestedAt ? { ...state.requestedAt } : undefined,
      history: [...state.history]
    }
  }

  /**
   * 保存插件权限状态
   */
  async savePluginState(state: PluginPermissionState): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    // 保存副本到缓存
    this.cache[state.pluginId] = {
      pluginId: state.pluginId,
      permissions: { ...state.permissions },
      requestedAt: state.requestedAt ? { ...state.requestedAt } : undefined,
      history: [...state.history]
    }

    await this.save()
  }

  /**
   * 删除插件权限状态
   */
  async deletePluginState(pluginId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    delete this.cache[pluginId]
    await this.save()
  }

  /**
   * 获取所有插件状态
   */
  getAllPluginStates(): Record<string, PluginPermissionState> {
    if (!this.initialized) {
      console.warn('PermissionStore not initialized')
      return {}
    }

    const result: Record<string, PluginPermissionState> = {}
    for (const [pluginId, state] of Object.entries(this.cache)) {
      result[pluginId] = {
        pluginId: state.pluginId,
        permissions: { ...state.permissions },
        requestedAt: state.requestedAt ? { ...state.requestedAt } : undefined,
        history: [...state.history]
      }
    }
    return result
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    this.cache = {}
    await this.save()
  }

  /**
   * 获取存储统计信息
   */
  getStats(): {
    totalPlugins: number
    totalGrantedPermissions: number
    totalDeniedPermissions: number
    totalHistoryEntries: number
  } {
    if (!this.initialized) {
      return {
        totalPlugins: 0,
        totalGrantedPermissions: 0,
        totalDeniedPermissions: 0,
        totalHistoryEntries: 0
      }
    }

    let totalGranted = 0
    let totalDenied = 0
    let totalHistory = 0

    for (const state of Object.values(this.cache)) {
      for (const status of Object.values(state.permissions)) {
        if (status === PermissionStatus.GRANTED) {
          totalGranted++
        } else if (status === PermissionStatus.DENIED) {
          totalDenied++
        }
      }
      totalHistory += state.history.length
    }

    return {
      totalPlugins: Object.keys(this.cache).length,
      totalGrantedPermissions: totalGranted,
      totalDeniedPermissions: totalDenied,
      totalHistoryEntries: totalHistory
    }
  }
}
