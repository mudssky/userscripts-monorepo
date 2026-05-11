import { SELECTORS } from './selectors'

/** 表格数据结构 */
export interface TableData {
  headers: string[]
  rows: string[][]
}

/**
 * 提取表格数据
 *
 * @param resultContainer - 结果容器元素，默认 document
 * @returns 表格数据或 null
 */
export function parseTable(resultContainer?: Element | null): TableData | null {
  const table = (resultContainer ?? document).querySelector(SELECTORS.table)
  if (!table) return null

  const headerEl = table.querySelector(SELECTORS.headerRow)
  if (!headerEl) return null

  const headers: string[] = []
  headerEl.querySelectorAll('th').forEach((th) => {
    const textEl = th.querySelector(SELECTORS.headerText)
    const text = textEl ? textEl.textContent : th.textContent
    headers.push((text ?? '').trim())
  })

  const rows: string[][] = []
  table.querySelectorAll(SELECTORS.bodyRows).forEach((rowEl) => {
    const cells: string[] = []
    rowEl.querySelectorAll('.art-table-cell').forEach((cell) => {
      const textEl = cell.querySelector(SELECTORS.cellText)
      const text = textEl ? textEl.textContent : cell.textContent
      cells.push((text ?? '').trim())
    })
    rows.push(cells)
  })

  return { headers, rows }
}

/**
 * 格式化为 CSV
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
