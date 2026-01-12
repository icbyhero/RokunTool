/**
 * 配置状态管理Store
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppConfig {
  // 主题设置
  theme: 'light' | 'dark' | 'auto'

  // 插件设置
  autoEnablePlugins: boolean
  autoCheckUpdates: boolean

  // 通知设置
  enableNotifications: boolean
  enableSoundEffects: boolean

  // 界面设置
  showSidebarOnStart: boolean
  sidebarWidth: number

  // 开发者设置
  enableDevTools: boolean
  showDebugInfo: boolean
}

interface ConfigState extends AppConfig {
  // Actions
  setConfig: (config: Partial<AppConfig>) => void
  resetConfig: () => void

  // 主题
  setTheme: (theme: 'light' | 'dark' | 'auto') => void

  // 插件
  setAutoEnablePlugins: (enabled: boolean) => void
  setAutoCheckUpdates: (enabled: boolean) => void

  // 通知
  setEnableNotifications: (enabled: boolean) => void
  setEnableSoundEffects: (enabled: boolean) => void

  // 界面
  setShowSidebarOnStart: (show: boolean) => void
  setSidebarWidth: (width: number) => void

  // 开发者
  setEnableDevTools: (enabled: boolean) => void
  setShowDebugInfo: (show: boolean) => void
}

const defaultConfig: AppConfig = {
  theme: 'auto',
  autoEnablePlugins: false,
  autoCheckUpdates: true,
  enableNotifications: true,
  enableSoundEffects: false,
  showSidebarOnStart: true,
  sidebarWidth: 256,
  enableDevTools: false,
  showDebugInfo: false
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      ...defaultConfig,

      setConfig: (config) => set(config),

      resetConfig: () => set(defaultConfig),

      setTheme: (theme) => set({ theme }),

      setAutoEnablePlugins: (enabled) => set({ autoEnablePlugins: enabled }),
      setAutoCheckUpdates: (enabled) => set({ autoCheckUpdates: enabled }),

      setEnableNotifications: (enabled) => set({ enableNotifications: enabled }),
      setEnableSoundEffects: (enabled) => set({ enableSoundEffects: enabled }),

      setShowSidebarOnStart: (show) => set({ showSidebarOnStart: show }),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      setEnableDevTools: (enabled) => set({ enableDevTools: enabled }),
      setShowDebugInfo: (show) => set({ showDebugInfo: show })
    }),
    {
      name: 'rokun-tool-config',
      version: 1
    }
  )
)
