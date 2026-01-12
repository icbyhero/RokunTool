/**
 * UI状态管理Store
 */

import { create } from 'zustand'

interface UIState {
  // 主题
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void

  // 侧边栏
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // 当前页面
  currentPage:
    | 'home'
    | 'plugins'
    | 'plugin-loading'
    | 'plugin-detail'
    | 'plugin-status'
    | 'plugin-view'
    | 'settings'
    | 'about'
  setCurrentPage: (
    page:
      | 'home'
      | 'plugins'
      | 'plugin-loading'
      | 'plugin-detail'
      | 'plugin-status'
      | 'plugin-view'
      | 'settings'
      | 'about'
  ) => void

  // 选中的插件ID
  selectedPluginId: string | null
  setSelectedPluginId: (id: string | null) => void

  // 活动插件ID（用于插件视图）
  activePluginId: string | null
  setActivePluginId: (id: string | null) => void

  // Toast通知
  toasts: Array<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  setTheme: (theme) => {
    set({ theme })
    localStorage.setItem('theme', theme)
    // 应用主题到document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', newTheme)
      // 应用主题到document
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return { theme: newTheme }
    })
  },

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  currentPage: 'home',
  setCurrentPage: (page) => set({ currentPage: page }),

  selectedPluginId: null,
  setSelectedPluginId: (id) => set({ selectedPluginId: id }),

  activePluginId: null,
  setActivePluginId: (id) => set({ activePluginId: id }),

  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Date.now().toString()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }))
    // 3秒后自动移除
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }))
    }, 3000)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
}))
