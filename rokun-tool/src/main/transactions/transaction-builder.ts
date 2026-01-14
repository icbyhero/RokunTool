/**
 * 事务构建器
 *
 * 提供流式 API 来构建事务
 */

import type { Transaction, TransactionOptions, TransactionStep } from './transaction-executor'

/**
 * 事务构建器类
 */
export class TransactionBuilder {
  private transaction: Partial<Transaction> = {
    steps: []
  }

  /**
   * 设置事务 ID
   */
  id(id: string): this {
    this.transaction.id = id
    return this
  }

  /**
   * 设置事务名称
   */
  name(name: string): this {
    this.transaction.name = name
    return this
  }

  /**
   * 设置事务描述
   */
  description(description: string): this {
    this.transaction.description = description
    return this
  }

  /**
   * 设置插件 ID
   */
  pluginId(pluginId: string): this {
    this.transaction.pluginId = pluginId
    return this
  }

  /**
   * 设置事务选项
   */
  options(options: TransactionOptions): this {
    this.transaction.options = options
    return this
  }

  /**
   * 添加一个步骤
   */
  addStep(step: TransactionStep): this {
    if (!this.transaction.steps) {
      this.transaction.steps = []
    }
    this.transaction.steps.push(step)
    return this
  }

  /**
   * 添加多个步骤
   */
  addSteps(steps: TransactionStep[]): this {
    if (!this.transaction.steps) {
      this.transaction.steps = []
    }
    this.transaction.steps.push(...steps)
    return this
  }

  /**
   * 构建事务
   */
  build(): Transaction {
    // 验证必需字段
    if (!this.transaction.id) {
      throw new Error('事务 ID 不能为空')
    }
    if (!this.transaction.name) {
      throw new Error('事务名称不能为空')
    }
    if (!this.transaction.pluginId) {
      throw new Error('插件 ID 不能为空')
    }
    if (!this.transaction.steps || this.transaction.steps.length === 0) {
      throw new Error('事务必须至少包含一个步骤')
    }

    return this.transaction as Transaction
  }
}

/**
 * 创建事务构建器
 */
export function createTransactionBuilder(): TransactionBuilder {
  return new TransactionBuilder()
}
