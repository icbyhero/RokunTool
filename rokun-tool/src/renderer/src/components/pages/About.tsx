import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Github, Heart, ExternalLink } from 'lucide-react'

export function About() {
  const handleOpenGitHub = () => {
    window.open('https://github.com/your-username/rokun-tool', '_blank')
  }

  const handleCheckUpdates = () => {
    alert('检查更新功能开发中')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">关于 Rokun Tool</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">了解应用信息和版本</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>应用信息</CardTitle>
            <CardDescription>当前版本和基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">应用名称</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Rokun Tool</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">版本</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">1.0.0</Badge>
                <Badge variant="success">稳定版</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">构建日期</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">许可证</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">MIT</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>技术栈</CardTitle>
            <CardDescription>使用的技术和框架</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <TechBadge name="Electron" version="39.2.7" />
            <TechBadge name="React" version="19.x" />
            <TechBadge name="TypeScript" version="5.x" />
            <TechBadge name="TailwindCSS" version="3.x" />
            <TechBadge name="Zustand" version="5.x" />
            <TechBadge name="Radix UI" version="1.x" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>功能特性</CardTitle>
          <CardDescription>Rokun Tool 的核心功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="🧩"
              title="插件系统"
              description="灵活的插件架构，支持多种插件类型"
            />
            <FeatureCard icon="🔒" title="权限管理" description="细粒度的权限控制，确保系统安全" />
            <FeatureCard icon="🎨" title="主题支持" description="深色和浅色主题，随心切换" />
            <FeatureCard icon="⚡" title="高性能" description="基于 Electron 和 React，快速响应" />
            <FeatureCard icon="🌐" title="跨平台" description="支持 Windows、macOS 和 Linux" />
            <FeatureCard icon="🔧" title="可扩展" description="开放的 API，易于扩展和定制" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>链接</CardTitle>
          <CardDescription>有用的链接和资源</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">GitHub 仓库</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">查看源代码和提交问题</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenGitHub}>
              <Github className="w-4 h-4 mr-2" />
              访问
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">文档</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">查看使用文档和 API 参考</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open('https://github.com/your-username/rokun-tool/wiki', '_blank')
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              查看
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>检查更新</CardTitle>
          <CardDescription>检查是否有新版本可用</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              当前版本: <span className="font-medium text-gray-900 dark:text-white">1.0.0</span>
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">✓ 已是最新版本</p>
          </div>
          <Button onClick={handleCheckUpdates}>
            <ExternalLink className="w-4 h-4 mr-2" />
            检查更新
          </Button>
        </CardContent>
      </Card>

      <div className="text-center py-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Made with <Heart className="w-4 h-4 inline text-red-500" /> by Rokun
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          © {new Date().getFullYear()} Rokun Tool. All rights reserved.
        </p>
      </div>
    </div>
  )
}

function TechBadge({ name, version }: { name: string; version: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <span className="text-sm font-medium text-gray-900 dark:text-white">{name}</span>
      <Badge variant="secondary" className="text-xs">
        {version}
      </Badge>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  )
}
