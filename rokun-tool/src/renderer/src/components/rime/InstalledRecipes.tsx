/**
 * 已安装配方管理组件
 *
 * 显示已安装的配方列表,支持更新、卸载操作
 */

import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '../ui/Badge'
import {
  RefreshCw,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Package,
  Calendar,
  HardDrive
} from 'lucide-react'

export interface PlumRecipe {
  id: string
  name: string
  description: string
  recipe: string
  installed: boolean
  version?: string
  size?: string
  installedAt?: Date
}

interface InstalledRecipesProps {
  onDeployNeeded?: () => void
}

export function InstalledRecipes({ onDeployNeeded }: InstalledRecipesProps) {
  const [recipes, setRecipes] = useState<PlumRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [operatingRecipe, setOperatingRecipe] = useState<string | null>(null)

  useEffect(() => {
    loadInstalledRecipes()
  }, [])

  const loadInstalledRecipes = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'getRecipes',
        args: []
      })

      if (result.success && result.data) {
        // 只显示已安装的配方
        const installedRecipes = result.data.recipes.filter((r: PlumRecipe) => r.installed)
        setRecipes(installedRecipes)
      } else {
        setError(result.error || '加载已安装配方失败')
      }
    } catch (error) {
      setError('加载已安装配方失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (recipe: string, _recipeName: string) => {
    try {
      setOperatingRecipe(recipe)
      setError(null)

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'updateRecipe',
        args: [{ recipe }]
      })

      if (result.success) {
        await loadInstalledRecipes()
        // 更新成功后,提示用户需要部署
        if (onDeployNeeded) {
          onDeployNeeded()
        }
      } else {
        setError(result.error || '更新配方失败')
      }
    } catch (error) {
      setError('更新配方失败: ' + (error as Error).message)
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
        await loadInstalledRecipes()
        // 卸载成功后,提示用户需要部署
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>加载已安装配方...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">已安装配方</h2>
          <p className="text-gray-600 mt-1">管理已安装的 Plum 配方</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadInstalledRecipes} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

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

      {/* 已安装配方列表 */}
      {recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Package className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">暂无已安装配方</p>
              <p className="text-sm mt-2">前往"配方市场"安装您需要的配方</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 统计信息 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">已安装 {recipes.length} 个配方</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 配方卡片列表 */}
          <div className="grid gap-4">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="border-green-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-500" />
                        {recipe.name}
                        <Badge variant="success" className="ml-2">
                          <Check className="w-3 h-3 mr-1" />
                          已安装
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">{recipe.description}</CardDescription>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <span>配方: <code className="px-2 py-0.5 bg-gray-100 rounded text-xs">{recipe.recipe}</code></span>
                        {recipe.version && <span>版本: {recipe.version}</span>}
                        {recipe.size && (
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {recipe.size}
                          </span>
                        )}
                        {recipe.installedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(recipe.installedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {operatingRecipe === recipe.recipe ? (
                        <Button size="sm" disabled>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          处理中
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdate(recipe.recipe, recipe.name)}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            更新
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUninstall(recipe.recipe, recipe.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
