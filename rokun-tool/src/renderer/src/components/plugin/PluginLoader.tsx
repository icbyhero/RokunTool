import { Suspense, lazy, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

interface PluginLoaderProps {
  loader: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ReactNode
}

const loadedComponents = new Map<string, ComponentType<any>>()

export function PluginLoader({ loader, fallback }: PluginLoaderProps) {
  const cacheKey = loader.toString()

  if (!loadedComponents.has(cacheKey)) {
    loadedComponents.set(cacheKey, lazy(loader))
  }

  const LazyComponent = loadedComponents.get(cacheKey)!

  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">正在加载...</p>
      </div>
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyComponent />
    </Suspense>
  )
}

export function preloadPluginComponent(loader: () => Promise<{ default: ComponentType<any> }>) {
  const cacheKey = loader.toString()

  if (!loadedComponents.has(cacheKey)) {
    loadedComponents.set(cacheKey, lazy(loader))
  }

  return loadedComponents.get(cacheKey)!
}
