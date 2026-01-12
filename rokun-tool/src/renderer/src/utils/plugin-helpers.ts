import type { PluginMetadata, PluginPermission } from '../../../shared/types/plugin'

export function formatPermission(permission: PluginPermission): string {
  const permissionMap: Record<PluginPermission, string> = {
    'fs:read': '读取文件',
    'fs:write': '写入文件',
    'process:spawn': '启动进程',
    'process:exec': '执行命令',
    'network:http': 'HTTP 请求',
    'shell:execute': '执行 Shell 命令',
    'clipboard:read': '读取剪贴板',
    'clipboard:write': '写入剪贴板',
    'notification:show': '显示通知',
    'window:open': '打开窗口',
    'config:read': '读取配置',
    'config:write': '写入配置'
  }

  return permissionMap[permission] || permission
}

export function formatPermissions(permissions: PluginPermission[]): string[] {
  return permissions.map(formatPermission)
}

export function formatVersion(version: string): string {
  if (!version) return '未知版本'

  const parts = version.split('.')
  if (parts.length >= 3) {
    return `v${version}`
  }

  return version
}

export function validatePluginMetadata(meta: PluginMetadata): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!meta.id || meta.id.trim() === '') {
    errors.push('插件 ID 不能为空')
  }

  if (!meta.name || meta.name.trim() === '') {
    errors.push('插件名称不能为空')
  }

  if (!meta.version || meta.version.trim() === '') {
    errors.push('插件版本不能为空')
  }

  if (!meta.description || meta.description.trim() === '') {
    errors.push('插件描述不能为空')
  }

  if (!meta.author || meta.author.trim() === '') {
    errors.push('插件作者不能为空')
  }

  if (!meta.license || meta.license.trim() === '') {
    errors.push('插件许可证不能为空')
  }

  if (!meta.main || meta.main.trim() === '') {
    errors.push('插件入口文件不能为空')
  }

  if (!meta.type || !['tool', 'extension', 'theme'].includes(meta.type)) {
    errors.push('插件类型必须是 tool、extension 或 theme')
  }

  if (!Array.isArray(meta.permissions)) {
    errors.push('权限列表必须是数组')
  }

  const validPermissions: PluginPermission[] = [
    'fs:read',
    'fs:write',
    'process:spawn',
    'process:exec',
    'network:http',
    'shell:execute',
    'clipboard:read',
    'clipboard:write',
    'notification:show',
    'window:open',
    'config:read',
    'config:write'
  ]

  if (Array.isArray(meta.permissions)) {
    const invalidPermissions = meta.permissions.filter((p) => !validPermissions.includes(p))
    if (invalidPermissions.length > 0) {
      errors.push(`无效的权限: ${invalidPermissions.join(', ')}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function getPluginIcon(plugin: PluginMetadata): string {
  if (plugin.icon) {
    if (plugin.icon.startsWith('data:')) {
      return plugin.icon
    }
    return plugin.icon
  }

  const typeIcons: Record<string, string> = {
    tool: '🔧',
    extension: '🧩',
    theme: '🎨'
  }

  return typeIcons[plugin.type] || '📦'
}

export function getPluginTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    tool: '工具',
    extension: '扩展',
    theme: '主题'
  }

  return labels[type] || type
}

export function getPluginStatusLabel(enabled: boolean): string {
  return enabled ? '已启用' : '已禁用'
}

export function isPluginEnabled(plugin: PluginMetadata): boolean {
  return plugin.enabled === true
}

export function canPluginBeEnabled(plugin: PluginMetadata): boolean {
  return plugin.enabled !== true
}

export function canPluginBeDisabled(plugin: PluginMetadata): boolean {
  return plugin.enabled === true
}

export function getPluginDependencies(plugin: PluginMetadata): string[] {
  return plugin.dependencies || []
}

export function hasDependencies(plugin: PluginMetadata): boolean {
  return !!(plugin.dependencies && plugin.dependencies.length > 0)
}
