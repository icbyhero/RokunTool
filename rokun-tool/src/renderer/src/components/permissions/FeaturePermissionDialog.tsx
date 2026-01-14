import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle, Shield, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import type { PluginPermission } from '@shared/types/plugin'

/**
 * 功能权限定义
 */
export interface FeaturePermissionDef {
  permission: PluginPermission
  required: boolean
  reason?: string
}

/**
 * 风险等级
 */
export type RiskLevel = 'low' | 'medium' | 'high'

/**
 * 推荐策略
 */
export type Recommendation = 'auto_grant' | 'session_grant' | 'ask_user'

/**
 * 功能权限请求
 */
export interface FeaturePermissionRequest {
  pluginId: string
  pluginName: string
  featureName: string
  featureDescription?: string
  permissions: FeaturePermissionDef[]
  riskLevel: RiskLevel
  recommendation: Recommendation
  context?: {
    operation: string
    target?: string
  }
}

interface FeaturePermissionDialogProps {
  request: FeaturePermissionRequest
  onResponse: (result: {
    granted: boolean
    sessionOnly: boolean
  }) => void
  onClose: () => void
}

/**
 * 功能权限请求对话框
 * 用于在执行功能前批量请求多个权限,并显示风险评估和推荐策略
 */
export function FeaturePermissionDialog({
  request,
  onResponse,
  onClose
}: FeaturePermissionDialogProps) {
  const [showDetails, setShowDetails] = useState(false)

  // 获取权限图标和描述
  const getPermissionInfo = (permission: PluginPermission) => {
    const permissionMap: Record<string, {
      icon: string
      name: string
      description: string
      risk: string
      riskLevel: RiskLevel
    }> = {
      'fs:read': {
        icon: '📖',
        name: '文件读取权限',
        description: '允许插件读取文件',
        risk: '插件可以读取您系统中的文件',
        riskLevel: 'low'
      },
      'fs:write': {
        icon: '📁',
        name: '文件写入权限',
        description: '允许插件在指定位置创建和修改文件',
        risk: '插件可以修改您系统中的文件,请确保您信任此插件',
        riskLevel: 'high'
      },
      'process:exec': {
        icon: '⚙️',
        name: '进程执行权限',
        description: '允许插件执行系统命令',
        risk: '插件可以运行任意系统命令,请确保您信任此插件',
        riskLevel: 'high'
      },
      'process:spawn': {
        icon: '🚀',
        name: '进程启动权限',
        description: '允许插件启动新进程',
        risk: '插件可以启动其他应用程序,请确保您信任此插件',
        riskLevel: 'medium'
      },
      'shell:execute': {
        icon: '💻',
        name: 'Shell 执行权限',
        description: '允许插件执行 Shell 命令',
        risk: '插件可以执行 Shell 命令,请确保您信任此插件',
        riskLevel: 'high'
      },
      'network:http': {
        icon: '🌐',
        name: '网络访问权限',
        description: '允许插件访问网络',
        risk: '插件可以发送和接收网络数据',
        riskLevel: 'medium'
      },
      'clipboard:read': {
        icon: '📋',
        name: '剪贴板读取权限',
        description: '允许插件读取剪贴板内容',
        risk: '插件可以访问您剪贴板中的敏感信息',
        riskLevel: 'medium'
      },
      'clipboard:write': {
        icon: '📋',
        name: '剪贴板写入权限',
        description: '允许插件修改剪贴板内容',
        risk: '插件可以替换您剪贴板中的内容',
        riskLevel: 'low'
      },
      'notification:show': {
        icon: '🔔',
        name: '通知显示权限',
        description: '允许插件显示系统通知',
        risk: '插件可以显示通知',
        riskLevel: 'low'
      },
      'config:read': {
        icon: '⚙️',
        name: '配置读取权限',
        description: '允许插件读取应用配置',
        risk: '插件可以读取应用程序设置',
        riskLevel: 'low'
      },
      'config:write': {
        icon: '⚙️',
        name: '配置写入权限',
        description: '允许插件修改应用配置',
        risk: '插件可以更改应用程序设置',
        riskLevel: 'medium'
      },
      'window:open': {
        icon: '🪟',
        name: '窗口打开权限',
        description: '允许插件打开新窗口',
        risk: '插件可以打开新的应用程序窗口',
        riskLevel: 'low'
      }
    }

    return (
      permissionMap[permission] || {
        icon: '🔐',
        name: permission,
        description: `需要 ${permission} 权限`,
        risk: '请确保您信任此插件',
        riskLevel: 'medium'
      }
    )
  }

  // 获取风险等级显示信息
  const getRiskLevelInfo = (level: RiskLevel) => {
    switch (level) {
      case 'low':
        return {
          icon: Shield,
          label: '低风险',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      case 'medium':
        return {
          icon: AlertCircle,
          label: '中风险',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        }
      case 'high':
        return {
          icon: AlertTriangle,
          label: '高风险',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        }
    }
  }

  // 获取推荐策略显示信息
  const getRecommendationInfo = (rec: Recommendation) => {
    switch (rec) {
      case 'auto_grant':
        return {
          label: '建议自动授权',
          description: '这些权限已经全部授予,可以直接执行操作',
          color: 'text-green-600 dark:text-green-400'
        }
      case 'session_grant':
        return {
          label: '建议本次授权',
          description: '这些权限风险较低,建议本次会话授权',
          color: 'text-blue-600 dark:text-blue-400'
        }
      case 'ask_user':
        return {
          label: '需要您确认',
          description: '这些权限风险较高,请仔细考虑后再授权',
          color: 'text-orange-600 dark:text-orange-400'
        }
    }
  }

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
    onResponse({ granted: false, sessionOnly: false })
  }

  const handleSessionOnly = () => {
    onResponse({ granted: true, sessionOnly: true })
  }

  const handlePermanentGrant = () => {
    onResponse({ granted: true, sessionOnly: false })
  }

  const riskInfo = getRiskLevelInfo(request.riskLevel)
  const recommendationInfo = getRecommendationInfo(request.recommendation)
  const RiskIcon = riskInfo.icon

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Card className="w-full max-w-3xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">
        <CardContent className="p-6 flex-1 overflow-auto">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">🔐</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {request.pluginName} 请求权限
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  功能: {request.featureName}
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

          {/* 功能描述 */}
          {request.featureDescription && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {request.featureDescription}
              </p>
            </div>
          )}

          {/* 操作上下文 */}
          {request.context && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <div className="font-medium mb-1">操作信息</div>
                <div>操作: {request.context.operation}</div>
                {request.context.target && (
                  <div className="text-xs mt-1">目标: {request.context.target}</div>
                )}
              </div>
            </div>
          )}

          {/* 风险评估和推荐策略 */}
          <div className={`rounded-lg p-3 mb-4 border ${riskInfo.bgColor} ${riskInfo.borderColor}`}>
            <div className="flex items-center space-x-3">
              <RiskIcon className={`w-5 h-5 ${riskInfo.color} flex-shrink-0`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${riskInfo.color}`}>
                    {riskInfo.label}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">•</span>
                  <span className={`text-sm ${recommendationInfo.color}`}>
                    {recommendationInfo.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {recommendationInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* 权限列表 */}
          <div className="space-y-3 mb-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              所需权限列表 ({request.permissions.length} 个):
            </div>
            {request.permissions.map(({ permission, required, reason }) => {
              const info = getPermissionInfo(permission)
              return (
                <div
                  key={permission}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{info.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {info.name}
                        </h3>
                        {required && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                            必需
                          </span>
                        )}
                        {!required && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            可选
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {info.description}
                      </p>
                      {reason && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                          用途: {reason}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        ⚠️ {info.risk}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 安全提示 */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">安全提示</p>
                <p>
                  请确保您信任此插件后再授予权限。您可以在插件设置页面随时撤销已授予的权限。
                </p>
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
                    <strong>永久授权</strong>: 所有权限将被永久记录,以后使用此功能时不再询问。
                    您可以在插件设置页面随时撤销这些权限。
                  </li>
                  <li>
                    <strong>本次授权</strong>: 所有权限仅在当前应用会话中有效,关闭应用后失效。
                    下次使用此功能时会再次询问。
                  </li>
                  <li>
                    <strong>拒绝</strong>: 拒绝所有权限,中止操作。下次使用此功能时会重新询问。
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* 按钮 */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="destructive"
              onClick={handleDeny}
            >
              拒绝
            </Button>
            <Button
              variant="secondary"
              onClick={handleSessionOnly}
            >
              本次授权
            </Button>
            <Button
              variant="default"
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
