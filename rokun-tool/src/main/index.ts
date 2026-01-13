import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { PluginLoader } from './plugins/loader'
import { PluginRegistry } from './plugins/registry'
import { IpcHandlers } from './ipc'
import { ServiceManager } from './services'
import { PermissionManager } from './permissions'

// Don't initialize ServiceManager and PermissionManager at module level
// They will be initialized after app.whenReady()
let serviceManager: ServiceManager
let permissionManager: PermissionManager

// 初始化插件系统
// 根据环境决定插件目录路径
// 开发环境: __dirname = out/main/ → ../../../plugins/ = 项目根目录/plugins/
// 生产环境: __dirname = out/main/ → ../../plugins/ = 项目根目录/plugins/
const isDev = process.env.NODE_ENV === 'development'
const pluginsDir = isDev
  ? join(__dirname, '../../../plugins')
  : join(__dirname, '../../plugins')

// 输出调试信息
console.log('[Plugin System] Initializing...')
console.log(`[Plugin System] Environment: ${process.env.NODE_ENV}`)
console.log(`[Plugin System] __dirname: ${__dirname}`)
console.log(`[Plugin System] Plugins directory: ${pluginsDir}`)

const pluginRegistry = new PluginRegistry()
let pluginLoader: PluginLoader
let ipcHandlers: IpcHandlers

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#1e1e1e',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      webSecurity: true,
      nodeIntegration: false
    }
  })

  // 开发模式下打开开发者工具
  if (isDev) {
    mainWindow!.webContents.openDevTools()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  // 监听渲染进程错误
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer ${level}]: ${message} (${sourceId}:${line})`)
  })

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load:', errorCode, errorDescription, validatedURL)
    }
  )

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Render process gone:', details)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 设置主窗口到插件加载器和权限管理器
  pluginLoader.setMainWindow(mainWindow!)
  permissionManager.setMainWindow(mainWindow!)

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Initialize ServiceManager and PermissionManager after app is ready
  serviceManager = ServiceManager.getInstance()
  permissionManager = new PermissionManager()

  // Initialize PluginLoader and IpcHandlers
  pluginLoader = new PluginLoader(pluginsDir, pluginRegistry, serviceManager, permissionManager)
  ipcHandlers = new IpcHandlers(pluginRegistry, serviceManager, permissionManager)

  // Set app user model id for windows
  // Note: electronApp.setAppUserModelId removed to avoid importing it before app is ready

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // Dynamically import optimizer to avoid accessing electron.app before it's ready
  const { optimizer } = await import('@electron-toolkit/utils')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化权限管理器
  await permissionManager.initialize()

  // 初始化IPC处理器
  ipcHandlers.register()

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 退出应用
  ipcMain.on('app-quit', () => {
    app.quit()
  })

  createWindow()

  // 异步加载所有插件,不阻塞窗口显示
  setImmediate(async () => {
    try {
      const startTime = Date.now()
      const plugins = await pluginLoader.loadAll({ autoEnable: true })
      const loadTime = Date.now() - startTime
      console.log(`Loaded ${plugins.length} plugin(s) in ${loadTime}ms`)

      // 通知渲染进程插件加载完成
      if (mainWindow) {
        mainWindow.webContents.send('plugins-loaded', {
          count: plugins.length,
          loadTime
        })
      }
    } catch (error) {
      console.error('Failed to load plugins:', error)

      // 通知渲染进程插件加载失败
      if (mainWindow) {
        mainWindow.webContents.send('plugins-load-error', {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
