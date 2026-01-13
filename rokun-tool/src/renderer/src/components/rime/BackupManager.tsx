import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import type { BackupInfo } from '../../types/rime'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../ui/AlertDialog'
import {
  Archive,
  RefreshCw,
  Trash2,
  Star,
  StarOff,
  Download,
  AlertCircle,
  Loader2,
  HardDrive,
  Calendar
} from 'lucide-react'

interface BackupManagerProps {
  onCreateBackup?: (description: string, isPermanent: boolean) => Promise<boolean>
  onRestoreBackup?: (backupId: string) => Promise<boolean>
  onDeleteBackup?: (backupId: string) => Promise<boolean>
  onTogglePermanent?: (backupId: string) => Promise<boolean>
}

export function BackupManager({
  onCreateBackup: _onCreateBackup,
  onRestoreBackup: _onRestoreBackup,
  onDeleteBackup: _onDeleteBackup,
  onTogglePermanent: _onTogglePermanent
}: BackupManagerProps): React.JSX.Element {
  // 预留的回调函数参数,未来扩展使用
  void _onCreateBackup
  void _onRestoreBackup
  void _onDeleteBackup
  void _onTogglePermanent
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [operatingBackup, setOperatingBackup] = useState<string | null>(null)

  // 创建备份对话框状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newBackupDescription, setNewBackupDescription] = useState('')
  const [newBackupPermanent, setNewBackupPermanent] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)

  // 恢复确认对话框状态
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
  const [restoreBackupId, setRestoreBackupId] = useState<string | null>(null)

  // 删除确认对话框状态
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteBackupId, setDeleteBackupId] = useState<string | null>(null)

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'getBackupList',
        args: []
      })

      if (result.success && result.data) {
        setBackups(result.data.backups || [])
      } else {
        setError(result.error || '加载备份列表失败')
      }
    } catch (error) {
      setError('加载备份列表失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async (): Promise<void> => {
    if (!newBackupDescription.trim()) {
      setError('请输入备份描述')
      return
    }

    try {
      setCreatingBackup(true)
      setError(null)

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'createBackup',
        args: [newBackupDescription, newBackupPermanent]
      })

      if (result.success) {
        setCreateDialogOpen(false)
        setNewBackupDescription('')
        setNewBackupPermanent(false)
        await loadBackups()
      } else {
        setError(result.error || '创建备份失败')
      }
    } catch (error) {
      setError('创建备份失败: ' + (error as Error).message)
    } finally {
      setCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async (backupId: string): Promise<void> => {
    try {
      setOperatingBackup(backupId)
      setError(null)

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'restoreBackup',
        args: [backupId]
      })

      if (result.success) {
        await loadBackups()
        setRestoreConfirmOpen(false)
        setRestoreBackupId(null)
      } else {
        setError(result.error || '恢复备份失败')
      }
    } catch (error) {
      setError('恢复备份失败: ' + (error as Error).message)
    } finally {
      setOperatingBackup(null)
    }
  }

  const handleDeleteBackup = async (backupId: string): Promise<void> => {
    try {
      setOperatingBackup(backupId)
      setError(null)

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'deleteBackup',
        args: [backupId]
      })

      if (result.success) {
        await loadBackups()
        setDeleteConfirmOpen(false)
        setDeleteBackupId(null)
      } else {
        setError(result.error || '删除备份失败')
      }
    } catch (error) {
      setError('删除备份失败: ' + (error as Error).message)
    } finally {
      setOperatingBackup(null)
    }
  }

  const handleTogglePermanent = async (backupId: string): Promise<void> => {
    try {
      setOperatingBackup(backupId)
      setError(null)

      const result = await window.electronAPI.plugin.callMethod({
        pluginId: 'rokun-rime-config',
        method: 'togglePermanent',
        args: [backupId]
      })

      if (result.success) {
        await loadBackups()
      } else {
        setError(result.error || '切换长期备份标记失败')
      }
    } catch (error) {
      setError('切换长期备份标记失败: ' + (error as Error).message)
    } finally {
      setOperatingBackup(null)
    }
  }

  // 格式化备份大小
  const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  // 格式化时间戳
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>加载备份列表...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold">配置备份</h2>
          <Badge variant="secondary">{backups.length} 个备份</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Archive className="w-4 h-4 mr-1" />
            创建备份
          </Button>
          <Button variant="outline" size="sm" onClick={loadBackups} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            刷新
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

      {/* 备份列表 */}
      {backups.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <Archive className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">暂无备份</p>
              <p className="text-sm mt-2">点击"创建备份"按钮创建第一个配置备份</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {backups.map((backup) => (
            <Card
              key={backup.backupId}
              className={backup.isPermanent ? 'border-yellow-200 bg-yellow-50' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Archive
                      className={`w-5 h-5 mt-0.5 ${backup.isPermanent ? 'text-yellow-600' : 'text-gray-600'}`}
                    />
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {backup.backupId}
                        {backup.isPermanent && (
                          <Badge variant="secondary" className="ml-2">
                            <Star className="w-3 h-3 mr-1" />
                            长期保存
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">{backup.description}</CardDescription>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(backup.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-4 h-4" />
                          {formatSize(backup.size)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {operatingBackup === backup.backupId ? (
                      <Button size="sm" disabled>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        处理中
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRestoreBackupId(backup.backupId)
                            setRestoreConfirmOpen(true)
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          恢复
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePermanent(backup.backupId)}
                          title={backup.isPermanent ? '取消长期保存' : '设为长期保存'}
                        >
                          {backup.isPermanent ? (
                            <StarOff className="w-4 h-4" />
                          ) : (
                            <Star className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeleteBackupId(backup.backupId)
                            setDeleteConfirmOpen(true)
                          }}
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
      )}

      {/* 创建备份对话框 */}
      <AlertDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>创建配置备份</AlertDialogTitle>
            <AlertDialogDescription>创建当前配置的完整备份,用于后续恢复</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">备份描述</label>
              <Input
                placeholder="例如: 配置快照 - 2026年1月13日"
                value={newBackupDescription}
                onChange={(e) => setNewBackupDescription(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="permanent"
                checked={newBackupPermanent}
                onChange={(e) => setNewBackupPermanent(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="permanent" className="text-sm">
                标记为长期保存 (不会被自动清理)
              </label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creatingBackup}>取消</AlertDialogCancel>
            <Button
              onClick={handleCreateBackup}
              disabled={creatingBackup || !newBackupDescription.trim()}
            >
              {creatingBackup && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              创建
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 恢复确认对话框 */}
      <AlertDialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认恢复备份</AlertDialogTitle>
            <AlertDialogDescription>
              恢复此备份将:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>自动创建当前配置的备份</li>
                <li>替换当前所有配置文件</li>
                <li>重新部署 Rime</li>
              </ul>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">⚠️ 此操作不可撤销,请确认要继续吗?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={operatingBackup !== null}>取消</AlertDialogCancel>
            <Button
              variant="default"
              onClick={() => restoreBackupId && handleRestoreBackup(restoreBackupId)}
              disabled={operatingBackup !== null}
            >
              {operatingBackup && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确认恢复
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除备份</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>确定要删除此备份吗?</p>
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">⚠️ 此操作不可撤销,备份将被永久删除!</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={operatingBackup !== null}>取消</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => deleteBackupId && handleDeleteBackup(deleteBackupId)}
              disabled={operatingBackup !== null}
            >
              {operatingBackup && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确认删除
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
