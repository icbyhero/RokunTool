import { useState, useEffect } from 'react'
import { usePluginStore } from '../store/pluginStore'
import { useUIStore } from '../store/uiStore'

export function usePlugin() {
  const { plugins } = usePluginStore()
  const { setCurrentPage, setActivePluginId } = useUIStore()

  const getPlugin = (id: string) => {
    return plugins.find((p) => p.id === id)
  }

  const openPlugin = (id: string) => {
    setActivePluginId(id)
    setCurrentPage('plugin-view')
  }

  return {
    plugins,
    getPlugin,
    openPlugin
  }
}

export function usePluginState<T>(id: string, initialState: T) {
  const [state, setState] = useState<T>(initialState)
  const configKey = `plugin.${id}`

  const loadState = async () => {
    try {
      const saved = localStorage.getItem(configKey)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch (error) {
      console.error(`Failed to load state for plugin ${id}:`, error)
    }
  }

  const saveState = async (newState: T) => {
    setState(newState)
    try {
      localStorage.setItem(configKey, JSON.stringify(newState))
    } catch (error) {
      console.error(`Failed to save state for plugin ${id}:`, error)
    }
  }

  useEffect(() => {
    loadState()
  }, [id])

  return {
    state,
    setState: saveState
  }
}
