/**
 * 测试辅助函数
 * 提供常用的测试工具和断言
 */

import { vi } from 'vitest'

/**
 * 等待一段时间
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 等待条件成立
 */
export async function waitFor(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options

  const startTime = Date.now()
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Condition not met within ${timeout}ms`)
    }
    await delay(interval)
  }
}

/**
 * 等待异步函数执行完成
 */
export async function waitForAsync<T>(
  fn: () => Promise<T>,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const { timeout = 5000, interval = 100 } = options

  const startTime = Date.now()
  let lastError: Error | null = null

  while (Date.now() - startTime <= timeout) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      await delay(interval)
    }
  }

  throw lastError || new Error('Async function failed')
}

/**
 * Mock 函数调用次数断言
 */
export function assertCalledTimes(
  mock: ReturnType<typeof vi.fn>,
  times: number,
  message?: string
): void {
  const actualTimes = mock.mock.calls.length
  if (actualTimes !== times) {
    throw new Error(
      message ||
        `Expected mock to be called ${times} times, but was called ${actualTimes} times`
    )
  }
}

/**
 * Mock 函数调用参数断言
 */
export function assertCalledWith(
  mock: ReturnType<typeof vi.fn>,
  args: unknown[],
  callIndex = 0
): void {
  const actualArgs = mock.mock.calls[callIndex]
  if (!actualArgs) {
    throw new Error(`Mock was not called at index ${callIndex}`)
  }

  const isMatch = args.every((arg, index) => {
    return JSON.stringify(arg) === JSON.stringify(actualArgs[index])
  })

  if (!isMatch) {
    throw new Error(
      `Expected mock to be called with ${JSON.stringify(args)}, but was called with ${JSON.stringify(actualArgs)}`
    )
  }
}

/**
 * 创建 spies 监听器
 */
export function createSpies<T extends Record<string, (...args: unknown[]) => unknown>>(
  obj: T
): { [K in keyof T]: ReturnType<typeof vi.fn> } {
  const spies = {} as { [K in keyof T]: ReturnType<typeof vi.fn> }

  for (const key in obj) {
    if (typeof obj[key] === 'function') {
      spies[key] = vi.spyOn(obj, key)
    }
  }

  return spies
}

/**
 * 恢复所有 spies
 */
export function restoreAllSpies(spies: Record<string, ReturnType<typeof vi.spyOn>>): void {
  Object.values(spies).forEach((spy) => spy.mockRestore())
}

/**
 * 创建测试用例数据生成器
 */
export function createTestCases<T>(cases: T[]): { description: string; data: T }[] {
  return cases.map((data) => ({
    description: JSON.stringify(data),
    data
  }))
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 比较两个对象是否深度相等
 */
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

/**
 * 创建随机字符串
 */
export function randomString(length = 10): string {
  return Math.random().toString(36).substring(2, 2 + length)
}

/**
 * 创建随机文件路径
 */
export function randomPath(): string {
  return `/tmp/test/${randomString(8)}`
}

/**
 * 清理所有 mocks
 */
export function cleanupAllMocks(): void {
  vi.clearAllMocks()
  vi.restoreAllMocks()
}

/**
 * 创建测试套件名称
 */
export function describeTestSuite(
  feature: string,
  scenario: string
): string {
  return `${feature} > ${scenario}`
}

/**
 * 测试性能记录器
 */
export class PerformanceRecorder {
  private records: Map<string, number[]> = new Map()

  record(label: string, duration: number): void {
    if (!this.records.has(label)) {
      this.records.set(label, [])
    }
    this.records.get(label)!.push(duration)
  }

  getAverage(label: string): number {
    const durations = this.records.get(label)
    if (!durations || durations.length === 0) {
      return 0
    }
    return durations.reduce((a, b) => a + b, 0) / durations.length
  }

  getMax(label: string): number {
    const durations = this.records.get(label)
    if (!durations || durations.length === 0) {
      return 0
    }
    return Math.max(...durations)
  }

  getMin(label: string): number {
    const durations = this.records.get(label)
    if (!durations || durations.length === 0) {
      return 0
    }
    return Math.min(...durations)
  }

  clear(): void {
    this.records.clear()
  }

  getSummary(): Record<string, { avg: number; max: number; min: number; count: number }> {
    const summary: Record<
      string,
      { avg: number; max: number; min: number; count: number }
    > = {}

    for (const [label, durations] of this.records.entries()) {
      summary[label] = {
        avg: this.getAverage(label),
        max: this.getMax(label),
        min: this.getMin(label),
        count: durations.length
      }
    }

    return summary
  }
}
