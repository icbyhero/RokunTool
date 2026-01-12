/**
 * IPC处理器
 *
 * 处理来自渲染进程的IPC请求
 */

import { ipcMain } from 'electron'
import type {
  PluginListRequest,
  PluginListResponse,
  PluginGetRequest,
  PluginGetResponse,
  PluginGetLogsRequest,
  PluginGetLogsResponse,
  PluginActionRequest,
  PluginActionResponse,
  PluginCallMethodRequest,
  PluginCallMethodResponse,
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
import { PluginRegistry } from '../plugins/registry'
import { ServiceManager } from '../services'
import { PermissionManager } from '../permissions'

export class IpcHandlers {
  private pluginRegistry: PluginRegistry
  private serviceManager: ServiceManager
  private permissionManager: PermissionManager

  constructor(
    pluginRegistry: PluginRegistry,
    serviceManager: ServiceManager,
    permissionManager?: PermissionManager
  ) {
    this.pluginRegistry = pluginRegistry
    this.serviceManager = serviceManager
    this.permissionManager = permissionManager || new PermissionManager()
  }

  /**
   * 注册所有IPC处理器
   */
  register(): void {
    this.registerPluginHandlers()
    this.registerClipboardHandlers()
    this.registerNotificationHandlers()
    this.registerPermissionHandlers()
  }

  /**
   * 注册插件管理相关的IPC处理器
   */
  private registerPluginHandlers(): void {
    // 获取插件列表
    ipcMain.handle('plugin:list', async (_event, request: PluginListRequest) => {
      try {
        let plugins = this.pluginRegistry.getAll()

        // 应用过滤器
        if (request.filter?.status && request.filter.status !== 'all') {
          plugins = plugins.filter((p) => p.status === request.filter?.status)
        }
        if (request.filter?.type) {
          plugins = plugins.filter((p) => p.metadata.type === request.filter?.type)
        }

        const response: PluginListResponse = {
          plugins: plugins.map((p) => ({
            ...p.metadata,
            enabled: p.status === 'enabled' // 根据 status 设置 enabled 字段
          })),
          total: plugins.length
        }

        return response
      } catch (error) {
        console.error('Failed to get plugin list:', error)
        throw error
      }
    })

    // 获取插件详情
    ipcMain.handle('plugin:get', async (_event, request: PluginGetRequest) => {
      try {
        const plugin = this.pluginRegistry.get(request.pluginId)

        if (!plugin) {
          const response: PluginGetResponse = {
            error: `Plugin ${request.pluginId} not found`
          }
          return response
        }

        const response: PluginGetResponse = {
          plugin: plugin.metadata
        }
        return response
      } catch (error) {
        console.error(`Failed to get plugin ${request.pluginId}:`, error)
        throw error
      }
    })

    // 获取插件日志
    ipcMain.handle('plugin:getLogs', async (_event, request: PluginGetLogsRequest) => {
      try {
        const logs = await this.serviceManager.logger.getLogs(request.pluginId)

        const response: PluginGetLogsResponse = {
          logs
        }
        return response
      } catch (error) {
        console.error(`Failed to get logs for plugin ${request.pluginId}:`, error)
        const response: PluginGetLogsResponse = {
          logs: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        return response
      }
    })

    // 启用插件
    ipcMain.handle('plugin:enable', async (event, request: PluginActionRequest) => {
      try {
        const plugin = this.pluginRegistry.get(request.pluginId)

        if (!plugin) {
          const response: PluginActionResponse = {
            success: false,
            error: `Plugin ${request.pluginId} not found`
          }
          return response
        }

        await plugin.enable()

        // 通知渲染进程插件状态变化
        event.sender.send('plugin:status-changed', {
          pluginId: request.pluginId,
          status: 'enabled',
          timestamp: Date.now()
        })

        const response: PluginActionResponse = {
          success: true
        }
        return response
      } catch (error) {
        console.error(`Failed to enable plugin ${request.pluginId}:`, error)
        const response: PluginActionResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        return response
      }
    })

    // 禁用插件
    ipcMain.handle('plugin:disable', async (event, request: PluginActionRequest) => {
      try {
        const plugin = this.pluginRegistry.get(request.pluginId)

        if (!plugin) {
          const response: PluginActionResponse = {
            success: false,
            error: `Plugin ${request.pluginId} not found`
          }
          return response
        }

        await plugin.disable()

        // 通知渲染进程插件状态变化
        event.sender.send('plugin:status-changed', {
          pluginId: request.pluginId,
          status: 'disabled',
          timestamp: Date.now()
        })

        const response: PluginActionResponse = {
          success: true
        }
        return response
      } catch (error) {
        console.error(`Failed to disable plugin ${request.pluginId}:`, error)
        const response: PluginActionResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        return response
      }
    })

    // 卸载插件
    ipcMain.handle('plugin:unload', async (event, request: PluginActionRequest) => {
      try {
        const plugin = this.pluginRegistry.get(request.pluginId)

        if (!plugin) {
          const response: PluginActionResponse = {
            success: false,
            error: `Plugin ${request.pluginId} not found`
          }
          return response
        }

        await plugin.unload()

        // 通知渲染进程插件已卸载
        event.sender.send('plugin:unloaded', {
          pluginId: request.pluginId,
          timestamp: Date.now()
        })

        const response: PluginActionResponse = {
          success: true
        }
        return response
      } catch (error) {
        console.error(`Failed to unload plugin ${request.pluginId}:`, error)
        const response: PluginActionResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        return response
      }
    })

    // 调用插件方法
    ipcMain.handle('plugin:callMethod', async (_event, request: PluginCallMethodRequest) => {
      try {
        const plugin = this.pluginRegistry.get(request.pluginId)

        if (!plugin) {
          const response: PluginCallMethodResponse = {
            success: false,
            error: `Plugin ${request.pluginId} not found`
          }
          return response
        }

        // 获取插件导出的方法
        const pluginModule = require(plugin.path)

        if (!pluginModule[request.method]) {
          const response: PluginCallMethodResponse = {
            success: false,
            error: `Method ${request.method} not found in plugin ${request.pluginId}`
          }
          return response
        }

        // 调用插件方法
        const result = await pluginModule[request.method](
          plugin.context,
          ...(request.args || [])
        )

        const response: PluginCallMethodResponse = {
          success: true,
          data: result
        }
        return response
      } catch (error) {
        console.error(`Failed to call method ${request.method} on plugin ${request.pluginId}:`, error)
        const response: PluginCallMethodResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        return response
      }
    })
  }

  /**
   * 注册剪贴板相关的IPC处理器
   */
  private registerClipboardHandlers(): void {
    const clipboardService = this.serviceManager.getClipboardService()

    if (!clipboardService) {
      console.warn('ClipboardService not available')
      return
    }

    ipcMain.handle('service:clipboard:readText', async () => {
      try {
        const text = await clipboardService.readText()
        const response: ClipboardReadTextResponse = { text }
        return response
      } catch (error) {
        const response: ClipboardReadTextResponse = {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        return response
      }
    })

    ipcMain.handle(
      'service:clipboard:writeText',
      async (_event, request: ClipboardWriteTextRequest) => {
        try {
          await clipboardService.writeText(request.text)
          const response: ClipboardReadTextResponse = { text: request.text }
          return response
        } catch (error) {
          const response: ClipboardReadTextResponse = {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
          return response
        }
      }
    )

    ipcMain.handle('service:clipboard:readImage', async () => {
      try {
        const image = await clipboardService.readImage()
        const response: ClipboardReadImageResponse = { image }
        return response
      } catch (error) {
        const response: ClipboardReadImageResponse = {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        return response
      }
    })

    ipcMain.handle(
      'service:clipboard:writeImage',
      async (_event, request: ClipboardWriteImageRequest) => {
        try {
          await clipboardService.writeImage(request.image)
          const response: ClipboardReadImageResponse = { image: request.image }
          return response
        } catch (error) {
          const response: ClipboardReadImageResponse = {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
          return response
        }
      }
    )

    ipcMain.handle('service:clipboard:readHTML', async () => {
      try {
        const html = await clipboardService.readHTML()
        const response: ClipboardReadHTMLResponse = { html }
        return response
      } catch (error) {
        const response: ClipboardReadHTMLResponse = {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        return response
      }
    })

    ipcMain.handle(
      'service:clipboard:writeHTML',
      async (_event, request: ClipboardWriteHTMLRequest) => {
        try {
          await clipboardService.writeHTML(request.html, request.text)
          const response: ClipboardReadHTMLResponse = { html: request.html }
          return response
        } catch (error) {
          const response: ClipboardReadHTMLResponse = {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
          return response
        }
      }
    )

    ipcMain.handle('service:clipboard:clear', async () => {
      try {
        await clipboardService.clear()
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    ipcMain.handle('service:clipboard:readFormats', async () => {
      try {
        const formats = await clipboardService.readAvailableFormats()
        const response: ClipboardReadFormatsResponse = { formats }
        return response
      } catch (error) {
        const response: ClipboardReadFormatsResponse = {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        return response
      }
    })
  }

  /**
   * 注册通知相关的IPC处理器
   */
  private registerNotificationHandlers(): void {
    const notificationService = this.serviceManager.getNotificationService()

    if (!notificationService) {
      console.warn('NotificationService not available')
      return
    }

    ipcMain.handle(
      'service:notification:show',
      async (_event, request: NotificationShowRequest) => {
        try {
          await notificationService.show(request)
          const response: NotificationShowResponse = {
            notificationId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
          return response
        } catch (error) {
          const response: NotificationShowResponse = {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
          return response
        }
      }
    )

    ipcMain.handle(
      'service:notification:close',
      async (_event, request: NotificationCloseRequest) => {
        try {
          await notificationService.close(request.notificationId)
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    )

    ipcMain.handle('service:notification:closeAll', async () => {
      try {
        await notificationService.closeAll()
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })
  }

  /**
   * 注册权限管理相关的IPC处理器
   */
  private registerPermissionHandlers(): void {
    // 请求权限
    ipcMain.handle('permission:request', async (_event, request: any) => {
      try {
        const granted = await this.permissionManager.requestPermission(
          request.pluginId,
          request.permission,
          request.reason,
          request.context
        )
        return { granted }
      } catch (error) {
        return {
          granted: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // 检查权限
    ipcMain.handle('permission:check', async (_event, request: any) => {
      try {
        const status = this.permissionManager.checkPermission(
          request.pluginId,
          request.permission
        )
        return { status }
      } catch (error) {
        return {
          status: 'denied',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // 获取权限状态
    ipcMain.handle('permission:getStatus', async (_event, request: any) => {
      try {
        const status = this.permissionManager.getPermissionStatus(request.pluginId)
        const history = this.permissionManager.getPermissionHistory(request.pluginId)
        return {
          permissions: status,
          history
        }
      } catch (error) {
        return {
          permissions: {},
          history: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // 撤销权限
    ipcMain.handle('permission:revoke', async (_event, request: any) => {
      try {
        await this.permissionManager.revokePermission(
          request.pluginId,
          request.permission
        )
        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // 注意: permission:response 事件由 PermissionManager 自己处理
    // 不需要在这里添加监听器,避免与 PermissionManager.waitForResponse() 冲突
  }

  /**
   * 注销所有IPC处理器
   */
  unregister(): void {
    // 移除所有插件相关的处理器
    ipcMain.removeHandler('plugin:list')
    ipcMain.removeHandler('plugin:get')
    ipcMain.removeHandler('plugin:getLogs')
    ipcMain.removeHandler('plugin:enable')
    ipcMain.removeHandler('plugin:disable')
    ipcMain.removeHandler('plugin:unload')
    ipcMain.removeHandler('plugin:callMethod')

    // 移除剪贴板相关的处理器
    ipcMain.removeHandler('service:clipboard:readText')
    ipcMain.removeHandler('service:clipboard:writeText')
    ipcMain.removeHandler('service:clipboard:readImage')
    ipcMain.removeHandler('service:clipboard:writeImage')
    ipcMain.removeHandler('service:clipboard:readHTML')
    ipcMain.removeHandler('service:clipboard:writeHTML')
    ipcMain.removeHandler('service:clipboard:clear')
    ipcMain.removeHandler('service:clipboard:readFormats')

    // 移除通知相关的处理器
    ipcMain.removeHandler('service:notification:show')
    ipcMain.removeHandler('service:notification:close')
    ipcMain.removeHandler('service:notification:closeAll')

    // 移除权限相关的处理器
    ipcMain.removeHandler('permission:request')
    ipcMain.removeHandler('permission:check')
    ipcMain.removeHandler('permission:getStatus')
    ipcMain.removeHandler('permission:revoke')
  }
}
