import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { usePluginStore } from '../../store/pluginStore'
import { useUIStore } from '../../store/uiStore'
import { CheckCircle2, XCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react'

export function PluginLoading() {
  const { loadingPlugins, clearLoadingState } = usePluginStore()
  const { setCurrentPage, addToast } = useUIStore()
  const [autoRefresh] = useState(false)

  useEffect(() => {
    const handleLoadingEvent = (_event: any, data: any) => {
      const { pluginId, pluginName, status, progress, error } = data

      const existingState = loadingPlugins.get(pluginId)
      if (existingState?.status === 'loaded' && status === 'loaded') {
        return
      }

      usePluginStore.getState().setPluginLoadingState(pluginId, {
        status,
        progress,
        error
      })

      if (status === 'loaded' && autoRefresh) {
        setTimeout(() => {
          clearLoadingState()
          addToast(`插件 ${pluginName || pluginId} 加载成功`, 'success')
        }, 500)
      }
    }

    window.electronAPI.plugin.onLoading(handleLoadingEvent)

    return () => {
      window.electronAPI.plugin.removeListener('plugin:loading', handleLoadingEvent)
    }
  }, [loadingPlugins, autoRefresh, clearLoadingState, addToast])

  const loadingArray = Array.from(loadingPlugins.entries())
  const loadedCount = loadingArray.filter(([_, state]) => state.status === 'loaded').length
  const errorCount = loadingArray.filter(([_, state]) => state.status === 'error').length
  const totalCount = loadingArray.length
  const isComplete = totalCount > 0 && loadedCount + errorCount === totalCount

  const handleBack = () => {
    setCurrentPage('plugins')
  }

  const handleRefresh = () => {
    clearLoadingState()
    addToast('已清空加载状态', 'info')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      case 'loaded':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'loading':
        return <Badge variant="info">加载中</Badge>
      case 'loaded':
        return <Badge variant="success">已加载</Badge>
      case 'error':
        return <Badge variant="destructive">加载失败</Badge>
      default:
        return null
    }
  }

  if (totalCount === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">插件加载</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">查看插件的加载状态和进度</p>
          </div>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回插件列表
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              暂无加载状态
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
              插件加载状态会在插件加载时自动显示
            </p>
            <div className="flex gap-4">
              <Button onClick={() => setCurrentPage('plugins')}>前往插件市场</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">插件加载</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isComplete ? '所有插件加载完成' : '正在加载插件...'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingArray.map(([pluginId, state]) => (
          <LoadingCard
            key={pluginId}
            pluginId={pluginId}
            state={state}
            getStatusIcon={getStatusIcon}
            getStatusBadge={getStatusBadge}
          />
        ))}
      </div>

      {isComplete && (
        <div className="flex items-center justify-center py-8">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-center">加载完成</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">共加载 {totalCount} 个插件</p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                成功: <span className="text-green-600 font-semibold">{loadedCount}</span> | 失败:{' '}
                <span className="text-red-600 font-semibold">{errorCount}</span>
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={handleRefresh}>清空状态</Button>
                <Button variant="outline" onClick={handleBack}>
                  返回插件列表
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function LoadingCard({
  pluginId,
  state,
  getStatusIcon,
  getStatusBadge
}: {
  pluginId: string
  state: { status: string; progress?: number; error?: string }
  getStatusIcon: (status: string) => React.ReactNode
  getStatusBadge: (status: string) => React.ReactNode
}) {
  return (
    <Card className={state.status === 'error' ? 'border-red-200 dark:border-red-800' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{pluginId}</h3>
            <div className="flex items-center gap-2">
              {getStatusIcon(state.status)}
              {getStatusBadge(state.status)}
            </div>
          </div>
          {state.status === 'loading' && state.progress !== undefined && (
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(state.progress)}%
            </div>
          )}
        </div>

        {state.status === 'loading' && state.progress !== undefined && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              加载进度: {Math.round(state.progress)}%
            </p>
          </div>
        )}

        {state.status === 'error' && state.error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{state.error}</p>
          </div>
        )}

        <div className="text-sm text-gray-500 dark:text-gray-400">
          <div className="flex justify-between py-1">
            <span>状态:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {state.status === 'loading' && '加载中...'}
              {state.status === 'loaded' && '已加载'}
              {state.status === 'error' && '加载失败'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
