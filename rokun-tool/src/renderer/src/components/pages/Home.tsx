import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { usePluginStore } from '../../store/pluginStore'
import { useUIStore } from '../../store/uiStore'

export function Home() {
  const { plugins, loading, loadPlugins } = usePluginStore()
  const { theme } = useUIStore()

  useEffect(() => {
    loadPlugins()
  }, []) // 只在组件挂载时加载一次

  const stats = {
    total: plugins.length,
    enabled: plugins.filter((p) => p.enabled).length,
    disabled: plugins.filter((p) => !p.enabled).length,
    tools: plugins.filter((p) => p.type === 'tool').length,
    themes: plugins.filter((p) => p.type === 'theme').length,
    extensions: plugins.filter((p) => p.type === 'extension').length
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">欢迎使用 Rokun Tool</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">一个强大且灵活的插件管理系统</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总插件数"
          value={stats.total}
          description="已安装的所有插件"
          icon="📦"
          variant="default"
        />
        <StatCard
          title="已启用"
          value={stats.enabled}
          description="当前启用的插件"
          icon="✅"
          variant="success"
        />
        <StatCard
          title="已禁用"
          value={stats.disabled}
          description="已禁用的插件"
          icon="⏸️"
          variant="warning"
        />
        <StatCard
          title="工具类"
          value={stats.tools}
          description="工具类型插件"
          icon="🔧"
          variant="info"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>插件类型分布</CardTitle>
            <CardDescription>不同类型插件的分布情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <TypeDistribution type="工具" count={stats.tools} icon="🔧" color="bg-primary-500" />
              <TypeDistribution type="主题" count={stats.themes} icon="🎨" color="bg-pink-500" />
              <TypeDistribution
                type="扩展"
                count={stats.extensions}
                icon="🔌"
                color="bg-green-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
            <CardDescription>当前系统状态和配置</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <InfoRow label="主题" value={theme === 'light' ? '☀️ 浅色模式' : '🌙 深色模式'} />
              <InfoRow label="版本" value="1.0.0" />
              <InfoRow label="Electron" value="39.2.7" />
              <InfoRow label="Node.js" value="v18.x" />
              <InfoRow label="Chrome" value="未知" />
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      )}

      {!loading && plugins.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">�</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">暂无插件</h3>
            <p className="text-gray-600 dark:text-gray-400">前往插件市场安装您的第一个插件</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon,
  variant
}: {
  title: string
  value: number
  description: string
  icon: string
  variant: 'default' | 'success' | 'warning' | 'info'
}) {
  const variantStyles = {
    default: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-100',
    success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          </div>
          <div className={`text-4xl p-3 rounded-lg ${variantStyles[variant]}`}>{icon}</div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{description}</p>
      </CardContent>
    </Card>
  )
}

function TypeDistribution({
  type,
  count,
  icon,
  color
}: {
  type: string
  count: number
  icon: string
  color: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white`}
        >
          {icon}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{type}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{count} 个插件</p>
        </div>
      </div>
      <Badge variant="secondary">{count}</Badge>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}
