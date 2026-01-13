/**
 * 会话权限管理器
 *
 * 管理仅在当前应用会话中有效的权限
 * 应用退出后,这些权限会自动失效
 */

import type { Permission } from './permission-service'

/**
 * 会话权限管理器
 */
export class SessionPermissionManager {
  private sessionPermissions: Map<string, Set<Permission>> = new Map()

  /**
   * 授予会话级权限
   */
  grant(pluginId: string, permission: Permission): void {
    if (!this.sessionPermissions.has(pluginId)) {
      this.sessionPermissions.set(pluginId, new Set())
    }
    this.sessionPermissions.get(pluginId)!.add(permission)
  }

  /**
   * 撤销会话级权限
   */
  revoke(pluginId: string, permission: Permission): void {
    this.sessionPermissions.get(pluginId)?.delete(permission)
  }

  /**
   * 检查是否有会话级权限
   */
  has(pluginId: string, permission: Permission): boolean {
    return this.sessionPermissions.get(pluginId)?.has(permission) || false
  }

  /**
   * 清除所有会话权限
   */
  clear(): void {
    this.sessionPermissions.clear()
  }

  /**
   * 清除特定插件的所有会话权限
   */
  clearPlugin(pluginId: string): void {
    this.sessionPermissions.delete(pluginId)
  }

  /**
   * 获取插件的所有会话权限
   */
  getPluginPermissions(pluginId: string): Permission[] {
    const permissions = this.sessionPermissions.get(pluginId)
    return permissions ? Array.from(permissions) : []
  }

  /**
   * 获取所有会话权限
   */
  getAllPermissions(): Record<string, Permission[]> {
    const result: Record<string, Permission[]> = {}
    for (const [pluginId, permissions] of this.sessionPermissions.entries()) {
      result[pluginId] = Array.from(permissions)
    }
    return result
  }
}
