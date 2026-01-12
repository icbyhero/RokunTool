/**
 * 插件加载器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PluginLoader } from './loader'
import { PluginRegistry } from './registry'
import { ServiceManager } from '../services'
import { readFileSync, readdirSync, statSync } from 'fs'

// Mock fs 模块
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn()
  },
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn()
}))

// Mock Electron
vi.mock('electron', () => ({
  default: {
    BrowserWindow: vi.fn(),
    app: {
      getPath: vi.fn(() => '/mock/userdata')
    }
  },
  BrowserWindow: vi.fn(),
  app: {
    getPath: vi.fn(() => '/mock/userdata')
  }
}))

describe('PluginLoader', () => {
  let loader: PluginLoader
  let mockRegistry: PluginRegistry
  let mockServiceManager: ServiceManager

  beforeEach(() => {
    // 创建 mock 实例
    mockRegistry = new PluginRegistry()
    mockServiceManager = ServiceManager.getInstance()

    // 创建测试用的插件加载器
    loader = new PluginLoader('/mock/plugins', mockRegistry, mockServiceManager)

    // 清理所有 mocks
    vi.clearAllMocks()
  })

  describe('loadPackage', () => {
    it('should successfully load a valid plugin package', async () => {
      const mockPackageJson = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        license: 'MIT',
        main: 'index.js',
        permissions: ['fs:read']
      }

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackageJson))

      const result = await loader.loadPackage('/mock/plugins/test-plugin')

      expect(result).not.toBeNull()
      expect(result?.metadata.id).toBe('test-plugin')
      expect(result?.metadata.name).toBe('Test Plugin')
      expect(result?.metadata.version).toBe('1.0.0')
    })

    it('should return null for invalid package.json', async () => {
      const invalidPackage = {
        id: 'invalid-plugin',
        name: 'Invalid Plugin'
        // Missing required fields
      }

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(invalidPackage))

      const result = await loader.loadPackage('/mock/plugins/invalid-plugin')

      expect(result).toBeNull()
    })

    it('should return null when file read fails', async () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('File not found')
      })

      const result = await loader.loadPackage('/mock/plugins/nonexistent')

      expect(result).toBeNull()
    })

    it('should validate plugin ID format', async () => {
      const invalidIdPackage = {
        id: 'Invalid ID!',
        name: 'Invalid ID Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        main: 'index.js',
        permissions: []
      }

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(invalidIdPackage))

      const result = await loader.loadPackage('/mock/plugins/invalid-id')

      expect(result).toBeNull()
    })

    it('should validate plugin version format', async () => {
      const invalidVersionPackage = {
        id: 'invalid-version-plugin',
        name: 'Invalid Version Plugin',
        version: 'not-a-version',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        main: 'index.js',
        permissions: []
      }

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(invalidVersionPackage))

      const result = await loader.loadPackage('/mock/plugins/invalid-version')

      expect(result).toBeNull()
    })
  })

  describe('validateMetadata', () => {
    it('should accept valid metadata', () => {
      const validMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        license: 'MIT',
        main: 'index.js',
        permissions: ['fs:read']
      }

      // Access private method through testing
      const loaderAny = loader as any
      expect(loaderAny.validateMetadata(validMetadata)).toBe(true)
    })

    it('should reject metadata with missing required fields', () => {
      const incompleteMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin'
        // Missing version, description, etc.
      }

      const loaderAny = loader as any
      expect(loaderAny.validateMetadata(incompleteMetadata)).toBe(false)
    })

    it('should reject metadata with invalid ID format', () => {
      const invalidIdMetadata = {
        id: 'Invalid ID!',
        name: 'Test',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        main: 'index.js',
        permissions: []
      }

      const loaderAny = loader as any
      expect(loaderAny.validateMetadata(invalidIdMetadata)).toBe(false)
    })

    it('should reject metadata with invalid version format', () => {
      const invalidVersionMetadata = {
        id: 'test-plugin',
        name: 'Test',
        version: 'invalid',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        main: 'index.js',
        permissions: []
      }

      const loaderAny = loader as any
      expect(loaderAny.validateMetadata(invalidVersionMetadata)).toBe(false)
    })
  })

  describe('loadAll', () => {
    it('should return empty array when plugins directory does not exist', async () => {
      vi.mocked(statSync).mockImplementation(() => {
        throw new Error('Directory not found')
      })

      const result = await loader.loadAll()

      expect(result).toEqual([])
    })

    it('should scan plugins directory and load plugins', async () => {
      const mockEntries = [
        { name: 'test-plugin', isDirectory: () => true }
      ]

      vi.mocked(statSync).mockReturnValue({ isDirectory: () => true } as any)
      vi.mocked(readdirSync).mockReturnValue(mockEntries as any)

      const mockPackageJson = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        main: 'index.js',
        permissions: []
      }

      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockPackageJson))

      // Mock dynamic import
      vi.doMock('/mock/plugins/test-plugin/index.js', () => ({
        default: {
          onLoad: vi.fn()
        }
      }))

      const result = await loader.loadAll()

      expect(readdirSync).toHaveBeenCalledWith('/mock/plugins', { withFileTypes: true })
      expect(result).toBeDefined()
    })
  })

  describe('getRegistry', () => {
    it('should return the plugin registry', () => {
      const registry = loader.getRegistry()

      expect(registry).toBe(mockRegistry)
    })
  })

  describe('unloadAll', () => {
    it('should unload all registered plugins', async () => {
      const mockPlugin = {
        metadata: { id: 'test' } as any,
        unload: vi.fn().mockResolvedValue(undefined)
      }

      mockRegistry.register(mockPlugin as any)

      await loader.unloadAll()

      expect(mockPlugin.unload).toHaveBeenCalled()
    })
  })
})
