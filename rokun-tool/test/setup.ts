/**
 * Vitest 测试环境设置文件
 * 在所有测试运行前执行
 */

import { vi } from 'vitest'

// 导入 testing-library 的断言扩展
import '@testing-library/jest-dom'

// 清理每个测试后的 mock
afterEach(() => {
  vi.clearAllMocks()
})

/**
 * Mock matchMedia API (用于响应式测试)
 */
Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

/**
 * Mock localStorage
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})

/**
 * Mock ResizeObserver
 */
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
})) as any

/**
 * Mock IntersectionObserver
 */
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
})) as any

/**
 * 设置全局测试超时
 */
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000
})

console.info('✅ Test environment setup completed')
