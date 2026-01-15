/**
 * 日志服务
 *
 * 提供结构化的日志记录功能
 */

import { appendFile, mkdir } from 'fs/promises'
import { join } from 'path'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class LoggerService {
  private logDir: string
  private logLevel: LogLevel
  private caches: Map<string, string[]> = new Map()

  constructor(logDir: string, logLevel: LogLevel = LogLevel.INFO) {
    this.logDir = logDir
    this.logLevel = logLevel
  }

  /**
   * 记录调试日志
   */
  async debug(pluginId: string, message: string, ...args: any[]): Promise<void> {
    if (this.logLevel > LogLevel.DEBUG) return
    const log = this.formatLog('DEBUG', pluginId, message, args)
    await this.writeLog(pluginId, log)
  }

  /**
   * 记录信息日志
   */
  async info(pluginId: string, message: string, ...args: any[]): Promise<void> {
    if (this.logLevel > LogLevel.INFO) return
    const log = this.formatLog('INFO', pluginId, message, args)
    await this.writeLog(pluginId, log)
  }

  /**
   * 记录警告日志
   */
  async warn(pluginId: string, message: string, ...args: any[]): Promise<void> {
    if (this.logLevel > LogLevel.WARN) return
    const log = this.formatLog('WARN', pluginId, message, args)
    await this.writeLog(pluginId, log)
  }

  /**
   * 记录错误日志
   */
  async error(pluginId: string, message: string, ...args: any[]): Promise<void> {
    if (this.logLevel > LogLevel.ERROR) return
    const log = this.formatLog('ERROR', pluginId, message, args)
    await this.writeLog(pluginId, log)
  }

  /**
   * 格式化日志
   */
  private formatLog(
    level: string,
    pluginId: string,
    message: string,
    args: any[]
  ): string {
    const timestamp = new Date().toISOString()
    const argsStr = args.length > 0 ? ' ' + JSON.stringify(args) : ''
    return '[' + timestamp + '] [' + level + '] [' + pluginId + '] ' + message + argsStr + '\n'
  }

  /**
   * 写入日志
   */
  private async writeLog(pluginId: string, log: string): Promise<void> {
    try {
      await mkdir(this.logDir, { recursive: true })

      if (!this.caches.has(pluginId)) {
        this.caches.set(pluginId, [])
      }

      const cache = this.caches.get(pluginId)!
      cache.push(log)

      if (cache.length >= 10) {
        await this.flush(pluginId)
      }
    } catch (error) {
      console.error('Failed to write log:', error)
    }
  }

  /**
   * 刷新日志缓存到文件
   */
  async flush(pluginId?: string): Promise<void> {
    if (pluginId) {
      const cache = this.caches.get(pluginId)
      if (cache && cache.length > 0) {
        const logFile = join(this.logDir, pluginId + '.log')
        await appendFile(logFile, cache.join(''))
        this.caches.set(pluginId, [])
      }
    } else {
      for (const [id, cache] of this.caches.entries()) {
        if (cache.length > 0) {
          const logFile = join(this.logDir, id + '.log')
          await appendFile(logFile, cache.join(''))
          this.caches.set(id, [])
        }
      }
    }
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  /**
   * 获取日志级别
   */
  getLogLevel(): LogLevel {
    return this.logLevel
  }
}
