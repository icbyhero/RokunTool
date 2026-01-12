/**
 * 插件注册表
 *
 * 管理所有已加载的插件实例
 */

import type { PluginInstance, PluginRegistry as IPluginRegistry } from '@shared/types/plugin'

export class PluginRegistry implements IPluginRegistry {
  plugins: Map<string, PluginInstance> = new Map()

  register(plugin: PluginInstance): void {
    if (this.plugins.has(plugin.metadata.id)) {
      throw new Error(`Plugin ${plugin.metadata.id} is already registered`)
    }
    this.plugins.set(plugin.metadata.id, plugin)
  }

  unregister(pluginId: string): void {
    if (!this.plugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is not registered`)
    }
    this.plugins.delete(pluginId)
  }

  get(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId)
  }

  has(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  getAll(): PluginInstance[] {
    return Array.from(this.plugins.values())
  }

  getEnabled(): PluginInstance[] {
    return this.getAll().filter((p) => p.status === 'enabled')
  }

  getDisabled(): PluginInstance[] {
    return this.getAll().filter((p) => p.status === 'disabled')
  }

  clear(): void {
    this.plugins.clear()
  }

  get size(): number {
    return this.plugins.size
  }
}
