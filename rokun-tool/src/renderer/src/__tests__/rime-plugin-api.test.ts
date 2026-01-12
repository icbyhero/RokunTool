/**
 * Rime 配置管理插件 API 测试
 *
 * 测试 Rime 插件提供的 API 接口
 * 通过 IPC 通信测试插件功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Electron API
const mockIpcRenderer = {
  invoke: vi.fn()
}

vi.mock('electron', () => ({
  ipcRenderer: mockIpcRenderer
}))

// Mock window.electronAPI
const mockCallMethod = vi.fn()

const mockElectronAPI = {
  plugin: {
    callMethod: mockCallMethod
  },
  clipboard: {} as any,
  notification: {} as any,
  quit: vi.fn()
}

// Assign mock to window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

describe('Rime Plugin API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRecipes', () => {
    it('should return list of Plum recipes', async () => {
      const mockRecipes = [
        {
          id: 'full',
          name: '全部文件',
          description: '安装或更新 rime-ice 的全部文件',
          recipe: 'iDvel/rime-ice:others/recipes/full',
          installed: false
        },
        {
          id: 'all_dicts',
          name: '所有词库',
          description: '安装或更新所有词库文件',
          recipe: 'iDvel/rime-ice:others/recipes/all_dicts',
          installed: false
        },
        {
          id: 'cn_dicts',
          name: '拼音词库',
          description: '安装或更新拼音词库文件',
          recipe: 'iDvel/rime-ice:others/recipes/cn_dicts',
          installed: false
        },
        {
          id: 'en_dicts',
          name: '英文词库',
          description: '安装或更新英文词库文件',
          recipe: 'iDvel/rime-ice:others/recipes/en_dicts',
          installed: false
        },
        {
          id: 'opencc',
          name: 'OpenCC',
          description: '安装或更新 OpenCC 简繁转换配置',
          recipe: 'iDvel/rime-ice:others/recipes/opencc',
          installed: false
        }
      ]

      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: true,
        data: { recipes: mockRecipes }
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'getRecipes',
        args: []
      })

      expect(result.success).toBe(true)
      expect(result.data.recipes).toHaveLength(5)
      expect(result.data.recipes[0].id).toBe('full')
    })

    it('should handle errors when getting recipes', async () => {
      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: false,
        error: 'Failed to get recipes'
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'getRecipes',
        args: []
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to get recipes')
    })
  })

  describe('installRecipe', () => {
    it('should install a recipe successfully', async () => {
      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: true,
        data: {
          output: 'Installation successful'
        }
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'installRecipe',
        args: [{ recipe: 'iDvel/rime-ice:others/recipes/full' }]
      })

      expect(result.success).toBe(true)
      expect(result.data?.output).toBe('Installation successful')
      expect(mockElectronAPI.plugin.callMethod).toHaveBeenCalledWith({
        pluginId: 'rokun-rime-config',
        method: 'installRecipe',
        args: [{ recipe: 'iDvel/rime-ice:others/recipes/full' }]
      })
    })

    it('should handle installation errors', async () => {
      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: false,
        error: 'Rime 未安装'
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'installRecipe',
        args: [{ recipe: 'iDvel/rime-ice:others/recipes/full' }]
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rime 未安装')
    })

    it('should throw error when recipe does not exist', async () => {
      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: false,
        error: '配方不存在'
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'installRecipe',
        args: [{ recipe: 'invalid-recipe' }]
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('配方不存在')
    })
  })

  describe('updateRecipe', () => {
    it('should update a recipe successfully', async () => {
      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: true,
        data: {
          output: 'Update successful'
        }
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'updateRecipe',
        args: [{ recipe: 'iDvel/rime-ice:others/recipes/full' }]
      })

      expect(result.success).toBe(true)
      expect(result.data?.output).toBe('Update successful')
    })
  })

  describe('uninstallRecipe', () => {
    it('should uninstall a recipe successfully', async () => {
      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: true,
        data: {
          message: '配方 全部文件 卸载成功'
        }
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'uninstallRecipe',
        args: [{ recipe: 'iDvel/rime-ice:others/recipes/full' }]
      })

      expect(result.success).toBe(true)
      expect(result.data?.message).toContain('卸载成功')
    })
  })

  describe('deployRime', () => {
    it('should deploy Rime successfully', async () => {
      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: true,
        data: {
          message: 'Rime 部署成功',
          output: 'Deployment successful'
        }
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'deployRime',
        args: []
      })

      expect(result.success).toBe(true)
      expect(result.data?.message).toBe('Rime 部署成功')
      expect(mockElectronAPI.plugin.callMethod).toHaveBeenCalledWith({
        pluginId: 'rokun-rime-config',
        method: 'deployRime',
        args: []
      })
    })

    it('should handle deployment errors', async () => {
      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: false,
        error: 'Rime 未安装'
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'deployRime',
        args: []
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rime 未安装')
    })
  })

  describe('getSchemes', () => {
    it('should return list of Rime schemes', async () => {
      const mockSchemes = [
        {
          id: 'luna_pinyin',
          file: 'luna_pinyin.schema.yaml',
          displayName: '朙月拼音',
          enabled: true
        },
        {
          id: 'terra_pinyin',
          file: 'terra_pinyin.schema.yaml',
          displayName: '地球拼音',
          enabled: false
        }
      ]

      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: true,
        data: { schemes: mockSchemes }
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'getSchemes',
        args: []
      })

      expect(result.success).toBe(true)
      expect(result.data.schemes).toHaveLength(2)
      expect(result.data.schemes[0].id).toBe('luna_pinyin')
    })

    it('should handle errors when getting schemes', async () => {
      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: false,
        error: 'Rime 未安装'
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'getSchemes',
        args: []
      })

      expect(result.success).toBe(false)
    })
  })

  describe('enableScheme', () => {
    it('should enable a scheme successfully', async () => {
      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: true,
        data: {
          message: '方案已启用'
        }
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'enableScheme',
        args: [{ schemeId: 'luna_pinyin' }]
      })

      expect(result.success).toBe(true)
      expect(result.data?.message).toContain('已启用')
    })
  })

  describe('disableScheme', () => {
    it('should disable a scheme successfully', async () => {
      mockElectronAPI.plugin.callMethod.mockResolvedValue({
        success: true,
        data: {
          message: '方案已禁用'
        }
      })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'disableScheme',
        args: [{ schemeId: 'luna_pinyin' }]
      })

      expect(result.success).toBe(true)
      expect(result.data?.message).toContain('已禁用')
    })
  })
})
