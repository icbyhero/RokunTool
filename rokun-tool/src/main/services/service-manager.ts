/**
 * 服务管理器
 *
 * 统一管理所有系统服务
 */

import { app } from 'electron'
import { join } from 'path'
import { FsService } from './fs'
import { ProcessService } from './process'
import { ConfigService } from './config'
import { LoggerService, LogLevel } from './logger'
import { ClipboardService } from './clipboard'
import { NotificationService } from './notification'
import { PermissionService } from '../permissions'

export class ServiceManager {
  private static instance: ServiceManager

  fs: FsService
  process: ProcessService
  config: ConfigService
  logger: LoggerService
  clipboard: ClipboardService
  notification: NotificationService
  permissions: PermissionService

  private constructor() {
    const userData = app.getPath('userData')

    // 初始化各个服务
    this.fs = new FsService()
    this.process = new ProcessService()
    this.config = new ConfigService(join(userData, 'config'))
    this.logger = new LoggerService(join(userData, 'logs'), LogLevel.INFO)
    this.clipboard = new ClipboardService()
    this.notification = new NotificationService()
    this.permissions = new PermissionService()
  }

  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager()
    }
    return ServiceManager.instance
  }

  /**
   * 初始化所有服务
   */
  async initialize(): Promise<void> {
    // 这里可以添加服务初始化逻辑
    console.log('Services initialized')
  }

  /**
   * 关闭所有服务
   */
  async shutdown(): Promise<void> {
    // 刷新日志
    await this.logger.flush()
    // 终止所有进程
    await this.process.killAll()
    // 关闭所有通知
    await this.notification.closeAll()
  }

  getClipboardService(): ClipboardService {
    return this.clipboard
  }

  getNotificationService(): NotificationService {
    return this.notification
  }
}
