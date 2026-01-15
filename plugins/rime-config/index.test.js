/**
 * Rime 配置管理插件测试
 */

const { describe, it, expect, beforeEach, vi } = require('vitest')

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn()
}))

describe('RimeConfigPlugin', () => {
  let plugin
  let mockContext

  beforeEach(() => {
    // 重置所有 mocks
    vi.clearAllMocks()

    // 创建 mock context
    mockContext = {
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      },
      api: {
        process: {
          exec: vi.fn()
        },
        fs: {
          writeFile: vi.fn()
        }
      }
    }

    // 动态导入插件,避免顶层 import
    const RimeConfigPlugin = require('./index.js')
    plugin = new RimeConfigPlugin.class || new (class {
      constructor(context) {
        this.context = context
        this.rimeDir = null
        this.recipes = []
        this.backupDir = null
      }
    })()
    plugin.context = mockContext
  })

  describe('detectRimeInstallation', () => {
    it('should detect Rime directory when it exists', async () => {
      const { access, stat } = require('fs/promises')
      vi.mocked(access).mockResolvedValue(undefined)
      vi.mocked(stat).mockResolvedValue({ isDirectory: () => true })

      await plugin.detectRimeInstallation()

      expect(plugin.rimeDir).toBeTruthy()
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('检测到 Rime 目录')
      )
    })

    it('should return false when Rime is not found', async () => {
      const { access } = require('fs/promises')
      vi.mocked(access).mockRejectedValue(new Error('Not found'))

      const result = await plugin.detectRimeInstallation()

      expect(result).toBe(false)
      expect(plugin.rimeDir).toBeNull()
      expect(mockContext.logger.warn).toHaveBeenCalledWith('未检测到 Rime 安装')
    })
  })

  describe('loadRecipes', () => {
    it('should load all Plum recipes', async () => {
      await plugin.loadRecipes()

      expect(plugin.recipes).toHaveLength(5)
      expect(plugin.recipes[0].id).toBe('full')
      expect(plugin.recipes[1].id).toBe('all_dicts')
      expect(plugin.recipes[2].id).toBe('cn_dicts')
      expect(plugin.recipes[3].id).toBe('en_dicts')
      expect(plugin.recipes[4].id).toBe('opencc')
    })

    it('should check installed status when Rime directory exists', async () => {
      plugin.rimeDir = '/mock/rime'

      const { readdir } = require('fs/promises')
      vi.mocked(readdir).mockResolvedValue([
        'rime_ice.dict.yaml',
        'melt_eng.dict.yaml',
        'cn_dicts_1.yaml',
        'opencc_t2s.json'
      ])

      await plugin.loadRecipes()

      // 验证安装状态检测
      const fullRecipe = plugin.recipes.find(r => r.id === 'full')
      expect(fullRecipe.installed).toBe(true)

      const cnDictsRecipe = plugin.recipes.find(r => r.id === 'cn_dicts')
      expect(cnDictsRecipe.installed).toBe(true)
    })
  })

  describe('getRecipes', () => {
    it('should return all recipes', async () => {
      await plugin.loadRecipes()

      const result = await plugin.getRecipes()

      expect(result.success).toBe(true)
      expect(result.data.recipes).toHaveLength(5)
    })
  })

  describe('installRecipe', () => {
    beforeEach(async () => {
      await plugin.loadRecipes()
      plugin.rimeDir = '/mock/rime'
    })

    it('should install recipe successfully', async () => {
      const recipeString = 'iDvel/rime-ice:others/recipes/full'
      mockContext.api.process.exec.mockResolvedValue({
        stdout: 'Installation successful',
        stderr: ''
      })

      const result = await plugin.installRecipe(recipeString)

      expect(result.success).toBe(true)
      expect(result.message).toContain('安装成功')
      expect(mockContext.api.process.exec).toHaveBeenCalledWith(
        `rime-install ${recipeString}`
      )
    })

    it('should throw error when Rime is not installed', async () => {
      plugin.rimeDir = null

      await expect(plugin.installRecipe('any-recipe')).rejects.toThrow('Rime 未安装')
    })

    it('should throw error when recipe does not exist', async () => {
      await expect(plugin.installRecipe('non-existent-recipe')).rejects.toThrow('配方不存在')
    })

    it('should handle installation errors', async () => {
      const recipeString = 'iDvel/rime-ice:others/recipes/full'
      mockContext.api.process.exec.mockRejectedValue(new Error('Network error'))

      await expect(plugin.installRecipe(recipeString)).rejects.toThrow('Network error')
      expect(mockContext.logger.error).toHaveBeenCalled()
    })
  })

  describe('updateRecipe', () => {
    beforeEach(async () => {
      await plugin.loadRecipes()
      plugin.rimeDir = '/mock/rime'
    })

    it('should update recipe successfully', async () => {
      const recipeString = 'iDvel/rime-ice:others/recipes/full'
      mockContext.api.process.exec.mockResolvedValue({
        stdout: 'Update successful',
        stderr: ''
      })

      const result = await plugin.updateRecipe(recipeString)

      expect(result.success).toBe(true)
      expect(result.message).toContain('更新成功')
    })

    it('should throw error when Rime is not installed', async () => {
      plugin.rimeDir = null

      await expect(plugin.updateRecipe('any-recipe')).rejects.toThrow('Rime 未安装')
    })
  })

  describe('uninstallRecipe', () => {
    beforeEach(async () => {
      await plugin.loadRecipes()
      plugin.rimeDir = '/mock/rime'
    })

    it('should uninstall full recipe successfully', async () => {
      const { readdir } = require('fs/promises')
      vi.mocked(readdir).mockResolvedValue([
        'rime_ice.dict.yaml',
        'melt_eng.dict.yaml',
        'cn_dicts_1.yaml'
      ])

      const recipeString = 'iDvel/rime-ice:others/recipes/full'
      mockContext.api.process.exec.mockResolvedValue({
        stdout: '',
        stderr: ''
      })

      const result = await plugin.uninstallRecipe(recipeString)

      expect(result.success).toBe(true)
      expect(result.message).toContain('卸载成功')
      expect(mockContext.api.process.exec).toHaveBeenCalled()
    })

    it('should uninstall cn_dicts recipe successfully', async () => {
      const { readdir } = require('fs/promises')
      vi.mocked(readdir).mockResolvedValue([
        'cn_dicts_1.yaml',
        'cn_dicts_2.yaml'
      ])

      const recipeString = 'iDvel/rime-ice:others/recipes/cn_dicts'
      mockContext.api.process.exec.mockResolvedValue({
        stdout: '',
        stderr: ''
      })

      const result = await plugin.uninstallRecipe(recipeString)

      expect(result.success).toBe(true)
    })
  })

  describe('deployRime', () => {
    it('should deploy Rime successfully', async () => {
      plugin.rimeDir = '/mock/rime'
      mockContext.api.process.exec.mockResolvedValue({
        stdout: 'Deployment successful',
        stderr: ''
      })

      const result = await plugin.deployRime()

      expect(result.success).toBe(true)
      expect(result.message).toBe('Rime 部署成功')
      expect(mockContext.api.process.exec).toHaveBeenCalledWith('rime_deployer --build')
    })

    it('should throw error when Rime is not installed', async () => {
      plugin.rimeDir = null

      await expect(plugin.deployRime()).rejects.toThrow('Rime 未安装')
    })

    it('should handle deployment errors', async () => {
      plugin.rimeDir = '/mock/rime'
      mockContext.api.process.exec.mockRejectedValue(new Error('Deployment failed'))

      await expect(plugin.deployRime()).rejects.toThrow('Deployment failed')
      expect(mockContext.logger.error).toHaveBeenCalled()
    })
  })

  describe('getSchemes', () => {
    it('should return list of schemes', async () => {
      plugin.rimeDir = '/mock/rime'

      const { readdir, readFile } = require('fs/promises')
      vi.mocked(readdir).mockResolvedValue([
        'luna_pinyin.schema.yaml',
        'terra_pinyin.schema.yaml'
      ])

      vi.mocked(readFile).mockImplementation((path, encoding) => {
        if (path.includes('luna_pinyin.schema.yaml')) {
          return Promise.resolve(`
schema_name: luna_pinyin
name: 朙月拼音
`)
        }
        if (path.includes('terra_pinyin.schema.yaml')) {
          return Promise.resolve(`
schema_name: terra_pinyin
name: 地球拼音
`)
        }
        if (path.includes('default.custom.yaml')) {
          return Promise.resolve('schema_list:\n  - luna_pinyin\n')
        }
        return Promise.reject(new Error('File not found'))
      })

      const schemes = await plugin.getSchemes()

      expect(schemes).toHaveLength(2)
      expect(schemes[0].id).toBe('luna_pinyin')
      expect(schemes[0].displayName).toBe('朙月拼音')
      expect(schemes[0].enabled).toBe(true)
    })

    it('should throw error when Rime is not installed', async () => {
      plugin.rimeDir = null

      await expect(plugin.getSchemes()).rejects.toThrow('Rime 未安装')
    })
  })

  describe('enableScheme', () => {
    it('should enable a scheme', async () => {
      plugin.rimeDir = '/mock/rime'

      const { readFile } = require('fs/promises')
      vi.mocked(readFile).mockResolvedValue('schema_list:\n')

      await plugin.enableScheme('luna_pinyin')

      expect(mockContext.api.fs.writeFile).toHaveBeenCalled()
      expect(mockContext.logger.info).toHaveBeenCalledWith('方案已启用: luna_pinyin')
    })

    it('should create schema_list section if not exists', async () => {
      plugin.rimeDir = '/mock/rime'

      const { readFile } = require('fs/promises')
      vi.mocked(readFile).mockResolvedValue('# No schema_list\n')

      await plugin.enableScheme('terra_pinyin')

      const writeCall = mockContext.api.fs.writeFile.mock.calls[0]
      const content = writeCall[1]
      expect(content).toContain('schema_list:')
      expect(content).toContain('- terra_pinyin')
    })

    it('should throw error when Rime is not installed', async () => {
      plugin.rimeDir = null

      await expect(plugin.enableScheme('luna_pinyin')).rejects.toThrow('Rime 未安装')
    })
  })

  describe('disableScheme', () => {
    it('should disable a scheme', async () => {
      plugin.rimeDir = '/mock/rime'

      const { readFile } = require('fs/promises')
      vi.mocked(readFile).mockResolvedValue(
        'schema_list:\n  - luna_pinyin\n  - terra_pinyin\n'
      )

      await plugin.disableScheme('luna_pinyin')

      const writeCall = mockContext.api.fs.writeFile.mock.calls[0]
      const content = writeCall[1]
      expect(content).toContain('- terra_pinyin')
      expect(content).not.toContain('- luna_pinyin')
      expect(mockContext.logger.info).toHaveBeenCalledWith('方案已禁用: luna_pinyin')
    })

    it('should return silently when default.custom.yaml does not exist', async () => {
      plugin.rimeDir = '/mock/rime'

      const { readFile } = require('fs/promises')
      vi.mocked(readFile).mockRejectedValue(new Error('File not found'))

      await expect(plugin.disableScheme('luna_pinyin')).resolves.toBeUndefined()
    })

    it('should throw error when Rime is not installed', async () => {
      plugin.rimeDir = null

      await expect(plugin.disableScheme('luna_pinyin')).rejects.toThrow('Rime 未安装')
    })
  })
})
