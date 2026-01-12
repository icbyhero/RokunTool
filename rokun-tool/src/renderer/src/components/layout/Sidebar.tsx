/**
 * 侧边栏组件
 */

import { useUIStore } from '../../store/uiStore'

const navigation = [
  { name: '首页', id: 'home', icon: '🏠' },
  { name: '插件市场', id: 'plugins', icon: '🧩' },
  { name: '插件状态', id: 'plugin-status', icon: '📊' },
  { name: '设置', id: 'settings', icon: '⚙️' },
  { name: '关于', id: 'about', icon: 'ℹ️' }
]

export function Sidebar() {
  const { sidebarOpen, currentPage, setCurrentPage, toggleSidebar } = useUIStore()

  return (
    <>
      {/* 移动端遮罩 */}
      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Rokun Tool</h1>
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as any)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${
                    currentPage === item.id
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-100'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>

          {/* 底部信息 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>版本: 1.0.0</p>
              <p>
                插件数: <span id="plugin-count">-</span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
