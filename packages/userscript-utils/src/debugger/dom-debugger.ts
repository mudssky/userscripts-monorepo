import { debugSelectors, diagnoseSelectors, formatDiagnostics } from './core'
import type {
  DebugOptions,
  SelectorDiagnostic,
  SelectorMap,
  SelectorResult,
  WaitForOptions,
  WaitForResult,
} from './type'

/**
 * DOM 选择器调试器（有状态封装）
 *
 * @example
 * const dbg = new DomDebugger({ toolbar: '.bar-top', table: '.art-table' })
 * dbg.check()
 * console.log(dbg.diagnoseText())
 */
export class DomDebugger {
  private selectors: SelectorMap
  private options: DebugOptions
  private lastResults: SelectorResult[] = []
  private lastDiagnostics: SelectorDiagnostic[] = []

  constructor(selectors: SelectorMap, options: DebugOptions = {}) {
    this.selectors = selectors
    this.options = options
  }

  /** 执行选择器检测，更新并返回结果 */
  check(): SelectorResult[] {
    this.lastResults = debugSelectors(this.selectors, this.options)
    return this.lastResults
  }

  /** 生成结构化诊断报告 */
  diagnose(): SelectorDiagnostic[] {
    this.lastDiagnostics = diagnoseSelectors(this.selectors, this.options)
    return this.lastDiagnostics
  }

  /** 生成可读的诊断文本 */
  diagnoseText(): string {
    return formatDiagnostics(this.diagnose())
  }

  /** 异步等待指定选择器匹配 */
  waitFor(name: string, options: WaitForOptions = {}): Promise<WaitForResult> {
    const timeout = options.timeout ?? 5000
    const interval = options.interval ?? 500
    const value = this.selectors[name]
    const root = this.options.root ?? document
    const startTime = Date.now()

    if (!value) {
      return Promise.resolve({
        name,
        matched: false,
        element: null,
        elapsed: 0,
      })
    }

    return new Promise<WaitForResult>((resolve) => {
      const tryMatch = (): Element | null => {
        if (typeof value === 'function') {
          try {
            return value(root)
          } catch {
            return null
          }
        }
        return root.querySelector(value)
      }

      const initial = tryMatch()
      if (initial) {
        resolve({
          name,
          matched: true,
          element: initial,
          elapsed: Date.now() - startTime,
        })
        return
      }

      const timer = setTimeout(() => {
        observer.disconnect()
        resolve({
          name,
          matched: false,
          element: null,
          elapsed: Date.now() - startTime,
        })
      }, timeout)

      const observerTarget =
        root instanceof Document ? root.documentElement : root
      const observer = new MutationObserver(() => {
        const el = tryMatch()
        if (el) {
          clearTimeout(timer)
          clearInterval(pollTimer)
          observer.disconnect()
          resolve({
            name,
            matched: true,
            element: el,
            elapsed: Date.now() - startTime,
          })
        }
      })

      observer.observe(observerTarget, { childList: true, subtree: true })

      const pollTimer = setInterval(() => {
        const el = tryMatch()
        if (el) {
          clearTimeout(timer)
          clearInterval(pollTimer)
          observer.disconnect()
          resolve({
            name,
            matched: true,
            element: el,
            elapsed: Date.now() - startTime,
          })
        }
      }, interval)

      setTimeout(() => {
        clearInterval(pollTimer)
      }, timeout)
    })
  }

  addSelectors(selectors: SelectorMap): void {
    this.selectors = { ...this.selectors, ...selectors }
  }

  removeSelectors(...names: string[]): void {
    for (const name of names) delete this.selectors[name]
  }

  getLastResults(): SelectorResult[] {
    return this.lastResults
  }
  getLastDiagnostics(): SelectorDiagnostic[] {
    return this.lastDiagnostics
  }
  getSelectorNames(): string[] {
    return Object.keys(this.selectors)
  }
}
