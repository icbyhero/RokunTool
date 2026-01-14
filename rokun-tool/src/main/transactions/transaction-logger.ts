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
  // TODO: 实现日志查询功能
  // 这个功能需要在后续版本中实现
  return []
}
