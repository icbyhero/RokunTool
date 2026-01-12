import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Switch } from '../ui/Switch'
import { Label } from '../ui/Label'
import { useUIStore } from '../../store/uiStore'
import { Moon, Sun, Save } from 'lucide-react'

export function Settings() {
  const { theme, toggleTheme, addToast } = useUIStore()

  const handleSaveSettings = () => {
    addToast('设置已保存', 'success')
  }

  const handleResetSettings = () => {
    localStorage.removeItem('theme')
    localStorage.removeItem('settings')
    addToast('设置已重置', 'info')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">设置</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">配置应用偏好设置</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>外观设置</CardTitle>
            <CardDescription>自定义应用的外观</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme-toggle">深色模式</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">切换深色和浅色主题</p>
              </div>
              <div className="flex items-center space-x-2">
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <Switch
                  id="theme-toggle"
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>插件设置</CardTitle>
            <CardDescription>配置插件相关选项</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-enable">自动启用插件</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">安装插件后自动启用</p>
              </div>
              <Switch
                id="auto-enable"
                defaultChecked={false}
                onCheckedChange={(checked) => {
                  addToast(checked ? '已启用自动启用' : '已禁用自动启用', 'info')
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="check-updates">自动检查更新</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">定期检查插件更新</p>
              </div>
              <Switch
                id="check-updates"
                defaultChecked={true}
                onCheckedChange={(checked) => {
                  addToast(checked ? '已启用自动检查更新' : '已禁用自动检查更新', 'info')
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>通知设置</CardTitle>
            <CardDescription>配置通知和提醒</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-notifications">启用通知</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">接收系统通知</p>
              </div>
              <Switch
                id="enable-notifications"
                defaultChecked={true}
                onCheckedChange={(checked) => {
                  addToast(checked ? '已启用通知' : '已禁用通知', 'info')
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-effects">音效</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">播放通知音效</p>
              </div>
              <Switch
                id="sound-effects"
                defaultChecked={false}
                onCheckedChange={(checked) => {
                  addToast(checked ? '已启用音效' : '已禁用音效', 'info')
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>数据管理</CardTitle>
            <CardDescription>管理应用数据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>清除缓存</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">清除临时文件和缓存</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  addToast('缓存已清除', 'success')
                }}
              >
                清除缓存
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>重置设置</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">恢复默认设置</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetSettings}>
                重置
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleResetSettings}>
          恢复默认
        </Button>
        <Button onClick={handleSaveSettings}>
          <Save className="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>
    </div>
  )
}
