/**
 * 事务系统
 *
 * 提供原子性操作执行和自动回滚能力
 */

export {
  TransactionExecutor,
  type TransactionStep,
  type Transaction,
  type TransactionOptions,
  type TransactionResult,
  type ProgressReporter
} from './transaction-executor'

export {
  TransactionBuilder,
  createTransactionBuilder
} from './transaction-builder'

export {
  TransactionLogger,
  type TransactionLogEntry,
  queryTransactionLogs,
  getTransactionSummaries
} from './transaction-logger'
