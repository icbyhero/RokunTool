import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { InstallProgress } from './InstallProgress'
import type { RecipeCategory, PlumRecipe } from '../../types/rime'
import { RECIPE_CATEGORIES } from '../../types/rime'
import {
  Search,
  Download,
  RefreshCw,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Package,
  Rocket,
  Settings,
  Book,
  Keyboard,
  Globe,
  Edit,
  Smile,
  Wrench
} from 'lucide-react'

// 图标映射
const ICON_MAP: Record<RecipeCategory, React.ComponentType<{ className?: string }>> = {
  basic: Settings,
  vocabulary: Book,
  input_method: Keyboard,
  double_pinyin: Keyboard,
  dialect: Globe,
  stroke: Edit,
  symbol: Smile,
  tool: Wrench
}

interface PlumRecipeManagerProps {
  onInstall?: (recipe: string) => Promise<boolean>
  onUpdate?: (recipe: string) => Promise<boolean>
  onUninstall?: (recipe: string) => Promise<boolean>
  onDeployNeeded?: () => void  // 新增: 需要部署的回调
}

export function PlumRecipeManager({
  onInstall,
  onUpdate,
  onUninstall,
  onDeployNeeded
}: PlumRecipeManagerProps) {
  // 预留的回调函数参数,未来扩展使用
  void onInstall
  void onUpdate
  void onUninstall
  const [recipes, setRecipes] = useState<PlumRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'all'>('all') // 新增: 选中的分类
  const [error, setError] = useState<string | null>(null)
  const [operatingRecipe, setOperatingRecipe] = useState<string | null>(null)
  const [deployNeeded, setDeployNeeded] = useState(false)  // 新增: 是否需要部署
  const [installProgress, setInstallProgress] = useState<{
    operation: 'install' | 'update' | 'uninstall'
    recipeName: string
  } | null>(null)  // 新增: 安装进度状态
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set())  // 新增: 批量选中的配方
  const [batchOperating, setBatchOperating] = useState(false)  // 新增: 批量操作进行中

  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'getRecipes',
        args: []
      })

      if (result.success && result.data) {
        setRecipes(result.data.recipes || [])
      } else {
        setError(result.error || '加载配方列表失败')
      }
    } catch (error) {
      console.error('[PlumRecipeManager] loadRecipes error:', error)
      setError('加载配方列表失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleInstall = async (recipe: string, recipeName: string) => {
    try {
      setOperatingRecipe(recipe)
      setError(null)
      setInstallProgress({ operation: 'install', recipeName })

      // 调用插件方法安装配方
      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'installRecipe',
        args: [{ recipe }]
      })

      if (result.success) {
        await loadRecipes()
        // 安装成功后,提示用户需要部署
        setDeployNeeded(true)
        // 通知父组件
        if (onDeployNeeded) {
          onDeployNeeded()
        }
        // 延迟关闭进度显示
        setTimeout(() => setInstallProgress(null), 2000)
      } else {
        setError(result.error || '安装配方失败')
        setInstallProgress(null)
      }
    } catch (error) {
      setError('安装配方失败: ' + (error as Error).message)
      setInstallProgress(null)
    } finally {
      setOperatingRecipe(null)
    }
  }

  const handleUpdate = async (recipe: string, recipeName: string) => {
    try {
      setOperatingRecipe(recipe)
      setError(null)
      setInstallProgress({ operation: 'update', recipeName })

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'updateRecipe',
        args: [{ recipe }]
      })

      if (result.success) {
        await loadRecipes()
        // 更新成功后,提示用户需要部署
        setDeployNeeded(true)
        // 通知父组件
        if (onDeployNeeded) {
          onDeployNeeded()
        }
        // 延迟关闭进度显示
        setTimeout(() => setInstallProgress(null), 2000)
      } else {
        setError(result.error || '更新配方失败')
        setInstallProgress(null)
      }
    } catch (error) {
      setError('更新配方失败: ' + (error as Error).message)
      setInstallProgress(null)
    } finally {
      setOperatingRecipe(null)
    }
  }

  const handleUninstall = async (recipe: string, name: string) => {
    const confirmed = window.confirm(`确定要卸载配方 "${name}" 吗？`)
    if (!confirmed) return

    try {
      setOperatingRecipe(recipe)
      setError(null)

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'uninstallRecipe',
        args: [{ recipe }]
      })

      if (result.success) {
        await loadRecipes()
        // 卸载成功后,提示用户需要部署
        setDeployNeeded(true)
        // 通知父组件
        if (onDeployNeeded) {
          onDeployNeeded()
        }
      } else {
        setError(result.error || '卸载配方失败')
      }
    } catch (error) {
      setError('卸载配方失败: ' + (error as Error).message)
    } finally {
      setOperatingRecipe(null)
    }
  }

  // 批量操作辅助函数
  const toggleRecipeSelection = (recipe: string) => {
    setSelectedRecipes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(recipe)) {
        newSet.delete(recipe)
      } else {
        newSet.add(recipe)
      }
      return newSet
    })
  }

  const selectAllVisible = () => {
    const visibleRecipes = filteredRecipes.map(r => r.recipe)
    setSelectedRecipes(new Set(visibleRecipes))
  }

  const clearSelection = () => {
    setSelectedRecipes(new Set())
  }

  const handleBatchInstall = async () => {
    if (selectedRecipes.size === 0) return

    setBatchOperating(true)
    setError(null)

    try {
      for (const recipe of selectedRecipes) {
        const recipeData = recipes.find(r => r.recipe === recipe)
        if (recipeData && !recipeData.installed) {
          await handleInstall(recipe, recipeData.name)
          // 等待一下再进行下一个
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      clearSelection()
    } catch (error) {
      setError('批量安装失败: ' + (error as Error).message)
    } finally {
      setBatchOperating(false)
    }
  }

  const handleBatchUpdate = async () => {
    if (selectedRecipes.size === 0) return

    setBatchOperating(true)
    setError(null)

    try {
      for (const recipe of selectedRecipes) {
        const recipeData = recipes.find(r => r.recipe === recipe)
        if (recipeData && recipeData.installed) {
          await handleUpdate(recipe, recipeData.name)
          // 等待一下再进行下一个
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      clearSelection()
    } catch (error) {
      setError('批量更新失败: ' + (error as Error).message)
    } finally {
      setBatchOperating(false)
    }
  }

  const filteredRecipes = recipes.filter((recipe) => {
    // 分类筛选
    if (selectedCategory !== 'all' && recipe.category !== selectedCategory) {
      return false
    }

    // 搜索筛选
    const searchLower = searchQuery.toLowerCase()
    return (
      recipe.name.toLowerCase().includes(searchLower) ||
      recipe.description.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>加载配方列表...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 分类标签页 */}
      <div className="flex items-center gap-2 flex-wrap border-b pb-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          全部配方
          <Badge variant="secondary" className="ml-1">
            {recipes.length}
          </Badge>
        </Button>
        {Object.values(RECIPE_CATEGORIES).map((category) => {
          const IconComponent = ICON_MAP[category.id]
          const count = recipes.filter(r => r.category === category.id).length
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
              title={category.description}
            >
              <IconComponent className="w-4 h-4" />
              {category.name}
              <Badge variant="secondary" className="ml-1">
                {count}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索配方..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedRecipes.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={selectAllVisible}>
                全选可见
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                清空选择
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleBatchInstall}
                disabled={batchOperating}
              >
                <Download className="w-4 h-4 mr-1" />
                批量安装 ({selectedRecipes.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchUpdate}
                disabled={batchOperating}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                批量更新 ({selectedRecipes.size})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={loadRecipes} disabled={loading || batchOperating}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 部署提示 */}
      {deployNeeded && !installProgress && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-blue-900">配置已更改</p>
                  <p className="text-sm text-blue-700">配方已安装/更新,需要部署 Rime 才能生效</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setDeployNeeded(false)
                  // 触发父组件的部署方法
                  window.dispatchEvent(new CustomEvent('rime-deploy-request'))
                }}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                立即部署
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误提示 */}
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

      {/* 安装进度 */}
      {installProgress && (
        <InstallProgress
          operation={installProgress.operation}
          recipeName={installProgress.recipeName}
          onComplete={() => setInstallProgress(null)}
        />
      )}

      {/* 配方列表 */}
      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <Package className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">暂无配方</p>
              <p className="text-sm mt-2">
                {searchQuery
                  ? '尝试其他搜索关键词'
                  : selectedCategory !== 'all'
                  ? `该分类下暂无配方`
                  : '配方列表为空'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className={recipe.installed ? 'border-green-200' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedRecipes.has(recipe.recipe)}
                      onChange={() => toggleRecipeSelection(recipe.recipe)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {/* 分类图标 */}
                        {(() => {
                          const CategoryIcon = ICON_MAP[recipe.category]
                          return <CategoryIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        })()}
                        {recipe.name}
                        {/* 分类标签 */}
                        <Badge variant="outline" className="text-xs">
                          {RECIPE_CATEGORIES[recipe.category].name}
                        </Badge>
                        {recipe.installed && (
                          <Badge variant="success" className="ml-2">
                            <Check className="w-3 h-3 mr-1" />
                            已安装
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">{recipe.description}</CardDescription>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <span>配方: <code className="px-2 py-0.5 bg-gray-100 rounded text-xs">{recipe.recipe}</code></span>
                        {recipe.version && <span>版本: {recipe.version}</span>}
                        {recipe.size && <span>大小: {recipe.size}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {operatingRecipe === recipe.recipe ? (
                      <Button size="sm" disabled>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        处理中
                      </Button>
                    ) : recipe.installed ? (
                      <>
                        {/* 只有可更新的配方才显示更新按钮 */}
                        {recipe.updatable !== false && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdate(recipe.recipe, recipe.name)}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            更新
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUninstall(recipe.recipe, recipe.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    ) : recipe.recipe ? (
                      /* 只有非本地配方才显示安装按钮 */
                      <Button size="sm" onClick={() => handleInstall(recipe.recipe, recipe.name)}>
                        <Download className="w-4 h-4 mr-1" />
                        安装
                      </Button>
                    ) : (
                      /* 本地方案显示提示 */
                      <span className="text-xs text-gray-500 dark:text-gray-400">本地方案</span>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
