import React, { useState, useEffect, createContext, useContext } from 'react'
import type { PluginRoute } from '@shared/types/plugin'

interface PluginRouterProps {
  pluginId: string
  routes?: PluginRoute[]
  children?: React.ReactNode
}

interface RouterContextValue {
  currentPath: string
  push: (path: string) => void
  replace: (path: string) => void
  back: () => void
}

export function PluginRouter({ routes, children }: Omit<PluginRouterProps, 'pluginId'>) {
  const [currentPath, setCurrentPath] = useState('/')
  const [history, setHistory] = useState<string[]>(['/'])

  const push = (path: string) => {
    const fullPath = path.startsWith('/') ? path : `/${path}`
    setHistory((prev) => [...prev, fullPath])
    setCurrentPath(fullPath)
  }

  const replace = (path: string) => {
    const fullPath = path.startsWith('/') ? path : `/${path}`
    setHistory((prev) => [...prev.slice(0, -1), fullPath])
    setCurrentPath(fullPath)
  }

  const back = () => {
    if (history.length > 1) {
      const newPath = history[history.length - 2]
      setHistory((prev) => prev.slice(0, -1))
      setCurrentPath(newPath)
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      if (history.length > 1) {
        const newPath = history[history.length - 2]
        setHistory((prev) => prev.slice(0, -1))
        setCurrentPath(newPath)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const renderRoute = () => {
    if (!routes || routes.length === 0) {
      return children
    }

    const route = routes.find((r) => {
      const routePath = r.path
      if (routePath === '*') return true
      if (routePath === currentPath) return true

      if (routePath.includes(':')) {
        const routeParts = routePath.split('/')
        const pathParts = currentPath.split('/')
        if (routeParts.length !== pathParts.length) return false

        return routeParts.every((part, i) => {
          if (part.startsWith(':')) return true
          return part === pathParts[i]
        })
      }

      return false
    })

    if (!route) {
      return children
    }

    const RouteComponent = route.component
    return <RouteComponent />
  }

  const routerContext: RouterContextValue = {
    currentPath,
    push,
    replace,
    back
  }

  return (
    <PluginRouterContext.Provider value={routerContext}>
      {renderRoute()}
    </PluginRouterContext.Provider>
  )
}

const PluginRouterContext = createContext<RouterContextValue | null>(null)

export function usePluginRouter() {
  const context = useContext(PluginRouterContext)
  if (!context) {
    throw new Error('usePluginRouter must be used within PluginRouter')
  }
  return context
}
