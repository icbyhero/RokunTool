/// <reference types="vite/client" />

import type { ElectronApi } from '../../preload/ipc'

declare global {
  interface Window {
    electronAPI: ElectronApi
    electron: {
      process: {
        versions: {
          electron: string
          chrome: string
          node: string
        }
      }
    }
  }
}
