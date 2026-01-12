/**
 * IPC 处理器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IpcHandlers } from './handlers'
import { PluginRegistry } from '../plugins/registry'
import { ServiceManager } from '../services'

// Mock Electron
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn()
  }
}))

describe('IpcHandlers', () => {
  let ipcHandlers: IpcHandlers
  let mockRegistry: PluginRegistry
  let mockServiceManager: ServiceManager

  beforeEach(() => {
    // 创建 mock 实例
    mockRegistry = new PluginRegistry()
    mockServiceManager = ServiceManager.getInstance()

    // 创建 IPC 处理器实例
    ipcHandlers = new IpcHandlers(mockRegistry, mockServiceManager)

    // 清理所有 mocks
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('should register all IPC handlers', () => {
      const mockIpcMain = require('electron').ipcMain

      ipcHandlers.register()

      // 验证注册了处理器
      expect(mockIpcMain.handle).toHaveBeenCalledWith('plugin:list', expect.any(Function))
      expect(mockIpcMain.handle).toHaveBeenCalledWith('plugin:get', expect.any(Function))
      expect(mockIpcMain.handle).toHaveBeenCalledWith('plugin:callMethod', expect.any(Function))
    })
  })

  describe('plugin:list handler', () => {
    it('should return all plugins when no filter is provided', async () => {
      const mockPlugin = {
        metadata: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          license: 'MIT',
          main: 'index.js',
          permissions: []
        },
        status: 'loaded' as const,
        path: '/mock/plugins/test-plugin',
        load: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        unload: vi.fn()
      }

      mockRegistry.register(mockPlugin as any)

      const mockIpcMain = require('electron').ipcMain
      const handleCalls = mockIpcMain.handle.mock.calls

      // 找到 plugin:list 的处理器
      const pluginListHandler = handleCalls.find((call: any) => call[0] === 'plugin:list')?.[1]

      expect(pluginListHandler).toBeDefined()

      if (pluginListHandler) {
        const event = {}
        const request = { filter: { status: 'all' } }

        const result = await pluginListHandler(event, request)

        expect(result).toEqual({
          plugins: [mockPlugin.metadata],
          total: 1
        })
      }
    })

    it('should filter plugins by status', async () => {
      const mockPlugin1 = {
        metadata: {
          id: 'plugin1',
          name: 'Plugin 1',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          license: 'MIT',
          main: 'index.js',
          permissions: []
        },
        status: 'loaded' as const,
        path: '/mock/plugins/plugin1',
        load: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        unload: vi.fn()
      }

      const mockPlugin2 = {
        metadata: {
          id: 'plugin2',
          name: 'Plugin 2',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          license: 'MIT',
          main: 'index.js',
          permissions: []
        },
        status: 'disabled' as const,
        path: '/mock/plugins/plugin2',
        load: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        unload: vi.fn()
      }

      mockRegistry.register(mockPlugin1 as any)
      mockRegistry.register(mockPlugin2 as any)

      const mockIpcMain = require('electron').ipcMain
      const handleCalls = mockIpcMain.handle.mock.calls

      const pluginListHandler = handleCalls.find((call: any) => call[0] === 'plugin:list')?.[1]

      if (pluginListHandler) {
        const event = {}
        const request = { filter: { status: 'loaded' } }

        const result = await pluginListHandler(event, request)

        expect(result.plugins).toHaveLength(1)
        expect(result.plugins[0].id).toBe('plugin1')
      }
    })

    it('should filter plugins by type', async () => {
      const mockPlugin = {
        metadata: {
          id: 'tool-plugin',
          name: 'Tool Plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          license: 'MIT',
          main: 'index.js',
          permissions: [],
          type: 'tool'
        },
        status: 'loaded' as const,
        path: '/mock/plugins/tool-plugin',
        load: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        unload: vi.fn()
      }

      mockRegistry.register(mockPlugin as any)

      const mockIpcMain = require('electron').ipcMain
      const handleCalls = mockIpcMain.handle.mock.calls

      const pluginListHandler = handleCalls.find((call: any) => call[0] === 'plugin:list')?.[1]

      if (pluginListHandler) {
        const event = {}
        const request = { filter: { type: 'tool' } }

        const result = await pluginListHandler(event, request)

        expect(result.plugins).toHaveLength(1)
        expect(result.plugins[0].type).toBe('tool')
      }
    })
  })

  describe('plugin:get handler', () => {
    it('should return plugin metadata when plugin exists', async () => {
      const mockPlugin = {
        metadata: {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          license: 'MIT',
          main: 'index.js',
          permissions: []
        },
        status: 'loaded' as const,
        path: '/mock/plugins/test-plugin',
        load: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        unload: vi.fn()
      }

      mockRegistry.register(mockPlugin as any)

      const mockIpcMain = require('electron').ipcMain
      const handleCalls = mockIpcMain.handle.mock.calls

      const pluginGetHandler = handleCalls.find((call: any) => call[0] === 'plugin:get')?.[1]

      if (pluginGetHandler) {
        const event = {}
        const request = { pluginId: 'test-plugin' }

        const result = await pluginGetHandler(event, request)

        expect(result).toEqual({
          plugin: mockPlugin.metadata
        })
      }
    })

    it('should return error when plugin does not exist', async () => {
      const mockIpcMain = require('electron').ipcMain
      const handleCalls = mockIpcMain.handle.mock.calls

      const pluginGetHandler = handleCalls.find((call: any) => call[0] === 'plugin:get')?.[1]

      if (pluginGetHandler) {
        const event = {}
        const request = { pluginId: 'nonexistent-plugin' }

        const result = await pluginGetHandler(event, request)

        expect(result).toEqual({
          error: 'Plugin nonexistent-plugin not found'
        })
      }
    })
  })
})
