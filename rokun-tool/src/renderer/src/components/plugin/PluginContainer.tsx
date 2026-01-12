import { useEffect, useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { usePluginStore } from '../../store/pluginStore'
import { useUIStore } from '../../store/uiStore'
import { RimeConfig } from '../pages/RimeConfig'
import { WeChatMultiInstance } from '../pages/WeChatMultiInstance'

interface PluginContainerProps {
  pluginId: string
}

export function PluginContainer({ pluginId }: PluginContainerProps) {
  const { plugins } = usePluginStore()
  const { setCurrentPage } = useUIStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const plugin = plugins.find((p) => p.id === pluginId)

  useEffect(() => {
    if (!plugin) {
      setError('插件未找到')
      setLoading(false)
      return
    }
    setLoading(false)
  }, [plugin])

  const handleClose = () => {
    setCurrentPage('plugins')
  }

  // ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">正在加载插件...</p>
        </div>
      </div>
    )
  }

  if (error || !plugin) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md m-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                加载失败
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error || '插件未找到'}</p>
              <Button onClick={handleClose} variant="outline" className="w-full">
                关闭
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 渲染插件内容
  const renderPluginContent = () => {
    switch (pluginId) {
      case 'rokun-rime-config':
        return <RimeConfig />
      case 'rokun-wechat-multi-instance':
        return <WeChatMultiInstance />
      default:
        // 通用插件界面
        return (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🧩</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">插件界面</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">此插件暂未提供自定义界面</p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>插件ID: {plugin.id}</p>
                  <p>版本: {plugin.version}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50 flex flex-col">
      {/* 插件页面头部 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-2xl">
            {plugin.type === 'tool'
              ? '🔧'
              : plugin.type === 'theme'
                ? '🎨'
                : plugin.type === 'extension'
                  ? '🔌'
                  : '📦'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{plugin.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{plugin.description}</p>
          </div>
        </div>
        <Button onClick={handleClose} variant="ghost" size="sm" title="关闭 (ESC)">
          <X className="w-5 h-5" />
        </Button>
      </header>

      {/* 插件内容区域 */}
      <main className="flex-1 overflow-auto p-6">{renderPluginContent()}</main>
    </div>
  )
}
