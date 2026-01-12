import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Play, Square, Trash2, Plus, RefreshCw, AlertCircle } from 'lucide-react'

interface Instance {
  id: string
  name: string
  path: string
  bundleId: string
  createdAt: string
  running: boolean
  pid?: number
  startedAt?: string
}

export function WeChatMultiInstance() {
  const [instances, setInstances] = useState<Instance[]>([])
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null)
  const [weChatVersion, setWeChatVersion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkWeChatStatus()
    loadInstances()
  }, [])

  const checkWeChatStatus = async () => {
    try {
      const versionResult = await window.electronAPI.plugin.callMethod<string>({
        pluginId: 'rokun-wechat-multi-instance',
        method: 'getWeChatVersion'
      })

      if (versionResult.success && versionResult.data) {
        setIsInstalled(true)
        setWeChatVersion(versionResult.data)
      } else {
        const installedResult = await window.electronAPI.plugin.callMethod<boolean>({
          pluginId: 'rokun-wechat-multi-instance',
          method: 'checkWeChatInstalled'
        })
        setIsInstalled(installedResult.success && installedResult.data === true)
      }
    } catch (error) {
      setIsInstalled(false)
      setError('微信未安装')
      setLoading(false)
    }
  }

  const loadInstances = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await window.electronAPI.plugin.callMethod<Instance[]>({
        pluginId: 'rokun-wechat-multi-instance',
        method: 'getInstances'
      })

      if (result.success && result.data) {
        setInstances(result.data)
      } else {
        setError(result.error || '加载实例失败')
      }
    } catch (error) {
      setError('加载实例失败')
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = async () => {
    setRefreshing(true)
    await loadInstances()
    setRefreshing(false)
  }

  const createInstance = async () => {
    try {
      setError(null)
      const result = await window.electronAPI.plugin.callMethod<Instance>({
        pluginId: 'rokun-wechat-multi-instance',
        method: 'createInstance'
      })
      if (result.success && result.data) {
        setInstances((prev) => [...prev, result.data!])
      } else {
        setError(result.error || '创建分身失败')
      }
    } catch (error) {
      setError('创建分身失败')
    }
  }

  const startInstance = async (instanceId: string) => {
    try {
      setError(null)
      const result = await window.electronAPI.plugin.callMethod<Instance>({
        pluginId: 'rokun-wechat-multi-instance',
        method: 'startInstance',
        args: [instanceId]
      })
      if (result.success && result.data) {
        setInstances((prev) => 
          prev.map((i) => (i.id === instanceId ? result.data! : i))
        )
      } else {
        setError(result.error || '启动实例失败')
      }
    } catch (error) {
      setError('启动实例失败')
    }
  }

  const stopInstance = async (instanceId: string) => {
    try {
      setError(null)
      const result = await window.electronAPI.plugin.callMethod<Instance>({
        pluginId: 'rokun-wechat-multi-instance',
        method: 'stopInstance',
        args: [instanceId]
      })
      if (result.success && result.data) {
        setInstances((prev) => 
          prev.map((i) => (i.id === instanceId ? result.data! : i))
        )
      } else {
        setError(result.error || '停止实例失败')
      }
    } catch (error) {
      setError('停止实例失败')
    }
  }

  const deleteInstance = async (instanceId: string) => {
    const instance = instances.find((i) => i.id === instanceId)
    if (!instance) return

    const confirmed = window.confirm(`确定要删除实例 "${instance.name}" 吗？`)
    if (!confirmed) return

    try {
      setError(null)
      const result = await window.electronAPI.plugin.callMethod<void>({
        pluginId: 'rokun-wechat-multi-instance',
        method: 'deleteInstance',
        args: [instanceId]
      })
      if (result.success) {
        setInstances((prev) => prev.filter((i) => i.id !== instanceId))
      } else {
        setError(result.error || '删除实例失败')
      }
    } catch (error) {
      setError('删除实例失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!isInstalled) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">微信未安装</h2>
        <p className="text-gray-600 mb-4">请先安装微信应用后再使用此功能</p>
        <Button onClick={checkWeChatStatus}>重新检测</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">微信分身管理</h2>
          {weChatVersion && (
            <span className="text-sm text-gray-500 dark:text-gray-400">微信版本: {weChatVersion}</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshStatus} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={createInstance}>
            <Plus className="w-4 h-4 mr-2" />
            创建分身
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {instances.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">暂无分身实例</div>
                <Button onClick={createInstance}>创建第一个分身</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          instances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {instance.name}
                      {instance.running && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          运行中
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      创建于 {new Date(instance.createdAt).toLocaleString('zh-CN')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {instance.running ? (
                      <Button variant="outline" size="sm" onClick={() => stopInstance(instance.id)}>
                        <Square className="w-4 h-4 mr-1" />
                        停止
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startInstance(instance.id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        启动
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteInstance(instance.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Bundle ID:</span> {instance.bundleId}
                  </div>
                  <div>
                    <span className="font-medium">路径:</span> {instance.path}
                  </div>
                  {instance.pid && (
                    <div>
                      <span className="font-medium">进程 ID:</span> {instance.pid}
                    </div>
                  )}
                  {instance.startedAt && (
                    <div>
                      <span className="font-medium">启动时间:</span>{' '}
                      {new Date(instance.startedAt).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
