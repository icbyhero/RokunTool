# 添加插件操作进度反馈 UI

## 概述

为长时间运行的插件操作(如创建微信分身、批量更新等)添加统一的进度反馈界面,解决用户在执行任务时感觉"应用卡住"的问题。

## Why

### 当前问题

1. **缺少进度反馈**
   - 用户点击"创建分身"或"更新版本"按钮后,界面没有任何响应
   - 操作执行过程中(可能需要几分钟),用户不知道应用是否在工作
   - 用户体验差,可能会重复点击或强制关闭应用

2. **现有基础设施未充分利用**
   - 已有 `PluginLoading.tsx` 组件可以显示插件加载进度
   - 已有 `pluginStore` 中的 `loadingPlugins` 状态管理
   - 已有 `plugin:loading` IPC 事件通道
   - 但这些只在插件加载时使用,插件方法执行时未使用

3. **不符合规格要求**
   - `wechat-multi-instance` 规格中的 **Scenario: 操作反馈** 明确要求:
     - 系统必须显示加载状态
     - 长时间操作必须显示进度条

### 用户反馈

用户明确指出:
> "执行任务的时候应该有个进度页面,或者有个处理页面,现在点击操作,会觉得像是卡住了一样。这个是否可以统一主程序上实现,"

## What Changes

### 核心修改

#### 1. 扩展插件进度 API (主进程)

**修改**: 在 `PluginAPI` 中添加进度报告方法

```typescript
interface PluginAPI {
  // 现有 API...

  /** 进度反馈 API (新增) */
  progress: {
    /**
     * 报告操作开始
     * @param operation 操作名称 (如 "创建分身", "更新版本")
     * @param totalSteps 总步骤数 (可选,用于计算进度百分比)
     */
    start(operation: string, totalSteps?: number): void

    /**
     * 报告操作进度
     * @param currentStep 当前步骤 (从1开始)
     * @param stepName 当前步骤名称 (如 "复制微信应用", "修改Bundle ID")
     * @param details 详细信息 (可选,插件可以提供额外的日志信息)
     */
    update(currentStep: number, stepName?: string, details?: string): void

    /**
     * 报告操作完成
     * @param result 操作结果 (成功/失败)
     * @param error 错误信息 (如果失败)
     */
    complete(result: 'success' | 'error', error?: string): void
  }
}
```

**实现**: 在 `PluginLoader` 中添加发送进度事件的方法

#### 2. 在插件方法中发送进度事件

**修改**: `plugins/wechat-multi-instance/index.js` 和 `plugins/rime-config/index.js`

##### 2.1 微信分身插件进度报告

在 `createInstance` 和 `rebuildInstance` 方法中添加进度报告:

```javascript
async createInstance() {
  // 1. 开始进度报告
  const totalSteps = 7
  this.context.api.progress.start('创建分身', totalSteps)

  try {
    // 2. 检查微信安装
    this.context.api.progress.update(1, '检查微信安装')
    const isInstalled = await this.checkWeChatInstalled()
    if (!isInstalled) {
      throw new Error('微信未安装,请先安装微信应用')
    }

    // 3. 复制应用
    this.context.api.progress.update(2, '复制微信应用')
    await this.copyWeChatApp(instancePath)

    // 4. 修改 Bundle ID
    this.context.api.progress.update(3, '修改应用标识')
    await this.modifyBundleId(instancePath, bundleId, instanceName)

    // 5. 签名应用
    this.context.api.progress.update(4, '签名应用')
    await this.signApp(instancePath)

    // 6. 修改显示名称
    this.context.api.progress.update(5, '修改显示名称')
    await this.modifyWeChatDisplayName(instancePath, instanceNumber)

    // 7. 创建符号链接
    this.context.api.progress.update(6, '创建快捷方式')
    await this.createSymlink(instancePath, symlinkPath)

    // 8. 保存配置
    this.context.api.progress.update(7, '保存配置')
    // ... 保存配置代码 ...

    // 9. 完成进度报告
    this.context.api.progress.complete('success')
    return instance
  } catch (error) {
    this.context.api.progress.complete('error', error.message)
    throw error
  }
}
```

##### 2.2 Rime 配置插件进度报告

在 `installRecipe`, `updateRecipe`, `deployRime` 方法中添加进度报告:

```javascript
async installRecipe(recipeString) {
  const totalSteps = 3
  this.context.api.progress.start('安装 Plum 配方', totalSteps)

  try {
    // 步骤1: 检查权限
    this.context.api.progress.update(1, '请求执行权限', '请求 process:exec 权限...')
    const hasPermission = await this.context.api.permission.request('process:exec', {
      reason: '安装 Plum 配方需要执行 rime-install 命令',
      context: {
        operation: '安装配方',
        target: recipe.name
      }
    })

    if (!hasPermission) {
      throw new Error('未授予进程执行权限,无法安装配方')
    }

    // 步骤2: 执行安装
    this.context.api.progress.update(2, `执行 rime-install ${recipeString}`, `正在下载并安装 ${recipe.name}...`)
    const result = await this.context.api.process.exec(`rime-install ${recipeString}`)

    // 步骤3: 检查安装状态
    this.context.api.progress.update(3, '验证安装状态', '检查安装的文件...')
    await this.checkInstalledRecipes()

    this.context.api.progress.complete('success')
    return {
      success: true,
      message: `配方 ${recipe.name} 安装成功`,
      output: result.stdout
    }
  } catch (error) {
    this.context.api.progress.complete('error', error.message)
    throw error
  }
}

async deployRime() {
  const totalSteps = 3
  this.context.api.progress.start('部署 Rime', totalSteps)

  try {
    // 步骤1: 检查权限
    this.context.api.progress.update(1, '请求执行权限', '请求 process:exec 权限...')
    const hasPermission = await this.context.api.permission.request('process:exec', {
      reason: '部署 Rime 需要执行 rime_deployer 命令',
      context: {
        operation: '部署 Rime',
        target: 'Rime 配置'
      }
    })

    if (!hasPermission) {
      throw new Error('未授予进程执行权限,无法部署 Rime')
    }

    // 步骤2: 执行部署
    this.context.api.progress.update(2, '执行 rime_deployer --build', '正在编译 Rime 配置...')
    const result = await this.context.api.process.exec('rime_deployer --build')

    // 步骤3: 完成
    this.context.api.progress.update(3, '部署完成', 'Rime 部署成功!')

    this.context.api.progress.complete('success')
    return {
      success: true,
      message: 'Rime 部署成功',
      output: result.stdout
    }
  } catch (error) {
    this.context.api.progress.complete('error', error.message)
    throw error
  }
}
```

#### 3. 添加统一的进度弹窗组件 (渲染进程)

**新增**: `rokun-tool/src/renderer/src/components/ui/ProgressDialog.tsx`

通用的进度对话框组件,用于显示任何长时间运行的操作:

```typescript
interface ProgressDialogProps {
  isOpen: boolean
  title: string
  currentStep: string
  progress: number
  status: 'running' | 'success' | 'error'
  error?: string
  logs?: string[]  // 插件提供的操作日志
  onClose?: () => void
}

export function ProgressDialog({
  isOpen,
  title,
  currentStep,
  progress,
  status,
  error,
  logs = [],
  onClose
}: ProgressDialogProps) {
  if (!isOpen) return null

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* 进度条 */}
        <Progress value={progress} />

        {/* 当前步骤 */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {currentStep}
        </p>

        {/* 操作日志 (可选) */}
        {logs.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto">
            <h4 className="text-sm font-medium mb-2">操作日志:</h4>
            <ul className="text-xs space-y-1 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {logs.map((log, index) => (
                <li key={index}>{log}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 状态图标 */}
        {status === 'running' && <Loader2 className="animate-spin" />}
        {status === 'success' && <CheckCircle2 className="text-green-500" />}
        {status === 'error' && <XCircle className="text-red-500" />}

        {/* 错误信息 */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 关闭按钮 (完成时显示) */}
        {status !== 'running' && (
          <Button onClick={onClose}>关闭</Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

#### 4. 添加操作进度状态管理 (渲染进程)

**修改**: `rokun-tool/src/renderer/src/store/pluginStore.ts`

添加操作进度状态:

```typescript
interface PluginState {
  // ... 现有状态 ...

  // 操作进度状态 (新增)
  operationProgress: Map<string, {
    operation: string
    currentStep: number
    totalSteps: number
    stepName: string
    status: 'running' | 'success' | 'error'
    error?: string
    logs: string[]  // 操作日志
  }>

  // 新增 Actions
  setOperationProgress: (
    pluginId: string,
    progress: {
      operation: string
      currentStep: number
      totalSteps: number
      stepName: string
      status: 'running' | 'success' | 'error'
      error?: string
      logs?: string[]
    }
  ) => void
  clearOperationProgress: (pluginId: string) => void
}
```

#### 5. 监听操作进度事件 (渲染进程)

**新增**: 在主应用布局或插件页面中监听进度事件

```typescript
useEffect(() => {
  const handleOperationProgress = (_event: any, data: any) => {
    const { pluginId, operation, currentStep, totalSteps, stepName, status, error } = data

    usePluginStore.getState().setOperationProgress(pluginId, {
      operation,
      currentStep,
      totalSteps,
      stepName,
      status,
      error
    })
  }

  window.electronAPI.ipc.on('plugin:operation-progress', handleOperationProgress)

  return () => {
    window.electronAPI.ipc.off('plugin:operation-progress', handleOperationProgress)
  }
}, [])
```

### 实现方案

#### 方案选择: 统一实现 + 插件可选使用

采用**渐进式增强**策略:

1. **基础层**: 主程序提供统一的进度反馈基础设施
   - API 扩展 (`PluginAPI.progress`)
   - IPC 事件通道 (`plugin:operation-progress`)
   - 状态管理 (`pluginStore.operationProgress`)
   - UI 组件 (`ProgressDialog`)

2. **应用层**: 插件可以选择性使用进度 API
   - 微信分身插件: 在创建/更新操作中添加进度报告
   - 其他插件: 保持现有行为不变

3. **展示层**: 渲染进程自动监听并显示进度
   - 监听 IPC 事件
   - 更新状态管理
   - 显示进度对话框

**优点**:
- ✅ 统一实现,符合用户要求
- ✅ 向后兼容,不破坏现有插件
- ✅ 插件可选使用,灵活性强
- ✅ 代码复用,减少重复

## Impact

### 影响范围

**修改文件**:
- `rokun-tool/src/shared/types/plugin.ts` - 扩展 PluginAPI 类型
- `rokun-tool/src/main/plugins/plugin-instance.ts` - 实现进度 API
- `rokun-tool/src/renderer/src/store/pluginStore.ts` - 添加进度状态
- `rokun-tool/src/renderer/src/components/ui/ProgressDialog.tsx` - 新增组件
- `rokun-tool/src/renderer/src/components/pages/WeChatMultiInstance.tsx` - 集成进度对话框
- `rokun-tool/src/renderer/src/components/pages/RimeConfig.tsx` - 集成进度对话框
- `plugins/wechat-multi-instance/index.js` - 添加进度报告
- `plugins/rime-config/index.js` - 添加进度报告

**影响功能**:
- 插件 API 扩展
- 微信分身创建/更新操作
- Rime 配方安装/更新/部署操作
- 用户界面体验

### 兼容性

- ✅ 向后兼容 - 现有插件无需修改即可继续工作
- ✅ 渐进增强 - 插件可以选择性使用进度 API
- ✅ 无破坏性变更 - 只添加新功能

### 风险评估

- **低风险** - 主要添加新功能,不修改现有逻辑
- **影响可控** - 只影响使用进度 API 的插件
- **易回滚** - 出问题可快速移除进度报告调用

## Success Criteria

### 功能验收

**微信分身插件**:
- [ ] 点击"创建分身"按钮后,立即显示进度对话框
- [ ] 进度对话框显示当前操作步骤名称
- [ ] 进度条正确显示完成百分比
- [ ] 操作完成后,显示成功或失败状态
- [ ] 批量更新时,显示整体进度和当前处理的分身
- [ ] 进度对话框可以关闭(完成后)

**Rime 配置插件**:
- [ ] 点击"安装配方"按钮后,立即显示进度对话框
- [ ] 点击"部署 Rime"按钮后,立即显示进度对话框
- [ ] 显示权限请求、执行命令、验证状态等步骤
- [ ] 操作完成后,显示成功或失败状态
- [ ] 进度对话框可以关闭(完成后)

### 技术验收

- [ ] `PluginAPI.progress` 方法正常工作
- [ ] IPC 事件 `plugin:operation-progress` 正确发送和接收
- [ ] 状态管理正确更新进度信息
- [ ] 进度对话框 UI 正确渲染
- [ ] TypeScript 类型检查通过
- [ ] 不影响其他插件的功能

### 用户体验验收

- [ ] 操作响应时间 < 100ms (立即显示对话框)
- [ ] 进度信息清晰易懂
- [ ] 错误信息友好具体
- [ ] 不会再感觉"应用卡住"

## Alternatives Considered

### 方案A: 只为微信分身插件实现进度反馈

**优点**:
- 实现简单,只修改一个插件
- 开发时间短

**缺点**:
- 不统一,不符合用户要求
- 其他插件无法复用
- 维护成本高

**结论**: 不采用 - 用户明确要求"统一主程序上实现"

### 方案B: 使用浏览器原生进度提示

**优点**:
- 无需额外 UI 组件
- 系统原生样式

**缺点**:
- 功能有限,无法显示详细信息
- 不能显示步骤名称
- 用户体验不佳

**结论**: 不采用 - 需要更丰富的反馈

### 方案C: 使用通知方式显示进度

**优点**:
- 不阻塞主界面
- 系统标准交互

**缺点**:
- 通知不适合显示频繁更新的进度
- 通知可能被忽略
- 无法显示详细的进度条

**结论**: 不采用 - 适合一次性通知,不适合持续进度

## Open Questions

1. **进度对话框是否应该在后台运行时自动隐藏?**
   - 当前方案: 保持显示,直到用户关闭或操作完成
   - 可选方案: 添加"最小化到托盘"功能

2. **是否需要支持取消操作?**
   - 创建分身操作较难安全取消
   - 批量更新可以支持中断
   - 当前方案: 不支持取消(简化实现)

3. **进度信息是否需要持久化?**
   - 应用关闭后重新打开,是否显示之前的进度?
   - 当前方案: 不持久化(操作完成后状态无意义)

## Related Changes

- 依赖: 无
- 相关: `wechat-multi-instance` 规格中的操作反馈要求
- 后续: 可以扩展到其他插件的长时间操作
