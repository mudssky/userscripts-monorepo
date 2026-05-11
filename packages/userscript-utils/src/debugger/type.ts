/**
 * 选择器值类型：CSS 选择器字符串或自定义查询函数
 */
export type SelectorValue =
  | string
  | ((root: Element | Document) => Element | null)

/**
 * 选择器配置对象
 */
export type SelectorMap = Record<string, SelectorValue>

/**
 * 未匹配原因枚举
 */
export enum SelectorFailReason {
  NOT_FOUND = 'NOT_FOUND',
  INVALID_SELECTOR = 'INVALID_SELECTOR',
  HIDDEN = 'HIDDEN',
  SHADOW_DOM = 'SHADOW_DOM',
  IFRAME = 'IFRAME',
}

/**
 * 单个选择器的检测结果
 */
export interface SelectorResult {
  name: string
  selector: SelectorValue
  matched: boolean
  count: number
  reason?: SelectorFailReason
  elements: Element[]
}

/**
 * 诊断上下文信息
 */
export interface SelectorDiagnosticContext {
  parentTag: string | null
  parentClasses: string[]
  siblings: Array<{ tag: string; classes: string[] }>
  nearestMatchedAncestor: string | null
  nearbyHtmlSnippet: string | null
}

/**
 * 完整诊断报告
 */
export interface SelectorDiagnostic {
  name: string
  selector: SelectorValue
  matched: boolean
  reason?: SelectorFailReason
  count: number
  context?: SelectorDiagnosticContext
  suggestion: string
}

/**
 * waitFor 方法配置
 */
export interface WaitForOptions {
  timeout?: number
  interval?: number
}

/**
 * waitFor 方法返回结果
 */
export interface WaitForResult {
  name: string
  matched: boolean
  element: Element | null
  elapsed: number
}

/**
 * debugSelectors 配置选项
 */
export interface DebugOptions {
  root?: Element | Document
}
