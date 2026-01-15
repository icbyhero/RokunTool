/**
 * Electron API Mock
 * 用于测试主进程和渲染进程的 Electron 功能
 */

import { vi } from 'vitest'

/**
 * Mock Electron app 对象
 */
export const mockApp = {
  getName: vi.fn(() => 'RokunTool'),
  getVersion: vi.fn(() => '1.0.0'),
  getPath: vi.fn((name: string) => {
    const paths: Record<string, string> = {
      home: '/home/test',
      appData: '/home/test/.config',
      userData: '/home/test/.config/rokun-tool',
      temp: '/tmp/test'
    }
    return paths[name] || `/tmp/test/${name}`
  }),
  setAppUserModelId: vi.fn(),
  isPackaged: false,
  quit: vi.fn(),
  exit: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  removeAllListeners: vi.fn()
}

/**
 * Mock BrowserWindow 对象
 */
export const mockBrowserWindow = {
  getInstance: vi.fn(() => ({
    webContents: {
      send: vi.fn(),
      executeJavaScript: vi.fn()
    },
    close: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeAllListeners: vi.fn()
  })),
  create: vi.fn(() => ({
    webContents: {
      send: vi.fn(),
      executeJavaScript: vi.fn()
    },
    close: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeAllListeners: vi.fn()
  })),
  getAllWindows: vi.fn(() => []),
  getFocusedWindow: vi.fn(),
  fromWebContents: vi.fn()
}

/**
 * Mock ipcMain 对象
 */
export const mockIpcMain = {
  handle: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  removeHandler: vi.fn(),
  removeAllListeners: vi.fn()
}

/**
 * Mock ipcRenderer 对象
 */
export const mockIpcRenderer = {
  send: vi.fn(),
  sendSync: vi.fn(),
  sendTo: vi.fn(),
  sendToHost: vi.fn(),
  invoke: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn()
}

/**
 * Mock dialog 对象
 */
export const mockDialog = {
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  showMessageDialog: vi.fn(),
  showErrorBox: vi.fn()
}

/**
 * Mock shell 对象
 */
export const mockShell = {
  openExternal: vi.fn(),
  openPath: vi.fn(),
  showItemInFolder: vi.fn(),
  beep: vi.fn()
}

/**
 * 完整的 Electron Mock 对象
 */
export const mockElectron = {
  app: mockApp,
  BrowserWindow: mockBrowserWindow,
  ipcMain: mockIpcMain,
  ipcRenderer: mockIpcRenderer,
  dialog: mockDialog,
  shell: mockShell
}

/**
 * 在测试中设置 Electron Mock
 */
export function setupElectronMock() {
  return vi.mock('electron', () => ({
    default: mockElectron,
    ...mockElectron
  }))
}
