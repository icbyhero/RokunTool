import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Loader2, X } from 'lucide-react'

/**
 * 插件执行状态
 */
export interface Execution {
  id: string // 唯一标识
  pluginId: string // 插件 ID
  pluginName: string // 插件名称
  pluginIcon?: string // 插件图标
  operation?: string // 操作描述
  startTime: number // 开始时间
  timeout?: number // 超时时间(毫秒),0 或 undefined 表示禁用超时
}

/**
 * 全局执行指示器组件属性
 */
interface GlobalExecutionIndicatorProps {
  executions: Execution[]
  currentPluginId?: string // 当前页面的插件 ID
  onTimeout?: (execution: Execution) => void
  onClose?: () => void // 关闭指示器回调
}

/**
 * 执行项组件
 */
interface ExecutionItemProps {
  execution: Execution
  duration: number
}

const ExecutionItem: React.FC<ExecutionItemProps> = React.memo(({ execution, duration }) => {
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 dark:hover:bg-black/5 transition-colors">
      {/* Loading Spinner */}
      <Loader2 className="h-3.5 w-3.5 text-red-500 animate-spin" />

      {/* Plugin Name */}
      <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">
        {execution.pluginName}
      </span>

      {/* Execution Time */}
      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
        {formatDuration(duration)}
      </span>
    </div>
  )
})

ExecutionItem.displayName = 'ExecutionItem'

/**
 * 排序执行项
 * 1. 当前页面的插件置顶
 * 2. 执行时间最长的排在前面
 * 3. 最近启动的排在前面
 */
function sortExecutions(executions: Execution[], currentPluginId?: string): Execution[] {
  return [...executions].sort((a, b) => {
    // 1. 当前页面的插件置顶
    if (currentPluginId) {
      if (a.pluginId === currentPluginId && b.pluginId !== currentPluginId) {
        return -1
      }
      if (b.pluginId === currentPluginId && a.pluginId !== currentPluginId) {
        return 1
      }
    }

    // 2. 执行时间最长的排在前面 (差距超过5秒才排序)
    const durationA = Date.now() - a.startTime
    const durationB = Date.now() - b.startTime
    if (Math.abs(durationA - durationB) > 5000) {
      return durationB - durationA
    }

    // 3. 最近启动的排在前面
    return b.startTime - a.startTime
  })
}

/**
 * 获取可见的执行项
 * 桌面端最多显示3个,移动端最多显示2个
 */
function getVisibleExecutions(executions: Execution[], isMobile: boolean) {
  const maxVisible = isMobile ? 2 : 3
  const sorted = sortExecutions(executions)

  if (sorted.length <= maxVisible) {
    return { visible: sorted, hidden: [] }
  }

  return {
    visible: sorted.slice(0, maxVisible),
    hidden: sorted.slice(maxVisible)
  }
}

/**
 * 全局插件执行指示器组件
 *
 * 功能:
 * - 显示执行中的插件列表
 * - 自动浅色/深色模式适配
 * - 支持超时检测
 * - 动画效果
 */
export const GlobalExecutionIndicator: React.FC<GlobalExecutionIndicatorProps> = React.memo(
  ({ executions, currentPluginId, onTimeout, onClose }) => {
    const [durations, setDurations] = useState<Record<string, number>>({})
    const [lastUpdateTime, setLastUpdateTime] = useState(0)

    // 检测是否为移动端
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    // 监听窗口大小变化
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768)
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    // 更新执行时间 (每秒最多更新1次)
    useEffect(() => {
      if (executions.length === 0) return

      const now = Date.now()
      const shouldUpdate = now - lastUpdateTime > 1000

      if (shouldUpdate) {
        const newDurations: Record<string, number> = {}
        executions.forEach(exec => {
          newDurations[exec.id] = now - exec.startTime
        })
        setDurations(newDurations)
        setLastUpdateTime(now)
      }

      // 检查超时
      executions.forEach(exec => {
        // 如果 timeout 为 0,则禁用超时检测
        if (exec.timeout === 0) return

        const duration = now - exec.startTime
        const timeout = exec.timeout || 30000 // 默认30秒

        if (duration > timeout && onTimeout) {
          onTimeout(exec)
        }
      })
    }, [executions, lastUpdateTime, onTimeout])

    // 计算可见的执行项
    const { visible, hidden } = useMemo(() => {
      return getVisibleExecutions(executions, isMobile)
    }, [executions, isMobile])

    // 如果没有执行项,不显示
    if (executions.length === 0) {
      return null
    }

    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="插件执行状态"
        className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-right duration-300"
      >
        <div className="bg-black/80 dark:bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 dark:border-gray-200/50 min-w-[200px] max-w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-700/50 dark:border-gray-200/50">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
              <span className="text-sm font-semibold text-white dark:text-gray-900">
                正在执行...
              </span>
              {executions.length > 1 && (
                <span className="text-xs text-gray-400 dark:text-gray-600">
                  ({executions.length})
                </span>
              )}
            </div>

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-600 hover:text-gray-200 dark:hover:text-gray-800 transition-colors"
                aria-label="关闭执行指示器"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Execution List */}
          <div className="max-h-[200px] overflow-y-auto">
            {visible.map(execution => (
              <ExecutionItem
                key={execution.id}
                execution={execution}
                duration={durations[execution.id] || 0}
              />
            ))}

            {/* Hidden Count */}
            {hidden.length > 0 && (
              <div className="px-2 py-1.5 text-xs text-gray-400 dark:text-gray-600 text-center hover:bg-white/5 dark:hover:bg-black/5 cursor-pointer transition-colors">
                还有 {hidden.length} 个插件在执行...
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

GlobalExecutionIndicator.displayName = 'GlobalExecutionIndicator'

export default GlobalExecutionIndicator
