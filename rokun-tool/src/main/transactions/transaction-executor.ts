/**
 * 事务执行器
 *
 * 支持原子性执行多个操作步骤,失败时自动回滚
 */

import { BrowserWindow } from 'electron'

export interface TransactionStep {
  /** 步骤名称 */
  name: string
  /** 执行函数 */
  execute: () => Promise<void>
  /** 回滚函数 (可选,如果没有回滚能力则不需要) */
  rollback?: () => Promise<void>
  /** 超时时间(毫秒),默认 30000ms */
  timeout?: number
  /** 步骤描述 */
  description?: string
}

export interface Transaction {
  /** 事务 ID */
  id: string
  /** 事务名称 */
  name: string
  /** 事务描述 */
  description?: string
  /** 所有步骤 */
  steps: TransactionStep[]
  /** 插件 ID */
  pluginId: string
  /** 配置选项 */
  options?: TransactionOptions
}

export interface TransactionOptions {
  /** 是否在失败时自动回滚 (默认 true) */
  autoRollback?: boolean
  /** 回滚失败时是否继续 (默认 false) */
  continueOnRollbackError?: boolean
  /** 默认步骤超时时间(毫秒,默认 30000) */
  defaultTimeout?: number
  /** 是否启用日志 (默认 true) */
  enableLogging?: boolean
}

export interface TransactionResult {
  /** 事务 ID */
  transactionId: string
  /** 是否成功 */
  success: boolean
  /** 已执行的步骤数 */
  executedSteps: number
  /** 总步骤数 */
  totalSteps: number
  /** 错误信息 (如果失败) */
  error?: string
  /** 回滚信息 (如果执行了回滚) */
  rollbackInfo?: {
    /** 是否回滚成功 */
    success: boolean
    /** 成功回滚的步骤数 */
    rolledBackSteps: number
    /** 回滚过程中的错误 */
    errors: Array<{ step: string; error: string }>
  }
}

export interface TransactionLogger {
  startTransaction(transactionId: string, transactionName: string, pluginId: string): void
  logStepStart(transactionId: string, stepName: string, stepIndex: number): void
  logStepSuccess(transactionId: string, stepName: string, stepIndex: number): void
  logStepFailed(
    transactionId: string,
    stepName: string,
    stepIndex: number,
    error: Error
  ): void
  logTransactionSuccess(transactionId: string, executedSteps: number): void
  logTransactionFailed(
    transactionId: string,
    executedSteps: number,
    error: Error,
    rollbackInfo?: TransactionResult['rollbackInfo']
  ): void
}

export interface ProgressReporter {
  start(message: string, totalSteps: number): void
  update(message: string, currentStep: number): void
  complete(status: 'success' | 'error', message?: string): void
}

/**
 * 事务执行器类
 */
export class TransactionExecutor {
  private logger?: TransactionLogger
  private progressReporter?: ProgressReporter
  private mainWindow?: BrowserWindow

  constructor(
    logger?: TransactionLogger,
    progressReporter?: ProgressReporter,
    mainWindow?: BrowserWindow
  ) {
    this.logger = logger
    this.progressReporter = progressReporter
    this.mainWindow = mainWindow
  }

  /**
   * 执行事务
   */
  async execute(transaction: Transaction): Promise<TransactionResult> {
    const {
      id,
      name,
      pluginId,
      steps,
      options = {}
    } = transaction

    const {
      autoRollback = true,
      continueOnRollbackError = false,
      defaultTimeout = 30000,
      enableLogging = true
    } = options

    // 记录事务开始
    if (this.logger && enableLogging) {
      this.logger.startTransaction(id, name, pluginId)
    }

    // 报告进度开始
    if (this.progressReporter) {
      this.progressReporter.start(name, steps.length)
    }

    // 发送事务开始事件到渲染进程
    this.mainWindow?.webContents.send('transaction:start', {
      transactionId: id,
      transactionName: name,
      pluginId: pluginId,
      timestamp: Date.now()
    })

    const result: TransactionResult = {
      transactionId: id,
      success: false,
      executedSteps: 0,
      totalSteps: steps.length
    }

    let lastError: Error | null = null

    try {
      // 执行所有步骤
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const stepTimeout = step.timeout ?? defaultTimeout

        // 记录步骤开始
        if (this.logger && enableLogging) {
          this.logger.logStepStart(id, step.name, i)
        }

        // 报告进度
        if (this.progressReporter) {
          this.progressReporter.update(step.name || `步骤 ${i + 1}`, i + 1)
        }

        try {
          // 执行步骤(带超时)
          await this.executeWithTimeout(step.execute, stepTimeout)

          // 记录步骤成功
          if (this.logger && enableLogging) {
            this.logger.logStepSuccess(id, step.name, i)
          }

          result.executedSteps = i + 1
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))

          // 记录步骤失败
          if (this.logger && enableLogging) {
            this.logger.logStepFailed(id, step.name, i, lastError)
          }

          // 如果启用自动回滚,执行回滚
          if (autoRollback) {
            result.rollbackInfo = await this.rollback(
              id,
              steps,
              i,
              continueOnRollbackError,
              enableLogging
            )
          }

          // 记录事务失败
          if (this.logger && enableLogging) {
            this.logger.logTransactionFailed(
              id,
              result.executedSteps,
              lastError,
              result.rollbackInfo
            )
          }

          // 报告进度失败
          if (this.progressReporter) {
            this.progressReporter.complete('error', lastError.message)
          }

          result.error = lastError.message

          // 发送事务结束事件到渲染进程
          this.mainWindow?.webContents.send('transaction:end', {
            transactionId: id,
            timestamp: Date.now(),
            success: false,
            error: lastError.message
          })

          return result
        }
      }

      // 所有步骤执行成功
      result.success = true

      // 记录事务成功
      if (this.logger && enableLogging) {
        this.logger.logTransactionSuccess(id, result.executedSteps)
      }

      // 报告进度成功
      if (this.progressReporter) {
        this.progressReporter.complete('success')
      }

      // 发送事务结束事件到渲染进程
      this.mainWindow?.webContents.send('transaction:end', {
        transactionId: id,
        timestamp: Date.now(),
        success: true
      })

      return result
    } catch (error) {
      // 捕获未预期的错误
      lastError = error instanceof Error ? error : new Error(String(error))
      result.error = lastError.message

      if (this.logger && enableLogging) {
        this.logger.logTransactionFailed(id, result.executedSteps, lastError)
      }

      if (this.progressReporter) {
        this.progressReporter.complete('error', lastError.message)
      }

      // 发送事务结束事件到渲染进程
      this.mainWindow?.webContents.send('transaction:end', {
        transactionId: id,
        timestamp: Date.now(),
        success: false,
        error: lastError.message
      })

      return result
    }
  }

  /**
   * 回滚已执行的步骤
   */
  private async rollback(
    transactionId: string,
    steps: TransactionStep[],
    failedIndex: number,
    continueOnError: boolean,
    enableLogging: boolean
  ): Promise<TransactionResult['rollbackInfo']> {
    const rollbackInfo: TransactionResult['rollbackInfo'] = {
      success: true,
      rolledBackSteps: 0,
      errors: []
    }

    // 报告回滚开始
    if (this.progressReporter) {
      this.progressReporter.update('正在回滚...', failedIndex)
    }

    // 按相反顺序回滚已执行的步骤
    for (let i = failedIndex - 1; i >= 0; i--) {
      const step = steps[i]

      // 如果没有回滚函数,跳过
      if (!step.rollback) {
        continue
      }

      try {
        await step.rollback()
        rollbackInfo.rolledBackSteps++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        rollbackInfo.errors.push({
          step: step.name,
          error: errorMessage
        })

        if (!continueOnError) {
          rollbackInfo.success = false
          break
        }
      }
    }

    return rollbackInfo
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout(
    fn: () => Promise<void>,
    timeout: number
  ): Promise<void> {
    return Promise.race([
      fn(),
      new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`操作超时 (${timeout}ms)`))
        }, timeout)
      })
    ])
  }
}
