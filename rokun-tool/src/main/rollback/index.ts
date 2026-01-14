/**
 * 回滚辅助工具
 *
 * 导出所有回滚辅助函数,提供统一接口
 */

// 文件操作回滚
export {
  copyWithRollback,
  writeWithRollback,
  mkdirWithRollback,
  moveWithRollback,
  copyDirWithRollback
} from './file-rollback'

// 进程操作回滚
export {
  spawnWithRollback,
  execWithRollback,
  waitForProcess,
  killProcesses,
  type SpawnOptions,
  type ProcessResult
} from './process-rollback'

// 配置修改回滚
export {
  modifyJsonWithRollback,
  modifyConfigValueWithRollback,
  modifyConfigValuesWithRollback,
  deleteConfigValueWithRollback,
  type ConfigModifyOptions
} from './config-rollback'
