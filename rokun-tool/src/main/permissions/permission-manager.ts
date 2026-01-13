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
import { SessionPermissionManager } from './session-permission-manager'

/**
 * 权限状态
 */
export enum PermissionStatus {
  PENDING = 'pending',              // 未询问
  GRANTED = 'granted',              // 已授予
  DENIED = 'denied',                // 已拒绝(会话级,不持久化)
  PERMANENTLY_DENIED = 'permanently_denied'  // 永久拒绝
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
  sessionOnly?: boolean  // 是否仅会话级授权
}

/**
 * 批量权限请求
 */
export interface BatchPermissionRequest {
  id: string
  pluginId: string
  pluginName: string
  permissions: Permission[]
  reason?: string
  context?: PermissionRequestContext
  requestedAt: Date
}

/**
 * 批量权限请求响应
 */
export interface BatchPermissionResponse {
  requestId: string
  granted: boolean
  sessionOnly?: boolean  // 是否仅会话级授权
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
  private pendingBatchRequests: Map<string, BatchPermissionRequest> = new Map()
  private mainWindow: BrowserWindow | null = null
  private sessionPermissionManager: SessionPermissionManager

  constructor(permissionService?: PermissionService, store?: PermissionStore) {
    this.permissionService = permissionService || new PermissionService()
    this.store = store || new PermissionStore()
    this.sessionPermissionManager = new SessionPermissionManager()
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

    // 2. 检查会话权限
    if (this.sessionPermissionManager.has(pluginId, permission)) {
      return PermissionStatus.GRANTED
    }

    // 3. 检查永久权限
    if (this.permissionService.hasPermission(pluginId, permission)) {
      return PermissionStatus.GRANTED
    }

    // 4. 检查是否已明确拒绝
    const state = this.permissionStates.get(pluginId)
    if (state && state.permissions[permission]) {
      return state.permissions[permission]
    }

    // 5. 未询问过,返回 PENDING 触发权限请求
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

    // 注意:即使是 DENIED 状态也继续,允许用户重新请求
    // DENIED 状态只在会话期间记住,下次启动应用会重置

    // 3. 如果是 DENIED 状态,清除状态以便重新请求
    if (currentStatus === PermissionStatus.DENIED) {
      const state = this.permissionStates.get(pluginId)
      if (state) {
        delete state.permissions[permission]
      }
    }

    // 4. 发送权限请求到渲染进程
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
        if (response.sessionOnly) {
          // 会话级授权
          this.sessionPermissionManager.grant(pluginId, permission)
          console.log('[PermissionManager] 授予会话级权限:', { pluginId, permission })
        } else {
          // 永久授权
          await this.grantPermission(pluginId, permission, 'user', context)
        }
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
   * 等待批量权限用户响应
   */
  private waitForBatchResponse(requestId: string, timeout: number): Promise<BatchPermissionResponse> {
    return new Promise((resolve, reject) => {
      console.log('[PermissionManager] 开始等待批量权限响应, requestId:', requestId)

      const timeoutId = setTimeout(() => {
        console.error('[PermissionManager] 批量权限请求超时, requestId:', requestId)
        // 清理监听器
        ipcMain.removeListener('permission:batchResponse', handleResponse)
        reject(new Error('批量权限请求超时'))
      }, timeout)

      const handleResponse = (_event: any, response: BatchPermissionResponse) => {
        console.log('[PermissionManager] 收到批量权限响应:', { requestId, responseRequestId: response.requestId, granted: response.granted })

        if (response.requestId === requestId) {
          console.log('[PermissionManager] 批量权限响应ID匹配,解析Promise')
          clearTimeout(timeoutId)
          ipcMain.removeListener('permission:batchResponse', handleResponse)
          resolve(response)
        } else {
          console.log('[PermissionManager] 批量权限响应ID不匹配,忽略')
        }
      }

      console.log('[PermissionManager] 注册批量权限响应监听器')
      ipcMain.on('permission:batchResponse', handleResponse)
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
   *
   * 注意:拒绝的权限不会持久化,只在当前会话期间记住
   * 这样用户下次启动应用时可以重新请求权限
   */
  async denyPermission(
    pluginId: string,
    permission: Permission,
    source: 'user' | 'system',
    context?: PermissionRequestContext
  ): Promise<void> {
    // 更新状态 - 只在内存中设置 DENIED 状态,不持久化
    const state = this.getOrCreateState(pluginId)
    state.permissions[permission] = PermissionStatus.DENIED

    // 添加历史记录 - 记录到内存中,但不持久化
    state.history.push({
      permission,
      status: PermissionStatus.DENIED,
      timestamp: Date.now(),
      source,
      context
    })

    this.permissionStates.set(pluginId, state)

    // 注意:不调用 saveState,因此 DENIED 状态不会持久化
    // 这样下次启动应用时,权限状态会重置为 PENDING

    // 发送状态变更事件
    this.broadcastPermissionChange(pluginId, permission, PermissionStatus.DENIED)
  }

  /**
   * 撤销权限
   * 将已授予的权限重置为 pending 状态,下次插件请求时会重新询问
   */
  async revokePermission(pluginId: string, permission: Permission): Promise<void> {
    // 从 PermissionService 撤销
    await this.permissionService.revokePermissions(pluginId, [permission])

    // 更新状态为 pending (而不是 denied)
    const state = this.permissionStates.get(pluginId)
    if (state) {
      state.permissions[permission] = PermissionStatus.PENDING
      state.history.push({
        permission,
        status: PermissionStatus.PENDING,
        timestamp: Date.now(),
        source: 'user'
      })
      await this.saveState(pluginId)
    }

    // 发送状态变更事件
    this.broadcastPermissionChange(pluginId, permission, PermissionStatus.PENDING)
  }

  /**
   * 清除永久拒绝状态
   * 将权限状态从 permanently_denied 重置为 pending
   */
  async clearPermanentDeny(pluginId: string, permission: Permission): Promise<void> {
    // 更新状态
    const state = this.permissionStates.get(pluginId)
    if (state) {
      // 检查当前是否为永久拒绝状态
      if (state.permissions[permission] !== PermissionStatus.PERMANENTLY_DENIED) {
        throw new Error(`权限 ${permission} 不是永久拒绝状态`)
      }

      // 重置为 pending
      state.permissions[permission] = PermissionStatus.PENDING

      // 添加历史记录
      state.history.push({
        permission,
        status: PermissionStatus.PENDING,
        timestamp: Date.now(),
        source: 'user'
      })

      // 保存状态
      await this.saveState(pluginId)
    }

    // 发送状态变更事件
    this.broadcastPermissionChange(pluginId, permission, PermissionStatus.PENDING)
  }

  /**
   * 批量检查权限(不弹出对话框)
   * 用于插件在执行功能前预检查所有需要的权限
   *
   * @param pluginId 插件ID
   * @param permissions 需要检查的权限列表
   * @returns 权限检查结果
   */
  async checkPermissions(
    pluginId: string,
    permissions: Permission[]
  ): Promise<{
    hasPermanentDeny: boolean
    permanentlyDenied: Permission[]
    pending: Permission[]
    granted: Permission[]
  }> {
    const permanentlyDenied: Permission[] = []
    const pending: Permission[] = []
    const granted: Permission[] = []

    for (const permission of permissions) {
      const status = this.checkPermission(pluginId, permission)

      switch (status) {
        case PermissionStatus.PERMANENTLY_DENIED:
          permanentlyDenied.push(permission)
          break
        case PermissionStatus.PENDING:
          pending.push(permission)
          break
        case PermissionStatus.GRANTED:
          granted.push(permission)
          break
        case PermissionStatus.DENIED:
          // DENIED 状态视为 pending,因为会话拒绝后可以重新请求
          pending.push(permission)
          break
      }
    }

    return {
      hasPermanentDeny: permanentlyDenied.length > 0,
      permanentlyDenied,
      pending,
      granted
    }
  }

  /**
   * 批量请求权限
   * 使用批量权限对话框一次性请求所有权限
   *
   * @param pluginId 插件ID
   * @param permissions 需要请求的权限列表
   * @param reason 请求原因
   * @param context 操作上下文
   * @returns 批量权限请求结果
   */
  async requestPermissions(
    pluginId: string,
    permissions: Permission[],
    reason?: string,
    context?: PermissionRequestContext
  ): Promise<{
    allGranted: boolean
    results: Array<{
      permission: Permission
      granted: boolean
      permanent?: boolean
    }>
  }> {
    // 过滤出需要请求的权限(排除已授予和永久拒绝的)
    const permissionsToRequest = permissions.filter(permission => {
      const status = this.checkPermission(pluginId, permission)
      return status !== PermissionStatus.GRANTED && status !== PermissionStatus.PERMANENTLY_DENIED
    })

    // 如果没有需要请求的权限,直接返回成功
    if (permissionsToRequest.length === 0) {
      return {
        allGranted: true,
        results: permissions.map(permission => ({
          permission,
          granted: true,
          permanent: true
        }))
      }
    }

    // 如果只有一个权限需要请求,使用单个权限对话框
    if (permissionsToRequest.length === 1) {
      const granted = await this.requestPermission(
        pluginId,
        permissionsToRequest[0],
        reason,
        context
      )

      return {
        allGranted: granted,
        results: permissions.map(permission => {
          const status = this.checkPermission(pluginId, permission)
          return {
            permission,
            granted: status === PermissionStatus.GRANTED || permission === permissionsToRequest[0] ? granted : false,
            permanent: status === PermissionStatus.GRANTED
          }
        })
      }
    }

    // 发送批量权限请求到渲染进程
    const requestId = uuidv4()
    const request: BatchPermissionRequest = {
      id: requestId,
      pluginId,
      pluginName: pluginId, // TODO: 从 plugin registry 获取真实名称
      permissions: permissionsToRequest,
      reason,
      context,
      requestedAt: new Date()
    }

    this.pendingBatchRequests.set(requestId, request)

    try {
      // 发送事件到渲染进程
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        await new Promise(resolve => setTimeout(resolve, 100))

        console.log('[PermissionManager] 发送批量权限请求事件到渲染进程:', request)
        this.mainWindow.webContents.send('permission:batchRequest', request)
        console.log('[PermissionManager] 批量权限请求事件已发送')
      } else {
        console.error('[PermissionManager] 主窗口不可用,无法发送批量权限请求事件')
      }

      // 等待用户响应 (超时 5 分钟)
      const response = await this.waitForBatchResponse(requestId, 5 * 60 * 1000)

      // 处理用户响应
      if (response.granted) {
        if (response.sessionOnly) {
          // 会话级授权 - 授予所有请求的权限
          for (const permission of permissionsToRequest) {
            this.sessionPermissionManager.grant(pluginId, permission)
          }
          console.log('[PermissionManager] 授予会话级权限:', { pluginId, permissions: permissionsToRequest })
        } else {
          // 永久授权 - 授予所有请求的权限
          for (const permission of permissionsToRequest) {
            await this.grantPermission(pluginId, permission, 'user', context)
          }
        }
      } else {
        // 拒绝 - 拒绝所有请求的权限
        for (const permission of permissionsToRequest) {
          await this.denyPermission(pluginId, permission, 'user', context)
        }
      }

      // 构建结果
      const results = permissions.map(permission => {
        const status = this.checkPermission(pluginId, permission)
        const wasRequested = permissionsToRequest.includes(permission)

        return {
          permission,
          granted: status === PermissionStatus.GRANTED,
          permanent: status === PermissionStatus.GRANTED && !wasRequested ? true : !response.sessionOnly
        }
      })

      const allGranted = results.every(r => r.granted)

      return {
        allGranted,
        results
      }
    } finally {
      this.pendingBatchRequests.delete(requestId)
    }
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
