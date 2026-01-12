/**
 * 插件加载器
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { BrowserWindow } from 'electron'
import type {
  PluginInstance,
  PluginMetadata,
  PluginPackage,
  PluginLoadOptions,
  PluginContext,
  PluginHooks,
  PermissionStatus
} from '../../shared/types/plugin'
import { PluginRegistry } from './registry'
import { ServiceManager } from '../services'
import { Permission, PermissionManager } from '../permissions'

export class PluginLoader {
  private registry: PluginRegistry
  private pluginsDir: string
  private serviceManager: ServiceManager
  private permissionManager: PermissionManager
  private mainWindow: BrowserWindow | null = null

  constructor(
    pluginsDir: string,
    registry?: PluginRegistry,
    serviceManager?: ServiceManager,
    permissionManager?: PermissionManager
  ) {
    this.pluginsDir = pluginsDir
    this.registry = registry || new PluginRegistry()
    this.serviceManager = serviceManager || ServiceManager.getInstance()
    this.permissionManager = permissionManager || new PermissionManager()
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  private sendLoadingEvent(pluginId: string, pluginName: string, status: 'loading' | 'loaded' | 'error', progress?: number, error?: string): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('plugin:loading', {
        pluginId,
        pluginName,
        status,
        progress,
        error,
        timestamp: Date.now()
      })
    }
  }

  async loadAll(options?: PluginLoadOptions): Promise<PluginInstance[]> {
    try {
      statSync(this.pluginsDir)
    } catch {
      return []
    }

    const entries = readdirSync(this.pluginsDir, { withFileTypes: true })
    const pluginEntries = entries.filter(entry => entry.isDirectory())

    // 并行加载所有插件以提升性能
    const loadPromises = pluginEntries.map(async (entry, index) => {
      const pluginPath = join(this.pluginsDir, entry.name)
      try {
        const pkg = await this.loadPackage(pluginPath, options)
        if (pkg) {
          this.sendLoadingEvent(pkg.metadata.id, pkg.metadata.name, 'loading', (index / pluginEntries.length) * 100)

          const instance = await pkg.load()
          if (instance) {
            if (options?.autoEnable !== false && pkg.metadata.enabled !== false) {
              await instance.enable()
            }

            this.sendLoadingEvent(pkg.metadata.id, pkg.metadata.name, 'loaded', 100)
            return instance
          }
        }
        return null
      } catch (error) {
        console.error(`Failed to load plugin ${entry.name}:`, error)
        this.sendLoadingEvent(
          entry.name,
          entry.name,
          'error',
          (index / pluginEntries.length) * 100,
          error instanceof Error ? error.message : 'Unknown error'
        )
        return null
      }
    })

    // 等待所有插件加载完成
    const results = await Promise.all(loadPromises)

    // 过滤掉加载失败的插件并返回
    return results.filter((result): result is PluginInstance => result !== null)
  }

  async loadPackage(pluginPath: string, options?: PluginLoadOptions): Promise<PluginPackage | null> {
    const packagePath = join(pluginPath, 'package.json')

    try {
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

      if (!this.validateMetadata(packageJson)) {
        return null
      }

      const metadata = packageJson as PluginMetadata

      return {
        metadata,
        path: pluginPath,
        load: () => this.loadInstance(metadata, pluginPath, options)
      }
    } catch (error) {
      console.error('Failed to load package:', error)
      return null
    }
  }

  private validateMetadata(metadata: any): boolean {
    const required = ['id', 'name', 'version', 'description', 'author', 'license', 'main', 'permissions']

    for (const field of required) {
      if (!metadata[field]) {
        return false
      }
    }

    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(metadata.id) && /^\d+\.\d+\.\d+/.test(metadata.version)
  }

  async loadInstance(
    metadata: PluginMetadata,
    pluginPath: string,
    options?: PluginLoadOptions
  ): Promise<PluginInstance> {
    const existing = this.registry.get(metadata.id)
    if (existing) {
      return existing
    }

    // 不再自动授予权限,让插件在使用时动态请求
    // await this.serviceManager.permissions.grantPermissions(metadata.id, metadata.permissions)

    const context = this.createContext(metadata, pluginPath, options)
    const mainPath = join(pluginPath, metadata.main)
    let pluginExports: any = null
    let hooks: PluginHooks = {}

    try {
      console.log(`Loading plugin from: ${mainPath}`)
      const pluginModule = await import(mainPath)
      pluginExports = pluginModule.default || pluginModule

      hooks = {
        onLoad: pluginExports.onLoad,
        onEnable: pluginExports.onEnable,
        onDisable: pluginExports.onDisable,
        onUnload: pluginExports.onUnload
      }

      console.log(`Plugin hooks:`, Object.keys(hooks).filter(k => hooks[k]))

      if (hooks.onLoad) {
        console.log(`Calling onLoad hook for ${metadata.id}`)
        await hooks.onLoad(context)
      }
    } catch (error) {
      console.error('Failed to load plugin module:', error)
      throw error
    }

    const instance: PluginInstance = {
      metadata,
      status: 'loaded',
      path: pluginPath,
      loadedAt: new Date(),
      exports: pluginExports,
      context,
      hooks,
      enable: async () => {
        if (instance.status === 'enabled') return
        try {
          console.log(`Enabling plugin: ${metadata.id}`)
          if (instance.hooks.onEnable) {
            console.log(`Calling onEnable hook for ${metadata.id}`)
            await instance.hooks.onEnable(instance.context)
          }
          instance.status = 'enabled'
          console.log(`Plugin ${metadata.id} enabled successfully`)
        } catch (error) {
          instance.status = 'error'
          console.error(`Failed to enable plugin ${metadata.id}:`, error)
          throw error
        }
      },
      disable: async () => {
        if (instance.status !== 'enabled') return
        try {
          if (instance.hooks.onDisable) {
            await instance.hooks.onDisable(instance.context)
          }
          instance.status = 'disabled'
        } catch (error) {
          instance.status = 'error'
          throw error
        }
      },
      unload: async () => {
        try {
          await instance.disable()
          if (instance.hooks.onUnload) {
            await instance.hooks.onUnload(instance.context)
          }
          this.registry.unregister(metadata.id)
        } catch (error) {
          instance.status = 'error'
          throw error
        }
      }
    }

    this.registry.register(instance)
    return instance
  }

  private createContext(
    metadata: PluginMetadata,
    pluginPath: string,
    options?: PluginLoadOptions
  ): PluginContext {
    const dataDir = options?.dataDir || join(pluginPath, 'data')
    const services = this.serviceManager

    return {
      metadata,
      dataDir,
      logger: {
        debug: (message: string) => {
          services.logger.debug(metadata.id, message)
        },
        info: (message: string) => {
          services.logger.info(metadata.id, message)
        },
        warn: (message: string) => {
          services.logger.warn(metadata.id, message)
        },
        error: (message: string) => {
          services.logger.error(metadata.id, message)
        }
      },
      api: {
        fs: {
          readFile: async (path: string) => {
            this.checkPermission(metadata.id, 'fs:read' as Permission)
            return services.fs.readFile(path)
          },
          writeFile: async (path: string, data: Buffer | string) => {
            this.checkPermission(metadata.id, 'fs:write' as Permission)
            return services.fs.writeFile(path, data)
          },
          readDir: async (path: string) => {
            this.checkPermission(metadata.id, 'fs:read' as Permission)
            return services.fs.readDir(path)
          },
          stat: async (path: string) => {
            this.checkPermission(metadata.id, 'fs:read' as Permission)
            return services.fs.stat(path)
          }
        },
        process: {
          spawn: async (command: string, args?: string[]) => {
            this.checkPermission(metadata.id, 'process:spawn' as Permission)
            return services.process.spawn(command, args)
          },
          exec: async (command: string) => {
            this.checkPermission(metadata.id, 'process:exec' as Permission)
            const result = await services.process.exec(command)
            return {
              stdout: result.stdout || '',
              stderr: result.stderr || ''
            }
          },
          kill: async (pid: number) => {
            this.checkPermission(metadata.id, 'process:spawn' as Permission)
            return services.process.kill(pid)
          }
        },
        clipboard: {
          readText: async () => {
            this.checkPermission(metadata.id, 'clipboard:read' as Permission)
            return services.clipboard.readText()
          },
          writeText: async (text: string) => {
            this.checkPermission(metadata.id, 'clipboard:write' as Permission)
            return services.clipboard.writeText(text)
          },
          readImage: async () => {
            this.checkPermission(metadata.id, 'clipboard:read' as Permission)
            return services.clipboard.readImage()
          },
          writeImage: async (buffer: Buffer) => {
            this.checkPermission(metadata.id, 'clipboard:write' as Permission)
            return services.clipboard.writeImage(buffer)
          },
          readHTML: async () => {
            this.checkPermission(metadata.id, 'clipboard:read' as Permission)
            return services.clipboard.readHTML()
          },
          writeHTML: async (html: string, text?: string) => {
            this.checkPermission(metadata.id, 'clipboard:write' as Permission)
            return services.clipboard.writeHTML(html, text)
          },
          clear: async () => {
            this.checkPermission(metadata.id, 'clipboard:write' as Permission)
            return services.clipboard.clear()
          },
          readAvailableFormats: async () => {
            this.checkPermission(metadata.id, 'clipboard:read' as Permission)
            return services.clipboard.readAvailableFormats()
          }
        },
        notification: {
          show: async (options: any) => {
            this.checkPermission(metadata.id, 'notification:show' as Permission)
            return services.notification.show(options)
          },
          close: async (notificationId: string) => {
            this.checkPermission(metadata.id, 'notification:show' as Permission)
            return services.notification.close(notificationId)
          },
          closeAll: async () => {
            this.checkPermission(metadata.id, 'notification:show' as Permission)
            return services.notification.closeAll()
          }
        },
        config: {
          get: async <T = any>(key: string) => {
            this.checkPermission(metadata.id, 'config:read' as Permission)
            return services.config.get<T>(key)
          },
          set: async (key: string, value: any) => {
            this.checkPermission(metadata.id, 'config:write' as Permission)
            return services.config.set(key, value)
          },
          delete: async (key: string) => {
            this.checkPermission(metadata.id, 'config:write' as Permission)
            return services.config.delete(key)
          },
          has: async (key: string) => {
            this.checkPermission(metadata.id, 'config:read' as Permission)
            return services.config.has(key)
          }
        },
        ipc: {
          send: (channel: string) => {
            console.log('IPC send:', channel)
          },
          on: (channel: string) => {
            console.log('IPC on:', channel)
          },
          off: (channel: string) => {
            console.log('IPC off:', channel)
          }
        },
        ui: {
          showMessage: (message: string) => {
            console.log('UI message:', message)
          },
          showNotification: (title: string) => {
            this.checkPermission(metadata.id, 'notification:show' as Permission)
            console.log('Notification:', title)
          },
          openWindow: (url: string) => {
            this.checkPermission(metadata.id, 'window:open' as Permission)
            console.log('Open window:', url)
          }
        },
        permission: {
          request: async (permission: Permission, options?: {
            reason?: string
            context?: {
              operation: string
              target?: string
            }
          }) => {
            return this.permissionManager.requestPermission(
              metadata.id,
              permission,
              options?.reason,
              options?.context
            )
          },
          check: async (permission: Permission): Promise<PermissionStatus> => {
            const status = this.permissionManager.checkPermission(metadata.id, permission)
            return status as PermissionStatus
          },
          has: (permission: Permission): boolean => {
            return this.permissionManager.checkPermission(metadata.id, permission) === 'granted'
          }
        }
      }
    }
  }

  private checkPermission(pluginId: string, permission: Permission): void {
    if (!this.serviceManager.permissions.hasPermission(pluginId, permission)) {
      throw new Error('Permission denied: ' + permission)
    }
  }

  getRegistry(): PluginRegistry {
    return this.registry
  }

  async unloadAll(): Promise<void> {
    const plugins = this.registry.getAll()
    await Promise.all(plugins.map((p) => p.unload()))
  }
}
