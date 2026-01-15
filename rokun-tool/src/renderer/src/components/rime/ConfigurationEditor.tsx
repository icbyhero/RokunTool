import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { X, Save, RotateCcw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import YAML from 'js-yaml'

// 懒加载Monaco Editor以减少初始加载时间
const MonacoEditor = lazy(() => import('@monaco-editor/react'))

interface ValidationError {
  line: number
  column: number
  message: string
}

interface ConfigurationEditorProps {
  filename: string
  initialContent: string
  onSave: (content: string) => Promise<boolean>
  onCancel: () => void
}

export function ConfigurationEditor({
  filename,
  initialContent,
  onSave,
  onCancel
}: ConfigurationEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 实时验证YAML内容
  const validateYAML = useCallback((yamlContent: string) => {
    try {
      YAML.load(yamlContent)
      setErrors([])
      setIsValid(true)
      return true
    } catch (error) {
      if (error instanceof YAML.YAMLException) {
        const mark = error.mark
        setErrors([
          {
            line: mark.line + 1,
            column: mark.column + 1,
            message: error.message
          }
        ])
        setIsValid(false)
      } else {
        setErrors([
          {
            line: 0,
            column: 0,
            message: '未知错误: ' + (error as Error).message
          }
        ])
        setIsValid(false)
      }
      return false
    }
  }, [])

  // 格式化YAML内容
  const formatYAML = useCallback(() => {
    try {
      const parsed = YAML.load(content)
      const formatted = YAML.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      })
      setContent(formatted)
      validateYAML(formatted)
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: '格式化失败: ' + (error as Error).message
      })
    }
  }, [content, validateYAML])

  // 处理内容变化
  const handleEditorChange = useCallback((value: string | undefined) => {
    const newContent = value || ''
    setContent(newContent)
    setIsDirty(newContent !== initialContent)
    validateYAML(newContent)
  }, [initialContent, validateYAML])

  // 保存配置
  const handleSave = async () => {
    if (!isValid) {
      setSaveMessage({
        type: 'error',
        text: '请先修复YAML语法错误'
      })
      return
    }

    setIsSaving(true)
    try {
      const success = await onSave(content)
      if (success) {
        setIsDirty(false)
        setSaveMessage({
          type: 'success',
          text: '保存成功'
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
      // 3秒后清除消息
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  // 重置内容
  const handleReset = () => {
    if (isDirty) {
      const confirmed = window.confirm('确定要放弃所有修改吗?')
      if (confirmed) {
        setContent(initialContent)
        setIsDirty(false)
        setErrors([])
        setIsValid(true)
      }
    } else {
      onCancel()
    }
  }

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      // Ctrl/Cmd + Shift + F: 格式化
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        formatYAML()
      }
      // Escape: 取消(如果未保存)
      if (e.key === 'Escape' && !isDirty) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, formatYAML, isDirty, onCancel])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[85vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>编辑配置文件</span>
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
              <Button variant="outline" size="sm" onClick={formatYAML}>
                <RotateCcw className="w-4 h-4 mr-1" />
                格式化
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
                取消
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!isValid || isSaving || !isDirty}>
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

          {/* 状态栏 */}
          <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-1 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                {isValid ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {isValid ? '语法正确' : '语法错误'}
              </span>
              {errors.length > 0 && (
                <span className="text-red-600">
                  第 {errors[0].line} 行,第 {errors[0].column} 列: {errors[0].message}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Ctrl+S: 保存 | Ctrl+Shift+F: 格式化 | ESC: 取消
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <Suspense fallback={<div className="flex items-center justify-center h-full">加载编辑器...</div>}>
            <MonacoEditor
              height="100%"
              language="yaml"
              value={content}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
              }}
              beforeMount={(monaco) => {
                // 配置YAML语言支持
                monaco.languages.registerCompletionItemProvider('yaml', {
                  provideCompletionItems: () => {
                    const suggestions = [
                      {
                        label: 'schema_list',
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: 'schema_list:\n  - schema: ',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '输入方案列表',
                        documentation: '定义启用的输入方案列表'
                      },
                      {
                        label: 'switcher',
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: 'switcher:\n  hotkeys:\n    - F4\n  fold_options: true\n  option_menu_separator: " ["',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '方案切换器',
                        documentation: '配置输入方案切换相关选项'
                      },
                      {
                        label: 'menu',
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: 'menu:\n  page_size: 5',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: '候选菜单',
                        documentation: '配置候选词菜单相关选项'
                      }
                    ]
                    return { suggestions }
                  }
                })
              }}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
