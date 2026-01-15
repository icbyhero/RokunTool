/**
 * fs/promises Mock 类型定义
 */

import { vi } from 'vitest'

export type MockFsPromises = {
  readFile: ReturnType<typeof vi.fn>
  writeFile: ReturnType<typeof vi.fn>
  readdir: ReturnType<typeof vi.fn>
  stat: ReturnType<typeof vi.fn>
  access: ReturnType<typeof vi.fn>
  mkdir: ReturnType<typeof vi.fn>
  unlink: ReturnType<typeof vi.fn>
  rmdir: ReturnType<typeof vi.fn>
}

// 默认导出
export const mockFsPromises = {} as MockFsPromises
