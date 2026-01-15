/**
 * 插件代码验证器
 *
 * 在插件加载前验证代码安全性,检测危险模式
 */

/**
 * 违规记录
 */
export interface Violation {
  /** 行号 */
  line: number
  /** 违规的模式名称 */
  pattern: string
  /** 严重程度 */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  /** 违规的代码行 */
  code: string
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否通过验证 */
  valid: boolean
  /** 违规列表 */
  violations: Violation[]
  /** 警告列表 */
  warnings: string[]
}

/**
 * 危险模式定义
 */
interface DangerousPattern {
  /** 正则表达式 */
  regex: RegExp
  /** 严重程度 */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  /** 模式名称 */
  name: string
  /** 描述 */
  description: string
}

/**
 * 插件验证器类
 */
export class PluginValidator {
  private dangerousPatterns: DangerousPattern[] = [
    {
      regex: /\brequire\s*\(/,
      severity: 'CRITICAL',
      name: 'require() 调用',
      description: '直接调用 require() 可以绕过沙箱限制'
    },
    {
      regex: /\bprocess\.(env|platform|arch|cwd|exit|kill|argv)/,
      severity: 'HIGH',
      name: 'process 对象访问',
      description: '直接访问 process 对象可以绕过沙箱限制'
    },
    {
      regex: /\beval\s*\(/,
      severity: 'CRITICAL',
      name: 'eval() 调用',
      description: 'eval() 可以执行任意代码,存在严重安全风险'
    },
    {
      regex: /\bnew\s+Function\s*\(/,
      severity: 'CRITICAL',
      name: 'Function 构造器',
      description: 'Function 构造器可以执行任意代码,存在严重安全风险'
    },
    {
      regex: /\bglobal\.[a-zA-Z]/,
      severity: 'HIGH',
      name: 'global 对象访问',
      description: '直接访问 global 对象可以绕过沙箱限制'
    },
    {
      regex: /\b__dirname\b/,
      severity: 'MEDIUM',
      name: '__dirname 使用',
      description: '__dirname 应该从插件上下文中获取'
    },
    {
      regex: /\b__filename\b/,
      severity: 'MEDIUM',
      name: '__filename 使用',
      description: '__filename 应该从插件上下文中获取'
    },
    {
      regex: /\bBuffer\s*\(/,
      severity: 'MEDIUM',
      name: 'Buffer 构造器',
      description: 'Buffer 应该从插件 API 返回值中获取'
    }
  ]

  /**
   * 检查是否为开发模式
   */
  private isDevelopmentMode(): boolean {
    // 生产构建时强制启用验证
    if (process.env.NODE_ENV === 'production') {
      return false
    }

    return process.env.DISABLE_SANDBOX === '1' || process.env.DISABLE_SANDBOX === 'true'
  }

  /**
   * 验证插件代码
   *
   * @param code - 插件代码
   * @param pluginId - 插件 ID
   * @returns 验证结果
   */
  validatePluginCode(code: string, pluginId: string): ValidationResult {
    // 开发模式: 跳过验证,但返回警告
    if (this.isDevelopmentMode()) {
      console.warn(`⚠️  开发模式: 跳过 ${pluginId} 的代码验证`)

      return {
        valid: true,
        violations: [],
        warnings: [
          '开发模式已启用,代码验证被跳过',
          '请确保在生产环境部署前运行完整验证'
        ]
      }
    }

    console.log(`🔍 验证插件代码: ${pluginId}`)

    const violations: Violation[] = []
    const warnings: string[] = []
    const lines = code.split('\n')

    // 检查每一行代码
    lines.forEach((line, index) => {
      const lineNumber = index + 1
      const trimmedLine = line.trim()

      // 跳过空行和注释行
      if (!trimmedLine || trimmedLine.startsWith('//')) {
        return
      }

      // 检查所有危险模式
      this.dangerousPatterns.forEach(pattern => {
        if (pattern.regex.test(line)) {
          // 特殊处理: 检查是否是安全的 API 调用
          if (pattern.name === 'process 对象访问') {
            // 如果是 context.api.process.xxx 或 api.process.xxx,则允许
            if (/context\.api\.process\.|this\.context\.api\.process\.|api\.process\./.test(line)) {
              return // 跳过,这是安全的 API 调用
            }
          }

          violations.push({
            line: lineNumber,
            pattern: pattern.name,
            severity: pattern.severity,
            code: trimmedLine
          })
        }
      })
    })

    // 判断是否通过验证
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL')
    const highViolations = violations.filter(v => v.severity === 'HIGH')

    const valid = criticalViolations.length === 0 && highViolations.length === 0

    // 输出验证结果
    if (valid) {
      console.log(`✅ ${pluginId} 代码验证通过`)
    } else {
      console.error(`❌ ${pluginId} 代码验证失败:`)
      violations.forEach(v => {
        console.error(`  - 行 ${v.line}: ${v.pattern} (${v.severity})`)
        console.error(`    ${v.code}`)
      })
    }

    // 如果有 MEDIUM 或 LOW 级别的违规,添加警告
    const mediumViolations = violations.filter(v => v.severity === 'MEDIUM' || v.severity === 'LOW')
    if (mediumViolations.length > 0) {
      warnings.push(`发现 ${mediumViolations.length} 个中低优先级违规,建议修复`)
    }

    return {
      valid,
      violations,
      warnings
    }
  }

  /**
   * 快速检查代码是否包含关键违规
   *
   * @param code - 插件代码
   * @returns 是否包含关键违规
   */
  hasCriticalViolations(code: string): boolean {
    const criticalPatterns = this.dangerousPatterns.filter(
      p => p.severity === 'CRITICAL' || p.severity === 'HIGH'
    )

    for (const pattern of criticalPatterns) {
      if (pattern.regex.test(code)) {
        return true
      }
    }

    return false
  }

  /**
   * 获取违规统计
   *
   * @param violations - 违规列表
   * @returns 统计信息
   */
  getViolationStats(violations: Violation[]): {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  } {
    return {
      total: violations.length,
      critical: violations.filter(v => v.severity === 'CRITICAL').length,
      high: violations.filter(v => v.severity === 'HIGH').length,
      medium: violations.filter(v => v.severity === 'MEDIUM').length,
      low: violations.filter(v => v.severity === 'LOW').length
    }
  }

  /**
   * 格式化验证报告
   *
   * @param result - 验证结果
   * @param pluginId - 插件 ID
   * @returns 格式化的报告文本
   */
  formatReport(result: ValidationResult, pluginId: string): string {
    const lines: string[] = []

    lines.push(`\n╔════════════════════════════════════════════════════════════╗`)
    lines.push(`║  插件代码验证报告                                          ║`)
    lines.push(`╚════════════════════════════════════════════════════════════╝`)
    lines.push(``)
    lines.push(`插件 ID: ${pluginId}`)
    lines.push(`验证状态: ${result.valid ? '✅ 通过' : '❌ 失败'}`)
    lines.push(``)

    if (result.violations.length > 0) {
      const stats = this.getViolationStats(result.violations)

      lines.push(`违规统计:`)
      lines.push(`  总计: ${stats.total}`)
      lines.push(`  CRITICAL: ${stats.critical}`)
      lines.push(`  HIGH: ${stats.high}`)
      lines.push(`  MEDIUM: ${stats.medium}`)
      lines.push(`  LOW: ${stats.low}`)
      lines.push(``)

      lines.push(`违规详情:`)
      result.violations.forEach(v => {
        lines.push(`  [${v.severity}] 行 ${v.line}: ${v.pattern}`)
        lines.push(`    ${v.code}`)
      })
      lines.push(``)
    }

    if (result.warnings.length > 0) {
      lines.push(`警告:`)
      result.warnings.forEach(w => {
        lines.push(`  ⚠️  ${w}`)
      })
      lines.push(``)
    }

    return lines.join('\n')
  }
}
