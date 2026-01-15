/**
 * 插件沙箱
 *
 * 使用 VM 沙箱隔离插件代码执行,防止插件访问危险的全局对象
 */

import { createContext, runInNewContext } from 'vm'
import type { PluginMetadata } from '@shared/types/plugin'

/**
 * 沙箱配置
 */
export interface SandboxConfig {
  /** 是否启用沙箱 */
  enabled: boolean
  /** 执行超时时间 (毫秒) */
  timeout: number
  /** 是否严格模式 */
  strict: boolean
  /** 是否输出详细日志 */
  verbose: boolean
}

/**
 * 沙箱上下文选项
 */
export interface SandboxContextOptions {
  /** 插件元数据 */
  metadata: PluginMetadata
  /** 插件数据目录 */
  dataDir: string
  /** 插件 API */
  api: any
  /** 环境变量 */
  env: {
    HOME: string
    USER?: string
    PATH?: string
  }
}

/**
 * 插件沙箱类
 */
export class PluginSandbox {
  private config: SandboxConfig

  constructor(config: SandboxConfig) {
    this.config = config
  }

  /**
   * 创建沙箱执行上下文
   *
   * 根据配置返回不同的上下文:
   * - 开发模式: 返回完整的上下文 (包含 require, process, global)
   * - 生产模式: 返回受限的上下文 (移除危险全局对象)
   */
  createSandboxContext(options: SandboxContextOptions): any {
    const { metadata, dataDir, api, env } = options

    // 开发模式: 返回完整上下文
    if (!this.config.enabled) {
      if (this.config.verbose) {
        console.log(`🔓 开发模式: ${metadata.id} 使用完整上下文`)
      }

      return {
        // 提供完整的 Node.js 全局对象
        require: require,
        process: process,
        global: global,
        module: { exports: {} },
        exports: {},
        __dirname: dataDir,
        __filename: `${dataDir}/index.js`,

        // 插件上下文
        context: {
          metadata,
          dataDir,
          env,
          logger: console,
          api
        }
      }
    }

    // 生产模式: 返回受限的沙箱上下文
    if (this.config.verbose) {
      console.log(`🔒 生产模式: ${metadata.id} 使用沙箱上下文`)
    }

    return {
      // 移除危险的全局对象
      // 不提供 require, process, global

      // 仅提供安全的模块系统对象
      module: { exports: {} },
      exports: {},
      __dirname: dataDir,
      __filename: `${dataDir}/index.js`,

      // 插件上下文
      context: {
        metadata,
        dataDir,
        env,
        logger: console,
        api
      }
    }
  }

  /**
   * 在沙箱中执行插件代码
   *
   * @param code - 插件代码
   * @param sandboxContext - 沙箱上下文
   * @param timeout - 执行超时时间 (毫秒)
   * @returns 插件导出的内容
   */
  runInSandbox(code: string, sandboxContext: any, timeout?: number): any {
    // 如果沙箱禁用 (开发模式),直接执行
    if (!this.config.enabled) {
      if (this.config.verbose) {
        console.log('🔓 开发模式: 直接执行插件代码 (无沙箱)')
      }
      return this.runWithoutSandbox(code, sandboxContext)
    }

    // 生产模式: 使用 VM 沙箱执行
    if (this.config.verbose) {
      console.log('🔒 生产模式: 使用 VM 沙箱执行插件代码')
    }
    return this.runInVM(code, sandboxContext, timeout || this.config.timeout)
  }

  /**
   * 不使用沙箱直接执行代码 (开发模式)
   */
  private runWithoutSandbox(code: string, context: any): any {
    try {
      // 创建包装函数,注入上下文
      const fn = new Function(
        'module',
        'exports',
        'require',
        'process',
        'global',
        '__dirname',
        '__filename',
        'context',
        code
      )

      const module = { exports: {} }

      // 执行插件代码
      fn(
        module,
        module.exports,
        context.require,
        context.process,
        context.global,
        context.__dirname,
        context.__filename,
        context.context
      )

      return module.exports
    } catch (error) {
      throw new Error(`插件代码执行失败: ${(error as Error).message}`)
    }
  }

  /**
   * 使用 VM 沙箱执行代码 (生产模式)
   */
  private runInVM(code: string, context: any, timeout: number): any {
    try {
      // 创建 VM 上下文
      const vmContext = createContext(context)

      // 包装代码以支持模块系统
      const wrappedCode = `
        (function() {
          var module = { exports: {} };
          var exports = module.exports;

          // 执行插件代码
          ${code}

          return module.exports;
        })();
      `

      // 在沙箱中执行代码
      const result = runInNewContext(wrappedCode, vmContext, {
        timeout,
        displayErrors: true
      })

      return result
    } catch (error) {
      if ((error as any).code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
        throw new Error(`插件执行超时 (${timeout}ms)`)
      }
      throw new Error(`沙箱执行失败: ${(error as Error).message}`)
    }
  }

  /**
   * 验证代码是否安全
   *
   * 检查代码中是否包含危险的模式
   */
  validateCode(code: string): {
    safe: boolean
    violations: Array<{
      line: number
      pattern: string
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
    }>
  } {
    const violations: Array<{
      line: number
      pattern: string
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
    }> = []

    // 危险模式列表
    const patterns = [
      {
        regex: /\brequire\(/,
        severity: 'CRITICAL' as const,
        name: 'require() 调用'
      },
      {
        regex: /\bprocess\.[a-zA-Z]/,
        severity: 'HIGH' as const,
        name: 'process 对象访问'
      },
      {
        regex: /\beval\(/,
        severity: 'CRITICAL' as const,
        name: 'eval() 调用'
      },
      {
        regex: /\bnew Function\(/,
        severity: 'CRITICAL' as const,
        name: 'Function 构造器'
      },
      {
        regex: /\bglobal\./,
        severity: 'HIGH' as const,
        name: 'global 对象访问'
      }
    ]

    const lines = code.split('\n')

    // 检查每一行
    lines.forEach((line, index) => {
      // 跳过注释行
      if (line.trim().startsWith('//')) {
        return
      }

      patterns.forEach(pattern => {
        if (pattern.regex.test(line)) {
          violations.push({
            line: index + 1,
            pattern: pattern.name,
            severity: pattern.severity
          })
        }
      })
    })

    return {
      safe: violations.length === 0,
      violations
    }
  }
}
