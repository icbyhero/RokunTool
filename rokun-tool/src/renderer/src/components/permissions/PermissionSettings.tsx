import { useEffect, useState } from 'react'
import { Shield, RotateCcw, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { useUIStore } from '../../store/uiStore'

interface PluginPermission {
  permission: string
  status: 'granted' | 'denied' | 'permanently_denied' | 'pending'
}

interface PluginPermissions {
  pluginId: string
  pluginName: string
  permissions: Record<string, PluginPermission>
}

const statusLabels: Record<string, string> = {
  granted: '已授予',
  denied: '已拒绝',
  permanently_denied: '永久拒绝',
  pending: '待确认'
}

const statusBadgeClasses: Record<string, string> = {
  granted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  denied: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  permanently_denied: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

const permissionNames: Record<string, string> = {
  'fs:read': '文件读取',
  'fs:write': '文件写入',
  'process:exec': '进程执行',
  'process:spawn': '进程启动',
  'process:kill': '进程终止',
  'shell:execute': 'Shell执行',
  'network:http': '网络访问',
  'clipboard:read': '剪贴板读取',
  'clipboard:write': '剪贴板写入',
  'config:read': '配置读取',
  'config:write': '配置写入',
  'notification:show': '显示通知',
  'window:open': '打开窗口'
}

export function PermissionSettings() {
  const { addToast } = useUIStore()
  const [plugins, setPlugins] = useState<PluginPermissions[]>([])
  const [loading, setLoading] = useState(true)

  // 加载所有插件的权限状态
  const loadPermissions = async () => {
    setLoading(true)
    try {
      // 获取所有已加载的插件
      const pluginListResult = await window.electronAPI.plugin.list()
      if (!pluginListResult.success) {
        throw new Error(pluginListResult.error || '无法获取插件列表')
      }

      const pluginsData: PluginPermissions[] = []

      // 获取每个插件的权限状态
      for (const plugin of pluginListResult.data || []) {
        try {
          const statusResult = await window.electronAPI.permission.getStatus({
            pluginId: plugin.id
          })

          if (statusResult.permissions && Object.keys(statusResult.permissions).length > 0) {
            pluginsData.push({
              pluginId: plugin.id,
              pluginName: plugin.name,
              permissions: statusResult.permissions as Record<string, PluginPermission>
            })
          }
        } catch (error) {
          console.error(`Failed to load permissions for ${plugin.id}:`, error)
        }
      }

      setPlugins(pluginsData)
    } catch (error) {
      console.error('Failed to load permissions:', error)
      addToast('无法加载权限数据', 'error')
    } finally {
      setLoading(false)
    }
  }

  // 撤销权限
  const handleRevoke = async (pluginId: string, permission: string) => {
    try {
      const result = await window.electronAPI.permission.revoke({
        pluginId,
        permission
      })

      if (result.success) {
        addToast(`已撤销 ${permissionNames[permission] || permission} 权限`, 'success')
        await loadPermissions() // 重新加载
      } else {
        throw new Error(result.error || '撤销权限失败')
      }
    } catch (error) {
      console.error('Failed to revoke permission:', error)
      addToast(`撤销权限失败: ${error}`, 'error')
    }
  }

  // 清除永久拒绝状态
  const handleClearPermanentDeny = async (pluginId: string, permission: string) => {
    try {
      const result = await window.electronAPI.permission.clearPermanentDeny({
        pluginId,
        permission
      })

      if (result.success) {
        addToast(`已重新启用 ${permissionNames[permission] || permission} 权限询问`, 'success')
        await loadPermissions() // 重新加载
      } else {
        throw new Error(result.error || '清除永久拒绝失败')
      }
    } catch (error) {
      console.error('Failed to clear permanent deny:', error)
      addToast(`操作失败: ${error}`, 'error')
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>权限管理</CardTitle>
          <CardDescription>管理插件权限</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (plugins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>权限管理</CardTitle>
          <CardDescription>管理插件权限</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无权限数据</p>
            <p className="text-sm mt-1">使用插件功能后,权限记录将显示在这里</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>权限管理</CardTitle>
            <CardDescription>查看和管理插件权限</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPermissions}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {plugins.map((plugin) => (
            <div key={plugin.pluginId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {plugin.pluginName}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {plugin.pluginId}
                </span>
              </div>

              <div className="space-y-2">
                {Object.entries(plugin.permissions).map(([perm, data]) => {
                  const permissionName = permissionNames[perm] || perm
                  const statusLabel = statusLabels[data.status] || data.status
                  const statusClass = statusBadgeClasses[data.status] || statusBadgeClasses.pending

                  return (
                    <div
                      key={perm}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {permissionName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {perm}
                          </div>
                        </div>

                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {data.status === 'granted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevoke(plugin.pluginId, perm)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            撤销
                          </Button>
                        )}

                        {data.status === 'permanently_denied' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleClearPermanentDeny(plugin.pluginId, perm)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            重新询问
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">权限说明</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>已授予</strong>: 插件拥有该权限,可以正常使用</li>
                <li><strong>已拒绝</strong>: 仅在当前会话拒绝,重启应用后可重新询问</li>
                <li><strong>永久拒绝</strong>: 已永久拒绝该权限,可点击"重新询问"恢复</li>
                <li><strong>待确认</strong>: 首次使用该功能时会询问用户</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
