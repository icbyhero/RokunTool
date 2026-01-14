/**
 * 文件操作回滚辅助类
 *
 * 提供带自动回滚能力的文件操作方法
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'fs'
import { join, dirname, basename } from 'path'

/**
 * 复制文件(带回滚)
 *
 * @param source 源文件路径
 * @param target 目标文件路径
 * @returns 回滚函数
 *
 * @example
 * ```typescript
 * const rollback = await copyWithRollback('/path/to/source', '/path/to/target')
 * // 如果后续操作失败,调用 rollback() 删除目标文件
 * ```
 */
export async function copyWithRollback(source: string, target: string): Promise<() => void> {
  // 检查源文件是否存在
  if (!existsSync(source)) {
    throw new Error(`源文件不存在: ${source}`)
  }

  // 检查目标文件是否已存在
  const targetExists = existsSync(target)
  let targetBackup: string | null = null

  // 如果目标文件已存在,先备份
  if (targetExists) {
    targetBackup = `${target}.backup.${Date.now()}`
    copyFileSync(target, targetBackup)
  }

  try {
    // 确保目标目录存在
    const targetDir = dirname(target)
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    // 复制文件
    copyFileSync(source, target)

    // 返回回滚函数
    return () => {
      try {
        // 删除复制的文件
        if (existsSync(target)) {
          rmSync(target, { force: true })
        }

        // 如果有备份,恢复备份
        if (targetBackup && existsSync(targetBackup)) {
          renameSync(targetBackup, target)
        }
      } catch (error) {
        console.error(`[copyWithRollback] 回滚失败:`, error)
        throw error
      }
    }
  } catch (error) {
    // 如果复制失败,清理备份
    if (targetBackup && existsSync(targetBackup)) {
      rmSync(targetBackup, { force: true })
    }
    throw error
  }
}

/**
 * 写入文件(带回滚)
 *
 * @param filePath 文件路径
 * @param data 文件内容
 * @returns 回滚函数
 *
 * @example
 * ```typescript
 * const rollback = await writeWithRollback('/path/to/file', 'content')
 * // 如果后续操作失败,调用 rollback() 恢复原始内容
 * ```
 */
export async function writeWithRollback(filePath: string, data: string | Buffer): Promise<() => void> {
  let originalContent: Buffer | null = null
  const fileExists = existsSync(filePath)

  // 如果文件已存在,备份原始内容
  if (fileExists) {
    originalContent = readFileSync(filePath)
  }

  try {
    // 确保目录存在
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    // 写入文件
    writeFileSync(filePath, data)

    // 返回回滚函数
    return () => {
      try {
        if (originalContent) {
          // 恢复原始内容
          writeFileSync(filePath, originalContent)
        } else {
          // 如果原本不存在,删除文件
          if (existsSync(filePath)) {
            rmSync(filePath, { force: true })
          }
        }
      } catch (error) {
        console.error(`[writeWithRollback] 回滚失败:`, error)
        throw error
      }
    }
  } catch (error) {
    throw error
  }
}

/**
 * 创建目录(带回滚)
 *
 * @param dirPath 目录路径
 * @returns 回滚函数
 *
 * @example
 * ```typescript
 * const rollback = await mkdirWithRollback('/path/to/dir')
 * // 如果后续操作失败,调用 rollback() 删除目录
 * ```
 */
export async function mkdirWithRollback(dirPath: string): Promise<() => void> {
  const dirExists = existsSync(dirPath)

  // 如果目录已存在,不需要创建
  if (dirExists) {
    return () => {
      // 目录原本就存在,不需要回滚
    }
  }

  try {
    // 创建目录
    mkdirSync(dirPath, { recursive: true })

    // 返回回滚函数
    return () => {
      try {
        // 删除目录(如果为空)
        if (existsSync(dirPath)) {
          rmSync(dirPath, { recursive: true, force: true })
        }
      } catch (error) {
        console.error(`[mkdirWithRollback] 回滚失败:`, error)
        throw error
      }
    }
  } catch (error) {
    throw error
  }
}

/**
 * 移动文件(带回滚)
 *
 * @param source 源文件路径
 * @param target 目标文件路径
 * @returns 回滚函数
 *
 * @example
 * ```typescript
 * const rollback = await moveWithRollback('/path/to/source', '/path/to/target')
 * // 如果后续操作失败,调用 rollback() 将文件移回原位置
 * ```
 */
export async function moveWithRollback(source: string, target: string): Promise<() => void> {
  // 检查源文件是否存在
  if (!existsSync(source)) {
    throw new Error(`源文件不存在: ${source}`)
  }

  // 检查目标文件是否已存在
  const targetExists = existsSync(target)
  let targetBackup: string | null = null

  // 如果目标文件已存在,先备份
  if (targetExists) {
    targetBackup = `${target}.backup.${Date.now()}`
    copyFileSync(target, targetBackup)
  }

  try {
    // 确保目标目录存在
    const targetDir = dirname(target)
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    // 移动文件
    renameSync(source, target)

    // 返回回滚函数
    return () => {
      try {
        // 将文件移回原位置
        if (existsSync(target)) {
          renameSync(target, source)
        }

        // 如果有备份,恢复备份
        if (targetBackup && existsSync(targetBackup)) {
          renameSync(targetBackup, target)
        }
      } catch (error) {
        console.error(`[moveWithRollback] 回滚失败:`, error)
        throw error
      }
    }
  } catch (error) {
    // 如果移动失败,清理备份
    if (targetBackup && existsSync(targetBackup)) {
      rmSync(targetBackup, { force: true })
    }
    throw error
  }
}

/**
 * 复制目录(带回滚)
 *
 * @param source 源目录路径
 * @param target 目标目录路径
 * @returns 回滚函数
 *
 * @example
 * ```typescript
 * const rollback = await copyDirWithRollback('/path/to/source/dir', '/path/to/target/dir')
 * // 如果后续操作失败,调用 rollback() 删除目标目录
 * ```
 */
export async function copyDirWithRollback(source: string, target: string): Promise<() => void> {
  // 检查源目录是否存在
  if (!existsSync(source)) {
    throw new Error(`源目录不存在: ${source}`)
  }

  const targetExisted = existsSync(target)
  let createdFiles: string[] = []

  try {
    // 如果目标目录不存在,创建它
    if (!targetExisted) {
      mkdirSync(target, { recursive: true })
    }

    // 递归复制目录内容
    const copyRecursive = (src: string, dest: string) => {
      const stat = statSync(src)

      if (stat.isDirectory()) {
        // 创建子目录
        if (!existsSync(dest)) {
          mkdirSync(dest, { recursive: true })
          createdFiles.push(dest)
        }

        // 复制目录内容
        const items = readdirSync(src)
        for (const item of items) {
          copyRecursive(join(src, item), join(dest, item))
        }
      } else {
        // 复制文件
        copyFileSync(src, dest)
        createdFiles.push(dest)
      }
    }

    // 如果目标目录原本存在,先记录其内容
    const originalTargetFiles: string[] = []
    if (targetExisted) {
      const recordFiles = (dir: string) => {
        const items = readdirSync(dir)
        for (const item of items) {
          const itemPath = join(dir, item)
          const stat = statSync(itemPath)
          if (stat.isDirectory()) {
            recordFiles(itemPath)
          } else {
            originalTargetFiles.push(itemPath)
          }
        }
      }
      recordFiles(target)
    }

    // 执行复制
    const items = readdirSync(source)
    for (const item of items) {
      copyRecursive(join(source, item), join(target, item))
    }

    // 返回回滚函数
    return () => {
      try {
        // 删除所有新创建的文件和目录
        for (const file of [...createdFiles].reverse()) {
          if (existsSync(file)) {
            const stat = statSync(file)
            if (stat.isDirectory()) {
              // 只删除空目录
              try {
                const items = readdirSync(file)
                if (items.length === 0) {
                  rmSync(file, { recursive: true, force: true })
                }
              } catch {
                // 忽略错误
              }
            } else {
              rmSync(file, { force: true })
            }
          }
        }

        // 如果目标目录原本不存在,删除它
        if (!targetExisted && existsSync(target)) {
          rmSync(target, { recursive: true, force: true })
        }
      } catch (error) {
        console.error(`[copyDirWithRollback] 回滚失败:`, error)
        throw error
      }
    }
  } catch (error) {
    // 如果复制失败,清理已创建的文件
    for (const file of [...createdFiles].reverse()) {
      if (existsSync(file)) {
        rmSync(file, { recursive: true, force: true })
      }
    }
    throw error
  }
}
