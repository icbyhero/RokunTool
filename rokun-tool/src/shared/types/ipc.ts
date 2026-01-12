/**
 * IPC通信类型定义
 *
 * 定义主进程和渲染进程之间的通信协议
 */

import type { PluginMetadata } from './plugin'

// ============================================================================
// IPC 通道名称定义
// ============================================================================

/**
 * 插件管理相关的IPC通道
 */
export enum PluginIpcChannel {
  /** 获取插件列表 */
  LIST = 'plugin:list',

  /** 获取插件详情 */
  GET = 'plugin:get',

  /** 加载插件 */
  LOAD = 'plugin:load',

  /** 启用插件 */
  ENABLE = 'plugin:enable',

  /** 禁用插件 */
  DISABLE = 'plugin:disable',

  /** 卸载插件 */
  UNLOAD = 'plugin:unload',

  /** 重新加载插件 */
  RELOAD = 'plugin:reload',

  /** 调用插件方法 */
  CALL_METHOD = 'plugin:callMethod'
}

/**
 * 权限管理相关的IPC通道
 */
export enum PermissionIpcChannel {
  /** 请求权限 */
  REQUEST = 'permission:request',

  /** 检查权限 */
  CHECK = 'permission:check',

  /** 获取权限列表 */
  LIST = 'permission:list',

  /** 撤销权限 */
  REVOKE = 'permission:revoke'
}

/**
 * 基础服务相关的IPC通道
 */
export enum ServiceIpcChannel {
  /** 文件系统服务 */
  FS_READ = 'service:fs:read',
  FS_WRITE = 'service:fs:write',
  FS_READ_DIR = 'service:fs:readDir',
  FS_STAT = 'service:fs:stat',

  /** 进程管理服务 */
  PROCESS_SPAWN = 'service:process:spawn',
  PROCESS_EXEC = 'service:process:exec',
  PROCESS_KILL = 'service:process:kill',

  /** 剪贴板服务 */
  CLIPBOARD_READ_TEXT = 'service:clipboard:readText',
  CLIPBOARD_WRITE_TEXT = 'service:clipboard:writeText',
  CLIPBOARD_READ_IMAGE = 'service:clipboard:readImage',
  CLIPBOARD_WRITE_IMAGE = 'service:clipboard:writeImage',
  CLIPBOARD_READ_HTML = 'service:clipboard:readHTML',
  CLIPBOARD_WRITE_HTML = 'service:clipboard:writeHTML',
  CLIPBOARD_CLEAR = 'service:clipboard:clear',
  CLIPBOARD_READ_FORMATS = 'service:clipboard:readFormats',

  /** 通知服务 */
  NOTIFICATION_SHOW = 'service:notification:show',
  NOTIFICATION_CLOSE = 'service:notification:close',
  NOTIFICATION_CLOSE_ALL = 'service:notification:closeAll',

  /** 配置服务 */
  CONFIG_GET = 'service:config:get',
  CONFIG_SET = 'service:config:set',
  CONFIG_DELETE = 'service:config:delete',
  CONFIG_HAS = 'service:config:has',

  /** UI服务 */
  UI_SHOW_MESSAGE = 'service:ui:showMessage',
  UI_SHOW_NOTIFICATION = 'service:ui:showNotification'
}

/**
 * 插件间通信的IPC通道
 */
export enum PluginCommunicationChannel {
  /** 发送消息给其他插件 */
  SEND = 'plugin:send',

  /** 广播消息 */
  BROADCAST = 'plugin:broadcast',

  /** 订阅事件 */
  SUBSCRIBE = 'plugin:subscribe',

  /** 取消订阅 */
  UNSUBSCRIBE = 'plugin:unsubscribe'
}

// ============================================================================
// IPC 请求/响应类型
// ============================================================================

/**
 * 插件列表请求
 */
export interface PluginListRequest {
  /** 过滤条件 */
  filter?: {
    status?: 'enabled' | 'disabled' | 'all'
    type?: string
  }
}

/**
 * 插件列表响应
 */
export interface PluginListResponse {
  plugins: PluginMetadata[]
  total: number
}

/**
 * 插件详情请求
 */
export interface PluginGetRequest {
  pluginId: string
}

/**
 * 插件详情响应
 */
export interface PluginGetResponse {
  plugin?: PluginMetadata
  error?: string
}

/**
 * 插件日志请求
 */
export interface PluginGetLogsRequest {
  pluginId: string
}

/**
 * 插件日志响应
 */
export interface PluginGetLogsResponse {
  logs: Array<{
    level: string
    message: string
    timestamp: number
  }>
  error?: string
}

/**
 * 插件加载请求
 */
export interface PluginLoadRequest {
  pluginPath: string
}

/**
 * 插件操作请求 (启用/禁用/卸载)
 */
export interface PluginActionRequest {
  pluginId: string
}

/**
 * 插件操作响应
 */
export interface PluginActionResponse {
  success: boolean
  error?: string
}

/**
 * 插件方法调用请求
 */
export interface PluginCallMethodRequest {
  pluginId: string
  method: string
  args?: any[]
}

/**
 * 插件方法调用响应
 */
export interface PluginCallMethodResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 权限请求
 */
export interface PermissionRequestRequest {
  pluginId: string
  permission: string
}

/**
 * 权限请求响应
 */
export interface PermissionRequestResponse {
  granted: boolean
  remember?: boolean
}

/**
 * 文件读取请求
 */
export interface FsReadRequest {
  path: string
  encoding?: 'utf-8' | 'base64' | null
}

/**
 * 文件写入请求
 */
export interface FsWriteRequest {
  path: string
  data: string | Buffer
  encoding?: 'utf-8' | 'base64'
}

/**
 * 文件状态响应
 */
export interface FsStatResponse {
  size: number
  isFile: boolean
  isDirectory: boolean
  createdAt: Date
  modifiedAt: Date
}

/**
 * 进程启动请求
 */
export interface ProcessSpawnRequest {
  command: string
  args?: string[]
  options?: {
    cwd?: string
    env?: Record<string, string>
  }
}

/**
 * 进程启动响应
 */
export interface ProcessSpawnResponse {
  pid: number
  error?: string
}

/**
 * 进程执行请求
 */
export interface ProcessExecRequest {
  command: string
}

/**
 * 进程执行响应
 */
export interface ProcessExecResponse {
  stdout: string
  stderr: string
  exitCode: number
  error?: string
}

/**
 * 配置获取请求
 */
export interface ConfigGetRequest {
  key: string
  defaultValue?: any
}

/**
 * 配置设置请求
 */
export interface ConfigSetRequest {
  key: string
  value: any
}

/**
 * 配置响应
 */
export interface ConfigResponse<T = any> {
  value: T
  error?: string
}

/**
 * 剪贴板读取文本响应
 */
export interface ClipboardReadTextResponse {
  text?: string
  error?: string
}

/**
 * 剪贴板写入文本请求
 */
export interface ClipboardWriteTextRequest {
  text: string
}

/**
 * 剪贴板读取图片响应
 */
export interface ClipboardReadImageResponse {
  image?: Buffer
  error?: string
}

/**
 * 剪贴板写入图片请求
 */
export interface ClipboardWriteImageRequest {
  image: Buffer
}

/**
 * 剪贴板读取 HTML 响应
 */
export interface ClipboardReadHTMLResponse {
  html?: string
  error?: string
}

/**
 * 剪贴板写入 HTML 请求
 */
export interface ClipboardWriteHTMLRequest {
  html: string
  text?: string
}

/**
 * 剪贴板读取格式响应
 */
export interface ClipboardReadFormatsResponse {
  formats?: string[]
  error?: string
}

/**
 * 通知显示请求
 */
export interface NotificationShowRequest {
  title: string
  body: string
  icon?: string
  silent?: boolean
  urgency?: 'normal' | 'critical' | 'low'
}

/**
 * 通知显示响应
 */
export interface NotificationShowResponse {
  notificationId?: string
  error?: string
}

/**
 * 通知关闭请求
 */
export interface NotificationCloseRequest {
  notificationId: string
}

// ============================================================================
// IPC 事件类型
// ============================================================================

/**
 * 插件状态变化事件
 */
export interface PluginStatusChangedEvent {
  pluginId: string
  oldStatus: string
  newStatus: string
  timestamp: number
}

/**
 * 插件加载事件
 */
export interface PluginLoadedEvent {
  plugin: PluginMetadata
  timestamp: number
}

/**
 * 插件加载进度事件
 */
export interface PluginLoadingEvent {
  pluginId: string
  pluginName?: string
  status: 'loading' | 'loaded' | 'error'
  progress?: number
  error?: string
  timestamp: number
}

/**
 * 插件错误事件
 */
export interface PluginErrorEvent {
  pluginId: string
  error: string
  stack?: string
  timestamp: number
}

/**
 * 权限授予事件
 */
export interface PermissionGrantedEvent {
  pluginId: string
  permission: string
  timestamp: number
}

/**
 * 插件消息事件
 */
export interface PluginMessageEvent {
  from: string
  to: string | 'all'
  data: any
  timestamp: number
}

// ============================================================================
// IPC 错误类型
// ============================================================================

/**
 * IPC错误码
 */
export enum IpcErrorCode {
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN',

  /** 无效的参数 */
  INVALID_PARAMS = 'INVALID_PARAMS',

  /** 插件不存在 */
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',

  /** 插件已加载 */
  PLUGIN_ALREADY_LOADED = 'PLUGIN_ALREADY_LOADED',

  /** 权限被拒绝 */
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  /** 操作超时 */
  TIMEOUT = 'TIMEOUT',

  /** 内部错误 */
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * IPC错误
 */
export interface IpcError {
  code: IpcErrorCode
  message: string
  details?: any
}

// ============================================================================
// IPC 消息类型
// ============================================================================

/**
 * IPC请求消息
 */
export interface IpcRequest<T = any> {
  id: string
  channel: string
  payload: T
}

/**
 * IPC响应消息
 */
export interface IpcResponse<T = any> {
  id: string
  success: boolean
  data?: T
  error?: IpcError
}

/**
 * IPC事件消息
 */
export interface IpcEvent<T = any> {
  channel: string
  payload: T
}
