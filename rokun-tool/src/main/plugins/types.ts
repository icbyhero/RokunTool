/**
 * 插件系统类型定义
 */

export interface PluginMetadata {
  /** 插件唯一标识符 */
  id: string
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version: string
  /** 插件描述 */
  description?: string
  /** 插件作者 */
  author?: string
  /** 插件权限列表 */
  permissions: Permission[]
  /** 插件入口文件 */
  main: string
  /** 是否已启用 */
  enabled?: boolean
}

export enum Permission {
  FS_READ = 'fs:read',
  FS_WRITE = 'fs:write',
  PROCESS_SPAWN = 'process:spawn',
  NETWORK = 'network',
  CLIPBOARD = 'clipboard',
  NOTIFICATION = 'notification'
}

export interface Plugin {
  metadata: PluginMetadata
  onLoad?(): Promise<void>
  onUnload?(): Promise<void>
}

export interface PluginLoadOptions {
  /** 是否自动启用插件 */
  autoEnable?: boolean
}

export interface PluginRegistryEntry {
  plugin: Plugin
  metadata: PluginMetadata
  loadedAt: Date
}
