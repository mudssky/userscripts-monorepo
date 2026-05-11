import type {
  DebugOptions,
  SelectorDiagnostic,
  SelectorDiagnosticContext,
  SelectorMap,
  SelectorResult,
  SelectorValue,
} from './type'
import { SelectorFailReason } from './type'

const HTML_SNIPPET_MAX_LENGTH = 200
const SIBLINGS_MAX_COUNT = 10

/**
 * 校验 CSS 选择器语法是否合法
 */
export function isValidSelector(selector: string): boolean {
  try {
    document.createDocumentFragment().querySelector(selector)
    return true
  } catch {
    return false
  }
}

function resolveSelector(
  name: string,
  value: SelectorValue,
  root: Element | Document,
): SelectorResult {
  if (typeof value === 'function') {
    try {
      const element = value(root)
      return {
        name,
        selector: value,
        matched: element !== null,
        count: element !== null ? 1 : 0,
        elements: element ? [element] : [],
        reason: element === null ? SelectorFailReason.NOT_FOUND : undefined,
      }
    } catch {
      return {
        name,
        selector: value,
        matched: false,
        count: 0,
        elements: [],
        reason: SelectorFailReason.NOT_FOUND,
      }
    }
  }

  if (!isValidSelector(value)) {
    return {
      name,
      selector: value,
      matched: false,
      count: 0,
      elements: [],
      reason: SelectorFailReason.INVALID_SELECTOR,
    }
  }

  const elements = Array.from(root.querySelectorAll(value))
  const matched = elements.length > 0
  const reason = matched ? undefined : SelectorFailReason.NOT_FOUND

  return { name, selector: value, matched, count: elements.length, elements, reason }
}

/**
 * 检测一组选择器的匹配状态
 */
export function debugSelectors(
  selectors: SelectorMap,
  options: DebugOptions = {},
): SelectorResult[] {
  const root = options.root ?? document
  return Object.entries(selectors).map(([name, value]) =>
    resolveSelector(name, value, root),
  )
}

function collectContext(
  selector: string,
  root: Element | Document,
): SelectorDiagnosticContext | null {
  const parts = selector.split(/\s+/)
  let nearestMatchedAncestor: string | null = null
  let nearestElement: Element | null = null

  for (let i = parts.length - 1; i > 0; i--) {
    const ancestorSelector = parts.slice(0, i).join(' ')
    if (!isValidSelector(ancestorSelector)) continue
    const found = root.querySelector(ancestorSelector)
    if (found) {
      nearestMatchedAncestor = ancestorSelector
      nearestElement = found
      break
    }
  }

  const siblings: Array<{ tag: string; classes: string[] }> = []
  if (nearestElement?.parentElement) {
    const parent = nearestElement.parentElement
    for (const child of Array.from(parent.children).slice(0, SIBLINGS_MAX_COUNT)) {
      siblings.push({
        tag: child.tagName.toLowerCase(),
        classes: Array.from(child.classList),
      })
    }
  }

  const parent = nearestElement?.parentElement
  const nearbyHtmlSnippet = nearestElement?.parentElement
    ? truncateHtml(nearestElement.parentElement.outerHTML, HTML_SNIPPET_MAX_LENGTH)
    : null

  return {
    parentTag: parent?.tagName.toLowerCase() ?? null,
    parentClasses: parent ? Array.from(parent.classList) : [],
    siblings,
    nearestMatchedAncestor,
    nearbyHtmlSnippet,
  }
}

function generateSuggestion(
  reason: SelectorFailReason | undefined,
  name: string,
): string {
  switch (reason) {
    case SelectorFailReason.INVALID_SELECTOR:
      return `选择器 "${name}" 语法非法，请检查 CSS 选择器拼写`
    case SelectorFailReason.NOT_FOUND:
      return `选择器 "${name}" 未匹配到元素。可能原因：元素未加载、选择器过期（页面改版）、在 iframe 或 Shadow DOM 中`
    case SelectorFailReason.SHADOW_DOM:
      return `选择器 "${name}" 的目标可能在 Shadow DOM 内`
    case SelectorFailReason.IFRAME:
      return `选择器 "${name}" 的目标可能在 iframe 内`
    default:
      return ''
  }
}

/**
 * 生成完整诊断报告
 */
export function diagnoseSelectors(
  selectors: SelectorMap,
  options: DebugOptions = {},
): SelectorDiagnostic[] {
  const root = options.root ?? document
  const results = debugSelectors(selectors, options)

  return results.map((result): SelectorDiagnostic => {
    let context: SelectorDiagnosticContext | undefined

    if (
      !result.matched &&
      typeof result.selector === 'string' &&
      result.reason !== SelectorFailReason.INVALID_SELECTOR
    ) {
      context = collectContext(result.selector, root) ?? undefined
    }

    return {
      name: result.name,
      selector: result.selector,
      matched: result.matched,
      reason: result.reason,
      count: result.count,
      context,
      suggestion: generateSuggestion(result.reason, result.name),
    }
  })
}

/**
 * 将诊断报告格式化为可读文本
 */
export function formatDiagnostics(diagnostics: SelectorDiagnostic[]): string {
  const lines: string[] = []
  const total = diagnostics.length
  const matched = diagnostics.filter((d) => d.matched).length

  lines.push(`DOM Debug: ${matched}/${total} 选择器匹配`)
  lines.push('─'.repeat(40))

  for (const d of diagnostics) {
    const selectorLabel =
      typeof d.selector === 'string' ? d.selector : '[自定义函数]'

    if (d.matched) {
      lines.push(`✓ ${d.name} (${selectorLabel}) — 匹配 ${d.count} 个元素`)
    } else {
      lines.push(`✗ ${d.name} (${selectorLabel}) — 未匹配: ${d.reason}`)
      if (d.suggestion) {
        lines.push(`  建议: ${d.suggestion}`)
      }
      if (d.context) {
        if (d.context.nearestMatchedAncestor) {
          lines.push(`  最近匹配祖先: ${d.context.nearestMatchedAncestor}`)
        }
        if (d.context.parentTag) {
          const classStr =
            d.context.parentClasses.length > 0
              ? `.${d.context.parentClasses.join('.')}`
              : ''
          lines.push(`  父级元素: ${d.context.parentTag}${classStr}`)
        }
      }
    }
  }

  return lines.join('\n')
}

function truncateHtml(html: string, maxLength: number): string {
  if (html.length <= maxLength) return html
  return `${html.slice(0, maxLength)}...`
}
