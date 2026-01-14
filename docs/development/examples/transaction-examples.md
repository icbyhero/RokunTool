# 事务系统使用示例

本文档提供了事务系统的完整使用示例,展示如何在插件中使用事务 API。

## 目录

- [示例 1: 微信分身创建](#示例-1-微信分身创建)
- [示例 2: Rime 配方安装](#示例-2-rime-配方安装)
- [示例 3: 使用回滚辅助类](#示例-3-使用回滚辅助类)
- [最佳实践](#最佳实践)

## 示例 1: 微信分身创建

完整展示如何使用事务 API 创建微信分身,包含权限请求、进度报告和错误处理。

### 实现代码

```typescript
import { BasePlugin } from '@main/plugins/base-plugin'
import { FileRollback } from '@main/transactions/rollback/file-rollback'
import { ProcessRollback } from '@main/transactions/rollback/process-rollback'
import { join } from 'path'

/**
 * 微信分身插件
 */
export class WeChatMultiInstancePlugin extends BasePlugin {
  private readonly instancesDir = '/path/to/instances'

  /**
   * 创建微信分身
   */
  async createInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    // 阶段 1: 功能级权限请求
    const granted = await this.requestFeaturePermissions(
      '创建微信分身',
      [
        {
          permission: 'fs:read',
          required: true,
          reason: '读取微信应用文件'
        },
        {
          permission: 'fs:write',
          required: true,
          reason: '创建分身目录和修改文件'
        },
        {
          permission: 'process:exec',
          required: true,
          reason: '执行应用签名命令'
        }
      ],
      `将创建名为 "${instanceName}" 的独立微信应用副本`
    )

    if (!granted) {
      this.logger.warn('用户拒绝了创建分身的权限请求')
      return { success: false, error: '权限不足' }
    }

    // 阶段 2: 定义事务
    const instancePath = join(this.instancesDir, instanceName)
    const wechatPath = '/Applications/WeChat.app'

    const transaction = this.createTransactionBuilder()
      .name('创建微信分身')
      .addStep({
        name: '检查源文件',
        execute: async () => {
          this.logger.info('检查微信应用是否存在...')

          const fs = require('fs').promises
          try {
            await fs.access(wechatPath)
            this.logger.info('微信应用存在')
          } catch (error) {
            throw new Error('微信应用不存在,请先安装微信')
          }
        }
      })
      .addStep({
        name: '创建分身目录',
        execute: async () => {
          this.logger.info('创建分身目录...')

          const fs = require('fs').promises
          await fs.mkdir(instancePath, { recursive: true })
          this.logger.info(`目录已创建: ${instancePath}`)
        },
        rollback: async () => {
          this.logger.info('删除分身目录...')
          const fs = require('fs').promises
          await fs.rm(instancePath, { recursive: true, force: true })
          this.logger.info('目录已删除')
        }
      })
      .addStep({
        name: '复制微信应用',
        execute: async () => {
          this.logger.info('开始复制微信应用...')

          const fs = require('fs').promises
          await fs.cp(wechatPath, join(instancePath, 'WeChat.app'), { recursive: true })

          this.logger.info('微信应用复制完成')
        },
        rollback: async () => {
          this.logger.info('删除复制的应用...')
          const fs = require('fs').promises
          await fs.rm(join(instancePath, 'WeChat.app'), { recursive: true, force: true })
          this.logger.info('应用已删除')
        }
      })
      .addStep({
        name: '修改 Bundle ID',
        execute: async () => {
          this.logger.info('修改应用 Bundle ID...')

          const plistPath = join(instancePath, 'WeChat.app/Contents/Info.plist')
          const fs = require('fs').promises

          // 读取原文件
          const content = await fs.readFile(plistPath, 'utf8')

          // 备份 (用于回滚)
          await FileRollback.writeFile(plistPath, content.replace(
            /<key>CFBundleIdentifier<\/key>\s*<string>.*?<\/string>/,
            `<key>CFBundleIdentifier</key>\n\t<string>com.tencent.wechat.${instanceName}</string>`
          ))

          this.logger.info('Bundle ID 修改完成')
        },
        rollback: async () => {
          this.logger.info('恢复 Bundle ID...')
          // FileRollback 会自动处理备份恢复
          this.logger.info('Bundle ID 已恢复')
        }
      })
      .addStep({
        name: '签名应用',
        execute: async () => {
          this.logger.info('开始签名应用...')

          const { exec } = require('child_process')
          const signCommand = `codesign --force --deep --sign - "${join(instancePath, 'WeChat.app')}"`

          await new Promise<void>((resolve, reject) => {
            exec(signCommand, (error: any, stdout: string, stderr: string) => {
              if (error) {
                this.logger.error(`签名失败: ${stderr}`)
                reject(new Error(`签名失败: ${stderr}`))
              } else {
                this.logger.info('应用签名完成')
                resolve()
              }
            })
          })
        },
        rollback: async () => {
          this.logger.info('应用签名已自动回滚(通过删除应用)')
        }
      })
      .build()

    // 阶段 3: 执行事务
    try {
      this.progressStart('创建微信分身', 5)

      const result = await this.context.api.transaction.execute(transaction)

      if (result.success) {
        this.progressComplete('success')
        this.showMessage('分身创建成功!', 'info')
        return { success: true }
      } else {
        this.progressComplete('error', result.error)
        this.showMessage(`创建失败: ${result.error}`, 'error')
        return { success: false, error: result.error }
      }
    } catch (error) {
      this.progressComplete('error', error instanceof Error ? error.message : '未知错误')
      this.logger.error('创建分身时出错:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  }
}

export default new WeChatMultiInstancePlugin()
```

### 执行流程

```
1. 权限预检查
   ├─ fs:read  ✅ 已授予
   ├─ fs:write ⏳ 需要用户确认
   └─ process:exec ⏳ 需要用户确认

2. 显示功能权限对话框
   └─ 用户选择"永久授权"

3. 开始执行事务
   ├─ 步骤 1/5: 检查源文件 ... ✅
   ├─ 步骤 2/5: 创建分身目录 ... ✅
   ├─ 步骤 3/5: 复制微信应用 ... ✅
   ├─ 步骤 4/5: 修改 Bundle ID ... ✅
   └─ 步骤 5/5: 签名应用 ... ✅

4. 事务完成
   └─ ✅ 成功!
```

### 失败回滚流程

```
1. 权限已授予

2. 执行到步骤 3 时失败
   ├─ 步骤 1/5: 检查源文件 ... ✅
   ├─ 步骤 2/5: 创建分身目录 ... ✅
   └─ 步骤 3/5: 复制微信应用 ... ❌ (磁盘空间不足)

3. 自动回滚已执行的步骤
   ├─ 回滚步骤 2: 删除分身目录 ... ✅
   └─ 步骤 1 不需要回滚

4. 事务失败
   └─ ❌ 失败,但系统已恢复原状
```

## 示例 2: Rime 配方安装

展示如何使用事务 API 安装 Rime 配方,包含网络请求、文件操作和配置修改。

### 实现代码

```typescript
import { BasePlugin } from '@main/plugins/base-plugin'
import { FileRollback } from '@main/transactions/rollback/file-rollback'
import { ConfigRollback } from '@main/transactions/rollback/config-rollback'
import { join } from 'path'

/**
 * Rime 配置插件
 */
export class RimeConfigPlugin extends BasePlugin {
  private readonly rimeUserDir = '/path/to/rime/user'

  /**
   * 安装配方
   */
  async installRecipe(recipeId: string): Promise<{ success: boolean; error?: string }> {
    // 阶段 1: 权限请求
    const granted = await this.requestFeaturePermissions(
      '安装 Rime 配方',
      [
        {
          permission: 'fs:read',
          required: true,
          reason: '读取 Rime 配置文件'
        },
        {
          permission: 'fs:write',
          required: true,
          reason: '写入配方文件和修改配置'
        },
        {
          permission: 'network:http',
          required: true,
          reason: '下载配方文件'
        }
      ],
      `将安装配方 "${recipeId}" 到 Rime`
    )

    if (!granted) {
      return { success: false, error: '权限不足' }
    }

    // 阶段 2: 定义事务
    const recipeUrl = `https://github.com/rime-recipes/${recipeId}/archive/main.zip`
    const tempZipPath = join(this.context.dataDir, `${recipeId}.zip`)
    const tempExtractPath = join(this.context.dataDir, recipeId)

    const transaction = this.createTransactionBuilder()
      .name('安装 Rime 配方')
      .addStep({
        name: '创建备份',
        execute: async () => {
          this.logger.info('创建 Rime 配置备份...')

          const backupPath = join(this.context.dataDir, `backup-${Date.now()}`)
          const fs = require('fs').promises

          await fs.mkdir(backupPath, { recursive: true })

          // 备份关键配置文件
          const filesToBackup = ['default.custom.yaml', 'squirrel.custom.yaml']
          for (const file of filesToBackup) {
            const sourcePath = join(this.rimeUserDir, file)
            try {
              await fs.copyFile(sourcePath, join(backupPath, file))
              this.logger.info(`已备份: ${file}`)
            } catch (error) {
              // 文件不存在,忽略
            }
          }

          // 保存备份路径供回滚使用
          await this.setConfig('lastBackup', backupPath)
          this.logger.info('备份创建完成')
        }
      })
      .addStep({
        name: '检查冲突',
        execute: async () => {
          this.logger.info('检查配方冲突...')

          const fs = require('fs').promises
          const schemaListPath = join(this.rimeUserDir, 'schema_list.yaml')

          try {
            const content = await fs.readFile(schemaListPath, 'utf8')
            if (content.includes(recipeId)) {
              throw new Error(`配方 ${recipeId} 已安装`)
            }
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
              throw error
            }
          }

          this.logger.info('无冲突,可以安装')
        }
      })
      .addStep({
        name: '下载配方文件',
        execute: async () => {
          this.logger.info(`下载配方: ${recipeUrl}`)

          const https = require('https')
          const fs = require('fs')

          await new Promise<void>((resolve, reject) => {
            const file = fs.createWriteStream(tempZipPath)

            https.get(recipeUrl, (response: any) => {
              if (response.statusCode !== 200) {
                reject(new Error(`下载失败: ${response.statusCode}`))
                return
              }

              response.pipe(file)

              file.on('finish', () => {
                file.close()
                this.logger.info('下载完成')
                resolve()
              })

              file.on('error', (error: Error) => {
                fs.unlink(tempZipPath, () => {})
                reject(error)
              })
            })
          })
        },
        rollback: async () => {
          this.logger.info('删除下载的临时文件...')
          const fs = require('fs').promises
          try {
            await fs.unlink(tempZipPath)
            this.logger.info('临时文件已删除')
          } catch (error) {
            // 文件可能不存在
          }
        }
      })
      .addStep({
        name: '解压配方文件',
        execute: async () => {
          this.logger.info('解压配方文件...')

          const { exec } = require('child_process')

          await new Promise<void>((resolve, reject) => {
            exec(`unzip -q "${tempZipPath}" -d "${this.context.dataDir}"`, (error: any) => {
              if (error) {
                reject(new Error(`解压失败: ${error.message}`))
              } else {
                this.logger.info('解压完成')
                resolve()
              }
            })
          })
        },
        rollback: async () => {
          this.logger.info('删除解压的文件...')
          const fs = require('fs').promises
          try {
            await fs.rm(tempExtractPath, { recursive: true, force: true })
            this.logger.info('解压文件已删除')
          } catch (error) {
            // 目录可能不存在
          }
        }
      })
      .addStep({
        name: '复制配方文件',
        execute: async () => {
          this.logger.info('复制配方到 Rime 目录...')

          const fs = require('fs').promises
          const recipeSourceDir = join(tempExtractPath, `${recipeId}-main`)

          // 复制所有 .yaml 文件
          const files = await fs.readdir(recipeSourceDir)
          const yamlFiles = files.filter(f => f.endsWith('.yaml'))

          for (const file of yamlFiles) {
            await fs.copyFile(
              join(recipeSourceDir, file),
              join(this.rimeUserDir, file)
            )
            this.logger.info(`已复制: ${file}`)
          }

          this.logger.info('配方文件复制完成')
        },
        rollback: async () => {
          this.logger.info('删除复制的配方文件...')

          const fs = require('fs').promises
          try {
            const recipeSourceDir = join(tempExtractPath, `${recipeId}-main`)
            const files = await fs.readdir(recipeSourceDir)
            const yamlFiles = files.filter(f => f.endsWith('.yaml'))

            for (const file of yamlFiles) {
              try {
                await fs.unlink(join(this.rimeUserDir, file))
                this.logger.info(`已删除: ${file}`)
              } catch (error) {
                // 文件可能不存在
              }
            }

            this.logger.info('配方文件已删除')
          } catch (error) {
            this.logger.error('删除配方文件时出错:', error)
          }
        }
      })
      .addStep({
        name: '更新配置文件',
        execute: async () => {
          this.logger.info('更新 schema_list.yaml...')

          const schemaListPath = join(this.rimeUserDir, 'schema_list.yaml')

          await ConfigRollback.modifyJsonWithRollback(schemaListPath, (content: any) => {
            if (!content.schema_list) {
              content.schema_list = []
            }
            content.schema_list.push({
              schema: `${recipeId}`
            })
            return content
          })

          this.logger.info('配置文件已更新')
        },
        rollback: async () => {
          this.logger.info('恢复配置文件...')
          // ConfigRollback 会自动处理备份恢复
          this.logger.info('配置文件已恢复')
        }
      })
      .addStep({
        name: '清理临时文件',
        execute: async () => {
          this.logger.info('清理临时文件...')

          const fs = require('fs').promises

          // 删除下载的 zip 文件
          try {
            await fs.unlink(tempZipPath)
          } catch (error) {
            // 文件可能已删除
          }

          // 删除解压目录
          try {
            await fs.rm(tempExtractPath, { recursive: true, force: true })
          } catch (error) {
            // 目录可能已删除
          }

          this.logger.info('临时文件清理完成')
        }
      })
      .build()

    // 阶段 3: 执行事务
    try {
      this.progressStart('安装 Rime 配方', 7)

      const result = await this.context.api.transaction.execute(transaction)

      if (result.success) {
        this.progressComplete('success')
        this.showMessage('配方安装成功!请重新部署 Rime', 'info')
        return { success: true }
      } else {
        this.progressComplete('error', result.error)
        this.showMessage(`安装失败: ${result.error}`, 'error')
        return { success: false, error: result.error }
      }
    } catch (error) {
      this.progressComplete('error', error instanceof Error ? error.message : '未知错误')
      this.logger.error('安装配方时出错:', error)
      return { success: false, error: error instanceof Error ? error.message : '未知错误' }
    }
  }
}

export default new RimeConfigPlugin()
```

## 示例 3: 使用回滚辅助类

展示如何使用回滚辅助类简化回滚逻辑。

### 使用 FileRollback

```typescript
import { FileRollback } from '@main/transactions/rollback/file-rollback'

// 在事务步骤中使用
.addStep({
  name: '写入配置文件',
  execute: async () => {
    const filePath = '/path/to/config.yaml'
    const newContent = 'key: value'

    // 使用 FileRollback 自动处理备份和回滚
    await FileRollback.writeFile(filePath, newContent)

    // 如果后续步骤失败,FileRollback 会自动恢复原文件
  },
  rollback: async () => {
    // FileRollback 已经处理了备份恢复,这里不需要额外操作
    this.logger.info('配置文件已自动恢复')
  }
})
```

### 使用 ProcessRollback

```typescript
import { ProcessRollback } from '@main/transactions/rollback/process-rollback'

.addStep({
  name: '启动后台服务',
  execute: async () => {
    const command = 'python'
    const args = ['-m', 'http.server', '8080']

    // 使用 ProcessRollback 自动管理进程生命周期
    const pid = await ProcessRollback.spawnWithRollback(command, args)

    // 保存 PID 供后续使用
    await this.setConfig('servicePid', pid)
  },
  rollback: async () => {
    const pid = await this.getConfig<number>('servicePid')

    // ProcessRollback 会自动终止进程并清理子进程
    await ProcessRollback.rollback(pid)

    this.logger.info('后台服务已停止')
  }
})
```

### 使用 ConfigRollback

```typescript
import { ConfigRollback } from '@main/transactions/rollback/config-rollback'

.addStep({
  name: '修改配置',
  execute: async () => {
    const configPath = '/path/to/config.json'

    // 使用 ConfigRollback 修改配置并自动备份
    await ConfigRollback.modifyJsonWithRollback(configPath, (config) => {
      config.featureEnabled = true
      config.maxConnections = 100
      return config
    })

    // 如果后续步骤失败,配置会自动恢复
  },
  rollback: async () => {
    // ConfigRollback 已经处理了备份恢复
    this.logger.info('配置已自动恢复')
  }
})
```

## 最佳实践

### 1. 权限请求时机

❌ **错误**: 在执行过程中请求权限

```typescript
async badExample() {
  // 步骤 1
  await this.step1() // 需要 fs:read

  // 步骤 2 - 这里才请求权限!
  const granted = await this.requestPermission('fs:write')
  if (!granted) {
    // 步骤 1 已经执行,但无法完成步骤 2
    // 留下了垃圾数据!
  }
}
```

✅ **正确**: 在执行前请求所有权限

```typescript
async goodExample() {
  // 1. 先请求所有需要的权限
  const granted = await this.requestFeaturePermissions(
    '功能名称',
    [
      { permission: 'fs:read', required: true },
      { permission: 'fs:write', required: true }
    ]
  )

  if (!granted) {
    return // 权限未授予,不执行任何操作
  }

  // 2. 权限已授予,安全执行
  await this.step1()
  await this.step2()
}
```

### 2. 事务粒度

❌ **错误**: 事务太大

```typescript
// 一个事务包含太多步骤,难以调试
const transaction = this.createTransactionBuilder()
  .name('大事务')
  .addStep({ name: '步骤 1', ... })
  .addStep({ name: '步骤 2', ... })
  // ... 100 个步骤
  .addStep({ name: '步骤 100', ... })
```

✅ **正确**: 合理的粒度

```typescript
// 将大任务分解为多个小事务
async installComplete() {
  // 事务 1: 下载
  await this.executeTransaction({
    name: '下载文件',
    steps: [...]
  })

  // 事务 2: 安装
  await this.executeTransaction({
    name: '安装文件',
    steps: [...]
  })

  // 事务 3: 配置
  await this.executeTransaction({
    name: '配置系统',
    steps: [...]
  })
}
```

### 3. 回滚可靠性

❌ **错误**: 回滚可能失败

```typescript
.addStep({
  name: '修改数据库',
  execute: async () => {
    await db.update({ ... })
  },
  rollback: async () => {
    // 如果数据库连接断开,回滚会失败!
    await db.revert({ ... })
  }
})
```

✅ **正确**: 健壮的回滚

```typescript
.addStep({
  name: '修改数据库',
  execute: async () => {
    // 先记录变更
    await this.recordChange('db-update', { before: oldValue, after: newValue })

    // 再执行修改
    await db.update({ ... })
  },
  rollback: async () => {
    try {
      // 尝试直接回滚
      await db.revert({ ... })
    } catch (error) {
      // 如果回滚失败,使用记录的数据手动恢复
      const change = await this.getChange('db-update')
      await db.restore(change.before)
    }
  }
})
```

### 4. 进度报告

❌ **错误**: 不报告进度或更新不正确

```typescript
async badExample() {
  this.progressStart('安装', 5)

  await step1()
  await step2() // 忘记更新进度
  await step3()
  await step4()
  await step5()

  this.progressComplete('success')
}
```

✅ **正确**: 实时更新进度

```typescript
async goodExample() {
  this.progressStart('安装', 5)

  this.progressUpdate(1, '检查依赖', '正在检查系统依赖...')
  await step1()

  this.progressUpdate(2, '下载文件', '正在下载必要文件...')
  await step2()

  this.progressUpdate(3, '安装文件', '正在安装...')
  await step3()

  this.progressUpdate(4, '配置系统', '正在配置...')
  await step4()

  this.progressUpdate(5, '完成安装', '正在清理临时文件...')
  await step5()

  this.progressComplete('success')
}
```

### 5. 错误处理

❌ **错误**: 吞掉错误

```typescript
async badExample() {
  try {
    await this.executeTransaction(transaction)
  } catch (error) {
    // 什么都不做,用户不知道发生了什么
  }
}
```

✅ **正确**: 清晰的错误提示

```typescript
async goodExample() {
  try {
    const result = await this.executeTransaction(transaction)

    if (!result.success) {
      this.showMessage(`操作失败: ${result.error}`, 'error')
      return { success: false, error: result.error }
    }

    this.showMessage('操作成功!', 'info')
    return { success: true }
  } catch (error) {
    this.logger.error('操作出错:', error)
    this.showMessage(
      `操作失败: ${error instanceof Error ? error.message : '未知错误'}`,
      'error'
    )
    return { success: false, error: error instanceof Error ? error.message : '未知错误' }
  }
}
```

## 总结

使用事务 API 的关键点:

1. ✅ **权限预检**: 在执行前请求所有权限
2. ✅ **原子操作**: 使用事务保证操作完整性
3. ✅ **自动回滚**: 为每个步骤定义回滚逻辑
4. ✅ **进度报告**: 实时更新操作进度
5. ✅ **错误处理**: 提供清晰的错误信息
6. ✅ **使用辅助类**: 利用回滚辅助类简化开发

遵循这些最佳实践,可以开发出稳定、可靠的插件!
