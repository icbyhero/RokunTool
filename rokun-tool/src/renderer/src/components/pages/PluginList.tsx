import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { usePluginStore } from '../../store/pluginStore'
import { useUIStore } from '../../store/uiStore'
import { Power, Trash2, Settings, ExternalLink } from 'lucide-react'

export function PluginList() {
  const { plugins, loading, loadPlugins, enablePlugin, disablePlugin, unloadPlugin } =
    usePluginStore()
  const { setCurrentPage, setSelectedPluginId, setActivePluginId, addToast } = useUIStore()

  useEffect(() => {
    loadPlugins()
  }, []) // 只在组件挂载时加载一次

  const handleToggle = async (pluginId: string, enabled: boolean | undefined) => {
    try {
      if (enabled) {
        await disablePlugin(pluginId)
        addToast('插件已禁用', 'success')
      } else {
        await enablePlugin(pluginId)
        addToast('插件已启用', 'success')
      }
    } catch (error) {
      addToast('操作失败', 'error')
    }
  }

  const handleUnload = async (pluginId: string) => {
    try {
      await unloadPlugin(pluginId)
      addToast('插件已卸载', 'success')
    } catch (error) {
      addToast('卸载失败', 'error')
    }
  }

  const handleViewDetail = (plugin: any) => {
    setSelectedPluginId(plugin.id)
    setCurrentPage('plugin-detail')
  }

  const handleOpenPlugin = (plugin: any) => {
    console.log('handleOpenPlugin called with plugin:', plugin)
    console.log('Setting activePluginId to:', plugin.id)
    setActivePluginId(plugin.id)
    console.log('Setting currentPage to plugin-view')
    setCurrentPage('plugin-view')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tool':
        return '🔧'
      case 'theme':
        return '🎨'
      case 'extension':
        return '🔌'
      default:
        return '📦'
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'tool':
        return 'default'
      case 'theme':
        return 'secondary'
      case 'extension':
        return 'info'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">插件市场</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">管理和配置您的插件</p>
        </div>
        <Button onClick={() => addToast('安装插件功能开发中', 'info')}>安装插件</Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载插件中...</p>
        </div>
      ) : plugins.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">暂无插件</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">您还没有安装任何插件</p>
            <Button onClick={() => addToast('安装插件功能开发中', 'info')}>浏览插件市场</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onToggle={() => handleToggle(plugin.id, plugin.enabled)}
              onUnload={() => handleUnload(plugin.id)}
              onViewDetail={() => handleViewDetail(plugin)}
              onOpenPlugin={() => handleOpenPlugin(plugin)}
              getTypeIcon={getTypeIcon}
              getTypeBadgeVariant={getTypeBadgeVariant}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PluginCard({
  plugin,
  onToggle,
  onUnload,
  onViewDetail,
  onOpenPlugin,
  getTypeIcon,
  getTypeBadgeVariant
}: {
  plugin: any
  onToggle: () => void
  onUnload: () => void
  onViewDetail: () => void
  onOpenPlugin: () => void
  getTypeIcon: (type: string) => string
  getTypeBadgeVariant: (type: string) => any
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">{getTypeIcon(plugin.type)}</div>
            <div>
              <CardTitle className="text-lg">{plugin.name}</CardTitle>
              <CardDescription>v{plugin.version}</CardDescription>
            </div>
          </div>
          <Badge variant={getTypeBadgeVariant(plugin.type)}>{plugin.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {plugin.description}
        </p>

        <div className="space-y-2 mb-4">
          {plugin.author && <InfoRow label="作者" value={plugin.author} />}
          {plugin.license && <InfoRow label="许可证" value={plugin.license} />}
          <InfoRow
            label="状态"
            value={
              <Badge variant={plugin.enabled ? 'success' : 'secondary'}>
                {plugin.enabled ? '已启用' : '已禁用'}
              </Badge>
            }
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={plugin.enabled ? 'outline' : 'default'}
            size="sm"
            onClick={onToggle}
            className="flex-1"
          >
            <Power className="w-4 h-4 mr-2" />
            {plugin.enabled ? '禁用' : '启用'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenPlugin}
            title="打开插件"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onViewDetail} title="插件详情">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onUnload} title="卸载插件">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}
