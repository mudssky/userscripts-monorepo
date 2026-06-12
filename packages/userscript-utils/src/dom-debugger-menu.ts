import type { SelectorMap } from './debugger'
import {
  debugSelectors,
  diagnoseSelectors,
  dumpDomOutline,
  formatDiagnostics,
} from './debugger'

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
  /** DOM 结构打印深度，默认 3 */
  domDumpDepth?: number
}

function notify(msg: string): void {
  if (typeof GM_notification !== 'undefined') {
    GM_notification({ text: msg, timeout: 4000 })
  } else {
    console.log(`[notify] ${msg}`)
  }
}

function copyText(text: string): void {
  if (typeof GM_setClipboard !== 'undefined') {
    GM_setClipboard(text)
  } else {
    navigator.clipboard.writeText(text).catch(() => {
      // 静默失败，GM_setClipboard 兜底失败
    })
  }
}

/**
 * 注册 Tampermonkey 菜单命令，提供 DOM Debugger 诊断功能
 *
 * @param options - 配置项
 */
export function registerDomDebuggerMenu(options: DomDebuggerMenuOptions): void {
  const {
    scriptName,
    selectors,
    autoDiagnose = false,
    domDumpDepth = 5,
  } = options

  if (typeof GM_registerMenuCommand === 'undefined') {
    console.warn(
      `[${scriptName}] GM_registerMenuCommand 不可用，跳过 DOM Debugger 菜单注册`,
    )
    return
  }

  const register = (label: string, action: () => string): void => {
    GM_registerMenuCommand(label, () => {
      const text = action()
      copyText(`[${scriptName}] ${text}`)
      notify(`${scriptName}: 诊断报告已复制到剪贴板`)
      console.log(`[${scriptName}] 报告已复制到剪贴板，详情见下方 ↓`)
    })
  }

  register(`🔍 诊断选择器 (${scriptName})`, () => {
    const diagnostics = diagnoseSelectors(selectors)
    return `诊断报告:\n${formatDiagnostics(diagnostics)}`
  })

  register(`✅ 快速检测 (${scriptName})`, () => {
    const results = debugSelectors(selectors)
    const lines = results.map((r) => {
      const status = r.matched
        ? `✅ 匹配 (${r.count}个)`
        : `❌ 未匹配 (${r.reason ?? 'unknown'})`
      return `  ${r.name}: ${status}`
    })
    return `快速检测:\n${lines.join('\n')}`
  })

  register(`📋 DOM 结构 (${scriptName})`, () => {
    return dumpDomOutline(document.body, domDumpDepth)
  })

  if (autoDiagnose) {
    const results = debugSelectors(selectors)
    const unmatched = results.filter((r) => !r.matched)
    if (unmatched.length > 0) {
      console.warn(
        `[${scriptName}] ${unmatched.length}个选择器未匹配:`,
        unmatched.map((r) => r.name).join(', '),
      )
      console.log(dumpDomOutline(document.body, domDumpDepth))
    }
  }
}
