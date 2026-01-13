/**
 * Rime 配置管理相关类型定义
 * 用于配方市场和备份管理功能
 */

/**
 * 配方分类类型
 */
export type RecipeCategory =
  | 'basic' // 基础配置
  | 'vocabulary' // 词库配方
  | 'input_method' // 拼音输入
  | 'double_pinyin' // 双拼方案
  | 'dialect' // 方言输入
  | 'stroke' // 笔画输入
  | 'symbol' // 符号输入
  | 'tool' // 工具类

/**
 * 配方分类信息
 */
export interface RecipeCategoryInfo {
  id: RecipeCategory
  name: string
  description: string
  icon: string
}

/**
 * Plum 配方信息
 */
export interface PlumRecipe {
  // 基础信息
  id: string // 唯一标识,如 'rime_ice', 'luna_pinyin'
  name: string // 显示名称,如 '雾凇拼音', '朙月拼音'
  description: string // 描述信息
  recipe: string // Plum 配方标识,如 'iDvel/rime-ice:others/recipes/full'

  // 分类
  category: RecipeCategory // 配方分类

  // 文件冲突检测
  files: string[] // 此配方会创建/修改的文件列表

  // 状态
  installed: boolean // 是否已安装
  updatable?: boolean // 是否可更新 (默认 true,本地配方设为 false)

  // 元数据
  version?: string // 配方版本
  size?: string // 配方大小
  installedAt?: Date // 安装时间
}

/**
 * 配方安装标记文件内容
 */
export interface RecipeMarker {
  recipeId: string
  installedAt: string // ISO 8601 格式的时间戳
  version: string // 标记文件版本
}

/**
 * 备份信息
 */
export interface BackupInfo {
  backupId: string // 备份ID (时间戳)
  description: string // 备份描述
  createdAt: number // 创建时间 (Unix timestamp, 毫秒)
  size: number // 备份大小 (bytes)
  isPermanent: boolean // 是否为长期备份
}

/**
 * 备份元数据 (存储在 backup-metadata.json 中)
 */
export interface BackupMetadata extends BackupInfo {
  // backupId 等同于 id
  id: string
  name: string // 备份名称 (等同于 description)
  timestamp: number // 创建时间 (等同于 createdAt)
}

/**
 * 备份配置
 */
export interface BackupConfig {
  maxBackups: number // 最大备份数量 (10)
  maxAge: number // 最大保留时间 (90天, 毫秒)
  backupDir: string // 备份目录路径
}

/**
 * 文件冲突信息
 */
export interface FileConflict {
  recipeId: string
  recipeName: string
  conflictingFiles: string[]
}

/**
 * 文件冲突检测结果
 */
export interface ConflictCheckResult {
  hasConflict: boolean
  conflictingRecipes: FileConflict[]
  allConflictingFiles: string[]
}

/**
 * 配方安装结果
 */
export interface RecipeInstallResult {
  success: boolean
  message: string
  output?: string
  uninstalledRecipes?: string[] // 被自动卸载的配方ID列表
}

/**
 * 配方更新结果
 */
export interface RecipeUpdateResult {
  success: boolean
  message: string
  output?: string
}

/**
 * 配方卸载结果
 */
export interface RecipeUninstallResult {
  success: boolean
  message: string
}

/**
 * 输入方案信息
 */
export interface SchemeInfo {
  id: string
  name: string
  enabled: boolean
}

/**
 * Rime 配方分类常量
 */
export const RECIPE_CATEGORIES: Record<RecipeCategory, RecipeCategoryInfo> = {
  basic: {
    id: 'basic',
    name: '基础配置',
    description: 'Rime 基础配置和工具',
    icon: 'settings'
  },
  vocabulary: {
    id: 'vocabulary',
    name: '词库配方',
    description: '词库和词汇表',
    icon: 'book'
  },
  input_method: {
    id: 'input_method',
    name: '拼音输入',
    description: '各类拼音输入方案',
    icon: 'keyboard'
  },
  double_pinyin: {
    id: 'double_pinyin',
    name: '双拼方案',
    description: '双拼输入方案',
    icon: 'keyboard'
  },
  dialect: {
    id: 'dialect',
    name: '方言输入',
    description: '方言输入方案',
    icon: 'globe'
  },
  stroke: {
    id: 'stroke',
    name: '笔画输入',
    description: '笔画和字形输入方案',
    icon: 'edit'
  },
  symbol: {
    id: 'symbol',
    name: '符号输入',
    description: '符号和特殊字符输入',
    icon: 'smile'
  },
  tool: {
    id: 'tool',
    name: '工具类',
    description: '实用工具和辅助配置',
    icon: 'tool'
  }
} as const

/**
 * Rime 插件 API 方法返回结果通用格式
 */
export interface PluginResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * getRecipes 方法返回数据
 */
export interface GetRecipesData {
  recipes: PlumRecipe[]
  categories: Record<RecipeCategory, RecipeCategoryInfo>
}

/**
 * getBackupList 方法返回数据
 */
export interface GetBackupListData {
  backups: BackupInfo[]
}

/**
 * getBackup 方法返回数据
 */
export interface GetBackupData extends BackupMetadata {}

/**
 * createBackup 方法返回数据
 */
export interface CreateBackupData extends BackupMetadata {}

/**
 * restoreBackup 方法返回数据
 */
export interface RestoreBackupData {
  success: boolean
  message: string
}

/**
 * deleteBackup 方法返回数据
 */
export interface DeleteBackupData {
  success: boolean
  message: string
}

/**
 * togglePermanent 方法返回数据
 */
export interface TogglePermanentData {
  success: boolean
  data: BackupInfo
  message: string
}
