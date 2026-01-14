/**
 * 渲染进程IPC API
 *
 * 在preload脚本中暴露给渲染进程的类型安全IPC调用方法
 */

import { contextBridge, ipcRenderer } from 'electron'
import type {
  PluginListRequest,
  PluginListResponse,
  PluginGetRequest,
  PluginGetResponse,
  PluginActionRequest,
  PluginActionResponse,
  PluginCallMethodRequest,
  PluginCallMethodResponse,
  PluginStatusChangedEvent,
  PluginLoadedEvent,
  PluginLoadingEvent,
  PluginErrorEvent,
  ClipboardReadTextResponse,
  ClipboardWriteTextRequest,
  ClipboardReadImageResponse,
  ClipboardWriteImageRequest,
  ClipboardReadHTMLResponse,
  ClipboardWriteHTMLRequest,
  ClipboardReadFormatsResponse,
  NotificationShowRequest,
  NotificationShowResponse,
  NotificationCloseRequest
} from '@shared/types/ipc'

/**
 * 权限请求上下文
 */
export interface PermissionRequestContext {
  operation: string
  target?: string
}

/**
 * 功能权限定义
 */
export interface FeaturePermission {
  permission: string
  required: boolean
  reason?: string
}

/**
 * 增强的权限检查结果
 */
export interface EnhancedPermissionCheckResult {
  canProceed: boolean
  permanentlyDenied: Array<{
    permission: string
    required: boolean
  }>
  pending: Array<{
    permission: string
    required: boolean
  }>
  granted: Array<{
    permission: string
    permanent: boolean
  }>
  riskLevel: 'low' | 'medium' | 'high'
  recommendation: 'auto_grant' | 'session_grant' | 'ask_user'
}

/**
 * 权限请求
 */
export interface PermissionRequest {
  id: string
  pluginId: string
  pluginName: string
  permission: string
  reason?: string
  context?: PermissionRequestContext
  requestedAt: Date
}

/**
 * 权限管理API
 */
interface PermissionApi {
  /** 请求权限 */
  request(request: {
    pluginId: string
    permission: string
    reason?: string
    context?: PermissionRequestContext
  }): Promise<{ granted: boolean; error?: string }>

  /** 检查权限 */
  check(request: {
    pluginId: string
    permission: string
  }): Promise<{ status: string; error?: string }>

  /** 获取权限状态 */
  getStatus(request: {
    pluginId: string
  }): Promise<{
    permissions: Record<string, string>
    history: Array<{
      permission: string
      status: string
      timestamp: number
      source: string
      context?: PermissionRequestContext
    }>
    error?: string
  }>

  /** 撤销权限 */
  revoke(request: {
    pluginId: string
    permission: string
  }): Promise<{ success: boolean; error?: string }>

  /** 清除永久拒绝状态 */
  clearPermanentDeny(request: {
    pluginId: string
    permission: string
  }): Promise<{ success: boolean; error?: string }>

  /** 批量检查权限 */
  checkPermissions(request: {
    pluginId: string
    permissions: string[]
  }): Promise<{
    hasPermanentDeny: boolean
    permanentlyDenied: string[]
    pending: string[]
    granted: string[]
    error?: string
  }>

  /** 增强版批量检查权限 (支持风险评估和推荐策略) */
  checkPermissionsEnhanced(request: {
    pluginId: string
    featurePermissions: FeaturePermission[]
  }): Promise<{
    success: boolean
    canProceed: boolean
    permanentlyDenied: Array<{
      permission: string
      required: boolean
    }>
    pending: Array<{
      permission: string
      required: boolean
    }>
    granted: Array<{
      permission: string
      permanent: boolean
    }>
    riskLevel: 'low' | 'medium' | 'high'
    recommendation: 'auto_grant' | 'session_grant' | 'ask_user'
    error?: string
  }>

  /** 批量请求权限 */
  requestPermissions(request: {
    pluginId: string
    permissions: string[]
    reason?: string
    context?: PermissionRequestContext
  }): Promise<{
    allGranted: boolean
    results: Array<{
      permission: string
      granted: boolean
      permanent?: boolean
    }>
    error?: string
  }>

  /** 监听权限请求事件 */
  onRequest(callback: (_event: any, request: PermissionRequest) => void): void

  /** 监听权限状态变化 */
  onChanged(callback: (_event: any, event: {
    pluginId: string
    permission: string
    status: string
  }) => void): void

  /** 发送权限响应 */
  sendResponse(response: {
    requestId: string
    granted: boolean
    sessionOnly?: boolean
    permanent?: boolean  // 是否永久拒绝 (当 granted=false 时)
  }): void

  /** 移除监听器 */
  removeListener(channel: string, callback: (...args: any[]) => void): void
}

/**
 * 插件管理API
 */
interface PluginApi {
  /** 获取插件列表 */
  list(request?: PluginListRequest): Promise<PluginListResponse>

  /** 获取插件详情 */
  get(request: PluginGetRequest): Promise<PluginGetResponse>

  /** 获取插件日志 */
  getLogs(request: { pluginId: string }): Promise<{ logs: Array<{ level: string; message: string; timestamp: number }> }>

  /** 启用插件 */
  enable(request: PluginActionRequest): Promise<PluginActionResponse>

  /** 禁用插件 */
  disable(request: PluginActionRequest): Promise<PluginActionResponse>

  /** 卸载插件 */
  unload(request: PluginActionRequest): Promise<PluginActionResponse>

  /** 调用插件方法 */
  callMethod<T = any>(request: PluginCallMethodRequest): Promise<PluginCallMethodResponse<T>>

  /** 监听插件状态变化 */
  onStatusChanged(callback: (_event: any, event: PluginStatusChangedEvent) => void): void

  /** 监听插件加载事件 */
  onLoaded(callback: (_event: any, event: PluginLoadedEvent) => void): void

  /** 监听插件加载进度事件 */
  onLoading(callback: (_event: any, event: PluginLoadingEvent) => void): void

  /** 监听插件操作进度事件 */
  onOperationProgress(callback: (_event: any, event: any) => void): void

  /** 监听插件错误事件 */
  onError(callback: (_event: any, event: PluginErrorEvent) => void): void

  /** 移除监听器 */
  removeListener(channel: string, callback: (...args: any[]) => void): void
}

/**
 * 剪贴板API
 */
interface ClipboardApi {
  /** 读取文本 */
  readText(): Promise<ClipboardReadTextResponse>

  /** 写入文本 */
  writeText(request: ClipboardWriteTextRequest): Promise<ClipboardReadTextResponse>

  /** 读取图片 */
  readImage(): Promise<ClipboardReadImageResponse>

  /** 写入图片 */
  writeImage(request: ClipboardWriteImageRequest): Promise<ClipboardReadImageResponse>

  /** 读取HTML */
  readHTML(): Promise<ClipboardReadHTMLResponse>

  /** 写入HTML */
  writeHTML(request: ClipboardWriteHTMLRequest): Promise<ClipboardReadHTMLResponse>

  /** 清空剪贴板 */
  clear(): Promise<{ success: boolean; error?: string }>

  /** 读取可用格式 */
  readFormats(): Promise<ClipboardReadFormatsResponse>
}

/**
 * 通知API
 */
interface NotificationApi {
  /** 显示通知 */
  show(request: NotificationShowRequest): Promise<NotificationShowResponse>

  /** 关闭通知 */
  close(request: NotificationCloseRequest): Promise<{ success: boolean; error?: string }>

  /** 关闭所有通知 */
  closeAll(): Promise<{ success: boolean; error?: string }>
}

/**
 * 事务日志API
 */
interface TransactionApi {
  /** 获取事务日志 */
  getLogs(params?: {
    transactionId?: string
    pluginId?: string
    startDate?: string
    endDate?: string
  }): Promise<{
    success: boolean
    logs?: Array<{
      transactionId: string
      timestamp: string
      level: 'info' | 'success' | 'error'
      event: string
      data: any
    }>
    error?: string
  }>

  /** 获取事务摘要列表 */
  getSummaries(params?: {
    pluginId?: string
    startDate?: string
    endDate?: string
  }): Promise<{
    success: boolean
    summaries?: Array<{
      transactionId: string
      transactionName: string
      pluginId: string
      startTime: string
      endTime?: string
      status: 'executing' | 'success' | 'failed'
      stepCount: number
    }>
    error?: string
  }>
}

/**
 * 实现插件API
 */
const pluginApi: PluginApi = {
  list: (request) => ipcRenderer.invoke('plugin:list', request || {}),
  get: (request) => ipcRenderer.invoke('plugin:get', request),
  getLogs: (request) => ipcRenderer.invoke('plugin:getLogs', request),
  enable: (request) => ipcRenderer.invoke('plugin:enable', request),
  disable: (request) => ipcRenderer.invoke('plugin:disable', request),
  unload: (request) => ipcRenderer.invoke('plugin:unload', request),

  // 包装 callMethod 以自动发送执行事件
  callMethod: async <T = any>(request: PluginCallMethodRequest): Promise<PluginCallMethodResponse<T>> => {
    const timestamp = Date.now()

    // 发送方法开始事件
    ipcRenderer.send('plugin:method:start', {
      pluginId: request.pluginId,
      methodName: request.method,
      timestamp
    })

    try {
      // 调用原始方法
      const result = await ipcRenderer.invoke('plugin:callMethod', request)

      // 发送方法结束事件 (成功)
      ipcRenderer.send('plugin:method:end', {
        pluginId: request.pluginId,
        methodName: request.method,
        timestamp,
        success: true
      })

      return result
    } catch (error) {
      // 发送方法结束事件 (失败)
      ipcRenderer.send('plugin:method:end', {
        pluginId: request.pluginId,
        methodName: request.method,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })

      throw error
    }
  },

  onStatusChanged: (callback) => ipcRenderer.on('plugin:status-changed', (_, event) => callback(_, event)),
  onLoaded: (callback) => ipcRenderer.on('plugin:loaded', (_, event) => callback(_, event)),
  onLoading: (callback) => ipcRenderer.on('plugin:loading', (_, event) => callback(_, event)),
  onOperationProgress: (callback) => ipcRenderer.on('plugin:operation-progress', (_, event) => callback(_, event)),
  onError: (callback) => ipcRenderer.on('plugin:error', (_, event) => callback(_, event)),
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback)
}

/**
 * 实现剪贴板API
 */
const clipboardApi: ClipboardApi = {
  readText: () => ipcRenderer.invoke('service:clipboard:readText'),
  writeText: (request) => ipcRenderer.invoke('service:clipboard:writeText', request),
  readImage: () => ipcRenderer.invoke('service:clipboard:readImage'),
  writeImage: (request) => ipcRenderer.invoke('service:clipboard:writeImage', request),
  readHTML: () => ipcRenderer.invoke('service:clipboard:readHTML'),
  writeHTML: (request) => ipcRenderer.invoke('service:clipboard:writeHTML', request),
  clear: () => ipcRenderer.invoke('service:clipboard:clear'),
  readFormats: () => ipcRenderer.invoke('service:clipboard:readFormats')
}

/**
 * 实现通知API
 */
const notificationApi: NotificationApi = {
  show: (request) => ipcRenderer.invoke('service:notification:show', request),
  close: (request) => ipcRenderer.invoke('service:notification:close', request),
  closeAll: () => ipcRenderer.invoke('service:notification:closeAll')
}

/**
 * 实现事务日志API
 */
const transactionApi: TransactionApi = {
  getLogs: (params) => ipcRenderer.invoke('transaction:getLogs', { params }),
  getSummaries: (params) => ipcRenderer.invoke('transaction:getSummaries', { params })
}

/**
 * 实现权限管理API
 */
const permissionApi: PermissionApi = {
  request: (request) => ipcRenderer.invoke('permission:request', request),
  check: (request) => ipcRenderer.invoke('permission:check', request),
  getStatus: (request) => ipcRenderer.invoke('permission:getStatus', request),
  revoke: (request) => ipcRenderer.invoke('permission:revoke', request),
  clearPermanentDeny: (request) => ipcRenderer.invoke('permission:clearPermanentDeny', request),
  checkPermissions: (request) => ipcRenderer.invoke('permission:checkPermissions', request),
  checkPermissionsEnhanced: (request) => ipcRenderer.invoke('permission:checkPermissionsEnhanced', request),
  requestPermissions: (request) => ipcRenderer.invoke('permission:requestPermissions', request),
  onRequest: (callback) => ipcRenderer.on('permission:request', (_, request) => callback(_, request)),
  onChanged: (callback) => ipcRenderer.on('permission:changed', (_, event) => callback(_, event)),
  sendResponse: (response) => ipcRenderer.send('permission:response', response),
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback)
}

/**
 * 暴露给渲染进程的API
 */
export interface ElectronApi {
  plugin: PluginApi
  clipboard: ClipboardApi
  notification: NotificationApi
  permission: PermissionApi
  transaction: TransactionApi
  quit: () => void
}

export const electronApi: ElectronApi = {
  plugin: pluginApi,
  clipboard: clipboardApi,
  notification: notificationApi,
  permission: permissionApi,
  transaction: transactionApi,
  quit: () => ipcRenderer.send('app-quit')
}

/**
 * 在preload脚本中将API暴露给渲染进程
 */
export function exposeIpcApi(): void {
  contextBridge.exposeInMainWorld('electronAPI', electronApi)
}
