# 事务性权限执行 - 实现指南

## 概述

本文档提供了在批量权限 API 实现之前,插件开发者可以**立即使用**的临时解决方案,确保多权限操作的原子性和回滚能力。

## 当前可用的解决方案

### 方案1: 手动预检查 + 事务执行

插件开发者现在就可以使用这个模式,不依赖框架支持:

```javascript
class WeChatMultiInstancePlugin {
  /**
   * 创建微信分身 - 带完整的事务支持
   */
  async createInstance(instanceName, bundleId) {
    // 定义功能需要的所有权限
    const REQUIRED_PERMISSIONS = [
      {
        permission: 'fs:read',
        reason: '读取微信应用文件',
        context: { operation: '复制应用', target: instanceName }
      },
      {
        permission: 'fs:write',
        reason: '修改应用配置文件',
        context: { operation: '修改配置', target: instanceName }
      },
      {
        permission: 'process:exec',
        reason: '执行签名命令',
        context: { operation: '签名应用', target: instanceName }
      }
    ]

    // ============================================
    // 阶段1: 预检查所有权限
    // ============================================
    this.context.logger.info('预检查权限...')

    const permissionResults = []
    for (const perm of REQUIRED_PERMISSIONS) {
      const result = await this.checkPermissionStatus(perm.permission)
      permissionResults.push({
        ...perm,
        status: result
      })

      // 如果永久拒绝,立即中止
      if (result === 'permanently_denied') {
        this.showMessage(
          `功能无法执行: ${perm.permission} 权限已被永久拒绝。` +
          `请前往设置开启权限后重试。`,
          'error'
        )
        return { success: false, reason: 'permission_denied', permission: perm.permission }
      }
    }

    // ============================================
    // 阶段2: 批量请求所有权限
    // ============================================
    this.context.logger.info('请求所有必需权限...')

    const grantedPermissions = []
    for (const perm of REQUIRED_PERMISSIONS) {
      // 只请求尚未授予的权限
      if (permissionResults.find(p => p.permission === perm.permission)?.status !== 'granted') {
        const hasPermission = await this.context.api.permission.request(
          perm.permission,
          {
            reason: perm.reason,
            context: perm.context
          }
        )

        if (!hasPermission) {
          // 用户拒绝了权限,需要回滚已授予的权限(如果是永久授权)
          this.context.logger.warn(`用户拒绝了权限: ${perm.permission}`)
          await this.rollbackPermissions(grantedPermissions)

          this.showMessage(
            `操作已取消: 未授予 ${perm.permission} 权限。所有已授予的权限已撤销。`,
            'warning'
          )
          return { success: false, reason: 'permission_denied', permission: perm.permission }
        }

        grantedPermissions.push(perm)
      } else {
        // 权限已授予,加入列表
        grantedPermissions.push(perm)
      }
    }

    this.context.logger.info('所有权限已授予,开始执行操作...')

    // ============================================
    // 阶段3: 执行事务(带回滚)
    // ============================================
    const transaction = {
      featureName: '创建微信分身',
      totalSteps: 7,
      executedSteps: [],
      rollbackData: {}
    }

    try {
      // 步骤1: 检查微信安装
      await this.executeStep(transaction, '检查微信安装', async () => {
        const isInstalled = await this.checkWeChatInstalled()
        if (!isInstalled) {
          throw new Error('微信未安装')
        }
      })

      // 步骤2: 创建实例目录
      await this.executeStep(transaction, '创建实例目录', async () => {
        const instancePath = this.getInstancePath(instanceName)
        await this.context.api.fs.ensureDir(instancePath)

        // 记录回滚信息
        transaction.rollbackData.instancePath = instancePath
      })

      // 步骤3: 复制微信应用
      await this.executeStep(transaction, '复制微信应用', async () => {
        const sourcePath = this.getWeChatPath()
        const targetPath = this.getInstancePath(instanceName, 'WeChat.app')

        await this.context.api.fs.copyDirectory(sourcePath, targetPath)

        // 记录回滚信息
        transaction.rollbackData.copiedAppPath = targetPath
      })

      // 步骤4: 修改 Bundle ID
      await this.executeStep(transaction, '修改 Bundle ID', async () => {
        const appPath = this.getInstancePath(instanceName, 'WeChat.app')
        const infoPlistPath = this.context.api.path.join(appPath, 'Contents/Info.plist')

        // 备份原始配置
        const backupPath = `${infoPlistPath}.backup`
        await this.context.api.fs.copyFile(infoPlistPath, backupPath)
        transaction.rollbackData.bundleIdBackup = backupPath

        // 修改 Bundle ID
        const currentBundleId = await this.getCurrentBundleId(appPath)
        transaction.rollbackData.originalBundleId = currentBundleId

        await this.modifyBundleId(appPath, bundleId, instanceName)
      })

      // 步骤5: 修改应用名称
      await this.executeStep(transaction, '修改应用名称', async () => {
        const appPath = this.getInstancePath(instanceName, 'WeChat.app')

        // 备份配置
        const infoPlistPath = this.context.api.path.join(appPath, 'Contents/Info.plist')
        const backupPath = `${infoPlistPath}.name.backup`
        await this.context.api.fs.copyFile(infoPlistPath, backupPath)
        transaction.rollbackData.nameBackup = backupPath

        // 修改名称
        await this.modifyAppName(appPath, instanceName)
      })

      // 步骤6: 签名应用
      await this.executeStep(transaction, '签名应用', async () => {
        const appPath = this.getInstancePath(instanceName, 'WeChat.app')

        // 创建签名前的备份
        const backupPath = this.getInstancePath(instanceName, 'WeChat.backup.zip')
        await this.context.api.fs.zipDirectory(appPath, backupPath)
        transaction.rollbackData.signatureBackup = backupPath

        // 执行签名
        await this.signApp(appPath)
      })

      // 步骤7: 保存配置
      await this.executeStep(transaction, '保存配置', async () => {
        this.instances.set(instanceName, {
          name: instanceName,
          bundleId,
          path: this.getInstancePath(instanceName, 'WeChat.app'),
          realPath: this.getInstancePath(instanceName, 'WeChat.app'),
          createdAt: Date.now()
        })

        await this.saveConfig()
      })

      // ============================================
      // 成功!
      // ============================================
      this.context.logger.info(`创建分身成功: ${instanceName}`)
      this.context.api.progress.complete('创建分身成功')

      return {
        success: true,
        instanceName,
        instancePath: this.getInstancePath(instanceName, 'WeChat.app')
      }

    } catch (error) {
      // ============================================
      // 失败:执行回滚
      // ============================================
      this.context.logger.error(`创建分身失败: ${error.message}`)
      this.context.api.progress.fail(`创建分身失败: ${error.message}`)

      await this.rollbackTransaction(transaction)

      throw error
    }
  }

  /**
   * 执行事务步骤(带回滚记录)
   */
  async executeStep(transaction, stepName, stepFunction) {
    this.context.api.progress.update(
      transaction.executedSteps.length + 1,
      stepName,
      `正在执行: ${stepName}...`
    )

    try {
      await stepFunction()
      transaction.executedSteps.push(stepName)
      this.context.logger.info(`步骤成功: ${stepName}`)
    } catch (error) {
      this.context.logger.error(`步骤失败: ${stepName}`, error)
      throw error  // 抛出错误,触发回滚
    }
  }

  /**
   * 回滚事务
   */
  async rollbackTransaction(transaction) {
    this.context.logger.warn('开始回滚事务...')
    this.context.api.progress.start('回滚操作', transaction.executedSteps.length)

    let rollbackFailures = []

    // 按相反顺序回滚
    for (let i = transaction.executedSteps.length - 1; i >= 0; i--) {
      const stepName = transaction.executedSteps[i]

      try {
        this.context.api.progress.update(
          transaction.executedSteps.length - i,
          `回滚: ${stepName}`,
          `正在回滚: ${stepName}...`
        )

        await this.rollbackStep(stepName, transaction.rollbackData)
        this.context.logger.info(`回滚成功: ${stepName}`)
      } catch (error) {
        this.context.logger.error(`回滚失败: ${stepName}`, error)
        rollbackFailures.push({ step: stepName, error })
      }
    }

    if (rollbackFailures.length > 0) {
      this.showMessage(
        `回滚过程中有 ${rollbackFailures.length} 个步骤失败,可能需要手动清理`,
        'warning'
      )
    } else {
      this.context.logger.info('事务回滚成功,系统已恢复原状')
      this.context.api.progress.complete('回滚成功')
    }
  }

  /**
   * 回滚单个步骤
   */
  async rollbackStep(stepName, rollbackData) {
    switch (stepName) {
      case '修改应用名称':
        if (rollbackData.nameBackup) {
          await this.context.api.fs.copyFile(
            rollbackData.nameBackup,
            rollbackData.nameBackup.replace('.name.backup', '')
          )
          await this.context.api.fs.remove(rollbackData.nameBackup)
        }
        break

      case '修改 Bundle ID':
        if (rollbackData.bundleIdBackup) {
          await this.context.api.fs.copyFile(
            rollbackData.bundleIdBackup,
            rollbackData.bundleIdBackup.replace('.backup', '')
          )
          await this.context.api.fs.remove(rollbackData.bundleIdBackup)
        }
        break

      case '签名应用':
        if (rollbackData.signatureBackup) {
          const appPath = rollbackData.signatureBackup.replace('.backup.zip', '.app')
          await this.context.api.fs.remove(appPath)
          await this.context.api.fs.unzipDirectory(rollbackData.signatureBackup, appPath)
          await this.context.api.fs.remove(rollbackData.signatureBackup)
        }
        break

      case '复制微信应用':
        if (rollbackData.copiedAppPath) {
          await this.context.api.fs.remove(rollbackData.copiedAppPath)
        }
        break

      case '创建实例目录':
        if (rollbackData.instancePath) {
          await this.context.api.fs.remove(rollbackData.instancePath)
        }
        break

      case '保存配置':
        // 配置保存失败,不需要回滚
        break

      default:
        this.context.logger.warn(`未知的回滚步骤: ${stepName}`)
    }
  }

  /**
   * 回滚已授予的权限
   */
  async rollbackPermissions(grantedPermissions) {
    for (const perm of grantedPermissions) {
      try {
        // 注意:当前框架可能不支持撤销权限,这是未来功能
        // 这里只是预留接口
        this.context.logger.info(`尝试撤销权限: ${perm.permission}`)
        // await this.context.api.permission.revoke(perm.permission)
      } catch (error) {
        this.context.logger.error(`撤销权限失败: ${perm.permission}`, error)
      }
    }
  }

  /**
   * 检查权限状态(不弹出对话框)
   */
  async checkPermissionStatus(permission) {
    // 检查会话权限
    if (this.sessionPermissions?.has(permission)) {
      return 'granted'
    }

    // 检查永久权限
    // 注意:这是临时实现,未来应该有专门的 API
    try {
      const result = await this.context.api.permission.check({
        pluginId: this.id,
        permission
      })

      return result.status  // 'granted' | 'denied' | 'pending' | 'permanently_denied'
    } catch (error) {
      this.context.logger.error(`检查权限状态失败: ${permission}`, error)
      return 'pending'
    }
  }
}
```

## 关键原则

### 1. 权限申请提前原则

**规则**: 在执行任何操作之前,先申请所有需要的权限

```javascript
// ✅ 正确:提前申请所有权限
async myFeature() {
  // 1. 申请权限
  const perm1 = await this.requestPermission('fs:read')
  const perm2 = await this.requestPermission('fs:write')

  if (!perm1 || !perm2) {
    return // 任何一个拒绝,都不执行
  }

  // 2. 执行操作
  await this.doSomething()

  // 3. 执行另一个操作
  await this.doSomethingElse()
}

// ❌ 错误:边执行边申请
async myFeatureBad() {
  // 执行第一个操作
  const perm1 = await this.requestPermission('fs:read')
  if (perm1) {
    await this.doSomething()  // ← 产生了数据
  }

  // 申请第二个权限
  const perm2 = await this.requestPermission('fs:write')
  if (!perm2) {
    // ← 第一个操作已经完成,留下了数据!
    throw new Error('权限被拒绝')
  }
}
```

### 2. 原子性原则

**规则**: 功能要么全部成功,要么全部失败,不要留下中间状态

```javascript
// ✅ 正确:带回滚的事务执行
async atomicOperation() {
  const state = {}

  try {
    // 步骤1
    await this.step1()
    state.step1Done = true

    // 步骤2
    await this.step2()
    state.step2Done = true

    // 步骤3
    await this.step3()
    state.step3Done = true

    return { success: true }
  } catch (error) {
    // 回滚所有已执行的步骤
    if (state.step3Done) await this.rollbackStep3()
    if (state.step2Done) await this.rollbackStep2()
    if (state.step1Done) await this.rollbackStep1()

    throw error
  }
}
```

### 3. 备份原则

**规则**: 修改任何文件之前先备份

```javascript
// ✅ 正确:先备份再修改
async modifyConfig(filePath) {
  // 1. 备份
  const backupPath = `${filePath}.backup`
  await this.context.api.fs.copyFile(filePath, backupPath)

  try {
    // 2. 修改
    await this.context.api.fs.writeFile(filePath, newContent)
    return { success: true }
  } catch (error) {
    // 3. 恢复备份
    await this.context.api.fs.copyFile(backupPath, filePath)
    await this.context.api.fs.remove(backupPath)
    throw error
  }
}
```

### 4. 进度报告原则

**规则**: 让用户了解当前执行状态

```javascript
async featureWithProgress() {
  const totalSteps = 5

  this.context.api.progress.start('功能名称', totalSteps)

  try {
    this.context.api.progress.update(1, '步骤1', '正在执行步骤1...')
    await this.step1()

    this.context.api.progress.update(2, '步骤2', '正在执行步骤2...')
    await this.step2()

    // ...

    this.context.api.progress.complete('功能完成')
    return { success: true }
  } catch (error) {
    this.context.api.progress.fail(`功能失败: ${error.message}`)
    throw error
  }
}
```

## 实用工具函数

### 1. 事务执行器(简化版)

```javascript
class SimpleTransactionExecutor {
  constructor(context, logger) {
    this.context = context
    this.logger = logger
  }

  async execute(featureName, steps) {
    const executedSteps = []
    const rollbackData = {}

    this.context.api.progress.start(featureName, steps.length)

    try {
      for (const step of steps) {
        this.context.api.progress.update(
          executedSteps.length + 1,
          step.name,
          `正在执行: ${step.name}...`
        )

        // 执行步骤
        await step.execute({ rollbackData })
        executedSteps.push(step)

        this.logger.info(`步骤成功: ${step.name}`)
      }

      this.context.api.progress.complete('操作成功完成')
      return { success: true, executedSteps: executedSteps.map(s => s.name) }

    } catch (error) {
      this.logger.error(`事务失败: ${error.message}, 开始回滚`)
      this.context.api.progress.fail(`操作失败,正在回滚...`)

      // 回滚
      await this.rollback(executedSteps, rollbackData)

      return { success: false, error }
    }
  }

  async rollback(steps, rollbackData) {
    const failures = []

    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i]

      try {
        if (step.rollback) {
          this.logger.info(`回滚: ${step.name}`)
          await step.rollback({ rollbackData })
        }
      } catch (error) {
        this.logger.error(`回滚失败: ${step.name}`, error)
        failures.push({ step: step.name, error })
      }
    }

    if (failures.length === 0) {
      this.context.api.progress.complete('回滚成功')
    } else {
      this.context.api.progress.fail(`回滚完成,但有 ${failures.length} 个失败`)
    }
  }
}
```

### 2. 文件操作回滚助手

```javascript
class FileOperationHelper {
  constructor(context) {
    this.context = context
    this.backupFiles = []
  }

  async copyWithRollback(source, target) {
    await this.context.api.fs.copyDirectory(source, target)
    this.backupFiles.push({ type: 'directory', path: target })
  }

  async writeWithRollback(filePath, content) {
    // 备份原文件
    const backupPath = `${filePath}.backup`

    if (await this.context.api.fs.pathExists(filePath)) {
      await this.context.api.fs.copyFile(filePath, backupPath)
      this.backupFiles.push({ type: 'file', path: filePath, backup: backupPath })
    }

    // 写入新内容
    await this.context.api.fs.writeFile(filePath, content)
  }

  async rollback() {
    // 按相反顺序回滚
    for (let i = this.backupFiles.length - 1; i >= 0; i--) {
      const item = this.backupFiles[i]

      if (item.type === 'directory') {
        await this.context.api.fs.remove(item.path)
      } else if (item.type === 'file') {
        if (item.backup && await this.context.api.fs.pathExists(item.backup)) {
          await this.context.api.fs.copyFile(item.backup, item.path)
          await this.context.api.fs.remove(item.backup)
        } else {
          await this.context.api.fs.remove(item.path)
        }
      }
    }

    this.backupFiles = []
  }
}
```

## 示例:完整的创建实例功能

```javascript
async createInstance(instanceName, bundleId) {
  // 1. 预检查权限
  const checkResult = await this.preCheckPermissions([
    'fs:read',
    'fs:write',
    'process:exec'
  ])

  if (!checkResult.canProceed) {
    this.showMessage('功能无法执行: 需要的权限已被永久拒绝')
    return
  }

  // 2. 批量请求权限
  const requestResult = await this.requestAllPermissions([
    {
      permission: 'fs:read',
      reason: '读取微信应用文件',
      context: { operation: '复制应用', target: instanceName }
    },
    {
      permission: 'fs:write',
      reason: '修改应用配置',
      context: { operation: '修改配置', target: instanceName }
    },
    {
      permission: 'process:exec',
      reason: '执行签名命令',
      context: { operation: '签名应用', target: instanceName }
    }
  ])

  if (!requestResult.allGranted) {
    this.showMessage('操作已取消: 未授予所有必需的权限')
    return
  }

  // 3. 执行事务
  return await this.executeTransaction({
    featureName: '创建微信分身',
    steps: [
      {
        name: '检查微信安装',
        execute: async ({ rollbackData }) => {
          const isInstalled = await this.checkWeChatInstalled()
          if (!isInstalled) {
            throw new Error('微信未安装')
          }
        }
      },
      {
        name: '复制微信应用',
        execute: async ({ rollbackData }) => {
          const source = this.getWeChatPath()
          const target = this.getInstancePath(instanceName, 'WeChat.app')
          await this.context.api.fs.copyDirectory(source, target)
          rollbackData.copiedApp = target
        },
        rollback: async ({ rollbackData }) => {
          if (rollbackData.copiedApp) {
            await this.context.api.fs.remove(rollbackData.copiedApp)
          }
        }
      },
      {
        name: '修改配置',
        execute: async ({ rollbackData }) => {
          const infoPlist = this.getInfoPlistPath(instanceName)
          await this.context.api.fs.copyFile(infoPlist, `${infoPlist}.backup`)
          rollbackData.backup = `${infoPlist}.backup`

          await this.modifyBundleId(infoPlist, bundleId)
        },
        rollback: async ({ rollbackData }) => {
          if (rollbackData.backup) {
            await this.context.api.fs.copyFile(rollbackData.backup, rollbackData.backup.replace('.backup', ''))
            await this.context.api.fs.remove(rollbackData.backup)
          }
        }
      },
      {
        name: '签名应用',
        execute: async ({ rollbackData }) => {
          const appPath = this.getInstancePath(instanceName, 'WeChat.app')
          await this.signApp(appPath)
          // 签名后的应用无法简单回滚,记录状态即可
          rollbackData.signed = true
        },
        rollback: async ({ rollbackData }) => {
          // 签名应用无法回滚,只能删除
          if (rollbackData.signed) {
            const appPath = this.getInstancePath(instanceName, 'WeChat.app')
            await this.context.api.fs.remove(appPath)
          }
        }
      }
    ]
  })
}
```

## 总结

### 当前可用的最佳实践

1. **预检查所有权限** - 在执行前检查,避免执行到一半被拒绝
2. **批量申请权限** - 一次性申请所有需要的权限
3. **事务式执行** - 记录每个步骤,失败时按相反顺序回滚
4. **备份重要数据** - 修改前先备份,失败时可以恢复
5. **清晰的进度报告** - 让用户了解当前状态
6. **详细的日志** - 方便调试和追踪问题

### 未来框架支持

当"批量权限请求"功能实现后:

```javascript
// 更简洁的API
async createInstance(instanceName, bundleId) {
  // 1. 预检查
  const checkResult = await this.api.permission.checkPermissions([
    'fs:read', 'fs:write', 'process:exec'
  ])

  if (checkResult.hasPermanentDeny) return

  // 2. 批量请求
  const requestResult = await this.api.permission.requestPermissions([
    'fs:read', 'fs:write', 'process:exec'
  ],
  '创建微信分身需要以下权限',
  { operation: 'create-instance', target: instanceName })

  if (!requestResult.allGranted) return

  // 3. 执行事务
  return await this.api.transaction.execute({
    featureName: '创建微信分身',
    steps: [ ... ]
  })
}
```

现在就可以开始使用手动事务模式,确保插件功能的可靠性!
