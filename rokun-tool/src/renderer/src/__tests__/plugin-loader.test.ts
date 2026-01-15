import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('PluginLoader - 单元测试', () => {
  let mockLogger: any

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('插件加载器基本功能', () => {
    it('应该能够创建插件加载器', () => {
      const PluginLoaderModule = require('../../../main/core/PluginLoader')
      const PluginLoader = PluginLoaderModule.PluginLoader

      const pluginLoader = new PluginLoader(mockLogger, '/tmp/test-plugins')

      expect(pluginLoader).toBeDefined()
      expect(pluginLoader).toHaveProperty('loadPlugin')
      expect(pluginLoader).toHaveProperty('unloadPlugin')
    })

    it('应该能够创建插件目录', () => {
      const mkdirSpy = vi.spyOn(require('fs'), 'mkdirSync')

      const PluginLoaderModule = require('../../../main/core/PluginLoader')
      const PluginLoader = PluginLoaderModule.PluginLoader

      const pluginLoader = new PluginLoader(mockLogger, '/tmp/test-plugins')

      expect(mkdirSpy).toHaveBeenCalled()

      mkdirSpy.mockRestore()
    })
  })

  describe('插件加载', () => {
    it('应该能够加载有效的插件', async () => {
      const PluginLoaderModule = require('../../../main/core/PluginLoader')
      const pluginLoader = new PluginLoaderModule.PluginLoader(mockLogger, '/tmp/test-plugins')

      const mockPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        enabled: false,
        path: '/tmp/test-plugins/test-plugin',
        load: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        unload: vi.fn()
      }

      await expect(pluginLoader.loadPlugin(mockPlugin)).resolves.not.toThrow()

      expect(mockPlugin.load).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('插件加载成功: test-plugin')
    })

    it('应该能够处理插件加载失败', async () => {
      const PluginLoaderModule = require('../../../main/core/PluginLoader')
      const pluginLoader = new PluginLoaderModule.PluginLoader(mockLogger, '/tmp/test-plugins')

      const mockPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        enabled: false,
        path: '/tmp/test-plugins/test-plugin',
        load: vi.fn().mockRejectedValue(new Error('Load failed')),
        enable: vi.fn(),
        disable: vi.fn(),
        unload: vi.fn()
      }

      await expect(pluginLoader.loadPlugin(mockPlugin)).rejects.toThrow()

      expect(mockLogger.error).toHaveBeenCalledWith('插件加载失败: test-plugin', expect.any(Error))
    })
  })

  describe('插件卸载', () => {
    it('应该能够卸载已加载的插件', async () => {
      const PluginLoaderModule = require('../../../main/core/PluginLoader')
      const pluginLoader = new PluginLoaderModule.PluginLoader(mockLogger, '/tmp/test-plugins')

      const mockPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        enabled: true,
        path: '/tmp/test-plugins/test-plugin',
        load: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        unload: vi.fn()
      }

      await expect(pluginLoader.unloadPlugin(mockPlugin)).resolves.not.toThrow()

      expect(mockPlugin.disable).toHaveBeenCalled()
      expect(mockPlugin.unload).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('插件卸载成功: test-plugin')
    })

    it('应该能够处理插件卸载失败', async () => {
      const PluginLoaderModule = require('../../../main/core/PluginLoader')
      const pluginLoader = new PluginLoaderModule.PluginLoader(mockLogger, '/tmp/test-plugins')

      const mockPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        enabled: true,
        path: '/tmp/test-plugins/test-plugin',
        load: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn().mockRejectedValue(new Error('Disable failed')),
        unload: vi.fn()
      }

      await expect(pluginLoader.unloadPlugin(mockPlugin)).rejects.toThrow()

      expect(mockLogger.error).toHaveBeenCalledWith('插件卸载失败: test-plugin', expect.any(Error))
    })
  })

  describe('插件启用/禁用', () => {
    it('应该能够启用插件', async () => {
      const PluginLoaderModule = require('../../../main/core/PluginLoader')
      const pluginLoader = new PluginLoaderModule.PluginLoader(mockLogger, '/tmp/test-plugins')

      const mockPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        enabled: false,
        path: '/tmp/test-plugins/test-plugin',
        load: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        unload: vi.fn()
      }

      await expect(pluginLoader.enablePlugin(mockPlugin)).resolves.not.toThrow()

      expect(mockPlugin.enable).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('插件启用成功: test-plugin')
    })

    it('应该能够禁用插件', async () => {
      const PluginLoaderModule = require('../../../main/core/PluginLoader')
      const pluginLoader = new PluginLoaderModule.PluginLoader(mockLogger, '/tmp/test-plugins')

      const mockPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        enabled: true,
        path: '/tmp/test-plugins/test-plugin',
        load: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        unload: vi.fn()
      }

      await expect(pluginLoader.disablePlugin(mockPlugin)).resolves.not.toThrow()

      expect(mockPlugin.disable).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('插件禁用成功: test-plugin')
    })
  })
})
