/**
 * 日志状态管理Store
 */

import { create } from 'zustand'

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: number
}

interface LogState {
  logs: LogEntry[]
  pluginId: string | null
  level: 'all' | 'debug' | 'info' | 'warn' | 'error'
  searchQuery: string

  // Actions
  setLogs: (logs: LogEntry[]) => void
  addLog: (log: LogEntry) => void
  clearLogs: (pluginId: string) => void
  setLevel: (level: 'all' | 'debug' | 'info' | 'warn' | 'error') => void
  setSearchQuery: (query: string) => void

  // 从主进程加载日志
  loadLogs: (pluginId: string) => Promise<void>
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  pluginId: null,
  level: 'all',
  searchQuery: '',

  setLogs: (logs) => set({ logs }),

  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),

  clearLogs: (pluginId) => {
    set((state) => {
      if (state.pluginId === pluginId) {
        return { logs: [] }
      }
      return state
    })
  },

  setLevel: (level) => set({ level }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  loadLogs: async (pluginId) => {
    set({ pluginId, logs: [] })
    try {
      const response = await window.electronAPI.plugin.getLogs({ pluginId })
      if (response.logs) {
        const logs: LogEntry[] = response.logs.map((log) => ({
          level: log.level as 'debug' | 'info' | 'warn' | 'error',
          message: log.message,
          timestamp: log.timestamp
        }))
        set({ logs })
      }
    } catch (error) {
      console.error('Failed to load logs:', error)
    }
  }
}))
