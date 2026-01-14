/**
 * 批量权限管理类型定义
 * 用于事务性权限管理:先检查所有权限,再批量请求
 */

import type { PluginPermission } from './plugin'

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  /**
   * 是否有永久拒绝的权限
   */
  hasPermanentDeny: boolean

  /**
   * 永久拒绝的权限列表
   */
  permanentlyDenied: PluginPermission[]

  /**
   * 待确认的权限列表(pending 状态)
   */
  pending: PluginPermission[]

  /**
   * 已授予的权限列表(granted 状态)
   */
  granted: PluginPermission[]
}

/**
 * 单个权限的授予结果
 */
export interface PermissionGrant {
  /**
   * 权限名称
   */
  permission: PluginPermission

  /**
   * 是否已授予
   */
  granted: boolean

  /**
   * 是否为永久授权
   * (如果 granted 为 false,此字段无意义)
   */
  permanent?: boolean
}

/**
 * 批量权限请求结果
 */
export interface BatchPermissionResult {
  /**
   * 是否所有权限都已授予
   */
  allGranted: boolean

  /**
   * 每个权限的结果
   */
  results: PermissionGrant[]
}

/**
 * 批量权限请求选项
 */
export interface BatchPermissionOptions {
  /**
   * 请求原因
   */
  reason?: string

  /**
   * 操作上下文
   */
  context?: {
    operation: string
    target?: string
  }
}
