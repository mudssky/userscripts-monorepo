import { COPY_CONFIG } from './config'
import {
  findTable,
  parseHeaders,
  parseTable,
  parseVisibleRows,
  type TableData,
} from './format'
import { SELECTORS } from './selectors'

/** 表格收集结果 */
export interface TableCollectionResult {
  data: TableData | null
  truncated: boolean
  rowLimit: number
}

/** 表格收集配置 */
interface TableCollectionOptions {
  rowLimit?: number
  confirmLargeCopy: (rowLimit: number) => boolean | Promise<boolean>
}

/**
 * 收集表格数据，优先尝试滚动虚拟表格收集完整 DOM 数据
 *
 * @param resultContainer - 查询结果容器
 * @param options - 收集配置
 * @returns 表格收集结果
 */
export async function collectTableData(
  resultContainer: Element,
  options: TableCollectionOptions,
): Promise<TableCollectionResult> {
  const rowLimit = options.rowLimit ?? COPY_CONFIG.slowRowThreshold
  const scrollContainer = await findVirtualScrollContainer(resultContainer)

  if (!scrollContainer) {
    return collectStaticTableData(
      resultContainer,
      rowLimit,
      options.confirmLargeCopy,
    )
  }

  return collectVirtualTableData(
    resultContainer,
    scrollContainer,
    rowLimit,
    options.confirmLargeCopy,
  )
}

/**
 * 收集普通 DOM 表格数据，并按阈值确认是否复制全部
 *
 * @param resultContainer - 查询结果容器
 * @param rowLimit - 长表格确认阈值
 * @param confirmLargeCopy - 超过阈值时的确认函数
 * @returns 表格收集结果
 */
async function collectStaticTableData(
  resultContainer: Element,
  rowLimit: number,
  confirmLargeCopy: (rowLimit: number) => boolean | Promise<boolean>,
): Promise<TableCollectionResult> {
  const data = parseTable(resultContainer)
  if (!data) return { data, truncated: false, rowLimit }

  const rows = await applyRowLimit(data.rows, rowLimit, confirmLargeCopy)
  return {
    data: { headers: data.headers, rows: rows.value },
    truncated: rows.truncated,
    rowLimit,
  }
}

/**
 * 通过滚动虚拟表格收集数据
 *
 * @param resultContainer - 查询结果容器
 * @param scrollContainer - 表格滚动容器
 * @param rowLimit - 长表格确认阈值
 * @param confirmLargeCopy - 超过阈值时的确认函数
 * @returns 表格收集结果
 */
async function collectVirtualTableData(
  resultContainer: Element,
  scrollContainer: HTMLElement,
  rowLimit: number,
  confirmLargeCopy: (rowLimit: number) => boolean | Promise<boolean>,
): Promise<TableCollectionResult> {
  const headers = parseHeaders(resultContainer)
  if (!headers) return { data: null, truncated: false, rowLimit }

  const originalScrollTop = scrollContainer.scrollTop
  let rows: string[][] = []
  let truncated = false
  let hasConfirmedLargeCopy = false
  let previousScrollTop = -1

  try {
    setScrollTop(scrollContainer, 0)
    await waitForTableRender()

    for (
      let stepIndex = 0;
      stepIndex < COPY_CONFIG.maxVirtualScrollSteps;
      stepIndex += 1
    ) {
      const visibleRows = parseVisibleRows(resultContainer)
      rows = mergeRows(rows, visibleRows)

      if (
        rows.length >= rowLimit &&
        !hasConfirmedLargeCopy &&
        canScrollDown(scrollContainer)
      ) {
        hasConfirmedLargeCopy = await confirmLargeCopy(rowLimit)
        if (!hasConfirmedLargeCopy) {
          rows = rows.slice(0, rowLimit)
          truncated = true
          break
        }
      }

      if (!canScrollDown(scrollContainer)) {
        break
      }

      const nextScrollTop = getNextScrollTop(scrollContainer, resultContainer)
      if (
        nextScrollTop <= scrollContainer.scrollTop ||
        scrollContainer.scrollTop === previousScrollTop
      ) {
        break
      }

      previousScrollTop = scrollContainer.scrollTop
      setScrollTop(scrollContainer, nextScrollTop)
      await waitForTableRender()
    }

    if (rows.length > rowLimit && !hasConfirmedLargeCopy) {
      const shouldCopyAll = await confirmLargeCopy(rowLimit)
      if (!shouldCopyAll) {
        rows = rows.slice(0, rowLimit)
        truncated = true
      }
    }
  } finally {
    setScrollTop(scrollContainer, originalScrollTop)
    await waitForTableRender()
  }

  return { data: { headers, rows }, truncated, rowLimit }
}

/**
 * 查找会触发虚拟表格换行渲染的滚动容器
 *
 * @param resultContainer - 查询结果容器
 * @returns 虚拟滚动容器或 null
 */
async function findVirtualScrollContainer(
  resultContainer: Element,
): Promise<HTMLElement | null> {
  const table = findTable(resultContainer)
  if (!table) return null

  const candidates = collectScrollCandidates(resultContainer, table)
    .filter((element) => isScrollableElement(element))
    .map((element) => ({
      element,
      score: scoreScrollCandidate(element, resultContainer, table),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, COPY_CONFIG.scrollProbeCandidateLimit)

  for (const candidate of candidates) {
    if (await canTriggerVirtualRows(resultContainer, candidate.element)) {
      return candidate.element
    }
  }

  return null
}

/**
 * 收集可能承载表格滚动的元素
 *
 * @param resultContainer - 查询结果容器
 * @param table - 表格元素
 * @returns 候选滚动元素列表
 */
function collectScrollCandidates(
  resultContainer: Element,
  table: Element,
): HTMLElement[] {
  const candidates = new Set<HTMLElement>()

  addElementCandidate(candidates, table)
  resultContainer
    .querySelectorAll(SELECTORS.tableScrollCandidates)
    .forEach((element) => {
      addElementCandidate(candidates, element)
    })
  resultContainer.querySelectorAll('*').forEach((element) => {
    if (isPotentialScrollCandidate(element, table)) {
      addElementCandidate(candidates, element)
    }
  })

  let current: Element | null = table.parentElement
  while (current && current !== resultContainer.parentElement) {
    addElementCandidate(candidates, current)
    if (current === resultContainer) break
    current = current.parentElement
  }

  return Array.from(candidates)
}

/**
 * 加入 HTMLElement 候选项
 *
 * @param candidates - 候选元素集合
 * @param element - 待加入元素
 * @returns 无返回值
 */
function addElementCandidate(
  candidates: Set<HTMLElement>,
  element: Element | null,
): void {
  if (element instanceof HTMLElement) {
    candidates.add(element)
  }
}

/**
 * 判断元素是否值得进入滚动候选列表
 *
 * @param element - 待检测元素
 * @param table - 表格元素
 * @returns 是否为潜在滚动容器
 */
function isPotentialScrollCandidate(element: Element, table: Element): boolean {
  if (!(element instanceof HTMLElement)) return false
  if (!element.contains(table) && !element.querySelector(SELECTORS.bodyRows))
    return false

  const className = element.className.toString()
  return (
    /table|body|virtual|scroll|container|content/i.test(className) ||
    element.scrollHeight > element.clientHeight + 1
  )
}

/**
 * 判断元素是否为可滚动容器
 *
 * @param element - 待检测元素
 * @returns 是否为可滚动容器
 */
function isScrollableElement(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false
  if (element.clientHeight <= 0) return false
  if (element.scrollHeight <= element.clientHeight + 1) return false

  const overflowY = window.getComputedStyle(element).overflowY
  return (
    overflowY === 'auto' ||
    overflowY === 'scroll' ||
    element.matches(SELECTORS.tableScrollCandidates) ||
    canSetScrollTop(element)
  )
}

/**
 * 判断元素是否是无关的 resize detector 滚动节点
 *
 * @param element - 待检测元素
 * @returns 是否应排除该元素
 */
function isResizeDetectorElement(element: HTMLElement): boolean {
  return /(^|\s)erd_|resize[-_]?detector|scroll_detection/i.test(
    element.className.toString(),
  )
}

/**
 * 检测元素是否能通过 scrollTop 实际滚动
 *
 * @param element - 待检测元素
 * @returns scrollTop 是否可被程序改变
 */
function canSetScrollTop(element: HTMLElement): boolean {
  if (isResizeDetectorElement(element)) return false

  const originalScrollTop = element.scrollTop
  const targetScrollTop =
    originalScrollTop > 0 ? originalScrollTop - 1 : originalScrollTop + 1

  element.scrollTop = targetScrollTop
  const changed = element.scrollTop !== originalScrollTop
  element.scrollTop = originalScrollTop

  return changed
}

/**
 * 计算滚动候选元素优先级
 *
 * @param element - 候选元素
 * @param resultContainer - 查询结果容器
 * @param table - 表格元素
 * @returns 候选优先级分数
 */
function scoreScrollCandidate(
  element: HTMLElement,
  resultContainer: Element,
  table: Element,
): number {
  if (isResizeDetectorElement(element)) return Number.NEGATIVE_INFINITY

  const className = element.className.toString()
  const scrollRange = element.scrollHeight - element.clientHeight
  let score = Math.min(scrollRange, 10000) / 10

  if (element.matches(SELECTORS.tableBody)) score += 5000
  if (element.matches(SELECTORS.tableScrollCandidates)) score += 2000
  if (/\bart-table-wrapper\b/i.test(className)) score += 4500
  if (/\bdui-use-virtual\b/i.test(className)) score += 3500
  if (
    /\b(art|next)-table-(body|scroll|scroller|content|container|body-wrapper)\b/i.test(
      className,
    )
  )
    score += 3000
  if (/virtual/i.test(className)) score += 1500
  if (/scroll/i.test(className)) score += 1000
  if (element.querySelector(SELECTORS.bodyRows)) score += 800
  if (element.contains(table)) score += 400
  if (table.contains(element)) score += 300
  if (element === resultContainer) score -= 1200

  return score
}

/**
 * 验证候选滚动容器是否能触发表格可见行变化
 *
 * @param resultContainer - 查询结果容器
 * @param scrollContainer - 候选滚动容器
 * @returns 是否会触发虚拟表格换行渲染
 */
async function canTriggerVirtualRows(
  resultContainer: Element,
  scrollContainer: HTMLElement,
): Promise<boolean> {
  const originalScrollTop = scrollContainer.scrollTop
  const originalRows = getVisibleRowSignature(resultContainer)
  const nextScrollTop = getProbeScrollTop(scrollContainer, resultContainer)
  if (nextScrollTop === originalScrollTop) return false

  try {
    setScrollTop(scrollContainer, nextScrollTop)
    await waitForTableRender()
    const nextRows = getVisibleRowSignature(resultContainer)

    return (
      originalRows.length > 0 &&
      nextRows.length > 0 &&
      !areStringArraysEqual(originalRows, nextRows)
    )
  } finally {
    setScrollTop(scrollContainer, originalScrollTop)
    await waitForTableRender()
  }
}

/**
 * 获取滚动容器探测位置
 *
 * @param scrollContainer - 候选滚动容器
 * @param resultContainer - 查询结果容器
 * @returns 探测用滚动位置
 */
function getProbeScrollTop(
  scrollContainer: HTMLElement,
  resultContainer: Element,
): number {
  if (canScrollDown(scrollContainer)) {
    return getNextScrollTop(scrollContainer, resultContainer)
  }

  if (scrollContainer.scrollTop > 0) {
    const rowHeight = getEstimatedRowHeight(resultContainer)
    const step = Math.max(
      rowHeight,
      scrollContainer.clientHeight - rowHeight * COPY_CONFIG.scrollOverlapRows,
    )
    return Math.max(0, scrollContainer.scrollTop - step)
  }

  return scrollContainer.scrollTop
}

/**
 * 获取当前可见行签名
 *
 * @param resultContainer - 查询结果容器
 * @returns 可见行文本签名
 */
function getVisibleRowSignature(resultContainer: Element): string[] {
  return parseVisibleRows(resultContainer).map((row) => row.join('\u0001'))
}

/**
 * 判断两个字符串数组是否一致
 *
 * @param left - 左侧字符串数组
 * @param right - 右侧字符串数组
 * @returns 两个数组是否完全一致
 */
function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false

  return left.every((value, index) => value === right[index])
}

/**
 * 判断滚动容器是否还能继续向下滚动
 *
 * @param scrollContainer - 表格滚动容器
 * @returns 是否还能继续向下滚动
 */
function canScrollDown(scrollContainer: HTMLElement): boolean {
  return (
    scrollContainer.scrollTop + scrollContainer.clientHeight <
    scrollContainer.scrollHeight - 1
  )
}

/**
 * 计算下一次滚动位置
 *
 * @param scrollContainer - 表格滚动容器
 * @param resultContainer - 查询结果容器
 * @returns 下一次滚动位置
 */
function getNextScrollTop(
  scrollContainer: HTMLElement,
  resultContainer: Element,
): number {
  const rowHeight = getEstimatedRowHeight(resultContainer)
  const overlapHeight = rowHeight * COPY_CONFIG.scrollOverlapRows
  const step = Math.max(rowHeight, scrollContainer.clientHeight - overlapHeight)
  const maxScrollTop =
    scrollContainer.scrollHeight - scrollContainer.clientHeight

  return Math.min(maxScrollTop, scrollContainer.scrollTop + step)
}

/**
 * 设置滚动位置并触发滚动事件
 *
 * @param scrollContainer - 表格滚动容器
 * @param scrollTop - 目标滚动位置
 * @returns 无返回值
 */
function setScrollTop(scrollContainer: HTMLElement, scrollTop: number): void {
  scrollContainer.scrollTop = scrollTop
  scrollContainer.dispatchEvent(new Event('scroll', { bubbles: true }))
}

/**
 * 估算当前表格行高
 *
 * @param resultContainer - 查询结果容器
 * @returns 行高像素值
 */
function getEstimatedRowHeight(resultContainer: Element): number {
  const row = resultContainer.querySelector(SELECTORS.bodyRows)
  if (!(row instanceof HTMLElement)) return 32

  const height = row.getBoundingClientRect().height
  return height > 0 ? height : 32
}

/**
 * 等待虚拟表格完成一次渲染
 *
 * @returns 等待完成的 Promise
 */
function waitForTableRender(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, COPY_CONFIG.scrollRenderDelayMs)
  })
}

/**
 * 合并相邻滚动视口中的数据行
 *
 * @param collectedRows - 已收集的数据行
 * @param visibleRows - 当前视口数据行
 * @returns 合并后的数据行
 */
function mergeRows(
  collectedRows: string[][],
  visibleRows: string[][],
): string[][] {
  if (visibleRows.length === 0) return collectedRows
  if (collectedRows.length === 0) return [...visibleRows]

  const overlap = findOverlapLength(collectedRows, visibleRows)
  if (overlap === visibleRows.length) return collectedRows

  return [...collectedRows, ...visibleRows.slice(overlap)]
}

/**
 * 查找已收集行尾部与当前视口头部的重叠长度
 *
 * @param collectedRows - 已收集的数据行
 * @param visibleRows - 当前视口数据行
 * @returns 重叠行数
 */
function findOverlapLength(
  collectedRows: string[][],
  visibleRows: string[][],
): number {
  const maxOverlap = Math.min(collectedRows.length, visibleRows.length)

  for (let length = maxOverlap; length > 0; length -= 1) {
    const collectedSlice = collectedRows.slice(collectedRows.length - length)
    const visibleSlice = visibleRows.slice(0, length)
    if (areRowGroupsEqual(collectedSlice, visibleSlice)) {
      return length
    }
  }

  return 0
}

/**
 * 判断两组数据行是否完全一致
 *
 * @param leftRows - 左侧数据行
 * @param rightRows - 右侧数据行
 * @returns 两组数据行是否一致
 */
function areRowGroupsEqual(
  leftRows: string[][],
  rightRows: string[][],
): boolean {
  if (leftRows.length !== rightRows.length) return false

  return leftRows.every((leftRow, index) =>
    areRowsEqual(leftRow, rightRows[index]),
  )
}

/**
 * 判断两行数据是否完全一致
 *
 * @param leftRow - 左侧数据行
 * @param rightRow - 右侧数据行
 * @returns 两行数据是否一致
 */
function areRowsEqual(
  leftRow: string[],
  rightRow: string[] | undefined,
): boolean {
  if (!rightRow) return false
  if (leftRow.length !== rightRow.length) return false

  return leftRow.every((value, index) => value === rightRow[index])
}

/**
 * 按阈值确认是否保留全部行
 *
 * @param rows - 数据行
 * @param rowLimit - 长表格确认阈值
 * @param confirmLargeCopy - 超过阈值时的确认函数
 * @returns 阈值处理后的数据行
 */
async function applyRowLimit(
  rows: string[][],
  rowLimit: number,
  confirmLargeCopy: (rowLimit: number) => boolean | Promise<boolean>,
): Promise<{ value: string[][]; truncated: boolean }> {
  if (rows.length <= rowLimit) {
    return { value: rows, truncated: false }
  }

  const shouldCopyAll = await confirmLargeCopy(rowLimit)
  if (shouldCopyAll) {
    return { value: rows, truncated: false }
  }

  return { value: rows.slice(0, rowLimit), truncated: true }
}
