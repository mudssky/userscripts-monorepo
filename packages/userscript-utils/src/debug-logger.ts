/**
 * Debug 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 日志条目
 */
export interface LogEntry {
  level: LogLevel
  timestamp: number
  args: unknown[]
}

/**
 * Debug 模式日志器配置
 */
export interface DebugLoggerOptions {
  /** 脚本名称，用于日志前缀和 GM 存储键 */
  scriptName: string
  /** 日志前缀，默认 `[${scriptName}]` */
  prefix?: string
  /** 最大内存日志条数，默认 100 */
  maxLogs?: number
}

/**
 * 通用 Debug 模式日志器
 *
 * 基于 GM_getValue/GM_setValue 持久化 debug 开关，
 * 内存中保存最近日志条目用于导出。
 *
 * 使用 Greasemonkey 存储的 `debugMode` 键控制开关。
 */
export class DebugLogger {
  private readonly prefix: string
  private readonly maxLogs: number
  private readonly logs: LogEntry[] = []

  constructor(private readonly options: DebugLoggerOptions) {
    this.prefix = options.prefix ?? `[${options.scriptName}]`
    this.maxLogs = options.maxLogs ?? 100
  }

  /** 判断是否处于调试模式 */
  isDebugMode(): boolean {
    try {
      if (typeof GM_getValue === 'undefined') return false
      return GM_getValue('debugMode', false) as boolean
    } catch {
      return false
    }
  }

  /** 切换调试模式，返回新状态 */
  toggleDebugMode(enabled?: boolean): boolean {
    try {
      if (typeof GM_setValue === 'undefined') {
        console.warn(`${this.prefix} GM_setValue 不可用`)
        return false
      }
      const newState = enabled !== undefined ? enabled : !this.isDebugMode()
      GM_setValue('debugMode', newState)
      console.log(`${this.prefix} 调试模式已${newState ? '开启' : '关闭'}`)
      return newState
    } catch {
      return false
    }
  }

  /** 输出调试日志（仅 debug 模式） */
  log(...args: unknown[]): void {
    if (this.isDebugMode()) {
      console.log(this.prefix, ...args)
    }
    this.appendLog('debug', args)
  }

  /** 输出 info 日志（始终输出） */
  info(...args: unknown[]): void {
    console.info(this.prefix, ...args)
    this.appendLog('info', args)
  }

  /** 输出 warn 日志（始终输出） */
  warn(...args: unknown[]): void {
    console.warn(this.prefix, ...args)
    this.appendLog('warn', args)
  }

  /** 输出 error 日志（始终输出） */
  error(...args: unknown[]): void {
    console.error(this.prefix, ...args)
    this.appendLog('error', args)
  }

  /** 获取内存中的日志条目 */
  getLogs(): readonly LogEntry[] {
    return this.logs
  }

  /** 导出日志为格式化文本 */
  exportLogs(): string {
    return this.logs
      .map(
        (entry) =>
          `[${new Date(entry.timestamp).toISOString()}] [${entry.level}] ${this.stringifyArgs(entry.args)}`,
      )
      .join('\n')
  }

  /** 输出调试帮助信息到控制台 */
  showHelp(): void {
    console.group(`${this.prefix} 调试模式帮助`)
    console.log('当前状态:', this.isDebugMode() ? '开启' : '关闭')
    console.log('切换调试模式: logger.toggleDebugMode()')
    console.log('导出日志: logger.exportLogs()')
    console.groupEnd()
  }

  private appendLog(level: LogLevel, args: unknown[]): void {
    this.logs.push({ level, timestamp: Date.now(), args })
    while (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  }

  private stringifyArgs(args: unknown[]): string {
    return args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ')
  }
}
