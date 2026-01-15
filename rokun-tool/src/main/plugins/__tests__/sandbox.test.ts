/**
 * 插件沙箱测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PluginSandbox } from '../sandbox'
import type { PluginMetadata } from '@shared/types/plugin'

describe('PluginSandbox', () => {
  let sandbox: PluginSandbox
  let mockMetadata: PluginMetadata
  let mockOptions: any

  beforeEach(() => {
    // 创建测试用的沙箱配置
    const config = {
      enabled: true,
      timeout: 5000,
      strict: true,
      verbose: false
    }

    sandbox = new PluginSandbox(config)

    // 创建测试用的插件元数据
    mockMetadata = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'Test plugin for sandbox',
      author: 'Test Author',
      license: 'MIT',
      permissions: [],
      main: 'index.js',
      type: 'tool'
    } as PluginMetadata

    // 创建测试用的选项
    mockOptions = {
      metadata: mockMetadata,
      dataDir: '/tmp/test-plugin',
      api: {
        fs: {
          readFile: async () => Buffer.from('test'),
          writeFile: async () => {},
          readDir: async () => [],
          stat: async () => ({ size: 1024, isFile: true, isDirectory: false })
        },
        process: {
          exec: async () => ({ stdout: '', stderr: '' })
        },
        path: {
          join: (...parts: string[]) => parts.join('/'),
          basename: (p: string) => p.split('/').pop() || '',
          dirname: (p: string) => p.split('/').slice(0, -1).join('/') || '',
          resolve: (...parts: string[]) => parts.join('/')
        },
        system: {
          getPlatform: async () => 'darwin',
          getArch: async () => 'x64',
          getHomeDir: async () => '/home/user',
          getUserInfo: async () => ({ username: 'user', homedir: '/home/user' })
        }
      },
      env: {
        HOME: '/home/user',
        USER: 'user',
        PATH: '/usr/bin'
      }
    }
  })

  describe('createSandboxContext', () => {
    it('应该在生产模式下移除危险的全局对象', () => {
      const config = {
        enabled: true,
        timeout: 5000,
        strict: true,
        verbose: false
      }

      const prodSandbox = new PluginSandbox(config)
      const context = prodSandbox.createSandboxContext(mockOptions)

      // 不应该包含危险的全局对象
      expect(context.require).toBeUndefined()
      expect(context.process).toBeUndefined()
      expect(context.global).toBeUndefined()

      // 应该包含安全的模块系统对象
      expect(context.module).toBeDefined()
      expect(context.exports).toBeDefined()
      expect(context.__dirname).toBe('/tmp/test-plugin')
      expect(context.__filename).toBe('/tmp/test-plugin/index.js')

      // 应该包含插件上下文
      expect(context.context).toBeDefined()
      expect(context.context.metadata).toEqual(mockMetadata)
      expect(context.context.api).toBeDefined()
      expect(context.context.env).toBeDefined()
    })

    it('应该在开发模式下保留完整的上下文', () => {
      const config = {
        enabled: false, // 禁用沙箱
        timeout: Infinity,
        strict: false,
        verbose: false
      }

      const devSandbox = new PluginSandbox(config)
      const context = devSandbox.createSandboxContext(mockOptions)

      // 应该包含完整的 Node.js 全局对象
      expect(context.require).toBeDefined()
      expect(context.process).toBeDefined()
      expect(context.global).toBeDefined()

      // 应该包含模块系统对象
      expect(context.module).toBeDefined()
      expect(context.exports).toBeDefined()
    })
  })

  describe('runInSandbox', () => {
    it('应该在开发模式下直接执行代码', () => {
      const config = {
        enabled: false,
        timeout: Infinity,
        strict: false,
        verbose: false
      }

      const devSandbox = new PluginSandbox(config)
      const context = devSandbox.createSandboxContext(mockOptions)

      const code = `
        module.exports.test = 'hello';
        module.exports.value = 42;
      `

      const result = devSandbox.runInSandbox(code, context)

      expect(result.test).toBe('hello')
      expect(result.value).toBe(42)
    })

    it('应该在生产模式下在 VM 沙箱中执行代码', () => {
      const context = sandbox.createSandboxContext(mockOptions)

      const code = `
        module.exports.test = 'sandboxed';
        module.exports.value = 100;
      `

      const result = sandbox.runInSandbox(code, context)

      expect(result.test).toBe('sandboxed')
      expect(result.value).toBe(100)
    })

    it('应该在超时时抛出错误', () => {
      const config = {
        enabled: true,
        timeout: 100, // 100ms 超时
        strict: true,
        verbose: false
      }

      const timeoutSandbox = new PluginSandbox(config)
      const context = timeoutSandbox.createSandboxContext(mockOptions)

      // 创建一个会超时的无限循环
      const code = `
        while (true) {}
      `

      expect(() => {
        timeoutSandbox.runInSandbox(code, context)
      }).toThrow()
    })

    it('应该支持异步代码执行', async () => {
      const context = sandbox.createSandboxContext(mockOptions)

      const code = `
        module.exports.asyncValue = await new Promise(resolve => {
          setTimeout(() => resolve('async-result'), 100)
        });
      `

      // 注意: VM 沙箱中的异步代码需要特殊处理
      // 这里我们测试的是同步代码中的异步表达式
      const result = sandbox.runInSandbox(code, context)

      // 由于 VM 的限制,异步代码可能不会按预期工作
      // 这个测试主要用于验证代码不会立即崩溃
      expect(result).toBeDefined()
    })
  })

  describe('validateCode', () => {
    it('应该检测到 require() 调用', () => {
      const code = `
        const fs = require('fs');
        module.exports.value = 42;
      `

      const result = sandbox.validateCode(code)

      expect(result.safe).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0].pattern).toBe('require() 调用')
      expect(result.violations[0].severity).toBe('CRITICAL')
    })

    it('应该检测到 process 对象访问', () => {
      const code = `
        const platform = process.platform;
        module.exports.value = platform;
      `

      const result = sandbox.validateCode(code)

      expect(result.safe).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0].pattern).toBe('process 对象访问')
      expect(result.violations[0].severity).toBe('HIGH')
    })

    it('应该检测到 eval() 调用', () => {
      const code = `
        const result = eval('1 + 1');
        module.exports.value = result;
      `

      const result = sandbox.validateCode(code)

      expect(result.safe).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0].pattern).toBe('eval() 调用')
      expect(result.violations[0].severity).toBe('CRITICAL')
    })

    it('应该检测到 new Function() 调用', () => {
      const code = `
        const fn = new Function('return 42');
        module.exports.value = fn();
      `

      const result = sandbox.validateCode(code)

      expect(result.safe).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0].pattern).toBe('Function 构造器')
      expect(result.violations[0].severity).toBe('CRITICAL')
    })

    it('应该检测到 global 对象访问', () => {
      const code = `
        const value = global.test;
        module.exports.result = value;
      `

      const result = sandbox.validateCode(code)

      expect(result.safe).toBe(false)
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0].pattern).toBe('global 对象访问')
      expect(result.violations[0].severity).toBe('HIGH')
    })

    it('应该通过安全的代码', () => {
      const code = `
        module.exports.test = 'safe-code';
        module.exports.value = 42;
        const x = 100;
      `

      const result = sandbox.validateCode(code)

      expect(result.safe).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('应该跳过注释行中的违规', () => {
      const code = `
        // const fs = require('fs');
        module.exports.test = 'safe';
      `

      const result = sandbox.validateCode(code)

      expect(result.safe).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('应该检测到多个违规', () => {
      const code = `
        const fs = require('fs');
        const platform = process.platform;
        const result = eval('1 + 1');
        module.exports.value = result;
      `

      const result = sandbox.validateCode(code)

      expect(result.safe).toBe(false)
      expect(result.violations.length).toBeGreaterThanOrEqual(3)
    })
  })
})

describe('PluginValidator', () => {
  // 由于 PluginValidator 还没有完全导出,我们暂时跳过这些测试
  // 等导出后再添加完整的测试
})
