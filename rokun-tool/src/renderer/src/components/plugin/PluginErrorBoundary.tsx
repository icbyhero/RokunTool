import { Component, ReactNode, ErrorInfo } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface PluginErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface PluginErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class PluginErrorBoundary extends Component<
  PluginErrorBoundaryProps,
  PluginErrorBoundaryState
> {
  constructor(props: PluginErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<PluginErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PluginErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    const errorMessage = `
Plugin Error: ${error.message}
Component Stack: ${errorInfo.componentStack}
    `.trim()

    console.error(errorMessage)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  插件运行时错误
                </h3>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-red-700 dark:text-red-400 font-medium">
                    {this.state.error?.message || '未知错误'}
                  </p>
                </div>

                {import.meta.env.DEV && this.state.errorInfo && (
                  <details className="text-left mb-6">
                    <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2">
                      查看错误详情（仅开发模式）
                    </summary>
                    <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mt-2 text-xs overflow-auto max-h-60 text-left">
                      <code className="text-gray-900 dark:text-gray-100">
                        {this.state.errorInfo.componentStack}
                      </code>
                    </pre>
                  </details>
                )}

                <div className="flex gap-4 justify-center">
                  <Button onClick={this.handleRetry} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重试
                  </Button>
                  <Button onClick={() => window.location.reload()} variant="default">
                    刷新页面
                  </Button>
                </div>

                <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                  如果问题持续存在，请联系插件开发者或查看日志获取更多信息。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export function usePluginErrorHandler() {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('Plugin error:', error, errorInfo)
  }

  return {
    handleError
  }
}
