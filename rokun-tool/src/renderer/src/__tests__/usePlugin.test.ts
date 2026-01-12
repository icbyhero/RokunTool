import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePluginState } from '../hooks/usePlugin'

describe('usePlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('usePluginState', () => {
    it('应该加载初始状态', async () => {
      const { result } = renderHook(() => usePluginState('test-plugin', { count: 0 }))

      expect(result.current.state).toEqual({ count: 0 })
    })

    it('应该保存和加载状态', async () => {
      const { result } = renderHook(() => usePluginState('test-plugin', { count: 0 }))

      await act(async () => {
        await result.current.setState({ count: 5 })
      })

      expect(result.current.state).toEqual({ count: 5 })
      expect(localStorage.getItem('plugin.test-plugin')).toBe(JSON.stringify({ count: 5 }))
    })

    it('应该从 localStorage 加载保存的状态', async () => {
      localStorage.setItem('plugin.test-plugin', JSON.stringify({ count: 10 }))

      const { result } = renderHook(() => usePluginState('test-plugin', { count: 0 }))

      expect(result.current.state).toEqual({ count: 10 })
    })

    it('应该处理无效的 JSON 数据', async () => {
      localStorage.setItem('plugin.test-plugin', 'invalid json')

      const { result } = renderHook(() => usePluginState('test-plugin', { count: 0 }))

      expect(result.current.state).toEqual({ count: 0 })
    })
  })
})
