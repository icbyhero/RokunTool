import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Textarea } from '../ui/Textarea'
import { X, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface DictionaryEditorProps {
  filename: string
  initialContent: string
  wordCount: number
  onSave: (content: string) => Promise<boolean>
  onCancel: () => void
}

export function DictionaryEditor({
  filename,
  initialContent,
  wordCount,
  onSave,
  onCancel
}: DictionaryEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 计算当前词条数
  const currentWordCount = content.split('\n').filter(line => line.trim()).length

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const success = await onSave(content)
      if (success) {
        setIsDirty(false)
        setSaveMessage({
          type: 'success',
          text: `保存成功! 共 ${currentWordCount} 个词条`
        })
      } else {
        setSaveMessage({
          type: 'error',
          text: '保存失败'
        })
      }
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: '保存失败: ' + (error as Error).message
      })
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  const handleReset = () => {
    if (isDirty) {
      const confirmed = window.confirm('确定要放弃所有修改吗?')
      if (confirmed) {
        setContent(initialContent)
        setIsDirty(false)
      }
    } else {
      onCancel()
    }
  }

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape' && !isDirty) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [content, isDirty, handleSave, onCancel])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[85vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>编辑词库</span>
              <span className="text-sm font-normal text-gray-600">{filename}</span>
              {isDirty && (
                <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                  未保存
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {saveMessage && (
                <div className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
                  saveMessage.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {saveMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{saveMessage.text}</span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                词条数: {currentWordCount.toLocaleString()}
              </div>
              <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
                取消
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                保存
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-4">
          <div className="h-full">
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setIsDirty(e.target.value !== initialContent)
              }}
              className="w-full h-full font-mono text-sm resize-none"
              placeholder="每行一个词条，格式：词条 权重&#10;示例：&#10;中国 100&#10;中国人民 99"
              spellCheck={false}
            />
          </div>
        </CardContent>

        <div className="border-t px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              格式说明: 每行一个词条，使用空格分隔词条和权重
            </div>
            <div>
              Ctrl+S: 保存 | ESC: 取消
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
