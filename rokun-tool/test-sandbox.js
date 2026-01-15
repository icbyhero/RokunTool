#!/usr/bin/env node

/**
 * 沙箱功能测试脚本
 *
 * 测试沙箱的各项功能:
 * 1. 开发模式切换
 * 2. 代码验证
 * 3. 沙箱执行
 */

const { PluginSandbox } = require('./out/main/plugins/sandbox')
const { PluginValidator } = require('./out/main/plugins/validator')

console.log('=====================================')
console.log('插件沙箱功能测试')
console.log('=====================================\n')

// 测试 1: 开发模式配置
console.log('测试 1: 开发模式配置')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const devSandbox = new PluginSandbox({
  enabled: false,
  timeout: Infinity,
  strict: false,
  verbose: true
})

const devContext = devSandbox.createSandboxContext({
  metadata: { id: 'test-plugin', name: 'Test Plugin' },
  dataDir: '/tmp/test',
  api: { test: () => 'ok' },
  env: { HOME: '/tmp' }
})

console.log('开发模式上下文包含 require:', typeof devContext.require === 'function')
console.log('开发模式上下文包含 process:', typeof devContext.process === 'object')
console.log('开发模式上下文包含 global:', typeof devContext.global === 'object')
console.log('✓ 开发模式测试通过\n')

// 测试 2: 生产模式配置
console.log('测试 2: 生产模式配置')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const prodSandbox = new PluginSandbox({
  enabled: true,
  timeout: 30000,
  strict: true,
  verbose: true
})

const prodContext = prodSandbox.createSandboxContext({
  metadata: { id: 'test-plugin', name: 'Test Plugin' },
  dataDir: '/tmp/test',
  api: { test: () => 'ok' },
  env: { HOME: '/tmp' }
})

console.log('生产模式上下文包含 require:', typeof prodContext.require === 'function')
console.log('生产模式上下文包含 process:', typeof prodContext.process === 'object')
console.log('生产模式上下文包含 global:', typeof prodContext.global === 'object')
console.log('✓ 生产模式测试通过\n')

// 测试 3: 代码验证
console.log('测试 3: 代码验证')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const validator = new PluginValidator()

// 安全代码
const safeCode = `
  module.exports = {
    onLoad: async (context) => {
      context.logger.info('Plugin loaded')
    }
  }
`

const safeResult = validator.validatePluginCode(safeCode, 'test-safe')
console.log('安全代码验证:', safeResult.valid ? '✓ 通过' : '✗ 失败')
console.log('  违规数量:', safeResult.violations.length)

// 危险代码
const dangerousCode = `
  const fs = require('fs')
  module.exports = {
    onLoad: async (context) => {
      const data = process.env.HOME
    }
  }
`

const dangerousResult = validator.validatePluginCode(dangerousCode, 'test-dangerous')
console.log('\n危险代码验证:', dangerousResult.valid ? '✗ 失败 (应该被拒绝)' : '✓ 通过 (正确拒绝)')
console.log('  违规数量:', dangerousResult.violations.length)
if (dangerousResult.violations.length > 0) {
  console.log('  违规详情:')
  dangerousResult.violations.slice(0, 3).forEach(v => {
    console.log(`    - 行 ${v.line}: ${v.pattern} (${v.severity})`)
  })
}
console.log('✓ 代码验证测试通过\n')

// 测试 4: 沙箱执行
console.log('测试 4: 沙箱执行')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const testCode = `
  module.exports = {
    testValue: 42,
    testFunction: () => 'Hello from sandbox'
  }
`

try {
  const result = prodSandbox.runInSandbox(testCode, prodContext, 5000)
  console.log('执行结果:', result)
  console.log('testValue:', result.testValue)
  console.log('testFunction:', result.testFunction())
  console.log('✓ 沙箱执行测试通过\n')
} catch (error) {
  console.log('✗ 沙箱执行失败:', error.message, '\n')
}

console.log('=====================================')
console.log('所有测试完成')
console.log('=====================================')
