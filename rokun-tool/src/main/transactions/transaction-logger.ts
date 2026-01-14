/**
 * 事务日志系统
 *
 * 记录事务执行过程,用于调试和审计
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

export interface TransactionLogEntry {
  /** 事务 ID */
  transactionId: string
  /** 时间戳 */
  timestamp: string
  /** 日志级别 */
  level: 'info' | 'success' | 'error'
  /** 事件类型 */
  event: 'transaction_start' | 'step_start' | 'step_success' | 'step_failed' | 'transaction_success' | 'transaction_failed'
  /** 数据 */
  data: {
    transactionName?: string
    pluginId?: string
    stepName?: string
    stepIndex?: number
    error?: string
    executedSteps?: number
    totalSteps?: number
    rollbackInfo?: any
  }
}

/**
 * 事务日志记录器
 */
export class TransactionLogger {
  private logDir: string
  private currentLogFile: string
  private buffer: TransactionLogEntry[] = []
  private flushTimer?: NodeJS.Timeout

  constructor(logDir?: string) {
    // 默认使用 userData 目录下的 logs/transactions
    const userDataPath = app.getPath('userData')
    this.logDir = logDir || join(userDataPath, 'logs', 'transactions')

    // 确保日志目录存在
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }

    // 当前日期的日志文件
    const today = new Date().toISOString().split('T')[0]
    this.currentLogFile = join(this.logDir, `${today}.jsonl`)

    // 每 5 秒刷新一次缓冲区
    this.flushTimer = setInterval(() => {
      this.flush()
    }, 5000)
  }

  /**
   * 记录事务开始
   */
  startTransaction(transactionId: string, transactionName: string, pluginId: string): void {
    this.addLog({
      transactionId,
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'transaction_start',
      data: {
        transactionName,
        pluginId
      }
    })
  }

  /**
   * 记录步骤开始
   */
  logStepStart(transactionId: string, stepName: string, stepIndex: number): void {
    this.addLog({
      transactionId,
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'step_start',
      data: {
        stepName,
        stepIndex
      }
    })
  }

  /**
   * 记录步骤成功
   */
  logStepSuccess(transactionId: string, stepName: string, stepIndex: number): void {
    this.addLog({
      transactionId,
      timestamp: new Date().toISOString(),
      level: 'success',
      event: 'step_success',
      data: {
        stepName,
        stepIndex
      }
    })
  }

  /**
   * 记录步骤失败
   */
  logStepFailed(
    transactionId: string,
    stepName: string,
    stepIndex: number,
    error: Error
  ): void {
    this.addLog({
      transactionId,
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'step_failed',
      data: {
        stepName,
        stepIndex,
        error: error.message
      }
    })
  }

  /**
   * 记录事务成功
   */
  logTransactionSuccess(transactionId: string, executedSteps: number): void {
    this.addLog({
      transactionId,
      timestamp: new Date().toISOString(),
      level: 'success',
      event: 'transaction_success',
      data: {
        executedSteps
      }
    })
  }

  /**
   * 记录事务失败
   */
  logTransactionFailed(
    transactionId: string,
    executedSteps: number,
    error: Error,
    rollbackInfo?: any
  ): void {
    this.addLog({
      transactionId,
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'transaction_failed',
      data: {
        error: error.message,
        executedSteps,
        rollbackInfo
      }
    })
  }

  /**
   * 添加日志条目到缓冲区
   */
  private addLog(entry: TransactionLogEntry): void {
    this.buffer.push(entry)

    // 如果缓冲区太大,立即刷新
    if (this.buffer.length >= 50) {
      this.flush()
    }
  }

  /**
   * 刷新缓冲区到文件
   */
  private flush(): void {
    if (this.buffer.length === 0) {
      return
    }

    try {
      const lines = this.buffer.map(entry => JSON.stringify(entry)).join('\n')
      appendFileSync(this.currentLogFile, lines + '\n', 'utf-8')
      this.buffer = []
    } catch (error) {
      console.error('Failed to write transaction logs:', error)
    }
  }

  /**
   * 销毁日志记录器
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush()
  }
}

/**
 * 查询事务日志
 */
export async function queryTransactionLogs(params: {
  /** 事务 ID */
  transactionId?: string
  /** 插件 ID */
  pluginId?: string
  /** 开始日期 */
  startDate?: string
  /** 结束日期 */
  endDate?: string
}): Promise<TransactionLogEntry[]> {
  const { app } = await import('electron')
  const { promises: fs } = await import('fs')
  const { join } = await import('path')

  const userDataPath = app.getPath('userData')
  const logDir = join(userDataPath, 'logs', 'transactions')

  // 确定日期范围
  const endDate = params.endDate || new Date().toISOString().split('T')[0]
  const startDate = params.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // 收集需要查询的日志文件
  const logFiles: string[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= new Date(endDate)) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const logFile = join(logDir, `${dateStr}.jsonl`)
    logFiles.push(logFile)

    // 前进一天
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // 读取并解析日志
  const allLogs: TransactionLogEntry[] = []

  for (const logFile of logFiles) {
    try {
      const content = await fs.readFile(logFile, 'utf-8')
      const lines = content.trim().split('\n')

      for (const line of lines) {
        if (!line) continue

        try {
          const entry: TransactionLogEntry = JSON.parse(line)

          // 按条件过滤
          if (params.transactionId && entry.transactionId !== params.transactionId) {
            continue
          }

          if (params.pluginId && entry.data.pluginId !== params.pluginId) {
            continue
          }

          allLogs.push(entry)
        } catch (error) {
          console.error(`Failed to parse log line: ${line}`, error)
        }
      }
    } catch (error) {
      // 文件不存在或无法读取,忽略
      continue
    }
  }

  return allLogs
}

/**
 * 获取事务摘要列表
 */
export async function getTransactionSummaries(params?: {
  /** 插件 ID */
  pluginId?: string
  /** 开始日期 */
  startDate?: string
  /** 结束日期 */
  endDate?: string
}): Promise<{
  transactionId: string
  transactionName: string
  pluginId: string
  startTime: string
  endTime?: string
  status: 'executing' | 'success' | 'failed'
  stepCount: number
}[]> {
  const logs = await queryTransactionLogs(params || {})

  // 按事务ID分组
  const transactions = new Map<string, any>()

  for (const log of logs) {
    if (!transactions.has(log.transactionId)) {
      transactions.set(log.transactionId, {
        transactionId: log.transactionId,
        transactionName: log.data.transactionName || 'Unknown',
        pluginId: log.data.pluginId || 'unknown',
        startTime: log.timestamp,
        endTime: undefined,
        status: 'executing' as const,
        stepCount: 0
      })
    }

    const transaction = transactions.get(log.transactionId)!

    if (log.event === 'transaction_start') {
      transaction.startTime = log.timestamp
      transaction.transactionName = log.data.transactionName || transaction.transactionName
      transaction.pluginId = log.data.pluginId || transaction.pluginId
    } else if (log.event === 'transaction_success') {
      transaction.status = 'success'
      transaction.endTime = log.timestamp
    } else if (log.event === 'transaction_failed') {
      transaction.status = 'failed'
      transaction.endTime = log.timestamp
    } else if (log.event === 'step_success') {
      transaction.stepCount = Math.max(transaction.stepCount, (log.data.stepIndex || 0) + 1)
    }
  }

  return Array.from(transactions.values())
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
}
