/**
 * 文件系统 Mock
 * 用于测试文件操作功能
 */

import { vi } from 'vitest'
import { mockFsPromises, MockFsPromises } from './fs-promises.mock'

/**
 * 虚拟文件系统状态
 */
interface VirtualFile {
  content: string
  stats: {
    isFile: () => boolean
    isDirectory: () => boolean
    size: number
  }
}

interface VirtualFileSystem {
  [path: string]: VirtualFile
}

/**
 * 创建虚拟文件系统工具
 */
export class VirtualFileSystem {
  private fs: VirtualFileSystem = {}

  /**
   * 设置文件内容
   */
  setFile(path: string, content: string): void {
    this.fs[path] = {
      content,
      stats: {
        isFile: () => true,
        isDirectory: () => false,
        size: content.length
      }
    }
  }

  /**
   * 设置目录
   */
  setDirectory(path: string): void {
    this.fs[path] = {
      content: '',
      stats: {
        isFile: () => false,
        isDirectory: () => true,
        size: 0
      }
    }
  }

  /**
   * 获取文件内容
   */
  getFile(path: string): string | null {
    const file = this.fs[path]
    return file?.content || null
  }

  /**
   * 检查文件/目录是否存在
   */
  exists(path: string): boolean {
    return path in this.fs
  }

  /**
   * 删除文件/目录
   */
  delete(path: string): void {
    delete this.fs[path]
  }

  /**
   * 列出目录内容
   */
  listDirectory(path: string): string[] {
    return Object.keys(this.fs)
      .filter((key) => key.startsWith(path))
      .map((key) => key.slice(path.length))
  }

  /**
   * 清空文件系统
   */
  clear(): void {
    this.fs = {}
  }
}

/**
 * 全局虚拟文件系统实例
 */
export const virtualFs = new VirtualFileSystem()

/**
 * 创建 fs/promises 的 Mock
 */
export function createFsPromisesMock() {
  return {
    readFile: vi.fn(async (path: string) => {
      const content = virtualFs.getFile(path)
      if (content === null) {
        const error = new Error(`ENOENT: no such file or directory, open '${path}'`)
        ;(error as NodeJS.ErrnoException).code = 'ENOENT'
        throw error
      }
      return content
    }),

    writeFile: vi.fn(async (path: string, data: string) => {
      virtualFs.setFile(path, data)
    }),

    readdir: vi.fn(async (path: string) => {
      if (!virtualFs.exists(path)) {
        const error = new Error(`ENOENT: no such file or directory, scandir '${path}'`)
        ;(error as NodeJS.ErrnoException).code = 'ENOENT'
        throw error
      }
      return virtualFs.listDirectory(path)
    }),

    stat: vi.fn(async (path: string) => {
      if (!virtualFs.exists(path)) {
        const error = new Error(`ENOENT: no such file or directory, stat '${path}'`)
        ;(error as NodeJS.ErrnoException).code = 'ENOENT'
        throw error
      }
      const file = virtualFs.fs[path]
      return file.stats
    }),

    access: vi.fn(async (path: string) => {
      if (!virtualFs.exists(path)) {
        const error = new Error(`ENOENT: no such file or directory, access '${path}'`)
        ;(error as NodeJS.ErrnoException).code = 'ENOENT'
        throw error
      }
    }),

    mkdir: vi.fn(async (path: string) => {
      virtualFs.setDirectory(path)
    })
  }
}

/**
 * 设置文件系统 Mock
 */
export function setupFsMock() {
  const mock = createFsPromisesMock()
  vi.mock('fs/promises', () => mock)
  return mock
}

/**
 * 创建临时目录工具
 */
export async function createTempDir(): Promise<string> {
  const tempDir = `/tmp/test-${Date.now()}`
  virtualFs.setDirectory(tempDir)
  return tempDir
}

/**
 * 清理临时目录
 */
export async function cleanupTempDir(path: string): Promise<void> {
  virtualFs.delete(path)
}
