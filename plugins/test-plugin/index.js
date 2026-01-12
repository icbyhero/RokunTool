/**
 * 测试插件主文件
 *
 * 用于验证插件系统的基本功能
 */

const path = require('path')
const os = require('os')

// 测试结果存储
const testResults = {
  passed: [],
  failed: [],
  total: 0
}

// 辅助函数：记录测试结果
function recordTest(name, passed, error = null) {
  testResults.total++
  if (passed) {
    testResults.passed.push(name)
  } else {
    testResults.failed.push({ name, error: error?.message || 'Unknown error' })
  }
}

// 辅助函数：打印测试结果
function printTestResults(logger) {
  console.log('========== 测试结果 ==========')
  console.log(`总计: ${testResults.total} 个测试`)
  console.log(`通过: ${testResults.passed.length} 个`)
  console.log(`失败: ${testResults.failed.length} 个`)

  if (testResults.failed.length > 0) {
    console.log('失败的测试:')
    testResults.failed.forEach((f) => {
      console.log(`  - ${f.name}: ${f.error}`)
    })
  }

  console.log('============================')
}

// 测试文件系统API
async function testFileSystemAPI(context) {
  const { api, logger } = context
  const testDataDir = path.join(context.dataDir, 'test-data')
  const testFile = path.join(testDataDir, 'test.txt')

  console.log('测试文件系统API...')

  try {
    // 测试1: 写入文件（先创建目录）
    const fs = require('fs')
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true })
    }
    await api.fs.writeFile(testFile, 'Hello, RokunTool!')
    recordTest('文件系统: 写入文件', true)
    console.log('✓ 文件写入成功')
  } catch (error) {
    recordTest('文件系统: 写入文件', false, error)
    console.error('✗ 文件写入失败:', error.message)
    return
  }

  try {
    // 测试2: 读取文件
    const content = await api.fs.readFile(testFile)
    const passed = content.toString() === 'Hello, RokunTool!'
    recordTest('文件系统: 读取文件', passed)
    console.log(passed ? '✓ 文件读取成功' : '✗ 文件内容不匹配')
  } catch (error) {
    recordTest('文件系统: 读取文件', false, error)
    console.error('✗ 文件读取失败:', error.message)
  }

  try {
    // 测试3: 读取目录
    const files = await api.fs.readDir(testDataDir)
    const passed = files.includes('test.txt')
    recordTest('文件系统: 读取目录', passed)
    console.log(passed ? '✓ 目录读取成功' : '✗ 目录内容不匹配')
  } catch (error) {
    recordTest('文件系统: 读取目录', false, error)
    console.error('✗ 目录读取失败:', error.message)
  }

  try {
    // 测试4: 文件状态
    const stats = await api.fs.stat(testFile)
    const passed = stats.isFile === true
    recordTest('文件系统: 文件状态', passed)
    console.log(passed ? '✓ 文件状态获取成功' : '✗ 文件状态不正确')
  } catch (error) {
    recordTest('文件系统: 文件状态', false, error)
    console.error('✗ 文件状态获取失败:', error.message)
  }
}

// 测试进程管理API
async function testProcessAPI(context) {
  const { api, logger } = context

  console.log('测试进程管理API...')

  try {
    // 测试1: 执行简单命令
    const result = await api.process.exec('echo "test"')
    const passed = result.stdout.trim() === 'test'
    recordTest('进程管理: 执行命令', passed)
    console.log(passed ? '✓ 命令执行成功' : '✗ 命令执行结果不匹配')
  } catch (error) {
    recordTest('进程管理: 执行命令', false, error)
    console.error('✗ 命令执行失败:', error.message)
  }

  try {
    // 测试2: 启动进程
    const pid = await api.process.spawn('echo', ['test'])
    const passed = typeof pid === 'number' && pid > 0
    recordTest('进程管理: 启动进程', passed)
    console.log(passed ? `✓ 进程启动成功 (PID: ${pid})` : '✗ 进程启动失败')
  } catch (error) {
    recordTest('进程管理: 启动进程', false, error)
    console.error('✗ 进程启动失败:', error.message)
  }
}

// 测试配置API
async function testConfigAPI(context) {
  const { api, logger } = context

  console.log('测试配置API...')

  const testKey = 'test-plugin.testValue'
  const testValue = { timestamp: Date.now(), message: 'test' }

  try {
    // 测试1: 设置配置
    await api.config.set(testKey, testValue)
    recordTest('配置: 设置配置', true)
    console.log('✓ 配置设置成功')
  } catch (error) {
    recordTest('配置: 设置配置', false, error)
    console.error('✗ 配置设置失败:', error.message)
    return
  }

  try {
    // 测试2: 读取配置
    const value = await api.config.get(testKey)
    const passed = value && value.message === 'test'
    recordTest('配置: 读取配置', passed)
    console.log(passed ? '✓ 配置读取成功' : '✗ 配置内容不匹配')
  } catch (error) {
    recordTest('配置: 读取配置', false, error)
    console.error('✗ 配置读取失败:', error.message)
  }

  try {
    // 测试3: 检查配置存在
    const exists = await api.config.has(testKey)
    const passed = exists === true
    recordTest('配置: 检查配置存在', passed)
    console.log(passed ? '✓ 配置检查成功' : '✗ 配置检查失败')
  } catch (error) {
    recordTest('配置: 检查配置存在', false, error)
    console.error('✗ 配置检查失败:', error.message)
  }

  try {
    // 测试4: 删除配置
    await api.config.delete(testKey)
    const exists = await api.config.has(testKey)
    const passed = exists === false
    recordTest('配置: 删除配置', passed)
    console.log(passed ? '✓ 配置删除成功' : '✗ 配置删除失败')
  } catch (error) {
    recordTest('配置: 删除配置', false, error)
    console.error('✗ 配置删除失败:', error.message)
  }
}

// 测试权限系统
async function testPermissionSystem(context) {
  const { api, logger } = context

  console.log('测试权限系统...')

  try {
    // 测试1: 通知权限
    api.ui.showNotification('测试通知', '这是一个测试通知')
    recordTest('权限系统: 显示通知', true)
    console.log('✓ 通知显示成功')
  } catch (error) {
    recordTest('权限系统: 显示通知', false, error)
    console.error('✗ 通知显示失败:', error.message)
  }

  try {
    // 测试2: UI消息
    api.ui.showMessage('测试消息')
    recordTest('权限系统: 显示消息', true)
    console.log('✓ 消息显示成功')
  } catch (error) {
    recordTest('权限系统: 显示消息', false, error)
    console.error('✗ 消息显示失败:', error.message)
  }
}

// 插件加载时调用
async function onLoad(context) {
  context.logger.info('========== 测试插件开始加载 ==========')
  context.logger.info('插件ID:', context.metadata.id)
  context.logger.info('插件版本:', context.metadata.version)
  context.logger.info('数据目录:', context.dataDir)
  context.logger.info('操作系统:', os.platform())
  context.logger.info('架构:', os.arch())
  context.logger.info('=====================================')
}

// 插件启用时调用
async function onEnable(context) {
  console.log('========== 开始运行测试套件 ==========')

  try {
    // 运行所有测试
    await testFileSystemAPI(context)
    await testProcessAPI(context)
    await testConfigAPI(context)
    await testPermissionSystem(context)

    // 打印测试结果
    printTestResults(context.logger)

    // 保存测试结果到配置
    await context.api.config.set('test-plugin.lastRun', {
      timestamp: new Date().toISOString(),
      results: testResults
    })

    console.log('========== 测试套件完成 ==========')
  } catch (error) {
    console.error('测试套件执行失败:', error)
  }
}

// 插件禁用时调用
async function onDisable(context) {
  context.logger.info('测试插件已禁用')
}

// 插件卸载时调用
async function onUnload(context) {
  context.logger.info('测试插件已卸载')
}

// 导出钩子
module.exports = {
  onLoad,
  onEnable,
  onDisable,
  onUnload
}
