/**
 * 权限管理器
 *
 * 增强版权限管理,支持:
 * - 运行时权限请求
 * - 权限状态跟踪 (granted/denied/pending)
 * - 权限历史记录
 * - 基础权限自动授予
 * - 敏感权限需要用户确认
 */

import { BrowserWindow, ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { PermissionService, type Permission } from './permission-service'
import { PermissionStore } from './permission-store'

/**
 * 权限状态
 */
export enum PermissionStatus {
  PENDING = 'pending',   // 未询问
  GRANTED = 'granted',   // 已授予
  DENIED = 'denied'      // 已拒绝
}

/**
 * 权限请求上下文
 */
export interface PermissionRequestContext {
  operation: string      // 例如: "复制微信应用"
  target?: string        // 例如: "/Applications/WeChat2.app"
}

/**
 * 权限请求
 */
export interface PermissionRequest {
  id: string
  pluginId: string
  pluginName: string
  permission: Permission
  reason?: string
  context?: PermissionRequestContext
  requestedAt: Date
}

/**
 * 权限请求响应
 */
export interface PermissionResponse {
  requestId: string
  granted: boolean
  permission: Permission
}

/**
 * 权限历史记录
 */
export interface PermissionHistoryEntry {
  permission: Permission
  status: PermissionStatus
  timestamp: number
  source: 'user' | 'system' | 'auto'
  context?: PermissionRequestContext
}

/**
 * 插件权限状态
 */
export interface PluginPermissionState {
  pluginId: string
  permissions: Record<Permission, PermissionStatus>
  requestedAt?: Record<Permission, number>
  history: PermissionHistoryEntry[]
}

/**
 * 基础权限 (自动授予,无需用户确认)
 */
const BASIC_PERMISSIONS: Set<Permission> = new Set([
  'fs:read',
  'config:read',
  'notification:show'
])

/**
 * 敏感权限 (需要用户确认)
 */
const SENSITIVE_PERMISSIONS: Set<Permission> = new Set([
  'fs:write',
  'process:spawn',
  'process:exec',
  'shell:execute',
  'network:http',
  'clipboard:read',
  'clipboard:write',
  'window:open',
  'config:write'
] as Permission[])

export class PermissionManager {
  private permissionService: PermissionService
  private store: PermissionStore
  private permissionStates: Map<string, PluginPermissionState> = new Map()
  private pendingRequests: Map<string, PermissionRequest> = new Map()
  private mainWindow: BrowserWindow | null = null

  constructor(permissionService?: PermissionService, store?: PermissionStore) {
    this.permissionService = permissionService || new PermissionService()
    this.store = store || new PermissionStore()
  }

  /**
   * 初始化权限管理器
   */
  async initialize(): Promise<void> {
    await this.store.initialize()

    // 从存储加载所有插件状态到内存
    const allStates = this.store.getAllPluginStates()
    for (const [pluginId, state] of Object.entries(allStates)) {
      this.permissionStates.set(pluginId, state)
    }
  }

  /**
   * 设置主窗口,用于发送权限请求事件
   */
  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window
  }

  /**
   * 检查权限
   */
  checkPermission(pluginId: string, permission: Permission): PermissionStatus {
    // 1. 检查是否是基础权限 (自动授予)
    if (BASIC_PERMISSIONS.has(permission)) {
      return PermissionStatus.GRANTED
    }

    // 2. 检查已授予的权限
    if (this.permissionService.hasPermission(pluginId, permission)) {
      return PermissionStatus.GRANTED
    }

    // 3. 检查是否已明确拒绝
    const state = this.permissionStates.get(pluginId)
    if (state && state.permissions[permission]) {
      return state.permissions[permission]
    }

    // 4. 未询问过
    return PermissionStatus.PENDING
  }

  /**
   * 请求权限
   *
   * @param pluginId 插件ID
   * @param permission 权限类型
   * @param reason 为什么需要此权限
   * @param context 权限使用上下文
   * @returns Promise<boolean> 是否授予权限
   */
  async requestPermission(
    pluginId: string,
    permission: Permission,
    reason?: string,
    context?: PermissionRequestContext
  ): Promise<boolean> {
    // 1. 基础权限直接授予
    if (BASIC_PERMISSIONS.has(permission)) {
      await this.grantPermission(pluginId, permission, 'auto')
      return true
    }

    // 2. 检查当前状态
    const currentStatus = this.checkPermission(pluginId, permission)
    if (currentStatus === PermissionStatus.GRANTED) {
      return true
    }
    if (currentStatus === PermissionStatus.DENIED) {
      return false
    }

    // 3. 发送权限请求到渲染进程
    const requestId = uuidv4()
    const request: PermissionRequest = {
      id: requestId,
      pluginId,
      pluginName: pluginId, // TODO: 从 plugin registry 获取真实名称
      permission,
      reason,
      context,
      requestedAt: new Date()
    }

    this.pendingRequests.set(requestId, request)

    try {
      // 发送事件到渲染进程
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        // 延迟一小段时间,确保渲染进程已经准备好接收事件
        await new Promise(resolve => setTimeout(resolve, 100))

        console.log('[PermissionManager] 发送权限请求事件到渲染进程:', request)
        this.mainWindow.webContents.send('permission:request', request)
        console.log('[PermissionManager] 权限请求事件已发送')
      } else {
        console.error('[PermissionManager] 主窗口不可用,无法发送权限请求事件')
      }

      // 等待用户响应 (超时 5 分钟)
      const response = await this.waitForResponse(requestId, 5 * 60 * 1000)

      // 4. 处理用户响应
      if (response.granted) {
        await this.grantPermission(pluginId, permission, 'user', context)
      } else {
        await this.denyPermission(pluginId, permission, 'user', context)
      }

      return response.granted
    } finally {
      this.pendingRequests.delete(requestId)
    }
  }

  /**
   * 等待用户响应
   */
  private waitForResponse(requestId: string, timeout: number): Promise<PermissionResponse> {
    return new Promise((resolve, reject) => {
      console.log('[PermissionManager] 开始等待响应, requestId:', requestId)

      const timeoutId = setTimeout(() => {
        console.error('[PermissionManager] 权限请求超时, requestId:', requestId)
        // 清理监听器
        ipcMain.removeListener('permission:response', handleResponse)
        reject(new Error('权限请求超时'))
      }, timeout)

      const handleResponse = (_event: any, response: PermissionResponse) => {
        console.log('[PermissionManager] 收到权限响应:', { requestId, responseRequestId: response.requestId, granted: response.granted })

        if (response.requestId === requestId) {
          console.log('[PermissionManager] 响应ID匹配,解析Promise')
          clearTimeout(timeoutId)
          ipcMain.removeListener('permission:response', handleResponse)
          resolve(response)
        } else {
          console.log('[PermissionManager] 响应ID不匹配,忽略')
        }
      }

      console.log('[PermissionManager] 注册权限响应监听器')
      ipcMain.on('permission:response', handleResponse)
    })
  }

  /**
   * 授予权限
   */
  async grantPermission(
    pluginId: string,
    permission: Permission,
    source: 'user' | 'system' | 'auto' = 'user',
    context?: PermissionRequestContext
  ): Promise<void> {
    console.log('[PermissionManager] 授予权限:', { pluginId, permission, source })

    // 更新 PermissionService
    await this.permissionService.grantPermissions(pluginId, [permission])
    console.log('[PermissionManager] PermissionService 已更新')

    // 更新状态
    const state = this.getOrCreateState(pluginId)
    state.permissions[permission] = PermissionStatus.GRANTED
    if (!state.requestedAt) {
      state.requestedAt = {} as Record<Permission, number>
    }
    state.requestedAt[permission] = Date.now()

    // 添加历史记录
    state.history.push({
      permission,
      status: PermissionStatus.GRANTED,
      timestamp: Date.now(),
      source,
      context
    })

    this.permissionStates.set(pluginId, state)
    await this.saveState(pluginId)
    console.log('[PermissionManager] 权限状态已保存')

    // 发送状态变更事件
    this.broadcastPermissionChange(pluginId, permission, PermissionStatus.GRANTED)
    console.log('[PermissionManager] 权限授予完成')
  }

  /**
   * 拒绝权限
   */
  async denyPermission(
    pluginId: string,
    permission: Permission,
    source: 'user' | 'system',
    context?: PermissionRequestContext
  ): Promise<void> {
    // 更新状态
    const state = this.getOrCreateState(pluginId)
    state.permissions[permission] = PermissionStatus.DENIED
    if (!state.requestedAt) {
      state.requestedAt = {} as Record<Permission, number>
    }
    state.requestedAt[permission] = Date.now()

    // 添加历史记录
    state.history.push({
      permission,
      status: PermissionStatus.DENIED,
      timestamp: Date.now(),
      source,
      context
    })

    this.permissionStates.set(pluginId, state)
    await this.saveState(pluginId)

    // 发送状态变更事件
    this.broadcastPermissionChange(pluginId, permission, PermissionStatus.DENIED)
  }

  /**
   * 撤销权限
   */
  async revokePermission(pluginId: string, permission: Permission): Promise<void> {
    // 从 PermissionService 撤销
    await this.permissionService.revokePermissions(pluginId, [permission])

    // 更新状态
    const state = this.permissionStates.get(pluginId)
    if (state) {
      state.permissions[permission] = PermissionStatus.DENIED
      state.history.push({
        permission,
        status: PermissionStatus.DENIED,
        timestamp: Date.now(),
        source: 'user'
      })
      await this.saveState(pluginId)
    }

    // 发送状态变更事件
    this.broadcastPermissionChange(pluginId, permission, PermissionStatus.DENIED)
  }

  /**
   * 获取插件权限状态
   */
  getPermissionStatus(pluginId: string): Record<Permission, PermissionStatus> {
    const state = this.permissionStates.get(pluginId)
    if (!state) {
      return {} as Record<Permission, PermissionStatus>
    }
    return { ...state.permissions }
  }

  /**
   * 获取插件权限历史
   */
  getPermissionHistory(pluginId: string): PermissionHistoryEntry[] {
    const state = this.permissionStates.get(pluginId)
    if (!state) {
      return []
    }
    return [...state.history]
  }

  /**
   * 获取完整的插件权限状态
   */
  getPluginState(pluginId: string): PluginPermissionState | null {
    const state = this.permissionStates.get(pluginId)
    if (!state) {
      return null
    }
    return {
      pluginId: state.pluginId,
      permissions: { ...state.permissions },
      requestedAt: state.requestedAt ? { ...state.requestedAt } : undefined,
      history: [...state.history]
    }
  }

  /**
   * 获取或创建插件状态
   */
  private getOrCreateState(pluginId: string): PluginPermissionState {
    let state = this.permissionStates.get(pluginId)
    if (!state) {
      state = {
        pluginId,
        permissions: {} as Record<Permission, PermissionStatus>,
        history: []
      }
      this.permissionStates.set(pluginId, state)
    }
    return state
  }

  /**
   * 保存状态到磁盘
   */
  private async saveState(pluginId: string): Promise<void> {
    const state = this.permissionStates.get(pluginId)
    if (state) {
      await this.store.savePluginState(state)
    }
  }

  /**
   * 广播权限状态变更
   */
  private broadcastPermissionChange(
    pluginId: string,
    permission: Permission,
    status: PermissionStatus
  ): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('permission:changed', {
        pluginId,
        permission,
        status
      })
    }
  }

  /**
   * 处理权限请求响应
   */
  handlePermissionResponse(_response: PermissionResponse): void {
    // 响应由 waitForResponse 处理
    // 这个方法只是占位符,表明响应会被处理
  }

  /**
   * 检查是否是基础权限
   */
  isBasicPermission(permission: Permission): boolean {
    return BASIC_PERMISSIONS.has(permission)
  }

  /**
   * 检查是否是敏感权限
   */
  isSensitivePermission(permission: Permission): boolean {
    return SENSITIVE_PERMISSIONS.has(permission)
  }

  /**
   * 获取所有权限类型
   */
  getAllPermissions(): Permission[] {
    return [
      'fs:read',
      'fs:write',
      'process:spawn',
      'process:exec',
      'network:http',
      'shell:execute',
      'clipboard:read',
      'clipboard:write',
      'notification:show',
      'window:open',
      'config:read',
      'config:write'
    ]
  }
}
