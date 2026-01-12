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
import { useEffect, useState } from 'react'

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

function App(): React.JSX.Element {
  const { currentPage, toasts, activePluginId } = useUIStore()
  const { setCurrentPermissionRequest } = usePluginStore()
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null)

  // 监听权限请求事件
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

  // 处理权限响应
  const handlePermissionResponse = (granted: boolean) => {
    console.log('发送权限响应:', { granted, requestId: permissionRequest?.id })

    if (permissionRequest) {
      // 发送响应到主进程
      window.electronAPI.permission.sendResponse?.({
        requestId: permissionRequest.id,
        granted
      })

      // 更新 store 中的当前请求
      setCurrentPermissionRequest(null)

      // 关闭对话框
      setPermissionRequest(null)
    }
  }

  // 处理关闭对话框
  const handleCloseDialog = () => {
    console.log('关闭权限请求对话框')
    setPermissionRequest(null)
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

      {/* 权限请求对话框 */}
      {permissionRequest && (
        <PermissionRequestDialog
          request={permissionRequest}
          onResponse={handlePermissionResponse}
          onClose={handleCloseDialog}
        />
      )}

      <ToastViewport>
        {toasts.map((toast) => (
          <Toast key={toast.id} variant={toast.type === 'error' ? 'destructive' : 'default'}>
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
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
