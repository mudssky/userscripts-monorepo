import { SELECTORS } from './selectors'

/** 活动执行结果上下文 */
export interface ActiveExecutionResultContext {
  tab: Element
  tabPane: Element
}

/**
 * 获取当前活动执行结果上下文
 *
 * @param resultContainer - 查询结果容器
 * @returns 活动执行结果上下文；当前 tab 不是执行结果时返回 null
 */
export function getActiveExecutionResultContext(
  resultContainer: Element | Document,
): ActiveExecutionResultContext | null {
  const tab = findActiveResultTab(resultContainer)
  if (!tab || !isExecutionResultTab(tab)) return null

  const tabPane = findActiveResultTabPane(resultContainer, tab)
  if (!tabPane) return null

  return { tab, tabPane }
}

/**
 * 判断当前结果容器是否处于执行结果 tab
 *
 * @param resultContainer - 查询结果容器
 * @returns 是否存在活动执行结果
 */
export function hasActiveExecutionResult(
  resultContainer: Element | Document,
): boolean {
  return Boolean(getActiveExecutionResultContext(resultContainer))
}

/**
 * 查找活动执行结果 tabpane 中的表格
 *
 * @param resultContainer - 查询结果容器
 * @returns 活动执行结果表格；当前 tab 不是执行结果时返回 null
 */
export function findActiveExecutionResultTable(
  resultContainer: Element | Document,
): Element | null {
  const context = getActiveExecutionResultContext(resultContainer)
  return context?.tabPane.querySelector(SELECTORS.table) ?? null
}

/**
 * 查找当前活动的结果 tab
 *
 * @param resultContainer - 查询结果容器
 * @returns 活动 tab 元素或 null
 */
function findActiveResultTab(
  resultContainer: Element | Document,
): Element | null {
  return resultContainer.querySelector(
    '.sql-console-results-tab > .next-tabs-bar [role="tab"].active, .sql-console-results-tab > .next-tabs-bar [role="tab"][aria-selected="true"], .sql-console-results-tab > .next-tabs-bar .next-tabs-tab.active',
  )
}

/**
 * 判断 tab 是否为执行结果 tab
 *
 * @param tab - tab 元素
 * @returns 是否为执行结果 tab
 */
function isExecutionResultTab(tab: Element): boolean {
  const tabText = getElementText(tab)
  return /^执行结果\s*\d*$/i.test(tabText) || /^result\s*\d*$/i.test(tabText)
}

/**
 * 查找活动 tab 对应的 tabpane
 *
 * @param resultContainer - 查询结果容器
 * @param activeTab - 活动 tab 元素
 * @returns 活动 tabpane 或 null
 */
function findActiveResultTabPane(
  resultContainer: Element | Document,
  activeTab: Element,
): Element | null {
  const controlledId = activeTab.getAttribute('aria-controls')
  if (controlledId) {
    const controlledPane = resultContainer.querySelector(
      `#${CSS.escape(controlledId)}`,
    )
    if (controlledPane) return controlledPane
  }

  return resultContainer.querySelector(
    '.sql-console-results-tab > .next-tabs-content > .next-tabs-tabpane.active:not(.hidden), .sql-console-results-tab > .next-tabs-content > .next-tabs-tabpane.active',
  )
}

/**
 * 获取元素可见文本
 *
 * @param element - DOM 元素
 * @returns 规整后的元素文本
 */
function getElementText(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim()
}
