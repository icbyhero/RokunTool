/**
 * 顶部栏组件
 */

import { useUIStore } from '../../store/uiStore'

export function Header() {
  const { toggleSidebar, toggleTheme, theme } = useUIStore()

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4">
      {/* 左侧 */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">插件管理系统</h2>
      </div>

      {/* 右侧 */}
      <div className="flex items-center space-x-4">
        {/* 主题切换按钮 */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* 刷新按钮 */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="刷新"
        >
          🔄
        </button>

        {/* 退出按钮 */}
        <button
          onClick={() => window.electronAPI?.quit?.()}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
          title="退出应用"
        >
          ❌
        </button>
      </div>
    </header>
  )
}
