import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from './Dialog'
import { Progress } from './Progress'
import { Button } from './Button'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from './Alert'

interface ProgressDialogProps {
  isOpen: boolean
  title: string
  currentStep: string
  progress: number
  status: 'running' | 'success' | 'error'
  error?: string
  logs?: string[]
  onClose?: () => void
}

export function ProgressDialog({
  isOpen,
  title,
  currentStep,
  progress,
  status,
  error,
  logs = [],
  onClose
}: ProgressDialogProps) {
  if (!isOpen) return null

  // 计算进度百分比
  const progressPercent = Math.min(100, Math.max(0, progress))

  // 处理对话框关闭事件
  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 进度条 */}
          <div className="space-y-2">
            <Progress value={progressPercent} className="w-full" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{progressPercent.toFixed(0)}%</span>
              {status === 'running' && <span>处理中...</span>}
            </div>
          </div>

          {/* 当前步骤 */}
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {currentStep}
          </p>

          {/* 操作日志 (可选) */}
          {logs.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">操作日志:</h4>
              <ul className="text-xs space-y-1 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {logs.map((log, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">{log}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 状态图标和消息 */}
          <div className="flex items-center justify-center py-4">
            {status === 'running' && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">正在处理...</span>
              </div>
            )}
            {status === 'success' && (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">操作成功!</span>
              </div>
            )}
            {status === 'error' && (
              <div className="flex flex-col items-center gap-2">
                <XCircle className="h-8 w-8 text-red-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">操作失败</span>
              </div>
            )}
          </div>

          {/* 错误信息 */}
          {error && status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">{error}</AlertDescription>
            </Alert>
          )}

          {/* 关闭按钮 (完成时显示) */}
          {status !== 'running' && (
            <div className="flex justify-center pt-4">
              <Button onClick={onClose} variant="default">
                关闭
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
