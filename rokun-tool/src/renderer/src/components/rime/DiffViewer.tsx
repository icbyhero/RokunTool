import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { X, RotateCcw } from 'lucide-react'
import Diff2html from 'diff2html'

interface DiffViewerProps {
  originalContent: string
  modifiedContent: string
  filename: string
  onRestore: () => void
  onClose: () => void
}

export function DiffViewer({
  originalContent,
  modifiedContent,
  filename,
  onRestore,
  onClose
}: DiffViewerProps) {
  const [diffHtml, setDiffHtml] = useState<string>('')
  const [viewMode, setViewMode] = useState<'line-by-line' | 'side-by-side'>('side-by-side')

  useEffect(() => {
    // 生成diff HTML
    const diff = Diff2html.html(originalContent, modifiedContent, {
      drawFileList: false,
      matching: 'lines',
      outputFormat: viewMode === 'side-by-side' ? 'side-by-side' : 'line-by-line'
    })
    setDiffHtml(diff)
  }, [originalContent, modifiedContent, viewMode])

  const handleRestore = () => {
    const confirmed = window.confirm(`确定要恢复到原始版本吗?当前修改将丢失。`)
    if (confirmed) {
      onRestore()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[85vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>配置文件对比</span>
              <span className="text-sm font-normal text-gray-600">{filename}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'side-by-side' ? 'line-by-line' : 'side-by-side')}
              >
                {viewMode === 'side-by-side' ? '行内视图' : '并排视图'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRestore}>
                <RotateCcw className="w-4 h-4 mr-1" />
                恢复到原始版本
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-0">
          <div
            className="diff-container"
            dangerouslySetInnerHTML={{ __html: diffHtml }}
            style={{
              fontSize: '13px',
              fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, source-code-pro, monospace'
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
