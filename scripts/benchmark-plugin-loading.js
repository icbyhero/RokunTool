#!/usr/bin/env node
/**
 * 插件性能基准测试脚本
 *
 * 用于测量:
 * - 插件加载时间
 * - API 调用延迟
 * - 内存使用情况
 *
 * 运行方式:
 *   node scripts/benchmark-plugin-loading.js
 *
 * 输出格式: JSON
 */

const path = require('path')
const fs = require('fs')

// 测试结果存储
const results = {
  timestamp: new Date().toISOString(),
  baseline: {
    loadTime: {},
    apiLatency: {},
    memory: {
      before: 0,
      after: 0,
      delta: 0
    }
  },
  environment: {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cpuCount: require('os').cpus().length,
    totalMemory: Math.round(require('os').totalmem() / 1024 / 1024) + ' MB'
  }
}

/**
 * 获取当前内存使用 (MB)
 */
function getMemoryUsage() {
  const usage = process.memoryUsage()
  return {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024)
  }
}

/**
 * 测量函数执行时间
 */
async function measureTime(fn, label) {
  const start = performance.now()
  try {
    const result = await fn()
    const end = performance.now()
    const duration = Math.round(end - start)
    return { success: true, duration, result }
  } catch (error) {
    const end = performance.now()
    const duration = Math.round(end - start)
    return { success: false, duration, error: error.message }
  }
}

/**
 * 模拟插件上下文 (仅用于基准测试)
 */
function createMockContext() {
  return {
    metadata: {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0'
    },
    dataDir: '/tmp/test-plugin-data',
    env: {
      HOME: process.env.HOME,
      USER: process.env.USER,
      PATH: process.env.PATH
    },
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    },
    api: {
      fs: {
        readFile: async (path) => {
          // 模拟延迟
          await new Promise(resolve => setTimeout(resolve, 5))
          return Buffer.from('test content')
        },
        writeFile: async (path, content) => {
          // 模拟延迟
          await new Promise(resolve => setTimeout(resolve, 5))
        },
        stat: async (path) => {
          // 模拟延迟
          await new Promise(resolve => setTimeout(resolve, 3))
          return { isDirectory: () => true, size: 1024 }
        },
        readDir: async (path) => {
          // 模拟延迟
          await new Promise(resolve => setTimeout(resolve, 10))
          return ['file1.txt', 'file2.txt']
        }
      },
      process: {
        exec: async (cmd) => {
          // 模拟延迟
          await new Promise(resolve => setTimeout(resolve, 120))
          return { stdout: 'output', stderr: '' }
        }
      },
      path: {
        join: (...parts) => path.join(...parts),
        basename: (p) => path.basename(p),
        dirname: (p) => path.dirname(p),
        resolve: (...parts) => path.resolve(...parts)
      },
      system: {
        getPlatform: async () => process.platform,
        getArch: async () => process.arch,
        getHomeDir: async () => process.env.HOME,
        getUserInfo: async () => ({
          username: process.env.USER || 'unknown',
          homedir: process.env.HOME
        })
      }
    }
  }
}

/**
 * 测试插件加载性能
 */
async function benchmarkPluginLoading(pluginId, pluginPath) {
  console.log(`\n📊 测试插件加载: ${pluginId}`)

  const pluginDir = path.dirname(pluginPath)
  const startTime = performance.now()

  try {
    // 读取插件代码
    const code = fs.readFileSync(pluginPath, 'utf-8')

    // 创建简单的模块包装器
    const moduleWrapper = `
      ${code}
      return module.exports
    `

    // 记录加载前内存
    const memBefore = getMemoryUsage()

    // 执行插件代码 (模拟加载)
    const fn = new Function('module', 'exports', 'require', moduleWrapper)
    const module = { exports: {} }
    fn(module, module.exports, require)

    const endTime = performance.now()
    const loadTime = Math.round(endTime - startTime)

    // 记录加载后内存
    const memAfter = getMemoryUsage()

    console.log(`  ✓ 加载成功 (${loadTime}ms)`)
    console.log(`  📈 内存变化: RSS ${memAfter.rss - memBefore.rss}MB, Heap ${memAfter.heapUsed - memBefore.heapUsed}MB`)

    return {
      success: true,
      loadTime,
      memory: {
        before: memBefore,
        after: memAfter,
        delta: {
          rss: memAfter.rss - memBefore.rss,
          heapUsed: memAfter.heapUsed - memBefore.heapUsed
        }
      }
    }
  } catch (error) {
    console.log(`  ✗ 加载失败: ${error.message}`)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 测试 API 调用延迟
 */
async function benchmarkAPICalls(context) {
  console.log('\n📊 测试 API 调用延迟')

  const apiTests = [
    {
      name: 'fs.readFile',
      fn: () => context.api.fs.readFile('/tmp/test.txt')
    },
    {
      name: 'fs.stat',
      fn: () => context.api.fs.stat('/tmp/test.txt')
    },
    {
      name: 'fs.readDir',
      fn: () => context.api.fs.readDir('/tmp')
    },
    {
      name: 'process.exec',
      fn: () => context.api.process.exec('echo test')
    },
    {
      name: 'system.getPlatform',
      fn: () => context.api.system.getPlatform()
    },
    {
      name: 'system.getHomeDir',
      fn: () => context.api.system.getHomeDir()
    }
  ]

  const results = {}

  for (const test of apiTests) {
    const measurements = []

    // 运行 5 次取平均值
    for (let i = 0; i < 5; i++) {
      const result = await measureTime(test.fn)
      if (result.success) {
        measurements.push(result.duration)
      }
    }

    if (measurements.length > 0) {
      const avg = Math.round(measurements.reduce((a, b) => a + b, 0) / measurements.length)
      const min = Math.min(...measurements)
      const max = Math.max(...measurements)

      results[test.name] = { avg, min, max }
      console.log(`  ✓ ${test.name}: 平均 ${avg}ms (范围: ${min}-${max}ms)`)
    } else {
      results[test.name] = { avg: 0, min: 0, max: 0, error: 'Failed' }
      console.log(`  ✗ ${test.name}: 失败`)
    }
  }

  return results
}

/**
 * 运行所有基准测试
 */
async function runBenchmarks() {
  console.log('╔════════════════════════════════════════════════════════════════════╗')
  console.log('║           插件性能基准测试                                            ║')
  console.log('╚════════════════════════════════════════════════════════════════════╝')
  console.log(`\n时间: ${results.timestamp}`)
  console.log(`平台: ${results.environment.platform} ${results.environment.arch}`)
  console.log(`Node: ${results.environment.nodeVersion}`)
  console.log(`CPU: ${results.environment.cpuCount} 核`)
  console.log(`内存: ${results.environment.totalMemory}`)

  // 记录初始内存
  const initialMemory = getMemoryUsage()
  results.baseline.memory.before = initialMemory

  // 测试插件加载
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('测试 1: 插件加载时间')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const pluginsToTest = [
    { id: 'rokun-rime-config', path: './plugins/rime-config/index.js' },
    { id: 'rokun-wechat-multi-instance', path: './plugins/wechat-multi-instance/index.js' },
    { id: 'test-plugin', path: './plugins/test-plugin/index.js' }
  ]

  for (const plugin of pluginsToTest) {
    if (fs.existsSync(plugin.path)) {
      const result = await benchmarkPluginLoading(plugin.id, plugin.path)
      if (result.success) {
        results.baseline.loadTime[plugin.id] = result.loadTime
      }
    } else {
      console.log(`  ⚠️  跳过 ${plugin.id} (文件不存在)`)
    }
  }

  // 测试 API 调用延迟
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('测试 2: API 调用延迟')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const mockContext = createMockContext()
  results.baseline.apiLatency = await benchmarkAPICalls(mockContext)

  // 记录最终内存
  const finalMemory = getMemoryUsage()
  results.baseline.memory.after = finalMemory
  results.baseline.memory.delta = {
    rss: finalMemory.rss - initialMemory.rss,
    heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
    external: finalMemory.external - initialMemory.external
  }

  // 输出总结
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('测试总结')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n插件加载时间:`)
  Object.entries(results.baseline.loadTime).forEach(([id, time]) => {
    console.log(`  - ${id}: ${time}ms`)
  })

  console.log(`\nAPI 调用延迟 (平均值):`)
  Object.entries(results.baseline.apiLatency).forEach(([api, stats]) => {
    console.log(`  - ${api}: ${stats.avg}ms`)
  })

  console.log(`\n内存使用:`)
  console.log(`  - 测试前: RSS ${initialMemory.rss}MB, Heap ${initialMemory.heapUsed}MB`)
  console.log(`  - 测试后: RSS ${finalMemory.rss}MB, Heap ${finalMemory.heapUsed}MB`)
  console.log(`  - 增长: RSS ${results.baseline.memory.delta.rss}MB, Heap ${results.baseline.memory.delta.heapUsed}MB`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✓ 基准测试完成')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  return results
}

// 主程序
(async () => {
  try {
    const results = await runBenchmarks()

    // 输出 JSON 结果 (可用于后续分析)
    const outputPath = path.join(__dirname, '../openspec/changes/plugin-sandbox-security/baseline-results.json')
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`\n📄 结果已保存到: ${outputPath}`)

  } catch (error) {
    console.error('\n❌ 基准测试失败:', error)
    process.exit(1)
  }
})()
