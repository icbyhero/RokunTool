/**
 * 文件系统服务测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FsService } from './fs'

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn()
}))

describe('FsService', () => {
  let service: FsService
  let mockReadFile: ReturnType<typeof vi.fn>
  let mockWriteFile: ReturnType<typeof vi.fn>
  let mockReaddir: ReturnType<typeof vi.fn>
  let mockStat: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // 清除所有 mocks
    vi.clearAllMocks()

    // 获取 mock 函数引用
    const fsPromises = require('fs/promises')
    mockReadFile = fsPromises.readFile
    mockWriteFile = fsPromises.writeFile
    mockReaddir = fsPromises.readdir
    mockStat = fsPromises.stat

    // 创建文件系统服务
    service = new FsService(['/allowed/dir'])
  })

  describe('readFile', () => {
    it('should read file from allowed directory', async () => {
      const testContent = Buffer.from('test content')
      mockReadFile.mockResolvedValue(testContent)

      const result = await service.readFile('/allowed/dir/file.txt')

      expect(result).toEqual(testContent)
      expect(mockReadFile).toHaveBeenCalledWith('/allowed/dir/file.txt')
    })

    it('should throw error for path outside allowed directory', async () => {
      await expect(service.readFile('/restricted/dir/file.txt')).rejects.toThrow(
        'Access denied: /restricted/dir/file.txt'
      )

      expect(mockReadFile).not.toHaveBeenCalled()
    })

    it('should allow all paths when no restrictions are set', async () => {
      const unrestrictedService = new FsService([])
      const testContent = Buffer.from('test content')
      mockReadFile.mockResolvedValue(testContent)

      const result = await unrestrictedService.readFile('/any/path/file.txt')

      expect(result).toEqual(testContent)
      expect(mockReadFile).toHaveBeenCalledWith('/any/path/file.txt')
    })
  })

  describe('writeFile', () => {
    it('should write file to allowed directory', async () => {
      mockWriteFile.mockResolvedValue(undefined)

      await service.writeFile('/allowed/dir/file.txt', 'content')

      expect(mockWriteFile).toHaveBeenCalledWith('/allowed/dir/file.txt', 'content')
    })

    it('should throw error for path outside allowed directory', async () => {
      await expect(
        service.writeFile('/restricted/dir/file.txt', 'content')
      ).rejects.toThrow('Access denied: /restricted/dir/file.txt')

      expect(mockWriteFile).not.toHaveBeenCalled()
    })

    it('should support Buffer data', async () => {
      mockWriteFile.mockResolvedValue(undefined)

      await service.writeFile('/allowed/dir/file.txt', Buffer.from('content'))

      expect(mockWriteFile).toHaveBeenCalledWith('/allowed/dir/file.txt', Buffer.from('content'))
    })
  })

  describe('readDir', () => {
    it('should read directory from allowed path', async () => {
      const mockFiles = ['file1.txt', 'file2.txt']
      mockReaddir.mockResolvedValue(mockFiles)

      const result = await service.readDir('/allowed/dir')

      expect(result).toEqual(mockFiles)
      expect(mockReaddir).toHaveBeenCalledWith('/allowed/dir')
    })

    it('should throw error for path outside allowed directory', async () => {
      await expect(service.readDir('/restricted/dir')).rejects.toThrow(
        'Access denied: /restricted/dir'
      )

      expect(mockReaddir).not.toHaveBeenCalled()
    })
  })

  describe('stat', () => {
    it('should get file stats from allowed path', async () => {
      const mockStats = {
        size: 1024,
        isFile: vi.fn(() => true),
        isDirectory: vi.fn(() => false)
      }
      mockStat.mockResolvedValue(mockStats)

      const result = await service.stat('/allowed/dir/file.txt')

      expect(result).toEqual({
        size: 1024,
        isFile: true,
        isDirectory: false
      })
      expect(mockStat).toHaveBeenCalledWith('/allowed/dir/file.txt')
    })

    it('should get directory stats from allowed path', async () => {
      const mockStats = {
        size: 4096,
        isFile: vi.fn(() => false),
        isDirectory: vi.fn(() => true)
      }
      mockStat.mockResolvedValue(mockStats)

      const result = await service.stat('/allowed/dir')

      expect(result).toEqual({
        size: 4096,
        isFile: false,
        isDirectory: true
      })
    })

    it('should throw error for path outside allowed directory', async () => {
      await expect(service.stat('/restricted/dir/file.txt')).rejects.toThrow(
        'Access denied: /restricted/dir/file.txt'
      )

      expect(mockStat).not.toHaveBeenCalled()
    })
  })

  describe('addAllowedDir', () => {
    it('should add new allowed directory', async () => {
      service.addAllowedDir('/another/allowed/dir')
      const testContent = Buffer.from('test content')
      mockReadFile.mockResolvedValue(testContent)

      const result = await service.readFile('/another/allowed/dir/file.txt')

      expect(result).toEqual(testContent)
    })

    it('should allow access to multiple allowed directories', async () => {
      service.addAllowedDir('/second/allowed/dir')
      const testContent = Buffer.from('test content')
      mockReadFile.mockResolvedValue(testContent)

      await service.readFile('/allowed/dir/file1.txt')
      await service.readFile('/second/allowed/dir/file2.txt')

      expect(mockReadFile).toHaveBeenCalledTimes(2)
    })
  })

  describe('isAllowedPath', () => {
    it('should allow subdirectories of allowed directory', () => {
      const serviceAny = service as any
      expect(serviceAny.isAllowedPath('/allowed/dir/subdir/file.txt')).toBe(true)
    })

    it('should reject parent directory traversal', () => {
      const serviceAny = service as any
      expect(serviceAny.isAllowedPath('/allowed/../restricted/file.txt')).toBe(false)
    })

    it('should reject completely different paths', () => {
      const serviceAny = service as any
      expect(serviceAny.isAllowedPath('/restricted/file.txt')).toBe(false)
    })

    it('should allow all paths when no restrictions', () => {
      const unrestrictedService = new FsService([])
      const unrestrictedServiceAny = unrestrictedService as any
      expect(unrestrictedServiceAny.isAllowedPath('/any/path')).toBe(true)
    })
  })
})
