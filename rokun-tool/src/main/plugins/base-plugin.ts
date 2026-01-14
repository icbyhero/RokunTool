/**
 * BasePlugin - 插件基类
 *
 * 提供常用方法和辅助功能,简化插件开发
 *
 * @example
 * ```typescript
 * import { BasePlugin } from './base-plugin'
 *
 * class MyPlugin extends BasePlugin {
 *   async onEnable() {
 *     // 使用基类提供的方法
 *     const result = await this.executeTransaction({
 *       name: '我的功能',
 *       steps: [...]
 *     })
 *   }
 * }
 * ```
 */

import type { PluginContext, PluginHooks } from '@shared/types/plugin'

/**
 * 插件基类
 * 提供常用方法和默认实现
 */
export abstract class BasePlugin implements PluginHooks {
  /** 插件上下文 - 由框架注入 */
  protected context!: PluginContext

  /** 插件元数据快捷访问 */
  get metadata() {
    return this.context.metadata
  }

  /** 插件日志快捷访问 */
  get logger() {
    return this.context.logger
  }

  /** 插件 API 快捷访问 */
  get api() {
    return this.context.api
  }

  /**
   * 插件加载时调用
   * 子类可以覆盖此方法
   */
  async onLoad?(context: PluginContext): Promise<void>

  /**
   * 插件启用时调用
   * 子类可以覆盖此方法
   */
  async onEnable?(context: PluginContext): Promise<void>

  /**
   * 插件禁用时调用
   * 子类可以覆盖此方法
   */
  async onDisable?(context: PluginContext): Promise<void>

  /**
   * 插件卸载时调用
   * 子类可以覆盖此方法
   */
  async onUnload?(context: PluginContext): Promise<void>

  /**
   * 设置插件上下文
   * 由框架在加载插件时调用
   *
   * @internal
   */
  _setContext(context: PluginContext): void {
    this.context = context
  }

  /**
   * 辅助方法: 执行事务
   *
   * 简化了事务执行流程,自动包含插件ID
   *
   * @param transaction 事务配置
   * @returns 事务执行结果
   *
   * @example
   * ```typescript
   * const result = await this.executeTransaction({
   *   name: '安装配方',
   *   steps: [
   *     {
   *       name: '下载文件',
   *       execute: async () => { ... },
   *       rollback: async () => { ... }
   *     }
   *   ]
   * })
   * ```
   */
  protected async executeTransaction(transaction: {
    name: string
    steps: Array<{
      name: string
      execute: () => Promise<void>
      rollback?: () => Promise<void>
      timeout?: number
    }>
    rollbackOnError?: boolean
    stopOnFirstError?: boolean
  }) {
    return this.context.api.transaction.execute({
      id: `${this.metadata.id}-${Date.now()}`,
      name: transaction.name,
      pluginId: this.metadata.id,
      steps: transaction.steps,
      rollbackOnError: transaction.rollbackOnError ?? true,
      stopOnFirstError: transaction.stopOnFirstError ?? true
    })
  }

  /**
   * 辅助方法: 创建事务构建器
   *
   * 提供流式 API 构建复杂事务
   *
   * @returns 事务构建器
   *
   * @example
   * ```typescript
   * const transaction = this.createTransactionBuilder()
   *   .name('创建分身')
   *   .addStep({
   *     name: '复制文件',
   *     execute: async () => { ... },
   *     rollback: async () => { ... }
   *   })
   *   .addStep({
   *     name: '修改配置',
   *     execute: async () => { ... },
   *     rollback: async () => { ... }
   *   })
   *   .build()
   *
   * const result = await this.executeTransaction(transaction)
   * ```
   */
  protected createTransactionBuilder() {
    return this.context.api.transaction.createBuilder()
      .pluginId(this.metadata.id)
  }

  /**
   * 辅助方法: 功能级权限请求
   *
   * 简化权限请求流程
   *
   * @param featureName 功能名称
   * @param permissions 权限数组
   * @param featureDescription 功能描述
   * @returns 是否所有权限都已授予
   *
   * @example
   * ```typescript
   * const granted = await this.requestFeaturePermissions(
   *   '创建微信分身',
   *   [
   *     { permission: 'fs:read', required: true, reason: '读取微信应用' },
   *     { permission: 'fs:write', required: true, reason: '写入分身文件' },
   *     { permission: 'process:exec', required: true, reason: '执行签名命令' }
   *   ],
   *   '将创建独立的微信应用副本'
   * )
   *
   * if (!granted) {
   *   this.logger.warn('用户拒绝了权限请求')
   *   return
   * }
   *
   * // 继续执行功能...
   * ```
   */
  protected async requestFeaturePermissions(
    featureName: string,
    permissions: Array<{
      permission: string
      required: boolean
      reason?: string
    }>,
    featureDescription?: string
  ): Promise<boolean> {
    return this.context.api.permission.requestFeaturePermissions(
      featureName,
      permissions,
      featureDescription
    )
  }

  /**
   * 辅助方法: 检查权限
   *
   * @param permission 权限名称
   * @returns 权限状态
   */
  protected async checkPermission(permission: string) {
    return this.context.api.permission.check(permission as any)
  }

  /**
   * 辅助方法: 批量检查权限
   *
   * @param permissions 权限数组
   * @returns 权限检查结果
   */
  protected async checkPermissions(permissions: string[]) {
    return this.context.api.permission.checkPermissions(permissions as any[])
  }

  /**
   * 辅助方法: 显示进度开始
   *
   * @param operation 操作名称
   * @param totalSteps 总步骤数
   *
   * @example
   * ```typescript
   * this.progressStart('安装配方', 5)
   * ```
   */
  protected progressStart(operation: string, totalSteps?: number) {
    this.context.api.progress.start(operation, totalSteps)
  }

  /**
   * 辅助方法: 更新进度
   *
   * @param currentStep 当前步骤
   * @param stepName 步骤名称
   * @param details 详细信息
   *
   * @example
   * ```typescript
   * this.progressUpdate(1, '创建备份', '正在备份配置文件...')
   * ```
   */
  protected progressUpdate(currentStep: number, stepName?: string, details?: string) {
    this.context.api.progress.update(currentStep, stepName, details)
  }

  /**
   * 辅助方法: 完成进度
   *
   * @param result 操作结果
   * @param error 错误信息
   *
   * @example
   * ```typescript
   * // 成功
   * this.progressComplete('success')
   *
   * // 失败
   * this.progressComplete('error', '无法连接到服务器')
   * ```
   */
  protected progressComplete(result: 'success' | 'error', error?: string) {
    this.context.api.progress.complete(result, error)
  }

  /**
   * 辅助方法: 显示消息
   *
   * @param message 消息内容
   * @param type 消息类型
   */
  protected showMessage(message: string, type?: 'info' | 'warning' | 'error') {
    this.context.api.ui.showMessage(message, type)
  }

  /**
   * 辅助方法: 显示通知
   *
   * @param title 标题
   * @param body 内容
   */
  protected showNotification(title: string, body: string) {
    this.context.api.ui.showNotification(title, body)
  }

  /**
   * 辅助方法: 读取配置
   *
   * @param key 配置键
   * @returns 配置值
   */
  protected async getConfig<T = any>(key: string): Promise<T> {
    return this.context.api.config.get<T>(key)
  }

  /**
   * 辅助方法: 写入配置
   *
   * @param key 配置键
   * @param value 配置值
   */
  protected async setConfig(key: string, value: any): Promise<void> {
    return this.context.api.config.set(key, value)
  }

  /**
   * 辅助方法: 删除配置
   *
   * @param key 配置键
   */
  protected async deleteConfig(key: string): Promise<void> {
    return this.context.api.config.delete(key)
  }

  /**
   * 辅助方法: 检查配置是否存在
   *
   * @param key 配置键
   * @returns 是否存在
   */
  protected async hasConfig(key: string): Promise<boolean> {
    return this.context.api.config.has(key)
  }
}
