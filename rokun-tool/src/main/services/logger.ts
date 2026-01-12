/**
 * 日志服务
 *
 * 提供结构化的日志记录功能
 */

import { appendFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
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
  private formatLog(level: string, pluginId: string, message: string, args: any[]): string {
    const timestamp = new Date().toISOString()
    const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : ''
    return `[${timestamp}] [${level}] [${pluginId}] ${message}${argsStr}\n`
  }

  /**
   * 写入日志
   */
  private async writeLog(pluginId: string, log: string): Promise<void> {
    try {
      // 确保日志目录存在
      try {
        await mkdir(this.logDir, { recursive: true })
      } catch (mkdirError) {
        // 如果无法创建日志目录，降级到控制台输出
        console.log(`[${pluginId}] ${log.trim()}`)
        return
      }

      // 缓存日志,批量写入
      if (!this.caches.has(pluginId)) {
        this.caches.set(pluginId, [])
      }

      const cache = this.caches.get(pluginId)!
      cache.push(log)

      // 当缓存达到一定数量时写入文件
      if (cache.length >= 10) {
        await this.flush(pluginId)
      }
    } catch (error) {
      // 静默失败，避免日志错误影响主流程
      console.log(`[${pluginId}] ${log.trim()}`)
    }
  }

  /**
   * 刷新日志缓存到文件
   */
  async flush(pluginId?: string): Promise<void> {
    if (pluginId) {
      const cache = this.caches.get(pluginId)
      if (cache && cache.length > 0) {
        const logFile = join(this.logDir, `${pluginId}.log`)
        await appendFile(logFile, cache.join(''))
        this.caches.set(pluginId, [])
      }
    } else {
      // 刷新所有缓存
      for (const [id, cache] of this.caches.entries()) {
        if (cache.length > 0) {
          const logFile = join(this.logDir, `${id}.log`)
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

  /**
   * 获取插件日志
   */
  async getLogs(
    pluginId: string
  ): Promise<Array<{ level: string; message: string; timestamp: number }>> {
    try {
      const logFile = join(this.logDir, `${pluginId}.log`)

      if (!existsSync(logFile)) {
        return []
      }

      const content = await readFile(logFile, 'utf-8')
      const lines = content.trim().split('\n')

      const logs: Array<{ level: string; message: string; timestamp: number }> = []

      for (const line of lines) {
        if (!line.trim()) continue

        const match = line.match(/^\[([^\]]+)\]\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.+)$/)
        if (match) {
          const [, timestampStr, level, id, message] = match
          if (id === pluginId) {
            logs.push({
              level: level.toLowerCase(),
              message: message.trim(),
              timestamp: new Date(timestampStr).getTime()
            })
          }
        }
      }

      return logs
    } catch (error) {
      console.error(`Failed to read logs for plugin ${pluginId}:`, error)
      return []
    }
  }
}
