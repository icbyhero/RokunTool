import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'
import {
  Search,
  Download,
  Upload,
  Trash2,
  FileText,
  RefreshCw,
  AlertCircle,
  Plus
} from 'lucide-react'

interface DictionaryFile {
  name: string
  path: string
  size: number
  wordCount: number
  modifiedAt: Date
}

interface DictionaryListProps {
  onImport: () => void
  onEdit: (filename: string) => void
}

export function DictionaryList({ onImport, onEdit }: DictionaryListProps) {
  const [dictionaries, setDictionaries] = useState<DictionaryFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDictionaries()
  }, [])

  const loadDictionaries = async () => {
    try {
      setLoading(true)
      setError(null)

      // 通过Rime插件获取词库列表
      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'getDictionaries',
        args: []
      })

      if (result.success && result.data) {
        setDictionaries(result.data.dictionaries || [])
      } else {
        setError(result.error || '加载词库列表失败')
      }
    } catch (error) {
      setError('加载词库列表失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (filename: string) => {
    try {
      setError(null)
      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'exportDictionary',
        args: [{ filename }]
      })

      if (result.success) {
        alert('导出成功')
      } else {
        setError(result.error || '导出失败')
      }
    } catch (error) {
      setError('导出失败: ' + (error as Error).message)
    }
  }

  const handleDelete = async (filename: string) => {
    const confirmed = window.confirm(`确定要删除词库 "${filename}" 吗？此操作不可恢复。`)
    if (!confirmed) return

    try {
      setError(null)
      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'deleteDictionary',
        args: [{ filename }]
      })

      if (result.success) {
        await loadDictionaries()
      } else {
        setError(result.error || '删除失败')
      }
    } catch (error) {
      setError('删除失败: ' + (error as Error).message)
    }
  }

  const filteredDictionaries = dictionaries.filter(dict =>
    dict.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索词库..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadDictionaries}>
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
          <Button size="sm" onClick={onImport}>
            <Plus className="w-4 h-4 mr-1" />
            导入词库
          </Button>
        </div>
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

      {/* 词库列表 */}
      {filteredDictionaries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">暂无词库</p>
              <p className="text-sm mt-2">点击"导入词库"按钮添加您的第一个词库</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDictionaries.map((dict) => (
            <Card key={dict.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      {dict.name}
                    </CardTitle>
                    <CardDescription>
                      词条数: {dict.wordCount.toLocaleString()} | 大小: {(dict.size / 1024).toFixed(2)} KB |
                      修改时间: {new Date(dict.modifiedAt).toLocaleString('zh-CN')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(dict.name)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(dict.name)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      导出
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(dict.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
