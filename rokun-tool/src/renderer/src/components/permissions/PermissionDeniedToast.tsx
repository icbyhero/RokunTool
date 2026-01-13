/**
 * 权限被永久拒绝的 Toast 通知组件
 *
 * 当插件尝试使用被永久拒绝的权限时显示
 */

import { AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '../ui/Button'

export interface PermissionDeniedToastProps {
  pluginName: string
  permission: string
  operation: string
  onOpenSettings: () => void
  onClose: () => void
}

// 权限名称映射
const permissionNames: Record<string, string> = {
  'fs:read': '文件读取',
  'fs:write': '文件写入',
  'process:exec': '进程执行',
  'process:spawn': '进程启动',
  'process:kill': '进程终止',
  'shell:execute': 'Shell 执行',
  'network:http': '网络访问',
  'clipboard:read': '剪贴板读取',
  'clipboard:write': '剪贴板写入',
  'config:write': '配置写入',
  'window:open': '窗口打开'
}

export function PermissionDeniedToast({
  pluginName,
  permission,
  operation,
  onOpenSettings,
  onClose
}: PermissionDeniedToastProps) {
  const permissionName = permissionNames[permission] || permission

  return (
    <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 border-l-4 border-yellow-500 rounded-lg shadow-lg animate-in slide-in-from-right duration-300">
      {/* 图标 */}
      <div className="flex-shrink-0">
        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      </div>

      {/* 内容 */}
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          权限被拒绝
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {pluginName} 需要的 <span className="font-medium">{permissionName}</span> 权限已被永久拒绝
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          无法执行操作: {operation}
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSettings}
          className="flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          前往设置
        </Button>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="关闭通知"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
