/**
 * 权限服务测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PermissionService, Permission } from './permission-service'

// Mock Electron
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/userdata')
  }
}))

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined)
  },
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined)
}))

// Mock fs
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => '[]')
  },
  readFileSync: vi.fn(() => '[]')
}))

describe('PermissionService', () => {
  let service: PermissionService

  beforeEach(() => {
    // 清除所有 mocks
    vi.clearAllMocks()

    // 创建新的权限服务实例
    service = new PermissionService()
  })

  describe('hasPermission', () => {
    it('should return false for non-existent plugin', () => {
      const result = service.hasPermission('nonexistent-plugin', 'fs:read' as Permission)

      expect(result).toBe(false)
    })

    it('should return false for non-granted permission', async () => {
      await service.grantPermissions('test-plugin', ['fs:write' as Permission])

      const result = service.hasPermission('test-plugin', 'fs:read' as Permission)

      expect(result).toBe(false)
    })

    it('should return true for granted permission', async () => {
      await service.grantPermissions('test-plugin', ['fs:read' as Permission])

      const result = service.hasPermission('test-plugin', 'fs:read' as Permission)

      expect(result).toBe(true)
    })
  })

  describe('hasPermissions', () => {
    it('should return false if not all permissions are granted', async () => {
      await service.grantPermissions('test-plugin', ['fs:read' as Permission])

      const result = service.hasPermissions('test-plugin', [
        'fs:read' as Permission,
        'fs:write' as Permission
      ])

      expect(result).toBe(false)
    })

    it('should return true if all permissions are granted', async () => {
      await service.grantPermissions('test-plugin', [
        'fs:read' as Permission,
        'fs:write' as Permission
      ])

      const result = service.hasPermissions('test-plugin', [
        'fs:read' as Permission,
        'fs:write' as Permission
      ])

      expect(result).toBe(true)
    })

    it('should return true for empty permissions array', () => {
      const result = service.hasPermissions('test-plugin', [])

      expect(result).toBe(true)
    })
  })

  describe('grantPermissions', () => {
    it('should grant permissions to a plugin', async () => {
      await service.grantPermissions('test-plugin', ['fs:read' as Permission, 'fs:write' as Permission])

      expect(service.hasPermission('test-plugin', 'fs:read' as Permission)).toBe(true)
      expect(service.hasPermission('test-plugin', 'fs:write' as Permission)).toBe(true)
    })

    it('should be idempotent - granting same permissions twice should not duplicate', async () => {
      await service.grantPermissions('test-plugin', ['fs:read' as Permission])
      await service.grantPermissions('test-plugin', ['fs:read' as Permission])

      const permissions = service.getPluginPermissions('test-plugin')

      expect(permissions).toEqual(['fs:read'])
    })

    it('should add new permissions to existing ones', async () => {
      await service.grantPermissions('test-plugin', ['fs:read' as Permission])
      await service.grantPermissions('test-plugin', ['fs:write' as Permission])

      const permissions = service.getPluginPermissions('test-plugin')

      expect(permissions).toEqual(['fs:read', 'fs:write'])
    })
  })

  describe('revokePermissions', () => {
    it('should revoke specified permissions from a plugin', async () => {
      await service.grantPermissions('test-plugin', [
        'fs:read' as Permission,
        'fs:write' as Permission,
        'process:exec' as Permission
      ])

      await service.revokePermissions('test-plugin', ['fs:write' as Permission])

      expect(service.hasPermission('test-plugin', 'fs:read' as Permission)).toBe(true)
      expect(service.hasPermission('test-plugin', 'fs:write' as Permission)).toBe(false)
      expect(service.hasPermission('test-plugin', 'process:exec' as Permission)).toBe(true)
    })

    it('should remove plugin entry if all permissions are revoked', async () => {
      await service.grantPermissions('test-plugin', ['fs:read' as Permission])

      await service.revokePermissions('test-plugin', ['fs:read' as Permission])

      expect(service.getPluginPermissions('test-plugin')).toEqual([])
    })

    it('should do nothing if plugin has no permissions', async () => {
      await expect(
        service.revokePermissions('nonexistent-plugin', ['fs:read' as Permission])
      ).resolves.not.toThrow()
    })
  })

  describe('revokeAll', () => {
    it('should revoke all permissions from a plugin', async () => {
      await service.grantPermissions('test-plugin', [
        'fs:read' as Permission,
        'fs:write' as Permission,
        'process:exec' as Permission
      ])

      await service.revokeAll('test-plugin')

      expect(service.getPluginPermissions('test-plugin')).toEqual([])
    })

    it('should remove plugin from registry', async () => {
      await service.grantPermissions('test-plugin', ['fs:read' as Permission])

      await service.revokeAll('test-plugin')

      expect(service.getAllPlugins()).not.toContain('test-plugin')
    })
  })

  describe('getPluginPermissions', () => {
    it('should return empty array for plugin with no permissions', () => {
      const permissions = service.getPluginPermissions('nonexistent-plugin')

      expect(permissions).toEqual([])
    })

    it('should return all granted permissions', async () => {
      await service.grantPermissions('test-plugin', [
        'fs:read' as Permission,
        'fs:write' as Permission
      ])

      const permissions = service.getPluginPermissions('test-plugin')

      expect(permissions).toEqual(['fs:read', 'fs:write'])
    })
  })

  describe('getAllPlugins', () => {
    it('should return empty array when no plugins have permissions', () => {
      const plugins = service.getAllPlugins()

      expect(plugins).toEqual([])
    })

    it('should return all plugins with granted permissions', async () => {
      await service.grantPermissions('plugin1', ['fs:read' as Permission])
      await service.grantPermissions('plugin2', ['fs:write' as Permission])

      const plugins = service.getAllPlugins()

      expect(plugins).toContain('plugin1')
      expect(plugins).toContain('plugin2')
      expect(plugins).toHaveLength(2)
    })
  })
})
