import { defineConfig } from '@playwright/test'

/**
 * Playwright E2E 测试配置
 * 用于测试应用的端到端用户流程
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Electron 应用通常不适合并行测试
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 单个 worker 以避免 Electron 应用冲突
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'electron',
      use: {
        // Electron 特定配置
        launchOptions: {
          args: ['--disable-gpu']
        }
      }
    }
  ],
  timeout: 30 * 1000, // 30 秒超时
  expect: {
    timeout: 10 * 1000 // 10 秒断言超时
  }
})
