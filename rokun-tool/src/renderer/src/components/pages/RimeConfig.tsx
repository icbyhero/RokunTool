import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs'
import { PlumRecipeManager } from '../rime/PlumRecipeManager'
import { InstalledRecipes } from '../rime/InstalledRecipes'
import {
  Upload,
  FileText,
  Check,
  X,
  RefreshCw,
  AlertCircle
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

export function RimeConfig() {
  const [activeTab, setActiveTab] = useState('recipes')
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [configFiles, setConfigFiles] = useState<ConfigFile[]>([])
  const [loading, setLoading] = useState(true)
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    checkRimeStatus()

    // 监听部署请求事件
    const handleDeployRequest = () => {
      deployRime()
    }

    window.addEventListener('rime-deploy-request', handleDeployRequest)

    return () => {
      window.removeEventListener('rime-deploy-request', handleDeployRequest)
    }
  }, [])

  const checkRimeStatus = async () => {
    try {
      // 检查插件是否存在
      const result = await window.electronAPI.plugin.get({ pluginId: 'rokun-rime-config' })
      if (result.plugin) {
        setIsInstalled(true)
        setLoading(false) // ✅ 设置加载完成
        // 实际加载方案和配置文件
        await loadSchemes()
        await loadConfigFiles()
      } else {
        setIsInstalled(false)
        setError('Rime 插件未找到')
        setLoading(false)
      }
    } catch (error) {
      console.error('检查 Rime 状态失败:', error)
      setIsInstalled(false)
      setError('Rime 插件未找到: ' + (error as Error).message)
      setLoading(false)
    }
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
        setSchemes([])
      }
    } catch (error) {
      console.error('加载方案失败:', error)
      setError('加载方案失败: ' + (error as Error).message)
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
      setError('加载配置文件失败: ' + (error as Error).message)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!isInstalled) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Rime 未安装</h2>
        <p className="text-gray-600 mb-4">请先安装 Rime 输入法后再使用此功能</p>
        <Button onClick={checkRimeStatus}>重新检测</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rime 配置管理</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">可视化管理 Rime 输入法配置、方案和词库</span>
        </div>
        <Button onClick={deployRime} disabled={deploying}>
          <RefreshCw className={`w-4 h-4 mr-2 ${deploying ? 'animate-spin' : ''}`} />
          {deploying ? '部署中...' : '部署 Rime'}
        </Button>
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
