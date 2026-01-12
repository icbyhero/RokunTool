/**
 * 文件系统服务
 *
 * 为插件提供受限的文件系统访问
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises'
import { resolve, normalize, relative } from 'path'

export class FsService {
  private allowedDirs: string[] = []

  constructor(allowedDirs: string[] = []) {
    this.allowedDirs = allowedDirs.map((d) => resolve(d))
  }

  /**
   * 添加允许访问的目录
   */
  addAllowedDir(dir: string): void {
    this.allowedDirs.push(resolve(dir))
  }

  /**
   * 检查路径是否在允许的目录范围内
   */
  private isAllowedPath(path: string): boolean {
    const resolvedPath = resolve(path)

    // 如果没有限制,允许所有路径
    if (this.allowedDirs.length === 0) {
      return true
    }

    // 检查路径是否在允许的目录范围内
    return this.allowedDirs.some((allowedDir) => {
      const relativePath = relative(normalize(allowedDir), normalize(resolvedPath))
      return !relativePath.startsWith('..')
    })
  }

  /**
   * 读取文件
   */
  async readFile(path: string): Promise<Buffer> {
    if (!this.isAllowedPath(path)) {
      throw new Error(`Access denied: ${path}`)
    }

    return await readFile(path)
  }

  /**
   * 写入文件
   */
  async writeFile(path: string, data: Buffer | string): Promise<void> {
    if (!this.isAllowedPath(path)) {
      throw new Error(`Access denied: ${path}`)
    }

    await writeFile(path, data)
  }

  /**
   * 读取目录
   */
  async readDir(path: string): Promise<string[]> {
    if (!this.isAllowedPath(path)) {
      throw new Error(`Access denied: ${path}`)
    }

    return await readdir(path)
  }

  /**
   * 获取文件/目录状态
   */
  async stat(path: string): Promise<{
    size: number
    isFile: boolean
    isDirectory: boolean
  }> {
    if (!this.isAllowedPath(path)) {
      throw new Error(`Access denied: ${path}`)
    }

    const stats = await stat(path)
    return {
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    }
  }
}
