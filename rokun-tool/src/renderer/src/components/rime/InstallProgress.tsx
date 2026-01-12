/**
 * 安装进度显示组件
 *
 * 显示配方安装/更新/卸载的实时进度和日志
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react'

export interface InstallProgressProps {
  operation: 'install' | 'update' | 'uninstall' | 'deploy'
  recipeName?: string
  onComplete?: () => void
  onCancel?: () => void
}

type ProgressStatus = 'running' | 'completed' | 'error'

export function InstallProgress({
  operation,
  recipeName,
  onComplete,
  onCancel
}: InstallProgressProps) {
  const [status, setStatus] = useState<ProgressStatus>('running')
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState('')

  useEffect(() => {
    // 模拟进度更新
    const steps = getOperationSteps(operation)

    let currentStepIndex = 0
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        setCurrentStep(steps[currentStepIndex])
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[currentStepIndex]}`])
        setProgress(((currentStepIndex + 1) / steps.length) * 100)
        currentStepIndex++
      } else {
        setStatus('completed')
        clearInterval(interval)
        if (onComplete) {
          setTimeout(onComplete, 500)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [operation, onComplete])

  const getOperationTitle = () => {
    const titles = {
      install: `正在安装: ${recipeName || '配方'}`,
      update: `正在更新: ${recipeName || '配方'}`,
      uninstall: `正在卸载: ${recipeName || '配方'}`,
      deploy: '正在部署 Rime...'
    }
    return titles[operation]
  }

  const getOperationSteps = (op: InstallProgressProps['operation']) => {
    const stepMap = {
      install: [
        '检查配方依赖...',
        '下载配方文件...',
        '验证文件完整性...',
        '安装词库文件...',
        '安装配置文件...',
        '更新配方状态...',
        '完成!'
      ],
      update: [
        '检查当前版本...',
        '下载更新文件...',
        '备份现有配置...',
        '更新词库文件...',
        '更新配置文件...',
        '清理旧文件...',
        '完成!'
      ],
      uninstall: [
        '识别相关文件...',
        '卸载词库文件...',
        '卸载配置文件...',
        '清理残留文件...',
        '更新配方状态...',
        '完成!'
      ],
      deploy: [
        '检查配置文件...',
        '编译输入方案...',
        '生成词库索引...',
        '部署用户配置...',
        '完成!'
      ]
    }
    return stepMap[op]
  }

  const handleCancel = () => {
    setStatus('error')
    setLogs((prev) => [...prev, '[错误] 操作已取消'])
    if (onCancel) {
      setTimeout(onCancel, 500)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* 标题栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status === 'running' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
              {status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              {status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              <div>
                <p className="font-medium text-blue-900">{getOperationTitle()}</p>
                <p className="text-sm text-blue-700">{currentStep}</p>
              </div>
            </div>
            {status === 'running' && (
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" />
                取消
              </Button>
            )}
          </div>

          {/* 进度条 */}
          {status === 'running' && (
            <div className="space-y-2">
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 text-right">{Math.round(progress)}%</p>
            </div>
          )}

          {/* 日志输出 */}
          <div className="h-40 w-full rounded-md border border-blue-200 bg-white p-3 overflow-y-auto">
            <div className="space-y-1">
              {logs.map((log, index) => (
                <p key={index} className="text-xs font-mono text-gray-700">
                  {log}
                </p>
              ))}
            </div>
          </div>

          {/* 完成提示 */}
          {status === 'completed' && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLogs([])
                  setProgress(0)
                  setCurrentStep('')
                  setStatus('running')
                }}
              >
                关闭
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
