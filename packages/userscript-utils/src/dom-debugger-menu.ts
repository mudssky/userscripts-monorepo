import { debugSelectors, diagnoseSelectors, formatDiagnostics } from './debugger'
import type { SelectorMap } from './debugger'

/**
 * DOM Debugger 菜单配置
 */
export interface DomDebuggerMenuOptions {
  /** 脚本名称，用于菜单标签 */
  scriptName: string
  /** 要诊断的选择器映射 */
  selectors: SelectorMap
  /** 是否在脚本启动时自动运行一次诊断，默认 false */
  autoDiagnose?: boolean
}

/**
 * 注册 Tampermonkey 菜单命令，提供 DOM Debugger 诊断功能
 *
 * @param options - 配置项
 */
export function registerDomDebuggerMenu(options: DomDebuggerMenuOptions): void {
  const { scriptName, selectors, autoDiagnose = false } = options

  try {
    if (typeof GM_registerMenuCommand === 'undefined') {
      console.warn(`[${scriptName}] GM_registerMenuCommand 不可用，跳过 DOM Debugger 菜单注册`)
      return
    }

    GM_registerMenuCommand(`🔍 诊断选择器 (${scriptName})`, () => {
      const diagnostics = diagnoseSelectors(selectors)
      const text = formatDiagnostics(diagnostics)
      console.group(`[${scriptName}] DOM Debugger 诊断报告`)
      console.log(text)
      console.groupEnd()
    })

    GM_registerMenuCommand(`✅ 快速检测 (${scriptName})`, () => {
      const results = debugSelectors(selectors)
      console.group(`[${scriptName}] 选择器快速检测`)
      for (const r of results) {
        const status = r.matched ? `✅ 匹配 (${r.count}个)` : `❌ 未匹配 (${r.reason ?? 'unknown'})`
        console.log(`  ${r.name}: ${status}`)
      }
      console.groupEnd()
    })

    if (autoDiagnose) {
      const results = debugSelectors(selectors)
      const unmatched = results.filter((r) => !r.matched)
      if (unmatched.length > 0) {
        console.warn(
          `[${scriptName}] ${unmatched.length}个选择器未匹配:`,
          unmatched.map((r) => r.name).join(', '),
        )
      }
    }
  } catch (err) {
    console.warn(`[${scriptName}] DOM Debugger 菜单注册失败:`, err)
  }
}
