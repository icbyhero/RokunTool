/**
 * 进程操作回滚辅助类
 *
 * 提供带自动回滚能力的进程操作方法
 */

import { spawn } from 'child_process'
import { existsSync } from 'fs'

export interface SpawnOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  timeout?: number // 毫秒
  killTimeout?: number // 强制杀死超时(毫秒),默认5000ms
}

export interface ProcessResult {
  pid: number
  exitCode: number | null
  signal: NodeJS.Signals | null
}

/**
 * 启动进程(带回滚)
 *
 * @param command 命令
 * @param args 参数数组
 * @param options 选项
 * @returns Promise<{ pid: number, rollback: () => Promise<void> }>
 *
 * @example
 * ```typescript
 * const { pid, rollback } = await spawnWithRollback('nginx', ['-c', configPath])
 * try {
 *   // 执行其他操作
 * } catch (error) {
 *   await rollback() // 终止进程
 *   throw error
 * }
 * ```
 */
export async function spawnWithRollback(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {}
): Promise<{ pid: number; rollback: () => Promise<void> }> {
  const { timeout, killTimeout = 5000, ...spawnOptions } = options

  return new Promise((resolve, reject) => {
    // 启动进程
    const childProcess = spawn(command, args, {
      detached: true,  // 使进程独立于父进程
      stdio: 'ignore', // 忽略stdio
      ...spawnOptions
    })

    // 解除引用,让进程继续运行
    childProcess.unref()

    const pid = childProcess.pid!

    // 检查进程是否启动成功
    setTimeout(() => {
      try {
        // 尝试发送信号0检查进程是否存在
        process.kill(pid, 0)
        resolve({
          pid,
          rollback: async () => {
            await killProcessWithTimeout(pid, killTimeout)
          }
        })
      } catch (error) {
        reject(new Error(`进程启动失败: ${command}`))
      }
    }, 100)
  })
}

/**
 * 终止进程(带超时)
 *
 * @param pid 进程ID
 * @param timeout 超时时间(毫秒)
 */
async function killProcessWithTimeout(pid: number, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    let timeoutHandle: NodeJS.Timeout | null = null

    const cleanup = () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
        timeoutHandle = null
      }
    }

    // 监听进程退出
    const checkInterval = setInterval(() => {
      try {
        // 检查进程是否还存在
        process.kill(pid, 0)
        // 进程还存在
        if (Date.now() - startTime > timeout) {
          // 超时,强制杀死
          clearInterval(checkInterval)
          cleanup()
          try {
            process.kill(pid, 'SIGKILL')
            console.warn(`[killProcess] 进程 ${pid} 超时,已强制杀死`)
            resolve()
          } catch (error) {
            // 进程可能已经退出
            resolve()
          }
        }
      } catch (error) {
        // 进程已退出
        clearInterval(checkInterval)
        cleanup()
        resolve()
      }
    }, 100)

    // 首先尝试优雅退出
    try {
      process.kill(pid, 'SIGTERM')
    } catch (error) {
      // 进程可能已经退出
      clearInterval(checkInterval)
      cleanup()
      resolve()
    }

    // 设置超时
    timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval)
      cleanup()
      try {
        process.kill(pid, 'SIGKILL')
        console.warn(`[killProcess] 进程 ${pid} 超时,已强制杀死`)
        resolve()
      } catch (error) {
        // 进程可能已经退出
        resolve()
      }
    }, timeout)
  })
}

/**
 * 等待进程退出
 *
 * @param pid 进程ID
 * @param timeout 超时时间(毫秒)
 * @returns Promise<ProcessResult>
 */
export async function waitForProcess(pid: number, timeout?: number): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    let timeoutHandle: NodeJS.Timeout | null = null

    const checkInterval = setInterval(() => {
      try {
        // 检查进程是否还存在
        process.kill(pid, 0)
        // 进程还存在

        // 检查是否超时
        if (timeout && Date.now() - startTime > timeout) {
          clearInterval(checkInterval)
          if (timeoutHandle) {
            clearTimeout(timeoutHandle)
          }
          reject(new Error(`等待进程退出超时: ${pid}`))
        }
      } catch (error) {
        // 进程已退出
        clearInterval(checkInterval)
        if (timeoutHandle) {
          clearTimeout(timeoutHandle)
        }
        resolve({
          pid,
          exitCode: null,
          signal: null
        })
      }
    }, 100)

    if (timeout) {
      timeoutHandle = setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error(`等待进程退出超时: ${pid}`))
      }, timeout)
    }
  })
}

/**
 * 执行命令并等待完成(带回滚)
 *
 * @param command 命令
 * @param args 参数数组
 * @param options 选项
 * @returns Promise<{ result: ProcessResult, rollback: () => Promise<void> }>
 *
 * @example
 * ```typescript
 * const { result, rollback } = await execWithRollback('npm', ['install'])
 * try {
 *   // 使用安装结果
 * } catch (error) {
 *   await rollback() // 清理
 *   throw error
 * }
 * ```
 */
export async function execWithRollback(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {}
): Promise<{ result: ProcessResult; rollback: () => Promise<void> }> {
  const { timeout = 30000, killTimeout = 5000, ...spawnOptions } = options

  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      ...spawnOptions
    })

    const pid = childProcess.pid!
    let completed = false

    // 超时处理
    const timeoutHandle = setTimeout(() => {
      if (!completed) {
        completed = true
        childProcess.kill('SIGKILL')
        reject(new Error(`命令执行超时: ${command} ${args.join(' ')}`))
      }
    }, timeout)

    childProcess.on('exit', (code, signal) => {
      if (!completed) {
        completed = true
        clearTimeout(timeoutHandle)

        const result: ProcessResult = {
          pid,
          exitCode: code,
          signal: signal
        }

        resolve({
          result,
          rollback: async () => {
            // 命令已完成,不需要回滚
            // 如果需要清理,可以在选项中提供 cleanup 函数
          }
        })
      }
    })

    childProcess.on('error', (error) => {
      if (!completed) {
        completed = true
        clearTimeout(timeoutHandle)
        reject(error)
      }
    })
  })
}

/**
 * 批量终止进程
 *
 * @param pids 进程ID数组
 * @param timeout 每个进程的超时时间(毫秒)
 */
export async function killProcesses(pids: number[], timeout: number = 5000): Promise<void> {
  await Promise.all(pids.map(pid => killProcessWithTimeout(pid, timeout)))
}
