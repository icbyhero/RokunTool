import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { usePluginStore } from '../../store/pluginStore'
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2, FileText } from 'lucide-react'

export function PluginStatus() {
  const { plugins, loading, loadPlugins, enablePlugin, disablePlugin } = usePluginStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadPlugins()
  }, []) // 只在组件挂载时加载一次

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadPlugins()
    } catch (error) {
      console.error('Failed to refresh plugins:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleToggle = async (pluginId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await disablePlugin(pluginId)
      } else {
        await enablePlugin(pluginId)
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error)
    }
  }

  const getStatusInfo = (plugin: any) => {
    if (!plugin.enabled) {
      return {
        status: 'disabled',
        label: '已禁用',
        icon: <XCircle className="h-5 w-5" />,
        color: 'text-gray-500',
        badgeVariant: 'secondary' as const
      }
    }
    if (plugin.loading) {
      return {
        status: 'loading',
        label: '加载中',
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        color: 'text-blue-500',
        badgeVariant: 'info' as const
      }
    }
    if (plugin.error) {
      return {
        status: 'error',
        label: '错误',
        icon: <XCircle className="h-5 w-5" />,
        color: 'text-red-500',
        badgeVariant: 'destructive' as const
      }
    }
    return {
      status: 'enabled',
      label: '运行中',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-green-500',
      badgeVariant: 'success' as const
    }
  }

  const stats = {
    total: plugins.length,
    enabled: plugins.filter((p) => p.enabled && !p.loading && !p.error).length,
    disabled: plugins.filter((p) => !p.enabled).length,
    loading: plugins.filter((p) => p.loading).length,
    error: plugins.filter((p) => p.error).length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">插件状态</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">监控所有插件的加载和运行状态</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing || loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="总数"
          value={stats.total}
          icon={<FileText className="h-6 w-6" />}
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="运行中"
          value={stats.enabled}
          icon={<CheckCircle className="h-6 w-6" />}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          title="已禁用"
          value={stats.disabled}
          icon={<XCircle className="h-6 w-6" />}
          color="text-gray-600 dark:text-gray-400"
        />
        <StatCard
          title="错误"
          value={stats.error}
          icon={<AlertCircle className="h-6 w-6" />}
          color="text-red-600 dark:text-red-400"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>插件列表</CardTitle>
          <CardDescription>{plugins.length} 个插件</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !refreshing ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 mr-3" />
              <span className="text-gray-600 dark:text-gray-400">加载中...</span>
            </div>
          ) : plugins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600 dark:text-gray-400">
              <FileText className="h-12 w-12 mb-4" />
              <p>暂无插件</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plugins.map((plugin) => {
                const statusInfo = getStatusInfo(plugin)
                return (
                  <div
                    key={plugin.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className={`text-2xl`}>
                      {plugin.type === 'tool'
                        ? '🔧'
                        : plugin.type === 'theme'
                          ? '🎨'
                          : plugin.type === 'extension'
                            ? '🔌'
                            : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {plugin.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {plugin.version}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {plugin.type}
                        </Badge>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {plugin.id}
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${statusInfo.color}`}>
                      {statusInfo.icon}
                      <span className="text-sm font-medium">{statusInfo.label}</span>
                    </div>
                    <Button
                      variant={plugin.enabled ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleToggle(plugin.id, plugin.enabled ?? false)}
                      disabled={plugin.loading}
                    >
                      {plugin.loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : plugin.enabled ? (
                        '禁用'
                      ) : (
                        '启用'
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
          <div className={color}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
