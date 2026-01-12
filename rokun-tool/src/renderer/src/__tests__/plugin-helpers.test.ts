import { describe, it, expect } from 'vitest'
import {
  formatPermission,
  formatPermissions,
  formatVersion,
  validatePluginMetadata,
  getPluginIcon,
  getPluginTypeLabel,
  getPluginStatusLabel,
  isPluginEnabled,
  canPluginBeEnabled,
  canPluginBeDisabled,
  getPluginDependencies,
  hasDependencies
} from '../utils/plugin-helpers'
import type { PluginMetadata, PluginPermission } from '@shared/types/plugin'

describe('plugin-helpers', () => {
  describe('formatPermission', () => {
    it('应该格式化已知权限', () => {
      expect(formatPermission('fs:read')).toBe('读取文件')
      expect(formatPermission('fs:write')).toBe('写入文件')
      expect(formatPermission('process:spawn')).toBe('启动进程')
      expect(formatPermission('network:http')).toBe('HTTP 请求')
    })

    it('应该返回原始权限字符串如果未知', () => {
      expect(formatPermission('unknown:permission' as PluginPermission)).toBe('unknown:permission')
    })
  })

  describe('formatPermissions', () => {
    it('应该格式化权限数组', () => {
      const permissions: PluginPermission[] = ['fs:read', 'fs:write', 'process:spawn']
      const result = formatPermissions(permissions)
      expect(result).toEqual(['读取文件', '写入文件', '启动进程'])
    })

    it('应该处理空数组', () => {
      expect(formatPermissions([])).toEqual([])
    })
  })

  describe('formatVersion', () => {
    it('应该格式化版本号', () => {
      expect(formatVersion('1.0.0')).toBe('v1.0.0')
      expect(formatVersion('2.3.4')).toBe('v2.3.4')
    })

    it('应该处理空版本', () => {
      expect(formatVersion('')).toBe('未知版本')
      expect(formatVersion(null as any)).toBe('未知版本')
      expect(formatVersion(undefined as any)).toBe('未知版本')
    })
  })

  describe('validatePluginMetadata', () => {
    it('应该验证有效的元数据', () => {
      const validMeta: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        license: 'MIT',
        permissions: ['fs:read'],
        main: 'index.js',
        type: 'tool'
      }

      const result = validatePluginMetadata(validMeta)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('应该验证无效的元数据', () => {
      const invalidMeta: Partial<PluginMetadata> = {
        id: '',
        name: '',
        version: '',
        description: '',
        author: '',
        license: '',
        permissions: [],
        main: '',
        type: 'invalid' as any
      }

      const result = validatePluginMetadata(invalidMeta as PluginMetadata)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors).toContain('插件 ID 不能为空')
      expect(result.errors).toContain('插件名称不能为空')
      expect(result.errors).toContain('插件类型必须是 tool、extension 或 theme')
    })

    it('应该验证无效的权限', () => {
      const invalidMeta: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        license: 'MIT',
        permissions: ['invalid:permission'] as any,
        main: 'index.js',
        type: 'tool'
      }

      const result = validatePluginMetadata(invalidMeta)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('无效的权限: invalid:permission')
    })
  })

  describe('getPluginIcon', () => {
    it('应该返回类型图标', () => {
      const meta: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        permissions: [],
        main: 'index.js',
        type: 'tool'
      }

      expect(getPluginIcon(meta)).toBe('🔧')
      meta.type = 'extension'
      expect(getPluginIcon(meta)).toBe('🧩')
      meta.type = 'theme'
      expect(getPluginIcon(meta)).toBe('🎨')
    })

    it('应该返回默认图标如果类型未知', () => {
      const meta: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        permissions: [],
        main: 'index.js',
        type: 'unknown' as any
      }

      expect(getPluginIcon(meta)).toBe('📦')
    })

    it('应该使用自定义图标', () => {
      const meta: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        permissions: [],
        main: 'index.js',
        type: 'tool',
        icon: 'custom-icon.png'
      }

      expect(getPluginIcon(meta)).toBe('custom-icon.png')
    })
  })

  describe('getPluginTypeLabel', () => {
    it('应该返回类型标签', () => {
      expect(getPluginTypeLabel('tool')).toBe('工具')
      expect(getPluginTypeLabel('extension')).toBe('扩展')
      expect(getPluginTypeLabel('theme')).toBe('主题')
    })

    it('应该返回原始类型如果未知', () => {
      expect(getPluginTypeLabel('unknown')).toBe('unknown')
    })
  })

  describe('getPluginStatusLabel', () => {
    it('应该返回正确的状态标签', () => {
      expect(getPluginStatusLabel(true)).toBe('已启用')
      expect(getPluginStatusLabel(false)).toBe('已禁用')
    })
  })

  describe('isPluginEnabled', () => {
    it('应该检查插件是否启用', () => {
      const meta: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        permissions: [],
        main: 'index.js',
        type: 'tool',
        enabled: true
      }

      expect(isPluginEnabled(meta)).toBe(true)
      meta.enabled = false
      expect(isPluginEnabled(meta)).toBe(false)
      meta.enabled = undefined
      expect(isPluginEnabled(meta)).toBe(false)
    })
  })

  describe('canPluginBeEnabled', () => {
    it('应该检查插件是否可以启用', () => {
      const meta: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        permissions: [],
        main: 'index.js',
        type: 'tool',
        enabled: false
      }

      expect(canPluginBeEnabled(meta)).toBe(true)
      meta.enabled = true
      expect(canPluginBeEnabled(meta)).toBe(false)
    })
  })

  describe('canPluginBeDisabled', () => {
    it('应该检查插件是否可以禁用', () => {
      const meta: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        permissions: [],
        main: 'index.js',
        type: 'tool',
        enabled: true
      }

      expect(canPluginBeDisabled(meta)).toBe(true)
      meta.enabled = false
      expect(canPluginBeDisabled(meta)).toBe(false)
    })
  })

  describe('getPluginDependencies', () => {
    it('应该返回依赖列表', () => {
      const meta: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        permissions: [],
        main: 'index.js',
        type: 'tool',
        dependencies: ['plugin1', 'plugin2']
      }

      expect(getPluginDependencies(meta)).toEqual(['plugin1', 'plugin2'])
    })

    it('应该返回空数组如果没有依赖', () => {
      const meta: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        permissions: [],
        main: 'index.js',
        type: 'tool'
      }

      expect(getPluginDependencies(meta)).toEqual([])
    })
  })

  describe('hasDependencies', () => {
    it('应该检查插件是否有依赖', () => {
      const meta: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        permissions: [],
        main: 'index.js',
        type: 'tool',
        dependencies: ['plugin1']
      }

      expect(hasDependencies(meta)).toBe(true)
      meta.dependencies = []
      expect(hasDependencies(meta)).toBe(false)
      delete meta.dependencies
      expect(hasDependencies(meta)).toBe(false)
    })
  })
})
