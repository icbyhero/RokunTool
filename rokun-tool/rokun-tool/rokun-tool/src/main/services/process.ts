/**
 * 进程管理服务
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface ProcessResult {
  pid: number
  stdout?: string
  stderr?: string
}

export class ProcessService {
  private allowedCommands: Set<string> = new Set()
  private runningProcesses: Map<number, any> = new Map()

  constructor(allowedCommands: string[] = []) {
    this.allowedCommands = new Set(allowedCommands)
  }

  addAllowedCommand(command: string): void {
    this.allowedCommands.add(command)
  }

  private isCommandAllowed(command: string): boolean {
    if (this.allowedCommands.size === 0) {
      return true
    }
    const commandName = command.split(' ')[0]
    return this.allowedCommands.has(commandName)
  }

  async spawn(command: string, args?: string[]): Promise<number> {
    if (!this.isCommandAllowed(command)) {
      throw new Error('Command not allowed: ' + command)
    }

    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, args || [], {
        stdio: 'pipe',
        detached: false
      })

      const pid = childProcess.pid
      this.runningProcesses.set(pid, childProcess)

      childProcess.on('exit', () => {
        this.runningProcesses.delete(pid)
      })

      childProcess.on('error', (error) => {
        this.runningProcesses.delete(pid)
        reject(error)
      })

      setTimeout(() => {
        if (childProcess.pid) {
          resolve(pid)
        } else {
          reject(new Error('Failed to start process'))
        }
      }, 100)
    })
  }

  async exec(command: string): Promise<ProcessResult> {
    if (!this.isCommandAllowed(command)) {
      throw new Error('Command not allowed: ' + command)
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10
      })

      return {
        pid: 0,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      }
    } catch (error: any) {
      return {
        pid: 0,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message
      }
    }
  }

  async kill(pid: number): Promise<void> {
    const process = this.runningProcesses.get(pid)

    if (!process) {
      throw new Error('Process not found: ' + pid)
    }

    return new Promise((resolve, reject) => {
      process.kill((error: any) => {
        if (error) {
          reject(error)
        } else {
          this.runningProcesses.delete(pid)
          resolve()
        }
      })
    })
  }

  getRunningProcesses(): number[] {
    return Array.from(this.runningProcesses.keys())
  }

  isRunning(pid: number): boolean {
    return this.runningProcesses.has(pid)
  }

  async killAll(): Promise<void> {
    const promises = Array.from(this.runningProcesses.keys()).map((pid) =>
      this.kill(pid).catch((error) => {
        console.error('Failed to kill process ' + pid + ':', error)
      })
    )

    await Promise.all(promises)
  }
}
