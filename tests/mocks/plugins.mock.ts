/**
 * 插件系统 Mock 数据和工具
 */

import { vi } from 'vitest'

/**
 * 插件元数据接口
 */
export interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  license: string
  main: string
  permissions: string[]
}

/**
 * 插件实例接口
 */
export interface PluginInstance {
  metadata: PluginMetadata
  path: string
  load: ReturnType<typeof vi.fn>
  enable: ReturnType<typeof vi.fn>
  disable: ReturnType<typeof vi.fn>
  unload: ReturnType<typeof vi.fn>
  status: 'loaded' | 'enabled' | 'disabled' | 'error'
}

/**
 * 标准插件 package.json fixture
 */
export const mockPluginPackage: PluginMetadata = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'A test plugin for unit testing',
  author: 'Test Author',
  license: 'MIT',
  main: 'index.js',
  permissions: ['fs:read', 'fs:write']
}

/**
 * Rime 插件 package.json fixture
 */
export const mockRimePluginPackage: PluginMetadata = {
  id: 'rokun-rime-config',
  name: 'Rime Config Manager',
  version: '1.0.0',
  description: 'Rime input method configuration manager',
  author: 'Rokun Team',
  license: 'MIT',
  main: 'index.js',
  permissions: ['fs:read', 'fs:write', 'process:exec', 'process:spawn']
}

/**
 * 微信分身插件 package.json fixture
 */
export const mockWechatPluginPackage: PluginMetadata = {
  id: 'rokun-wechat-multi-instance',
  name: 'WeChat Multi Instance',
  version: '1.0.0',
  description: 'WeChat multi-instance launcher',
  author: 'Rokun Team',
  license: 'MIT',
  main: 'index.js',
  permissions: ['process:spawn', 'process:exec']
}

/**
 * 创建插件 Mock 工厂函数
 */
export function createMockPlugin(
  metadata: Partial<PluginMetadata> = {}
): PluginMetadata {
  return {
    ...mockPluginPackage,
    ...metadata
  }
}

/**
 * 创建插件实例 Mock 工厂函数
 */
export function createMockPluginInstance(
  metadata: Partial<PluginMetadata> = {},
  initialStatus: PluginInstance['status'] = 'loaded'
): PluginInstance {
  const pluginMetadata = createMockPlugin(metadata)

  return {
    metadata: pluginMetadata,
    path: `/mock/plugins/${pluginMetadata.id}`,
    load: vi.fn().mockResolvedValue(undefined),
    enable: vi.fn().mockResolvedValue(undefined),
    disable: vi.fn().mockResolvedValue(undefined),
    unload: vi.fn().mockResolvedValue(undefined),
    status: initialStatus
  }
}

/**
 * 创建插件上下文 Mock
 */
export function createMockPluginContext() {
  return {
    api: {
      fs: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        readDir: vi.fn(),
        stat: vi.fn()
      },
      process: {
        exec: vi.fn().mockResolvedValue({
          stdout: 'success',
          stderr: ''
        }),
        spawn: vi.fn()
      },
      config: {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn()
      },
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn()
      }
    },
    store: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn()
    }
  }
}

/**
 * 插件注册表 Mock
 */
export class MockPluginRegistry {
  private plugins: Map<string, PluginInstance> = new Map()

  register(plugin: PluginInstance): void {
    this.plugins.set(plugin.metadata.id, plugin)
  }

  unregister(pluginId: string): void {
    this.plugins.delete(pluginId)
  }

  get(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId)
  }

  has(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  getAll(): PluginInstance[] {
    return Array.from(this.plugins.values())
  }

  clear(): void {
    this.plugins.clear()
  }
}

/**
 * 创建插件注册表 Mock 实例
 */
export function createMockPluginRegistry(): MockPluginRegistry {
  return new MockPluginRegistry()
}
