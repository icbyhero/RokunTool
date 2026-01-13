/**
 * 插件状态管理Store
 */

import { create } from 'zustand'
import type { PluginMetadata } from '@shared/types/plugin'

interface LoadingState {
  status: 'loading' | 'loaded' | 'error'
  progress?: number
  error?: string
}

/**
 * 权限状态
 */
export type PermissionStatus = 'pending' | 'granted' | 'denied' | 'permanently_denied'

/**
 * 权限历史记录
 */
export interface PermissionHistoryEntry {
  permission: string
  status: PermissionStatus
  timestamp: number
  source: 'user' | 'system' | 'auto'
  context?: {
    operation: string
    target?: string
  }
}

/**
 * 插件权限状态
 */
export interface PluginPermissionState {
  permissions: Record<string, PermissionStatus>
  history: PermissionHistoryEntry[]
}

/**
 * 权限请求
 */
export interface PermissionRequest {
  id: string
  pluginId: string
  pluginName: string
  permission: string
  reason?: string
  context?: {
    operation: string
    target?: string
  }
  requestedAt: Date
}

/**
 * 操作进度状态
 */
export interface OperationProgress {
  operation: string
  currentStep: number
  totalSteps: number
  stepName: string
  status: 'running' | 'success' | 'error'
  error?: string
  logs: string[]
}

interface PluginState {
  plugins: PluginMetadata[]
  loading: boolean
  error: string | null
  selectedPlugin: PluginMetadata | null
  loadingPlugins: Map<string, LoadingState>

  // 权限状态
  permissionRequests: PermissionRequest[]
  pluginPermissions: Map<string, PluginPermissionState>
  currentPermissionRequest: PermissionRequest | null

  // 操作进度状态
  operationProgress: Map<string, OperationProgress>

  // Actions
  setPlugins: (plugins: PluginMetadata[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedPlugin: (plugin: PluginMetadata | null) => void
  setPluginLoadingState: (pluginId: string, state: LoadingState) => void
  clearLoadingState: () => void

  // 从主进程加载插件列表
  loadPlugins: () => Promise<void>

  // 启用/禁用插件
  enablePlugin: (pluginId: string) => Promise<void>
  disablePlugin: (pluginId: string) => Promise<void>
  unloadPlugin: (pluginId: string) => Promise<void>

  // 权限管理
  requestPermission: (pluginId: string, permission: string, reason?: string, context?: {
    operation: string
    target?: string
  }) => Promise<boolean>
  checkPermission: (pluginId: string, permission: string) => Promise<PermissionStatus>
  getPermissionStatus: (pluginId: string) => Promise<PluginPermissionState | null>
  revokePermission: (pluginId: string, permission: string) => Promise<boolean>
  clearPermanentDeny: (pluginId: string, permission: string) => Promise<boolean>
  setCurrentPermissionRequest: (request: PermissionRequest | null) => void
  clearPermissionRequests: () => void

  // 操作进度管理
  setOperationProgress: (pluginId: string, progress: OperationProgress) => void
  clearOperationProgress: (pluginId: string) => void
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  loading: false,
  error: null,
  selectedPlugin: null,
  loadingPlugins: new Map(),

  // 权限状态初始化
  permissionRequests: [],
  pluginPermissions: new Map(),
  currentPermissionRequest: null,

  // 操作进度状态初始化
  operationProgress: new Map(),

  setPlugins: (plugins) => set({ plugins }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setSelectedPlugin: (plugin) => set({ selectedPlugin: plugin }),

  setPluginLoadingState: (pluginId, loadingState) => {
    set((prevState) => {
      const loadingPlugins = new Map(prevState.loadingPlugins)
      loadingPlugins.set(pluginId, loadingState)
      return { loadingPlugins }
    })
  },

  clearLoadingState: () => set({ loadingPlugins: new Map() }),

  loadPlugins: async () => {
    set({ loading: true, error: null })
    try {
      console.log('loadPlugins: 开始加载插件...')
      const response = await window.electronAPI.plugin.list()
      console.log('loadPlugins: 收到响应', response)
      console.log('loadPlugins: response.plugins =', response?.plugins)
      console.log('loadPlugins: response.plugins 长度 =', response?.plugins?.length)

      if (response.plugins) {
        console.log('loadPlugins: 设置插件到 store, 插件数量:', response.plugins.length)
        set({ plugins: response.plugins, loading: false })
        console.log('loadPlugins: 插件已加载到 store')
      } else {
        console.error('loadPlugins: response.plugins 不存在!', response)
      }
    } catch (error) {
      console.error('loadPlugins: 加载失败', error)
      set({
        error: error instanceof Error ? error.message : '加载插件失败',
        loading: false
      })
    }
  },

  enablePlugin: async (pluginId) => {
    try {
      const response = await window.electronAPI.plugin.enable({ pluginId })
      if (response.success) {
        // 更新插件状态
        const plugins = get().plugins.map((p) => (p.id === pluginId ? { ...p, enabled: true } : p))
        set({ plugins })
      } else {
        set({ error: response.error || '启用插件失败' })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '启用插件失败' })
    }
  },

  disablePlugin: async (pluginId) => {
    try {
      const response = await window.electronAPI.plugin.disable({ pluginId })
      if (response.success) {
        // 更新插件状态
        const plugins = get().plugins.map((p) => (p.id === pluginId ? { ...p, enabled: false } : p))
        set({ plugins })
      } else {
        set({ error: response.error || '禁用插件失败' })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '禁用插件失败' })
    }
  },

  unloadPlugin: async (pluginId) => {
    try {
      const response = await window.electronAPI.plugin.unload({ pluginId })
      if (response.success) {
        // 从列表中移除插件
        const plugins = get().plugins.filter((p) => p.id !== pluginId)
        set({ plugins })
      } else {
        set({ error: response.error || '卸载插件失败' })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '卸载插件失败' })
    }
  },

  // 请求权限
  requestPermission: async (pluginId, permission, reason, context) => {
    try {
      const response = await window.electronAPI.permission.request({
        pluginId,
        permission,
        reason,
        context
      })

      if (response.granted) {
        // 更新缓存
        const state = get().pluginPermissions.get(pluginId)
        if (state) {
          const updatedState = {
            ...state,
            permissions: {
              ...state.permissions,
              [permission]: 'granted' as PermissionStatus
            }
          }
          const pluginPermissions = new Map(get().pluginPermissions)
          pluginPermissions.set(pluginId, updatedState)
          set({ pluginPermissions })
        }
      }

      return response.granted
    } catch (error) {
      console.error('请求权限失败:', error)
      return false
    }
  },

  // 检查权限
  checkPermission: async (pluginId, permission) => {
    try {
      const response = await window.electronAPI.permission.check({
        pluginId,
        permission
      })

      return response.status as PermissionStatus
    } catch (error) {
      console.error('检查权限失败:', error)
      return 'pending'
    }
  },

  // 获取权限状态
  getPermissionStatus: async (pluginId) => {
    try {
      const response = await window.electronAPI.permission.getStatus({ pluginId })

      if (response.permissions) {
        const state: PluginPermissionState = {
          permissions: response.permissions as Record<string, PermissionStatus>,
          history: (response.history || []).map(entry => ({
            ...entry,
            status: entry.status as PermissionStatus,
            source: entry.source as 'user' | 'system' | 'auto'
          }))
        }

        // 缓存权限状态
        const pluginPermissions = new Map(get().pluginPermissions)
        pluginPermissions.set(pluginId, state)
        set({ pluginPermissions })

        return state
      }

      return null
    } catch (error) {
      console.error('获取权限状态失败:', error)
      return null
    }
  },

  // 撤销权限
  revokePermission: async (pluginId, permission) => {
    try {
      const response = await window.electronAPI.permission.revoke({
        pluginId,
        permission
      })

      if (response.success) {
        // 更新缓存为 pending 状态
        const state = get().pluginPermissions.get(pluginId)
        if (state) {
          const updatedState = {
            ...state,
            permissions: {
              ...state.permissions,
              [permission]: 'pending' as PermissionStatus
            }
          }
          const pluginPermissions = new Map(get().pluginPermissions)
          pluginPermissions.set(pluginId, updatedState)
          set({ pluginPermissions })
        }
      }

      return response.success
    } catch (error) {
      console.error('撤销权限失败:', error)
      return false
    }
  },

  // 清除永久拒绝状态
  clearPermanentDeny: async (pluginId, permission) => {
    try {
      const response = await window.electronAPI.permission.clearPermanentDeny({
        pluginId,
        permission
      })

      if (response.success) {
        // 更新缓存
        const state = get().pluginPermissions.get(pluginId)
        if (state) {
          const updatedState = {
            ...state,
            permissions: {
              ...state.permissions,
              [permission]: 'pending' as PermissionStatus
            }
          }
          const pluginPermissions = new Map(get().pluginPermissions)
          pluginPermissions.set(pluginId, updatedState)
          set({ pluginPermissions })
        }
      }

      return response.success
    } catch (error) {
      console.error('清除永久拒绝失败:', error)
      return false
    }
  },

  // 设置当前权限请求
  setCurrentPermissionRequest: (request) => {
    set({ currentPermissionRequest: request })
  },

  // 清除权限请求
  clearPermissionRequests: () => {
    set({ permissionRequests: [], currentPermissionRequest: null })
  },

  // 设置操作进度
  setOperationProgress: (pluginId, progress) => {
    set((prevState) => {
      const operationProgress = new Map(prevState.operationProgress)
      operationProgress.set(pluginId, progress)
      return { operationProgress }
    })
  },

  // 清除操作进度
  clearOperationProgress: (pluginId) => {
    set((prevState) => {
      const operationProgress = new Map(prevState.operationProgress)
      operationProgress.delete(pluginId)
      return { operationProgress }
    })
  }
}))
