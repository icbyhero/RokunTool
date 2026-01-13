import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Switch } from '../ui/Switch'
import { Badge } from '../ui/Badge'
import { usePluginStore, type PermissionStatus } from '../../store/pluginStore'
import { useUIStore } from '../../store/uiStore'
import { useLogStore } from '../../store/logStore'
import {
  ArrowLeft,
  Power,
  Trash2,
  FileText,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink,
  Shield,
  AlertTriangle,
  Clock,
  X,
  RotateCcw,
  Ban
} from 'lucide-react'

export function PluginDetail() {
  const { plugins, loading, enablePlugin, disablePlugin, unloadPlugin } = usePluginStore()
  const { selectedPluginId, setCurrentPage, setActivePluginId } = useUIStore()
  const { logs, clearLogs, loadLogs } = useLogStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'config' | 'logs'>(
    'overview'
  )

  const plugin = plugins.find((p) => p.id === selectedPluginId)

  useEffect(() => {
    if (selectedPluginId) {
      loadLogs(selectedPluginId)
    }
  }, [selectedPluginId, loadLogs])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    )
  }

  if (!plugin) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">插件未找到</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">您要查看的插件不存在或已被卸载</p>
        <Button onClick={() => setCurrentPage('plugins')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回插件列表
        </Button>
      </div>
    )
  }

  const handleToggle = async () => {
    try {
      if (plugin.enabled) {
        await disablePlugin(plugin.id)
      } else {
        await enablePlugin(plugin.id)
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error)
    }
  }

  const handleUnload = async () => {
    if (window.confirm('确定要卸载此插件吗？此操作不可撤销。')) {
      try {
        await unloadPlugin(plugin.id)
        setCurrentPage('plugins')
      } catch (error) {
        console.error('Failed to unload plugin:', error)
      }
    }
  }

  const handleClearLogs = () => {
    if (selectedPluginId) {
      clearLogs(selectedPluginId)
    }
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setCurrentPage('plugins')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{getTypeIcon(plugin.type)}</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{plugin.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                v{plugin.version} {plugin.author && `by ${plugin.author}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={plugin.enabled ? 'outline' : 'default'} onClick={handleToggle}>
            <Power className="w-4 h-4 mr-2" />
            {plugin.enabled ? '禁用' : '启用'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setActivePluginId(plugin.id)
              setCurrentPage('plugin-view')
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            打开插件
          </Button>
          <Button variant="ghost" onClick={handleUnload}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <TabButton
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          icon={<Info className="w-4 h-4" />}
          label="概览"
        />
        <TabButton
          active={activeTab === 'permissions'}
          onClick={() => setActiveTab('permissions')}
          icon={<CheckCircle className="w-4 h-4" />}
          label="权限"
        />
        <TabButton
          active={activeTab === 'config'}
          onClick={() => setActiveTab('config')}
          icon={<Settings className="w-4 h-4" />}
          label="配置"
        />
        <TabButton
          active={activeTab === 'logs'}
          onClick={() => setActiveTab('logs')}
          icon={<FileText className="w-4 h-4" />}
          label="日志"
          count={logs.length}
        />
      </div>

      {activeTab === 'overview' && (
        <OverviewTab plugin={plugin} getTypeBadgeVariant={getTypeBadgeVariant} />
      )}

      {activeTab === 'permissions' && <PermissionsTab plugin={plugin} />}

      {activeTab === 'config' && <ConfigTab plugin={plugin} />}

      {activeTab === 'logs' && <LogsTab logs={logs} onClearLogs={handleClearLogs} />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
          : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="ml-1">
          {count}
        </Badge>
      )}
    </button>
  )
}

function OverviewTab({
  plugin,
  getTypeBadgeVariant
}: {
  plugin: any
  getTypeBadgeVariant: (type: string) => any
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>插件信息</CardTitle>
          <CardDescription>插件的基本信息和状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow label="插件ID" value={plugin.id} />
            <InfoRow label="版本" value={plugin.version} />
            <InfoRow
              label="类型"
              value={<Badge variant={getTypeBadgeVariant(plugin.type)}>{plugin.type}</Badge>}
            />
            <InfoRow
              label="状态"
              value={
                <Badge variant={plugin.enabled ? 'success' : 'secondary'}>
                  {plugin.enabled ? '已启用' : '已禁用'}
                </Badge>
              }
            />
            {plugin.author && <InfoRow label="作者" value={plugin.author} />}
            {plugin.license && <InfoRow label="许可证" value={plugin.license} />}
            {plugin.homepage && (
              <InfoRow
                label="主页"
                value={
                  <a
                    href={plugin.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {plugin.homepage}
                  </a>
                }
              />
            )}
          </div>
        </CardContent>
      </Card>

      {plugin.description && (
        <Card>
          <CardHeader>
            <CardTitle>描述</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">{plugin.description}</p>
          </CardContent>
        </Card>
      )}

      {plugin.tags && plugin.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>标签</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {plugin.tags.map((tag: string) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PermissionsTab({ plugin }: { plugin: any }) {
  const { getPermissionStatus, revokePermission, clearPermanentDeny, pluginPermissions } = usePluginStore()
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // 加载权限状态
  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true)
      await getPermissionStatus(plugin.id)
      setLoading(false)
    }

    if (plugin.id) {
      loadPermissions()
    }
  }, [plugin.id, getPermissionStatus])

  const permissionState = pluginPermissions.get(plugin.id)
  const permissions = permissionState?.permissions || {}

  if (!plugin.permissions || plugin.permissions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">无需权限</h3>
          <p className="text-gray-600 dark:text-gray-400">此插件不需要任何特殊权限</p>
        </CardContent>
      </Card>
    )
  }

  const getPermissionInfo = (permission: string) => {
    const permissionMap: Record<string, {
      icon: string
      name: string
      description: string
      risk: string
      category: 'basic' | 'sensitive'
    }> = {
      'fs:read': {
        icon: '📖',
        name: '文件读取权限',
        description: '允许插件读取文件系统',
        risk: '基础权限',
        category: 'basic'
      },
      'fs:write': {
        icon: '📁',
        name: '文件写入权限',
        description: '允许插件在指定位置创建和修改文件',
        risk: '敏感权限',
        category: 'sensitive'
      },
      'process:spawn': {
        icon: '🚀',
        name: '进程启动权限',
        description: '允许插件启动新进程',
        risk: '敏感权限',
        category: 'sensitive'
      },
      'process:exec': {
        icon: '⚙️',
        name: '进程执行权限',
        description: '允许插件执行系统命令',
        risk: '敏感权限',
        category: 'sensitive'
      },
      'process:kill': {
        icon: '🛑',
        name: '进程终止权限',
        description: '允许插件终止进程',
        risk: '敏感权限',
        category: 'sensitive'
      },
      'network:http': {
        icon: '🌐',
        name: '网络访问权限',
        description: '允许插件访问网络',
        risk: '敏感权限',
        category: 'sensitive'
      },
      'shell:execute': {
        icon: '💻',
        name: 'Shell 执行权限',
        description: '允许插件执行 Shell 命令',
        risk: '敏感权限',
        category: 'sensitive'
      },
      'clipboard:read': {
        icon: '📋',
        name: '剪贴板读取权限',
        description: '允许插件读取剪贴板内容',
        risk: '敏感权限',
        category: 'sensitive'
      },
      'clipboard:write': {
        icon: '📋',
        name: '剪贴板写入权限',
        description: '允许插件修改剪贴板内容',
        risk: '敏感权限',
        category: 'sensitive'
      },
      'notification:show': {
        icon: '🔔',
        name: '通知权限',
        description: '允许插件显示系统通知',
        risk: '基础权限',
        category: 'basic'
      },
      'window:open': {
        icon: '🪟',
        name: '窗口打开权限',
        description: '允许插件打开新窗口',
        risk: '敏感权限',
        category: 'sensitive'
      },
      'config:read': {
        icon: '⚙️',
        name: '配置读取权限',
        description: '允许插件读取应用配置',
        risk: '基础权限',
        category: 'basic'
      },
      'config:write': {
        icon: '⚙️',
        name: '配置写入权限',
        description: '允许插件修改应用配置',
        risk: '敏感权限',
        category: 'sensitive'
      }
    }

    return permissionMap[permission] || {
      icon: '🔐',
      name: permission,
      description: `需要 ${permission} 权限`,
      risk: '未知权限',
      category: 'sensitive'
    }
  }

  const getStatusBadge = (permission: string) => {
    const status = permissions[permission] as PermissionStatus | undefined

    if (!status || status === 'pending') {
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          未询问
        </Badge>
      )
    }

    if (status === 'granted') {
      return (
        <Badge variant="success">
          <CheckCircle className="w-3 h-3 mr-1" />
          已授权
        </Badge>
      )
    }

    if (status === 'permanently_denied') {
      return (
        <Badge variant="destructive" className="bg-orange-600 hover:bg-orange-700">
          <Ban className="w-3 h-3 mr-1" />
          永久拒绝
        </Badge>
      )
    }

    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        已拒绝
      </Badge>
    )
  }

  const handleRevoke = async (permission: string) => {
    if (window.confirm(`确定要撤销 ${permission} 权限吗?`)) {
      await revokePermission(plugin.id, permission)
    }
  }

  const handleReAsk = async (permission: string) => {
    if (window.confirm(`确定要重新询问 ${permission} 权限吗?`)) {
      const success = await clearPermanentDeny(plugin.id, permission)
      if (success) {
        // 清除成功,权限状态将变为 pending
        // 下次插件请求该权限时会重新弹出对话框
        alert('已清除永久拒绝状态。下次插件使用此权限时将重新询问。')
      }
    }
  }

  const getPermissionHistory = () => {
    return permissionState?.history || []
  }

  return (
    <div className="space-y-6">
      {/* 权限概览 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>权限管理</CardTitle>
              <CardDescription>
                管理此插件的 {plugin.permissions.length} 个权限
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <Clock className="w-4 h-4 mr-2" />
              {showHistory ? '隐藏历史' : '查看历史'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 权限历史 */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">权限变更历史</CardTitle>
          </CardHeader>
          <CardContent>
            {getPermissionHistory().length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">暂无历史记录</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getPermissionHistory().map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                  >
                    <div className="mt-0.5">
                      {entry.status === 'granted' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{entry.permission}</span>
                        <Badge variant={entry.status === 'granted' ? 'success' : 'destructive'}>
                          {entry.status === 'granted' ? '已授予' : '已拒绝'}
                        </Badge>
                        <Badge variant="outline">{entry.source}</Badge>
                      </div>
                      {entry.context && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          操作: {entry.context.operation}
                          {entry.context.target && ` (${entry.context.target})`}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(entry.timestamp).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 权限列表 */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">加载权限状态...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plugin.permissions.map((permission: string) => {
                const info = getPermissionInfo(permission)
                const status = permissions[permission] as PermissionStatus | undefined

                return (
                  <div
                    key={permission}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{info.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {info.name}
                          </h4>
                          <Badge variant={info.category === 'basic' ? 'secondary' : 'warning'}>
                            {info.category === 'basic' ? '基础' : '敏感'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {info.description}
                        </p>

                        {/* 操作上下文 */}
                        {status === 'granted' && (
                          <div className="flex items-center gap-2">
                            {getStatusBadge(permission)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevoke(permission)}
                              className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                            >
                              <X className="w-3.5 h-3.5 mr-1.5" />
                              撤销授权
                            </Button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              撤销后,下次插件使用时将重新询问
                            </span>
                          </div>
                        )}

                        {status === 'permanently_denied' && (
                          <div className="flex items-center gap-2">
                            {getStatusBadge(permission)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReAsk(permission)}
                              className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                              重新询问
                            </Button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              权限已被永久拒绝,可以重新询问
                            </span>
                          </div>
                        )}

                        {status === 'denied' && (
                          <div className="flex items-center gap-2">
                            {getStatusBadge(permission)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              已在本次会话拒绝,重启应用后可重新询问
                            </span>
                          </div>
                        )}

                        {!status && (
                          <div className="flex items-center gap-2">
                            {getStatusBadge(permission)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {info.category === 'basic'
                                ? '将在插件首次使用时自动授予'
                                : '将在插件首次使用时询问'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 风险提示 */}
                      <div className="flex-shrink-0" title={info.risk}>
                        <AlertTriangle
                          className={`w-5 h-5 ${
                            info.category === 'basic'
                              ? 'text-gray-400 dark:text-gray-600'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 安全提示 */}
      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">安全提示</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>基础权限会在插件首次使用时自动授予</li>
                <li>敏感权限需要您明确授权后才能使用</li>
                <li>您可以随时撤销已授予的权限</li>
                <li>撤销权限后,插件可能无法正常工作</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ConfigTab({ plugin }: { plugin: any }) {
  const [autoStart, setAutoStart] = useState(false)
  const [enableDebug, setEnableDebug] = useState(false)
  const [configKey, setConfigKey] = useState('')
  const [configValue, setConfigValue] = useState('')
  const [savedConfigs, setSavedConfigs] = useState<Record<string, string>>({})

  const handleSaveConfig = () => {
    if (configKey && configValue) {
      setSavedConfigs((prev) => ({ ...prev, [configKey]: configValue }))
      setConfigKey('')
      setConfigValue('')
    }
  }

  const handleDeleteConfig = (key: string) => {
    setSavedConfigs((prev) => {
      const newConfigs = { ...prev }
      delete newConfigs[key]
      return newConfigs
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>插件配置</CardTitle>
          <CardDescription>管理插件的配置选项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">自动启动</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">应用启动时自动加载此插件</p>
            </div>
            <Switch checked={autoStart} onCheckedChange={setAutoStart} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">启用调试模式</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">显示详细的调试日志</p>
            </div>
            <Switch checked={enableDebug} onCheckedChange={setEnableDebug} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>自定义配置</CardTitle>
          <CardDescription>为插件添加自定义配置项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">配置键</label>
              <Input
                placeholder="例如: theme"
                value={configKey}
                onChange={(e) => setConfigKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">配置值</label>
              <Input
                placeholder="例如: dark"
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSaveConfig} disabled={!configKey || !configValue}>
            添加配置
          </Button>

          {Object.keys(savedConfigs).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">已保存的配置</h4>
              <div className="space-y-2">
                {Object.entries(savedConfigs).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{key}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{value}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteConfig(key)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>插件信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <InfoRow label="插件ID" value={plugin.id} />
            <InfoRow label="主入口" value={plugin.main || 'index.js'} />
            <InfoRow label="数据目录" value={`~/.rokun-tool/plugins/${plugin.id}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LogsTab({
  logs,
  onClearLogs
}: {
  logs: Array<{ level: string; message: string; timestamp: number }>
  onClearLogs: () => void
}) {
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>
      case 'warn':
        return <Badge variant="warning">WARN</Badge>
      case 'info':
        return <Badge variant="info">INFO</Badge>
      default:
        return <Badge variant="secondary">DEBUG</Badge>
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>插件日志</CardTitle>
            <CardDescription>{logs.length} 条日志记录</CardDescription>
          </div>
          {logs.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              清除日志
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-600 dark:text-gray-400">
            <FileText className="h-12 w-12 mb-4" />
            <p>暂无日志</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getLevelBadge(log.level)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white break-all">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}
