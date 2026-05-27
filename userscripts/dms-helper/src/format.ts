import { SELECTORS } from './selectors'
import { findActiveExecutionResultTable } from './result-context'

/** 表格数据结构 */
export interface TableData {
  headers: string[]
  rows: string[][]
}

/**
 * 查找结果容器内的表格元素
 *
 * @param resultContainer - 结果容器元素，默认 document
 * @returns 表格元素或 null
 */
export function findTable(resultContainer?: Element | null): Element | null {
  const container = resultContainer ?? document
  if (container.querySelector('.sql-console-results-tab')) {
    return findActiveExecutionResultTable(container)
  }

  return container.querySelector(SELECTORS.table)
}

/**
 * 提取表头字段
 *
 * @param resultContainer - 结果容器元素，默认 document
 * @returns 表头字段列表或 null
 */
export function parseHeaders(resultContainer?: Element | null): string[] | null {
  const table = findTable(resultContainer)
  if (!table) return null

  const headerEl = table.querySelector(SELECTORS.headerRow)
  if (!headerEl) return null

  const headers: string[] = []
  headerEl.querySelectorAll('th').forEach((th) => {
    const textEl = th.querySelector(SELECTORS.headerText)
    const text = textEl ? textEl.textContent : th.textContent
    headers.push((text ?? '').trim())
  })

  return headers
}

/**
 * 提取当前 DOM 中可见的数据行
 *
 * @param resultContainer - 结果容器元素，默认 document
 * @returns 当前已渲染的数据行
 */
export function parseVisibleRows(resultContainer?: Element | null): string[][] {
  const table = findTable(resultContainer)
  if (!table) return []

  const rows: string[][] = []
  table.querySelectorAll(SELECTORS.bodyRows).forEach((rowEl) => {
    const cells: string[] = []
    rowEl.querySelectorAll(SELECTORS.bodyCell).forEach((cell) => {
      const textEl = cell.querySelector(SELECTORS.cellText)
      const text = textEl ? textEl.textContent : cell.textContent
      cells.push((text ?? '').trim())
    })
    rows.push(cells)
  })

  return rows
}

/**
 * 提取表格数据
 *
 * @param resultContainer - 结果容器元素，默认 document
 * @returns 表格数据或 null
 */
export function parseTable(resultContainer?: Element | null): TableData | null {
  const headers = parseHeaders(resultContainer)
  if (!headers) return null

  const rows = parseVisibleRows(resultContainer)
  return { headers, rows }
}

/**
 * 格式化为 CSV
 *
 * @param data - 表格数据
 * @returns CSV 文本
 */
export function toCSV(data: TableData | null): string {
  if (!data) return ''
  const escape = (val: string | null | undefined): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const lines = [data.headers.map(escape).join(',')]
  data.rows.forEach((row) => lines.push(row.map(escape).join(',')))
  return lines.join('\n')
}

/**
 * 格式化为 Markdown 表格
 *
 * @param data - 表格数据
 * @returns Markdown 表格文本
 */
export function toMarkdown(data: TableData | null): string {
  if (!data) return ''
  const { headers, rows } = data
  const escapePipe = (str: string): string => String(str).replace(/\|/g, '\\|')

  const headerLine = `| ${headers.map(escapePipe).join(' | ')} |`
  const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`
  const bodyLines = rows.map((row) => `| ${row.map(escapePipe).join(' | ')} |`)

  return [headerLine, separatorLine, ...bodyLines].join('\n')
}
