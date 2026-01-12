import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Rime Config Plugin - 冒烟测试', () => {
  let mockContext: any

  beforeEach(() => {
    mockContext = {
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      },
      dataDir: '/tmp/test-rime-data'
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('插件导出结构', () => {
    it('应该导出所有必需的钩子函数', () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      expect(pluginModule).toHaveProperty('onLoad')
      expect(pluginModule).toHaveProperty('onEnable')
      expect(pluginModule).toHaveProperty('onDisable')
      expect(pluginModule).toHaveProperty('onUnload')
      expect(pluginModule).toHaveProperty('getConfigFiles')
      expect(pluginModule).toHaveProperty('getConfigFile')
      expect(pluginModule).toHaveProperty('saveConfigFile')
      expect(pluginModule).toHaveProperty('installRecipe')
      expect(pluginModule).toHaveProperty('uninstallRecipe')
      expect(pluginModule).toHaveProperty('deployRime')
      expect(pluginModule).toHaveProperty('getSchemes')
      expect(pluginModule).toHaveProperty('enableScheme')
      expect(pluginModule).toHaveProperty('disableScheme')
      expect(pluginModule).toHaveProperty('getRecipes')
    })

    it('应该导出配置编辑器增强功能', () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      expect(pluginModule).toHaveProperty('validateConfigFile')
      expect(pluginModule).toHaveProperty('formatConfigFile')
      expect(pluginModule).toHaveProperty('diffConfigFile')
    })

    it('应该导出备份和恢复功能', () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      expect(pluginModule).toHaveProperty('getBackupFiles')
      expect(pluginModule).toHaveProperty('restoreFromBackup')
      expect(pluginModule).toHaveProperty('deleteBackup')
      expect(pluginModule).toHaveProperty('exportConfiguration')
      expect(pluginModule).toHaveProperty('importConfiguration')
    })

    it('应该导出字典文件管理功能', () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      expect(pluginModule).toHaveProperty('getDictionaryFiles')
      expect(pluginModule).toHaveProperty('downloadDictionary')
      expect(pluginModule).toHaveProperty('updateDictionary')
      expect(pluginModule).toHaveProperty('getDictionaryStats')
    })

    it('所有导出的函数应该是函数类型', () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      Object.keys(pluginModule).forEach((key) => {
        expect(typeof pluginModule[key]).toBe('function')
      })
    })
  })

  describe('插件生命周期', () => {
    it('应该能够加载插件', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(pluginModule.onLoad(mockContext)).resolves.not.toThrow()

      expect(mockContext.logger.info).toHaveBeenCalledWith('Rime 配置管理插件加载中...')
      expect(mockContext.logger.info).toHaveBeenCalledWith('Rime 配置管理插件加载完成')
    })

    it('应该能够启用插件', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(pluginModule.onEnable(mockContext)).resolves.not.toThrow()

      expect(mockContext.logger.info).toHaveBeenCalledWith('Rime 配置管理插件已启用')
    })

    it('应该能够禁用插件', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(pluginModule.onDisable(mockContext)).resolves.not.toThrow()

      expect(mockContext.logger.info).toHaveBeenCalledWith('Rime 配置管理插件已禁用')
    })

    it('应该能够卸载插件', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(pluginModule.onUnload(mockContext)).resolves.not.toThrow()

      expect(mockContext.logger.info).toHaveBeenCalledWith('Rime 配置管理插件已卸载')
    })
  })

  describe('配置编辑器增强功能', () => {
    it('应该能够验证配置文件', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      const validYaml = 'key: value\nname: test'
      const result = await pluginModule.validateConfigFile(mockContext, validYaml)

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(Array.isArray(result.errors)).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('应该能够检测无效的 YAML 语法', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      const invalidYaml = 'key'
      const result = await pluginModule.validateConfigFile(mockContext, invalidYaml)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('应该能够格式化配置文件', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      const unformattedYaml = 'key: value\nname: test'
      const formatted = await pluginModule.formatConfigFile(mockContext, unformattedYaml)

      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('应该能够对比配置文件差异', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      const oldContent = 'key: value1'
      const newContent = 'key: value2'
      const diffs = await pluginModule.diffConfigFile(mockContext, 'test.yaml', oldContent, newContent)

      expect(Array.isArray(diffs)).toBe(true)
      if (diffs.length > 0) {
        expect(diffs[0]).toHaveProperty('line')
        expect(diffs[0]).toHaveProperty('type')
        expect(diffs[0]).toHaveProperty('old')
        expect(diffs[0]).toHaveProperty('new')
      }
    })
  })

  describe('备份和恢复功能', () => {
    it('应该能够处理备份目录不可用的情况', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      const emptyContext = {
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        },
        dataDir: '/tmp/test-rime-data'
      }

      await expect(
        pluginModule.getBackupFiles(emptyContext)
      ).rejects.toThrow()
    })

    it('应该能够处理无效的备份文件名', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(
        pluginModule.restoreFromBackup(mockContext, 'invalid-backup.txt')
      ).rejects.toThrow()
    })

    it('应该能够删除备份', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(
        pluginModule.deleteBackup(mockContext, 'non-existent-backup.txt')
      ).rejects.toThrow()
    })
  })

  describe('字典文件管理功能', () => {
    it('应该能够获取字典文件列表', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(
        pluginModule.getDictionaryFiles(mockContext)
      ).rejects.toThrow('Rime 未安装')
    })

    it('应该能够获取字典统计信息', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(
        pluginModule.getDictionaryStats(mockContext)
      ).rejects.toThrow('Rime 未安装')
    })

    it('应该能够处理 Rime 未安装的情况', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(
        pluginModule.getDictionaryFiles(mockContext)
      ).rejects.toThrow('Rime 未安装')
    })
  })

  describe('错误处理', () => {
    it('应该能够处理无效的配方 ID', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(
        pluginModule.installRecipe(mockContext, 'non-existent-recipe')
      ).rejects.toThrow()
    })

    it('应该能够处理未安装的配方', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(
        pluginModule.uninstallRecipe(mockContext, 'non-existent-recipe')
      ).rejects.toThrow()
    })

    it('应该能够处理无效的配置文件名', async () => {
      const pluginModule = require('../../../../plugins/rime-config/index.js')

      await expect(
        pluginModule.getConfigFile(mockContext, 'non-existent.yaml')
      ).rejects.toThrow()
    })
  })
})
