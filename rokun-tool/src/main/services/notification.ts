/**
 * 系统通知服务
 *
 * 为插件提供系统通知功能
 */

import { Notification as ElectronNotification } from 'electron'

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  silent?: boolean
  urgency?: 'normal' | 'critical' | 'low'
  onClick?: () => void
  onClose?: () => void
}

export class NotificationService {
  private allowSend: boolean = true
  private activeNotifications: Map<string, ElectronNotification> = new Map()

  constructor(allowSend: boolean = true) {
    this.allowSend = allowSend
  }

  setPermission(allowSend: boolean): void {
    this.allowSend = allowSend
  }

  async show(options: NotificationOptions): Promise<void> {
    if (!this.allowSend) {
      throw new Error('Notification permission denied')
    }

    const notification = new ElectronNotification({
      title: options.title,
      body: options.body,
      icon: options.icon,
      silent: options.silent,
      urgency: options.urgency
    })

    const notificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.activeNotifications.set(notificationId, notification)

    if (options.onClick) {
      notification.on('click', () => {
        options.onClick?.()
      })
    }

    if (options.onClose) {
      notification.on('close', () => {
        options.onClose?.()
        this.activeNotifications.delete(notificationId)
      })
    }

    notification.show()
  }

  async close(notificationId: string): Promise<void> {
    const notification = this.activeNotifications.get(notificationId)

    if (!notification) {
      throw new Error('Notification not found')
    }

    notification.close()
    this.activeNotifications.delete(notificationId)
  }

  async closeAll(): Promise<void> {
    const promises = Array.from(this.activeNotifications.values()).map((notification) => {
      notification.close()
    })

    await Promise.all(promises)
    this.activeNotifications.clear()
  }

  getActiveCount(): number {
    return this.activeNotifications.size
  }

  hasPermission(): boolean {
    return ElectronNotification.isSupported()
  }
}
