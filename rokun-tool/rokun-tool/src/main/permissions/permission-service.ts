/**
 * 权限管理服务
 *
 * 管理插件权限申请、验证和持久化
 */

import { app } from 'electron'
import { join } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'

export type Permission =
  | 'fs:read'
  | 'fs:write'
  | 'process:spawn'
  | 'process:exec'
  | 'network:http'
  | 'shell:execute'
  | 'clipboard:read'
  | 'clipboard:write'
  | 'notification:show'
  | 'window:open'
  | 'config:read'
  | 'config:write'

export interface PermissionRequest {
  pluginId: string
  permissions: Permission[]
}

export interface PermissionGrant {
  pluginId: string
  permissions: Permission[]
  grantedAt: Date
}

export class PermissionService {
  private permissionsFile: string
  private grantedPermissions: Map<string, Permission[]> = new Map()

  constructor() {
    const userData = app.getPath('userData')
    const permissionsDir = join(userData, 'permissions')
    this.permissionsFile = join(permissionsDir, 'granted.json')
    this.loadPermissions()
  }

  /**
   * 加载已授予的权限
   */
  private async loadPermissions(): Promise<void> {
    try {
      const data = await readFile(this.permissionsFile, 'utf-8')
      const grants: PermissionGrant[] = JSON.parse(data)

      for (const grant of grants) {
        this.grantedPermissions.set(grant.pluginId, grant.permissions)
      }
    } catch (error) {
      // 文件不存在或读取失败,使用空Map
      this.grantedPermissions.clear()
    }
  }

  /**
   * 保存已授予的权限
   */
  private async savePermissions(): Promise<void> {
    try {
      const dir = join(this.permissionsFile, '..')
      await mkdir(dir, { recursive: true })

      const grants: PermissionGrant[] = Array.from(this.grantedPermissions.entries()).map(
        ([pluginId, permissions]) => ({
          pluginId,
          permissions,
          grantedAt: new Date()
        })
      )

      await writeFile(this.permissionsFile, JSON.stringify(grants, null, 2))
    } catch (error) {
      console.error('Failed to save permissions:', error)
    }
  }

  /**
   * 检查插件是否有某个权限
   */
  hasPermission(pluginId: string, permission: Permission): boolean {
    const permissions = this.grantedPermissions.get(pluginId)
    return permissions ? permissions.includes(permission) : false
  }

  /**
   * 检查插件是否有多个权限
   */
  hasPermissions(pluginId: string, permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(pluginId, p))
  }

  /**
   * 授予插件权限
   */
  async grantPermissions(pluginId: string, permissions: Permission[]): Promise<void> {
    const existing = this.grantedPermissions.get(pluginId) || []

    for (const permission of permissions) {
      if (!existing.includes(permission)) {
        existing.push(permission)
      }
    }

    this.grantedPermissions.set(pluginId, existing)
    await this.savePermissions()
  }

  /**
   * 撤销插件权限
   */
  async revokePermissions(pluginId: string, permissions: Permission[]): Promise<void> {
    const existing = this.grantedPermissions.get(pluginId)

    if (!existing) {
      return
    }

    const filtered = existing.filter((p) => !permissions.includes(p))

    if (filtered.length === 0) {
      this.grantedPermissions.delete(pluginId)
    } else {
      this.grantedPermissions.set(pluginId, filtered)
    }

    await this.savePermissions()
  }

  /**
   * 获取插件的所有权限
   */
  getPluginPermissions(pluginId: string): Permission[] {
    return this.grantedPermissions.get(pluginId) || []
  }

  /**
   * 撤销插件的所有权限
   */
  async revokeAll(pluginId: string): Promise<void> {
    this.grantedPermissions.delete(pluginId)
    await this.savePermissions()
  }

  /**
   * 获取所有已授予权限的插件
   */
  getAllPlugins(): string[] {
    return Array.from(this.grantedPermissions.keys())
  }
}
