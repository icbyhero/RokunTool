import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'

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

interface PermissionRequestDialogProps {
  request: PermissionRequest
  onResponse: (granted: boolean, sessionOnly?: boolean, permanent?: boolean) => void
  onClose: () => void
}

export function PermissionRequestDialog({ request, onResponse, onClose }: PermissionRequestDialogProps) {
  const [showDetails, setShowDetails] = useState(false)

  // 获取权限图标和描述
  const getPermissionInfo = (permission: string) => {
    const permissionMap: Record<string, { icon: string; name: string; description: string; risk: string }> = {
      'fs:write': {
        icon: '📁',
        name: '文件写入权限',
        description: '允许插件在指定位置创建和修改文件',
        risk: '插件可以修改您系统中的文件,请确保您信任此插件'
      },
      'process:exec': {
        icon: '⚙️',
        name: '进程执行权限',
        description: '允许插件执行系统命令',
        risk: '插件可以运行任意系统命令,请确保您信任此插件'
      },
      'process:spawn': {
        icon: '🚀',
        name: '进程启动权限',
        description: '允许插件启动新进程',
        risk: '插件可以启动其他应用程序,请确保您信任此插件'
      },
      'shell:execute': {
        icon: '💻',
        name: 'Shell 执行权限',
        description: '允许插件执行 Shell 命令',
        risk: '插件可以执行 Shell 命令,请确保您信任此插件'
      },
      'process:kill': {
        icon: '🛑',
        name: '进程终止权限',
        description: '允许插件终止进程',
        risk: '插件可以关闭运行中的应用程序'
      },
      'network:http': {
        icon: '🌐',
        name: '网络访问权限',
        description: '允许插件访问网络',
        risk: '插件可以发送和接收网络数据'
      },
      'clipboard:read': {
        icon: '📋',
        name: '剪贴板读取权限',
        description: '允许插件读取剪贴板内容',
        risk: '插件可以访问您剪贴板中的敏感信息'
      },
      'clipboard:write': {
        icon: '📋',
        name: '剪贴板写入权限',
        description: '允许插件修改剪贴板内容',
        risk: '插件可以替换您剪贴板中的内容'
      },
      'config:write': {
        icon: '⚙️',
        name: '配置写入权限',
        description: '允许插件修改应用配置',
        risk: '插件可以更改应用程序设置'
      },
      'window:open': {
        icon: '🪟',
        name: '窗口打开权限',
        description: '允许插件打开新窗口',
        risk: '插件可以打开新的应用程序窗口'
      }
    }

    return (
      permissionMap[permission] || {
        icon: '🔐',
        name: permission,
        description: `需要 ${permission} 权限`,
        risk: '请确保您信任此插件'
      }
    )
  }

  const permissionInfo = getPermissionInfo(request.permission)

  // ESC 键关闭对话框
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleDeny = () => {
    onResponse(false, false, false)  // 临时拒绝
  }

  const handlePermanentDeny = () => {
    onResponse(false, false, true)   // 永久拒绝
  }

  const handleSessionOnly = () => {
    onResponse(true, true, false)     // 本次授权
  }

  const handlePermanentGrant = () => {
    onResponse(true, false, false)    // 永久授权
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Card className="w-full max-w-md animate-in zoom-in-95 duration-200">
        <CardContent className="p-6">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">{permissionInfo.icon}</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {request.pluginName} 请求权限
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  为了继续操作,需要以下权限
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 权限信息 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{permissionInfo.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {permissionInfo.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {permissionInfo.description}
                </p>

                {/* 操作上下文 */}
                {request.context && (
                  <div className="text-sm bg-white dark:bg-gray-700 rounded p-2 mb-2">
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      操作: {request.context.operation}
                    </div>
                    {request.context.target && (
                      <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                        目标: {request.context.target}
                      </div>
                    )}
                  </div>
                )}

                {/* 原因说明 */}
                {request.reason && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    "{request.reason}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 风险警告 */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">安全提示</p>
                <p>{permissionInfo.risk}</p>
              </div>
            </div>
          </div>

          {/* 详细说明 */}
          {showDetails && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">授权选项说明</p>
                <ul className="list-disc list-inside space-y-2 text-xs">
                  <li>
                    <strong>永久授权</strong>: 权限将被永久记录,以后使用此功能时不再询问。
                    您可以在插件设置页面随时撤销此权限。
                  </li>
                  <li>
                    <strong>本次授权</strong>: 权限仅在当前应用会话中有效,关闭应用后失效。
                    下次使用此功能时会再次询问。
                  </li>
                  <li>
                    <strong>拒绝</strong>: 仅在本次会话中拒绝,关闭应用后会重置。
                  </li>
                  <li>
                    <strong>永久拒绝</strong>: 永久拒绝此权限,以后不会再次询问。
                    可在插件设置页面中重新启用。
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* 按钮 - 4列布局 */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeny}
            >
              拒绝
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handlePermanentDeny}
            >
              永久拒绝
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSessionOnly}
            >
              本次授权
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePermanentGrant}
            >
              永久授权
            </Button>
          </div>

          {/* 详细说明切换 */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-center"
          >
            {showDetails ? '隐藏' : '显示'}详细说明
          </button>
        </CardContent>
      </Card>
    </div>,
    document.body
  )
}
