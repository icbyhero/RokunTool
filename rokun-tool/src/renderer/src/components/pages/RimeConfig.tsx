import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs'
import { ProgressDialog } from '../ui/ProgressDialog'
import { PlumRecipeManager } from '../rime/PlumRecipeManager'
import { InstalledRecipes } from '../rime/InstalledRecipes'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog'
import {
  Upload,
  FileText,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Bug,
  CheckCircle2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface Scheme {
  id: string
  file: string
  displayName: string
  enabled: boolean
}

interface ConfigFile {
  name: string
  path: string
  size: number
  modifiedAt: Date
  type: string
}

interface RimeInfo {
  version: string | null
  rimeDir: string | null
  detected: boolean
}

export function RimeConfig() {
  const [activeTab, setActiveTab] = useState('recipes')
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [configFiles, setConfigFiles] = useState<ConfigFile[]>([])
  const [loading, setLoading] = useState(true)
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [rimeInfo, setRimeInfo] = useState<RimeInfo>({
    version: null,
    rimeDir: null,
    detected: false
  })

  // 诊断对话框状态
  const [diagnosticDialog, setDiagnosticDialog] = useState({
    isOpen: false,
    data: null as any
  })

  // 进度对话框状态
  const [progressDialog, setProgressDialog] = useState({
    isOpen: false,
    title: '',
    currentStep: '',
    progress: 0,
    status: 'running' as 'running' | 'success' | 'error',
    error: '',
    logs: [] as string[]
  })

  const closeProgressDialog = () => {
    setProgressDialog(prev => ({ ...prev, isOpen: false }))
  }

  useEffect(() => {
    checkRimeStatus()

    // 监听操作进度事件
    const handleOperationProgress = (_event: any, data: any) => {
      if (data.pluginId === 'rokun-rime-config') {
        const progressPercent = data.totalSteps > 0
          ? (data.currentStep / data.totalSteps) * 100
          : 0

        // 只有在运行状态时才自动打开对话框
        // 完成后保持显示,等待用户手动关闭
        setProgressDialog(prev => ({
          isOpen: data.status === 'running' ? true : prev.isOpen,
          title: data.operation,
          currentStep: data.stepName,
          progress: progressPercent,
          status: data.status,
          error: data.error || '',
          logs: data.logs || []
        }))

        // 如果是部署操作成功,显示成功消息
        if (data.status === 'success' && data.operation.includes('部署')) {
          setSuccessMessage('Rime 部署成功')
          setTimeout(() => setSuccessMessage(null), 3000)
        }
      }
    }

    // 监听部署请求事件
    const handleDeployRequest = () => {
      deployRime()
    }

    window.electronAPI.plugin.onOperationProgress(handleOperationProgress)
    window.addEventListener('rime-deploy-request', handleDeployRequest)

    return () => {
      window.electronAPI.plugin.removeListener('plugin:operation-progress', handleOperationProgress)
      window.removeEventListener('rime-deploy-request', handleDeployRequest)
    }
  }, [])

  const checkRimeStatus = async () => {
    try {
      // 设置加载状态,提供视觉反馈
      setLoading(true)
      setError(null)

      // 检查插件是否存在
      const result = await window.electronAPI.plugin.get({ pluginId: 'rokun-rime-config' })

      if (result.plugin) {
        // 获取 Rime 安装状态
        const statusResult = await window.electronAPI.plugin.callMethod<{
          installed: boolean
          rimeDir: string | null
          version: string | null
        }>({
          pluginId: 'rokun-rime-config',
          method: 'getRimeStatus'
        })

        if (statusResult.success && statusResult.data) {
          const { installed, rimeDir, version } = statusResult.data

          setIsInstalled(installed)
          setRimeInfo({
            version,
            rimeDir,
            detected: installed
          })
          setLoading(false)

          // 如果已安装,加载方案和配置文件
          if (installed) {
            await loadSchemes()
            await loadConfigFiles()
          } else {
            setError('未检测到 Rime 输入法。请先安装 Rime,或点击"部署 Rime"按钮首次部署。')
          }
        } else {
          setIsInstalled(false)
          // 检查是否是权限错误
          const errorMsg = statusResult.error || '无法获取 Rime 状态'
          setError(formatPermissionError(errorMsg))
          setLoading(false)
        }
      } else {
        setIsInstalled(false)
        setError('Rime 插件未找到')
        setLoading(false)
      }
    } catch (error) {
      console.error('检查 Rime 状态失败:', error)
      setIsInstalled(false)
      const errorMsg = (error as Error).message
      setError(formatPermissionError(errorMsg))
      setLoading(false)
    }
  }

  // 格式化权限错误信息
  const formatPermissionError = (error: string): string => {
    // 检查是否包含权限相关的关键词
    const permissionKeywords = [
      'permission',
      'Permission',
      '权限',
      'unauthorized',
      'forbidden'
    ]

    const isPermissionError = permissionKeywords.some(keyword =>
      error.toLowerCase().includes(keyword.toLowerCase())
    )

    if (isPermissionError) {
      // 尝试提取具体的权限类型
      const permissionMatch = error.match(/(fs:write|process:exec|shell:execute|network:http|clipboard:read|clipboard:write)/)
      if (permissionMatch) {
        const permission = permissionMatch[1]
        return `权限不足：需要 ${permission} 权限。请在弹出的权限请求对话框中授予权限，或在设置中管理权限。`
      }

      return `权限不足：此操作需要特定权限。请在弹出的权限请求对话框中授予权限。`
    }

    return error
  }

  const loadSchemes = async () => {
    try {
      setError(null)
      // 调用插件方法获取方案列表
      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'getSchemes',
        args: []
      })

      if (result.success && result.data) {
        setSchemes(result.data)
      } else {
        // 使用权限错误格式化
        const errorMsg = result.error || '加载方案失败'
        setError(formatPermissionError(errorMsg))
        setSchemes([])
      }
    } catch (error) {
      console.error('加载方案失败:', error)
      const errorMsg = (error as Error).message
      setError(formatPermissionError(errorMsg))
      setSchemes([])
    }
  }

  const loadConfigFiles = async () => {
    try {
      setError(null)
      // TODO: 实现加载配置文件的逻辑
      setConfigFiles([])
    } catch (error) {
      console.error('加载配置文件失败:', error)
      const errorMsg = (error as Error).message
      setError(formatPermissionError(errorMsg))
      setConfigFiles([])
    }
  }

  const toggleScheme = async (_schemeId: string, enabled: boolean) => {
    try {
      setError(null)
      const result = enabled
        ? await window.electronAPI.plugin.enable({ pluginId: 'rokun-rime-config' })
        : await window.electronAPI.plugin.disable({ pluginId: 'rokun-rime-config' })
      if (result.success) {
        await loadSchemes()
      } else {
        setError(result.error || '切换方案失败')
      }
    } catch (error) {
      setError('切换方案失败')
    }
  }

  const deployRime = async () => {
    try {
      setDeploying(true)
      setError(null)
      setSuccessMessage(null)

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'deployRime',
        args: []
      })

      if (result.success) {
        setSuccessMessage('Rime 部署成功')
        // 3秒后自动隐藏成功消息
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(result.error || '部署失败')
      }
    } catch (error) {
      setError('部署失败: ' + (error as Error).message)
    } finally {
      setDeploying(false)
    }
  }

  const diagnoseRime = async () => {
    try {
      setError(null)

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'diagnoseRimeInstallation',
        args: []
      })

      if (result.success && result.data) {
        const diagnostic = result.data

        // 打开诊断对话框显示结果
        setDiagnosticDialog({
          isOpen: true,
          data: diagnostic
        })
      } else {
        setError('诊断失败: ' + (result.error || '未知错误'))
      }
    } catch (error) {
      console.error('诊断失败:', error)
      setError('诊断失败: ' + (error as Error).message)
    }
  }

  const closeDiagnosticDialog = () => {
    setDiagnosticDialog({ isOpen: false, data: null })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  if (!isInstalled) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-full p-8">
          <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Rime 未安装</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">请先安装 Rime 输入法后再使用此功能</p>
          <div className="flex gap-2">
            <Button onClick={checkRimeStatus}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重新检测
            </Button>
            <Button variant="default" onClick={deployRime}>
              <Upload className="w-4 h-4 mr-2" />
              部署 Rime
            </Button>
            <Button variant="outline" onClick={diagnoseRime}>
              <Bug className="w-4 h-4 mr-2" />
              诊断
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded max-w-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* 诊断对话框 - 即使未安装也显示 */}
        <Dialog open={diagnosticDialog.isOpen} onOpenChange={(open) => !open && closeDiagnosticDialog()}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rime 安装诊断</DialogTitle>
              <DialogDescription>查看 Rime 安装状态和问题诊断</DialogDescription>
            </DialogHeader>
            {diagnosticDialog.data && (
              <div className="space-y-4">
                {/* 状态概览 */}
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded">
                  {diagnosticDialog.data.installed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className="font-medium">
                    {diagnosticDialog.data.installed ? 'Rime 已安装' : 'Rime 未安装'}
                  </span>
                </div>

                {/* 基本信息 */}
                {diagnosticDialog.data.rimeDir && (
                  <div>
                    <h4 className="font-medium mb-2">基本信息</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Rime 目录:</span>
                        <span className="font-mono">{diagnosticDialog.data.rimeDir}</span>
                      </div>
                      {diagnosticDialog.data.version && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">版本:</span>
                          <span>{diagnosticDialog.data.version}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 错误信息 */}
                {diagnosticDialog.data.errors && diagnosticDialog.data.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">错误</h4>
                    <ul className="space-y-1 text-sm text-red-700">
                      {diagnosticDialog.data.errors.map((error: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 警告信息 */}
                {diagnosticDialog.data.warnings && diagnosticDialog.data.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-yellow-600 dark:text-yellow-400">警告</h4>
                    <ul className="space-y-1 text-sm text-yellow-700">
                      {diagnosticDialog.data.warnings.map((warning: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 详细信息 */}
                {diagnosticDialog.data.info && Object.keys(diagnosticDialog.data.info).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">详细信息</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(diagnosticDialog.data.info).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                          <span className="font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button onClick={closeDiagnosticDialog}>关闭</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* 进度对话框 */}
      <ProgressDialog
        isOpen={progressDialog.isOpen}
        title={progressDialog.title}
        currentStep={progressDialog.currentStep}
        progress={progressDialog.progress}
        status={progressDialog.status}
        error={progressDialog.error}
        logs={progressDialog.logs}
        onClose={closeProgressDialog}
      />

      {/* 诊断结果对话框 */}
      <Dialog open={diagnosticDialog.isOpen} onOpenChange={(open) => !open && closeDiagnosticDialog()}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rime 安装诊断</DialogTitle>
          </DialogHeader>

          {diagnosticDialog.data && (
            <div className="space-y-4">
              {/* 操作系统和 HOME 目录 */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">操作系统</h4>
                  <code className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                    {diagnosticDialog.data.platform}
                  </code>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">HOME 目录</h4>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {diagnosticDialog.data.home}
                  </code>
                </div>
              </div>

              {/* 检查的目录 */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">已检查的目录</h4>
                <ul className="text-xs space-y-1">
                  {diagnosticDialog.data.checkedDirs?.map((dir: string, index: number) => (
                    <li key={index} className="text-gray-600 dark:text-gray-400">
                      {index + 1}. {dir}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 找到的目录 */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  找到的目录 ({diagnosticDialog.data.foundDirs?.length || 0})
                </h4>
                {diagnosticDialog.data.foundDirs && diagnosticDialog.data.foundDirs.length > 0 ? (
                  <ul className="text-xs space-y-2">
                    {diagnosticDialog.data.foundDirs.map((dir: any, index: number) => (
                      <li key={index} className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-mono">{dir.path}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-red-600 dark:text-red-400">未找到 Rime 配置目录</p>
                )}
              </div>

              {/* 错误信息 */}
              {diagnosticDialog.data.errors && diagnosticDialog.data.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">错误信息</h4>
                  <ul className="text-xs space-y-1">
                    {diagnosticDialog.data.errors.map((error: any, index: number) => (
                      <li key={index} className="text-red-600 dark:text-red-400">
                        ❌ {error.dir}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end pt-4">
                <Button onClick={closeDiagnosticDialog}>关闭</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rime 配置管理</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">可视化管理 Rime 输入法配置、方案和词库</span>
              {rimeInfo.version && (
                <>
                  <span className="text-gray-300 dark:text-gray-600 dark:text-gray-400">|</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    版本: <span className="font-medium">{rimeInfo.version}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={deployRime} disabled={deploying}>
            <RefreshCw className={`w-4 h-4 mr-2 ${deploying ? 'animate-spin' : ''}`} />
            {deploying ? '部署中...' : '部署 Rime'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <Check className="w-5 h-5" />
              <span>{successMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recipes">配方市场</TabsTrigger>
          <TabsTrigger value="installed">已安装配方</TabsTrigger>
          <TabsTrigger value="schemes">输入方案</TabsTrigger>
          <TabsTrigger value="config">配置文件</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-4">
          <PlumRecipeManager onDeployNeeded={() => {
            // 配方操作完成后,可以在这里添加额外逻辑
            // 例如显示提示信息等
          }} />
        </TabsContent>

        <TabsContent value="installed" className="space-y-4">
          <InstalledRecipes onDeployNeeded={() => {
            // 配方操作完成后触发部署
            window.dispatchEvent(new CustomEvent('rime-deploy-request'))
          }} />
        </TabsContent>

        <TabsContent value="schemes" className="space-y-4">
          <div className="grid gap-4">
            {schemes.map((scheme) => (
              <Card key={scheme.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {scheme.displayName}
                        {scheme.enabled && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            已启用
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>ID: {scheme.id}</CardDescription>
                    </div>
                    <div>
                      {scheme.enabled ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleScheme(scheme.id, false)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          禁用
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => toggleScheme(scheme.id, true)}>
                          <Check className="w-4 h-4 mr-1" />
                          启用
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="grid gap-4">
            {configFiles.map((file) => (
              <Card key={file.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {file.name}
                      </CardTitle>
                      <CardDescription>
                        大小: {(file.size / 1024).toFixed(2)} KB | 修改时间:{' '}
                        {new Date(file.modifiedAt).toLocaleString('zh-CN')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-1" />
                        导出
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
