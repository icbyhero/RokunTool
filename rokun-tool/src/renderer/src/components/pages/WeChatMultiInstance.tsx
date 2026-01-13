import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Trash2, Plus, RefreshCw, AlertCircle } from 'lucide-react'

interface Instance {
  id: string
  name: string
  path: string
  bundleId: string
  createdAt: string
  rebuiltAt?: string
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

  const rebuildInstance = async (instanceId: string) => {
    const instance = instances.find((i) => i.id === instanceId)
    if (!instance) return

    const confirmed = window.confirm(
      `确定要重建实例 "${instance.name}" 吗？\n\n` +
      '这将删除当前分身并使用最新的微信版本重新创建。'
    )
    if (!confirmed) return

    try {
      setError(null)
      const result = await window.electronAPI.plugin.callMethod<Instance>({
        pluginId: 'rokun-wechat-multi-instance',
        method: 'rebuildInstance',
        args: [instanceId]
      })
      if (result.success && result.data) {
        setInstances((prev) =>
          prev.map((i) => (i.id === instanceId ? result.data! : i))
        )
      } else {
        setError(result.error || '重建实例失败')
      }
    } catch (error) {
      setError('重建实例失败')
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
                    <CardTitle>{instance.name}</CardTitle>
                    <CardDescription>
                      创建于 {new Date(instance.createdAt).toLocaleString('zh-CN')}
                      {instance.rebuiltAt && (
                        <span className="block mt-1 text-xs">
                          重建于 {new Date(instance.rebuiltAt).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rebuildInstance(instance.id)}
                      title="重建分身(微信更新后使用)"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      重建
                    </Button>
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
                  <div className="text-xs text-gray-500">
                    💡 提示: 分身是独立应用,可以直接从启动台启动
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
