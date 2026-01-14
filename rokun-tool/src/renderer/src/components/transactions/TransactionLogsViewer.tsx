/**
 * 事务日志查看器组件
 *
 * 允许用户查看和分析事务执行历史
 */

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '../ui/utils'

interface TransactionSummary {
  transactionId: string
  transactionName: string
  pluginId: string
  startTime: string
  endTime?: string
  status: 'executing' | 'success' | 'failed'
  stepCount: number
}

interface TransactionLog {
  transactionId: string
  timestamp: string
  level: 'info' | 'success' | 'error'
  event: string
  data: {
    transactionName?: string
    pluginId?: string
    stepName?: string
    stepIndex?: number
    error?: string
    executedSteps?: number
    totalSteps?: number
  }
}

export function TransactionLogsViewer() {
  const [summaries, setSummaries] = useState<TransactionSummary[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  // 加载事务摘要列表
  useEffect(() => {
    loadSummaries()
  }, [])

  const loadSummaries = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await (window as any).electronAPI.transaction.getSummaries({
        startDate: getDaysAgo(7) // 最近7天
      })

      if (result.success && result.summaries) {
        setSummaries(result.summaries)
      } else {
        setError(result.error || '加载失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactionLogs = async (transactionId: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await (window as any).electronAPI.transaction.getLogs({
        transactionId
      })

      if (result.success && result.logs) {
        setTransactionLogs(result.logs)
      } else {
        setError(result.error || '加载失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionClick = (transactionId: string) => {
    if (selectedTransaction === transactionId) {
      setSelectedTransaction(null)
      setTransactionLogs([])
    } else {
      setSelectedTransaction(transactionId)
      loadTransactionLogs(transactionId)
    }
  }

  const toggleLogExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'executing':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      executing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
    }

    const labels: Record<string, string> = {
      success: '成功',
      failed: '失败',
      executing: '执行中'
    }

    return (
      <Badge className={variants[status] || ''}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getLevelBadge = (level: string) => {
    const variants: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    }

    return (
      <Badge className={variants[level] || ''}>
        {level}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>事务日志</CardTitle>
            <CardDescription>查看插件事务执行历史</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSummaries}
            disabled={loading}
          >
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading && summaries.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">加载中...</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">暂无事务日志</p>
          </div>
        ) : (
          <div className="space-y-2">
            {summaries.map((summary) => (
              <div
                key={summary.transactionId}
                className="border rounded-md dark:border-gray-700"
              >
                <button
                  onClick={() => handleTransactionClick(summary.transactionId)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {selectedTransaction === summary.transactionId ? (
                      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                    {getStatusIcon(summary.status)}
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {summary.transactionName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {summary.pluginId} · {summary.stepCount} 个步骤
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(summary.status)}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(summary.startTime)}
                    </p>
                  </div>
                </button>

                {selectedTransaction === summary.transactionId && transactionLogs.length > 0 && (
                  <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/20">
                    <div className="h-64 overflow-y-auto">
                      <div className="space-y-1">
                        {transactionLogs.map((log, index) => {
                          const logId = `${log.transactionId}-${index}`
                          const isExpandable = log.data.stepName !== undefined || log.data.error !== undefined

                          return (
                            <div key={logId} className="border-b dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                              <div
                                className={cn(
                                  "flex items-start gap-2 py-1",
                                  isExpandable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 -mx-2"
                                )}
                                onClick={() => isExpandable && toggleLogExpand(logId)}
                              >
                                <p className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">
                                  {formatDate(log.timestamp)}
                                </p>
                                {getLevelBadge(log.level)}
                                <p className="text-sm text-gray-900 dark:text-white flex-1 text-left">
                                  {log.event === 'transaction_start' && '开始事务'}
                                  {log.event === 'step_start' && `步骤: ${log.data.stepName}`}
                                  {log.event === 'step_success' && `步骤完成: ${log.data.stepName}`}
                                  {log.event === 'step_failed' && `步骤失败: ${log.data.stepName}`}
                                  {log.event === 'transaction_success' && '事务成功完成'}
                                  {log.event === 'transaction_failed' && '事务失败'}
                                </p>
                                {isExpandable && (
                                  <ChevronDown
                                    className={cn(
                                      "w-4 h-4 text-gray-400 transition-transform",
                                      expandedLogs.has(logId) && "transform rotate-180"
                                    )}
                                  />
                                )}
                              </div>

                              {isExpandable && expandedLogs.has(logId) && (
                                <div className="ml-8 mt-1 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                  {log.data.stepIndex !== undefined && (
                                    <p>步骤索引: {log.data.stepIndex + 1}</p>
                                  )}
                                  {log.data.error && (
                                    <p className="text-red-600 dark:text-red-400">错误: {log.data.error}</p>
                                  )}
                                  {log.data.executedSteps !== undefined && (
                                    <p>已执行步骤: {log.data.executedSteps}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}
