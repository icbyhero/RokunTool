/**
 * 主布局组件
 */

import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {/* 主内容区域 */}
        <main className="flex-1 overflow-auto p-6 lg:ml-64">{children}</main>
      </div>
    </div>
  )
}
