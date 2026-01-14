import { MainLayout } from './components/layout/MainLayout'
import { Home } from './components/pages/Home'
import { PluginList } from './components/pages/PluginList'
import { PluginLoading } from './components/pages/PluginLoading'
import { PluginDetail } from './components/pages/PluginDetail'
import { PluginStatus } from './components/pages/PluginStatus'
import { Settings } from './components/pages/Settings'
import { About } from './components/pages/About'
import { PluginContainer } from './components/plugin/PluginContainer'
import { PluginErrorBoundary } from './components/plugin/PluginErrorBoundary'
import { PermissionRequestDialog } from './components/permissions/PermissionRequestDialog'
import { BatchPermissionDialog } from './components/permissions/BatchPermissionDialog'
import { FeaturePermissionDialog } from './components/permissions/FeaturePermissionDialog'
import { PermissionDeniedToast } from './components/permissions/PermissionDeniedToast'
import { GlobalExecutionIndicator } from './components/ui/GlobalExecutionIndicator'
import { useUIStore } from './store/uiStore'
import { usePluginStore } from './store/pluginStore'
import {
  Toast,
  ToastViewport,
  ToastProvider,
  ToastTitle,
  ToastDescription
} from './components/ui/Toast'
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import type { PluginPermission } from '@shared/types/plugin'
import type { FeaturePermissionRequest } from './components/permissions/FeaturePermissionDialog'
import type { Execution } from './components/ui/GlobalExecutionIndicator'

// 权限请求类型(与 preload 中的定义保持一致)
interface PermissionRequest {
  id: string
  pluginId: string
  pluginName: string
  permission: string
  reason?: string
  context?: {
    operation: string
    target?: string
  }
  requestedAt: Date
}

// 批量权限请求类型
interface BatchPermissionRequest {
  id: string
  pluginId: string
  pluginName: string
  permissions: PluginPermission[]
  reason?: string
  context?: {
    operation: string
    target?: string
  }
  requestedAt: Date
}

function App(): React.JSX.Element {
  const { currentPage, toasts, activePluginId, setCurrentPage, addToast } = useUIStore()
  const { setCurrentPermissionRequest } = usePluginStore()
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null)
  const [batchPermissionRequest, setBatchPermissionRequest] = useState<BatchPermissionRequest | null>(null)
  const [featurePermissionRequest, setFeaturePermissionRequest] = useState<FeaturePermissionRequest | null>(null)
  const [permissionDeniedToasts, setPermissionDeniedToasts] = useState<Array<{
    id: string
    pluginName: string
    permission: string
    operation: string
    timestamp: number
  }>>([])

  // 全局执行指示器状态
  const [executions, setExecutions] = useState<Execution[]>([])

  // 处理导航到设置页面
  const handleOpenSettings = () => {
    setCurrentPage('settings')
  }

  // 移除权限被拒绝通知
  const removePermissionDeniedToast = (id: string) => {
    setPermissionDeniedToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // 监听单个权限请求事件
  useEffect(() => {
    const handlePermissionRequest = (_event: any, request: PermissionRequest) => {
      console.log('[App] 收到权限请求事件:', request)
      setPermissionRequest(request)
      // 同时更新 store
      setCurrentPermissionRequest(request)
    }

    // 监听来自主进程的权限请求
    console.log('[App] 注册权限请求监听器...')
    if (window.electronAPI.permission?.onRequest) {
      console.log('[App] 权限 API 可用,注册监听器')
      window.electronAPI.permission.onRequest(handlePermissionRequest)
    } else {
      console.error('[App] 权限 API 不可用!')
    }

    // 清理函数 - 移除事件监听器
    return () => {
      if (window.electronAPI.permission?.removeListener) {
        // 注意:需要使用 permission.removeListener,而不是 plugin.removeListener
        window.electronAPI.permission.removeListener('permission:request', handlePermissionRequest)
      }
    }
  }, [setCurrentPermissionRequest])

  // 监听批量权限请求事件
  useEffect(() => {
    const handleBatchPermissionRequest = (_event: any, request: BatchPermissionRequest) => {
      console.log('[App] 收到批量权限请求事件:', request)
      setBatchPermissionRequest(request)
    }

    // 监听来自主进程的批量权限请求
    console.log('[App] 注册批量权限请求监听器...')
    const ipcRenderer = (window as any).electron?.ipcRenderer
    if (ipcRenderer) {
      ipcRenderer.on('permission:batchRequest', handleBatchPermissionRequest)
    }

    // 清理函数 - 移除事件监听器
    return () => {
      if (ipcRenderer) {
        ipcRenderer.removeListener('permission:batchRequest', handleBatchPermissionRequest)
      }
    }
  }, [])

  // 监听功能权限请求事件
  useEffect(() => {
    const handleFeaturePermissionRequest = (_event: any, request: FeaturePermissionRequest) => {
      console.log('[App] 收到功能权限请求事件:', request)
      setFeaturePermissionRequest(request)
    }

    // 监听来自主进程的功能权限请求
    console.log('[App] 注册功能权限请求监听器...')
    const ipcRenderer = (window as any).electron?.ipcRenderer
    if (ipcRenderer) {
      ipcRenderer.on('permission:featureRequest', handleFeaturePermissionRequest)
    }

    // 清理函数 - 移除事件监听器
    return () => {
      if (ipcRenderer) {
        ipcRenderer.removeListener('permission:featureRequest', handleFeaturePermissionRequest)
      }
    }
  }, [])

  // 监听权限被永久拒绝事件
  useEffect(() => {
    const handlePermissionDenied = (_event: any, event: {
      pluginId: string
      pluginName: string
      permission: string
      operation: string
      timestamp: number
    }) => {
      console.log('[App] 收到权限被永久拒绝事件:', event)

      // 节流: 同一个(插件, 权限)组合每个会话只通知一次
      const existingToast = permissionDeniedToasts.find(
        toast => toast.pluginName === event.pluginName && toast.permission === event.permission
      )

      if (!existingToast) {
        const newToast = {
          id: `${event.pluginId}-${event.permission}-${event.timestamp}`,
          pluginName: event.pluginName,
          permission: event.permission,
          operation: event.operation,
          timestamp: event.timestamp
        }

        setPermissionDeniedToasts(prev => [...prev, newToast])

        // 5秒后自动关闭通知
        setTimeout(() => {
          setPermissionDeniedToasts(prev => prev.filter(toast => toast.id !== newToast.id))
        }, 8000)
      }
    }

    // 监听来自主进程的永久拒绝事件
    const ipcRenderer = (window as any).electron?.ipcRenderer
    if (ipcRenderer) {
      ipcRenderer.on('permission:permanently-denied', handlePermissionDenied)
    }

    // 清理函数
    return () => {
      if (ipcRenderer) {
        ipcRenderer.removeListener('permission:permanently-denied', handlePermissionDenied)
      }
    }
  }, [permissionDeniedToasts])

  // 添加执行项
  const addExecution = useCallback((execution: Execution) => {
    setExecutions(prev => {
      // 检查是否已存在
      const exists = prev.some(e => e.id === execution.id)
      if (exists) return prev
      return [...prev, execution]
    })
  }, [])

  // 移除执行项
  const removeExecution = useCallback((executionId: string) => {
    setExecutions(prev => prev.filter(e => e.id !== executionId))
  }, [])

  // 处理超时
  const handleTimeout = useCallback((execution: Execution) => {
    console.warn('[App] 执行超时:', execution)
    removeExecution(execution.id)

    // 显示超时通知
    const operationText = execution.operation ? `"${execution.operation}"` : '操作'
    const timeout = execution.timeout || 30000
    addToast(
      `${execution.pluginName} ${operationText} 执行超时 (超过 ${(timeout / 1000).toFixed(0)}秒)`,
      'warning'
    )
  }, [removeExecution, addToast])

  // 监听插件方法执行事件
  useEffect(() => {
    const ipcRenderer = (window as any).electron?.ipcRenderer
    if (!ipcRenderer) return

    // 监听插件方法开始事件
    const handlePluginMethodStart = (_event: any, data: {
      pluginId: string
      methodName: string
      timestamp: number
    }) => {
      console.log('[App] 插件方法开始执行:', data)

      // 获取插件名称
      const pluginName = data.pluginId // TODO: 从插件元数据获取

      addExecution({
        id: `${data.pluginId}-${data.methodName}-${data.timestamp}`,
        pluginId: data.pluginId,
        pluginName: pluginName || data.pluginId,
        operation: data.methodName,
        startTime: data.timestamp,
        timeout: 30000 // 默认30秒
      })
    }

    // 监听插件方法结束事件
    const handlePluginMethodEnd = (_event: any, data: {
      pluginId: string
      methodName: string
      timestamp: number
      success: boolean
      error?: string
    }) => {
      console.log('[App] 插件方法执行完成:', data)

      const executionId = `${data.pluginId}-${data.methodName}-${data.timestamp}`
      removeExecution(executionId)
    }

    // 监听事务开始事件
    const handleTransactionStart = (_event: any, data: {
      transactionId: string
      transactionName: string
      pluginId: string
      timestamp: number
    }) => {
      console.log('[App] 事务开始执行:', data)

      addExecution({
        id: data.transactionId,
        pluginId: data.pluginId,
        pluginName: data.pluginId, // TODO: 从插件元数据获取
        operation: data.transactionName,
        startTime: data.timestamp,
        timeout: 30000 // 默认30秒
      })
    }

    // 监听事务结束事件
    const handleTransactionEnd = (_event: any, data: {
      transactionId: string
      timestamp: number
      success: boolean
      error?: string
    }) => {
      console.log('[App] 事务执行完成:', data)
      removeExecution(data.transactionId)
    }

    // 注册监听器
    ipcRenderer.on('plugin:method:start', handlePluginMethodStart)
    ipcRenderer.on('plugin:method:end', handlePluginMethodEnd)
    ipcRenderer.on('transaction:start', handleTransactionStart)
    ipcRenderer.on('transaction:end', handleTransactionEnd)

    console.log('[App] 已注册插件执行事件监听器')

    // 清理函数
    return () => {
      ipcRenderer.removeListener('plugin:method:start', handlePluginMethodStart)
      ipcRenderer.removeListener('plugin:method:end', handlePluginMethodEnd)
      ipcRenderer.removeListener('transaction:start', handleTransactionStart)
      ipcRenderer.removeListener('transaction:end', handleTransactionEnd)
      console.log('[App] 已移除插件执行事件监听器')
    }
  }, [addExecution, removeExecution])

  // 处理单个权限响应
  const handlePermissionResponse = (granted: boolean, sessionOnly?: boolean, permanent?: boolean) => {
    console.log('发送权限响应:', { granted, sessionOnly, permanent, requestId: permissionRequest?.id })

    if (permissionRequest) {
      // 发送响应到主进程
      window.electronAPI.permission.sendResponse?.({
        requestId: permissionRequest.id,
        granted,
        sessionOnly,
        permanent  // 添加 permanent 标志
      })

      // 更新 store 中的当前请求
      setCurrentPermissionRequest(null)

      // 关闭对话框
      setPermissionRequest(null)
    }
  }

  // 处理批量权限响应
  const handleBatchPermissionResponse = (result: { granted: boolean; sessionOnly: boolean }) => {
    console.log('发送批量权限响应:', { ...result, requestId: batchPermissionRequest?.id })

    if (batchPermissionRequest) {
      // 发送响应到主进程
      const ipcRenderer = (window as any).electron?.ipcRenderer
      if (ipcRenderer) {
        ipcRenderer.send('permission:batchResponse', {
          requestId: batchPermissionRequest.id,
          granted: result.granted,
          sessionOnly: result.sessionOnly
        })
      }

      // 关闭对话框
      setBatchPermissionRequest(null)
    }
  }

  // 处理关闭对话框
  const handleCloseDialog = () => {
    console.log('关闭权限请求对话框')
    setPermissionRequest(null)
  }

  // 处理关闭批量对话框
  const handleCloseBatchDialog = () => {
    console.log('关闭批量权限请求对话框')
    setBatchPermissionRequest(null)
  }

  // 处理功能权限响应
  const handleFeaturePermissionResponse = (result: { granted: boolean; sessionOnly: boolean }) => {
    console.log('发送功能权限响应:', { ...result, requestId: featurePermissionRequest?.pluginId })

    if (featurePermissionRequest) {
      // 发送响应到主进程
      const ipcRenderer = (window as any).electron?.ipcRenderer
      if (ipcRenderer) {
        ipcRenderer.send('permission:featureResponse', {
          pluginId: featurePermissionRequest.pluginId,
          featureName: featurePermissionRequest.featureName,
          granted: result.granted,
          sessionOnly: result.sessionOnly
        })
      }

      // 关闭对话框
      setFeaturePermissionRequest(null)
    }
  }

  // 处理关闭功能权限对话框
  const handleCloseFeatureDialog = () => {
    console.log('关闭功能权限请求对话框')
    setFeaturePermissionRequest(null)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />
      case 'plugins':
        return <PluginList />
      case 'plugin-loading':
        return <PluginLoading />
      case 'plugin-detail':
        return <PluginDetail />
      case 'plugin-status':
        return <PluginStatus />
      case 'plugin-view':
        return activePluginId ? (
          <PluginErrorBoundary>
            <PluginContainer pluginId={activePluginId} />
          </PluginErrorBoundary>
        ) : (
          <PluginList />
        )
      case 'settings':
        return <Settings />
      case 'about':
        return <About />
      default:
        return <Home />
    }
  }

  return (
    <ToastProvider>
      <MainLayout>{renderPage()}</MainLayout>

      {/* 全局执行指示器 */}
      <GlobalExecutionIndicator
        executions={executions}
        currentPluginId={activePluginId}
        onTimeout={handleTimeout}
      />

      {/* 权限请求对话框 */}
      {permissionRequest && (
        <PermissionRequestDialog
          request={permissionRequest}
          onResponse={handlePermissionResponse}
          onClose={handleCloseDialog}
        />
      )}

      {/* 批量权限请求对话框 */}
      {batchPermissionRequest && (
        <BatchPermissionDialog
          request={batchPermissionRequest}
          onResponse={handleBatchPermissionResponse}
          onClose={handleCloseBatchDialog}
        />
      )}

      {/* 功能权限请求对话框 */}
      {featurePermissionRequest && (
        <FeaturePermissionDialog
          request={featurePermissionRequest}
          onResponse={handleFeaturePermissionResponse}
          onClose={handleCloseFeatureDialog}
        />
      )}

      {/* 权限被永久拒绝通知 */}
      {permissionDeniedToasts.map((toast) => (
        <div
          key={toast.id}
          className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300"
          style={{ maxWidth: '500px' }}
        >
          <PermissionDeniedToast
            pluginName={toast.pluginName}
            permission={toast.permission}
            operation={toast.operation}
            onOpenSettings={handleOpenSettings}
            onClose={() => removePermissionDeniedToast(toast.id)}
          />
        </div>
      ))}

      <ToastViewport>
        {toasts.map((toast) => (
          <Toast key={toast.id} variant={toast.type === 'error' ? 'destructive' : 'default'}>
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              <div>
                <ToastTitle>
                  {toast.type === 'success' && '成功'}
                  {toast.type === 'error' && '错误'}
                  {toast.type === 'warning' && '警告'}
                  {toast.type === 'info' && '信息'}
                </ToastTitle>
                <ToastDescription>{toast.message}</ToastDescription>
              </div>
            </div>
          </Toast>
        ))}
      </ToastViewport>
    </ToastProvider>
  )
}

export default App
