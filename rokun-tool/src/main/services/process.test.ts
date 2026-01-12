/**
 * 进程服务测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProcessService } from './process'

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
  exec: vi.fn()
}))

describe('ProcessService', () => {
  let service: ProcessService

  beforeEach(() => {
    service = new ProcessService()
    vi.clearAllMocks()
  })

  describe('isCommandAllowed', () => {
    it('should allow all commands when no restrictions are set', () => {
      const unrestrictedService = new ProcessService([])
      const serviceAny = unrestrictedService as any

      expect(serviceAny.isCommandAllowed('any-command')).toBe(true)
      expect(serviceAny.isCommandAllowed('ls -la')).toBe(true)
    })

    it('should allow commands in whitelist', () => {
      const restrictedService = new ProcessService(['ls', 'echo'])
      const serviceAny = restrictedService as any

      expect(serviceAny.isCommandAllowed('ls')).toBe(true)
      expect(serviceAny.isCommandAllowed('ls -la')).toBe(true)
      expect(serviceAny.isCommandAllowed('echo test')).toBe(true)
    })

    it('should reject commands not in whitelist', () => {
      const restrictedService = new ProcessService(['ls'])
      const serviceAny = restrictedService as any

      expect(serviceAny.isCommandAllowed('rm -rf /')).toBe(false)
      expect(serviceAny.isCommandAllowed('cat file.txt')).toBe(false)
    })
  })

  describe('spawn', () => {
    it('should spawn a process successfully', async () => {
      const mockChildProcess = {
        pid: 12345,
        on: vi.fn()
      }

      const { spawn } = require('child_process')
      vi.mocked(spawn).mockReturnValue(mockChildProcess)

      const pid = await service.spawn('ls', ['-la'])

      expect(pid).toBe(12345)
      expect(spawn).toHaveBeenCalledWith('ls', ['-la'], {
        stdio: 'pipe',
        detached: false
      })
      expect(mockChildProcess.on).toHaveBeenCalledWith('exit', expect.any(Function))
      expect(mockChildProcess.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should throw error for disallowed command', async () => {
      const restrictedService = new ProcessService(['ls'])

      await expect(restrictedService.spawn('rm', ['-rf', '/'])).rejects.toThrow(
        'Command not allowed'
      )
    })

    it('should reject when process fails to get PID', async () => {
      const mockChildProcess = {
        pid: null,
        on: vi.fn()
      }

      const { spawn } = require('child_process')
      vi.mocked(spawn).mockReturnValue(mockChildProcess)

      await expect(service.spawn('ls')).rejects.toThrow('Failed to get process PID')
    })
  })

  describe('exec', () => {
    it('should execute command successfully', async () => {
      const { exec } = require('child_process')
      vi.mocked(exec).mockImplementation((_command, _options, callback) => {
        callback(null, 'stdout content', '')
      })

      const result = await service.exec('ls')

      expect(result.stdout).toBe('stdout content')
      expect(result.stderr).toBe('')
    })

    it('should handle command error', async () => {
      const { exec } = require('child_process')
      vi.mocked(exec).mockImplementation((_command, _options, callback) => {
        callback(new Error('Command failed'), '', 'error output')
      })

      const result = await service.exec('ls')

      expect(result.stdout).toBe('')
      expect(result.stderr).toBe('error output')
    })

    it('should throw error for disallowed command', async () => {
      const restrictedService = new ProcessService(['ls'])

      await expect(restrictedService.exec('rm -rf /')).rejects.toThrow('Command not allowed')
    })
  })

  describe('kill', () => {
    it('should kill a running process', async () => {
      const mockChildProcess = {
        kill: vi.fn((callback) => {
          callback(null)
        })
      }

      // 手动添加一个运行中的进程
      const serviceAny = service as any
      serviceAny.runningProcesses.set(12345, mockChildProcess)

      await service.kill(12345)

      expect(mockChildProcess.kill).toHaveBeenCalledWith(expect.any(Function))
      expect(serviceAny.runningProcesses.has(12345)).toBe(false)
    })

    it('should throw error when process not found', async () => {
      await expect(service.kill(99999)).rejects.toThrow('Process not found')
    })

    it('should handle kill error', async () => {
      const mockChildProcess = {
        kill: vi.fn((callback) => {
          callback(new Error('Kill failed'))
        })
      }

      const serviceAny = service as any
      serviceAny.runningProcesses.set(12345, mockChildProcess)

      await expect(service.kill(12345)).rejects.toThrow('Kill failed')
    })
  })

  describe('getRunningProcesses', () => {
    it('should return list of running process PIDs', () => {
      const serviceAny = service as any
      serviceAny.runningProcesses.set(11111, {})
      serviceAny.runningProcesses.set(22222, {})
      serviceAny.runningProcesses.set(33333, {})

      const pids = service.getRunningProcesses()

      expect(pids).toEqual([11111, 22222, 33333])
    })

    it('should return empty array when no processes running', () => {
      const pids = service.getRunningProcesses()

      expect(pids).toEqual([])
    })
  })

  describe('isRunning', () => {
    it('should return true for running process', () => {
      const serviceAny = service as any
      serviceAny.runningProcesses.set(12345, {})

      expect(service.isRunning(12345)).toBe(true)
    })

    it('should return false for non-running process', () => {
      expect(service.isRunning(99999)).toBe(false)
    })
  })

  describe('killAll', () => {
    it('should kill all running processes', async () => {
      const mockProc1 = {
        kill: vi.fn((cb) => cb(null))
      }
      const mockProc2 = {
        kill: vi.fn((cb) => cb(null))
      }

      const serviceAny = service as any
      serviceAny.runningProcesses.set(11111, mockProc1)
      serviceAny.runningProcesses.set(22222, mockProc2)

      await service.killAll()

      expect(mockProc1.kill).toHaveBeenCalled()
      expect(mockProc2.kill).toHaveBeenCalled()
      expect(serviceAny.runningProcesses.size).toBe(0)
    })

    it('should handle individual kill failures gracefully', async () => {
      const mockProc1 = {
        kill: vi.fn((cb) => cb(new Error('Kill failed')))
      }
      const mockProc2 = {
        kill: vi.fn((cb) => cb(null))
      }

      const serviceAny = service as any
      serviceAny.runningProcesses.set(11111, mockProc1)
      serviceAny.runningProcesses.set(22222, mockProc2)

      // 不应该抛出错误
      await expect(service.killAll()).resolves.toBeUndefined()

      expect(mockProc2.kill).toHaveBeenCalled()
    })
  })

  describe('addAllowedCommand', () => {
    it('should add command to whitelist', () => {
      service.addAllowedCommand('ls')

      const serviceAny = service as any
      expect(serviceAny.allowedCommands.has('ls')).toBe(true)
    })

    it('should allow the newly added command', () => {
      service.addAllowedCommand('git')

      const serviceAny = service as any
      expect(serviceAny.isCommandAllowed('git status')).toBe(true)
    })
  })
})
