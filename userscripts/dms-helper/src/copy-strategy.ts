import { COPY_CONFIG } from './config'
import type { NativeCsvExportAttempt } from './csv-exporter'
import { parseCSV, type TableData, toCSV, toMarkdown } from './format'
import type { collectTableData } from './table-collector'

export type CopyFormat = 'csv' | 'markdown'
type CopyMode = 'export' | 'dom'

export interface CopyPayload {
  ok: true
  text: string
  copiedType: string
  source: 'dms-export-api' | 'dom'
  fallbackReason?: string
}

export interface CopyFailure {
  ok: false
  reason: string
  fallbackReason?: string
}

export type CopyResult = CopyPayload | CopyFailure

type ConfirmLargeCopy = (rowLimit: number) => boolean | Promise<boolean>

interface CopyStrategyDependencies {
  getCopyMode: () => CopyMode
  exportNativeCsv: (resultContainer: Element) => Promise<NativeCsvExportAttempt>
  collectTableData: typeof collectTableData
}

/**
 * 构建复制内容，默认优先调用 DMS 导出接口，失败后回退 DOM 表格提取。
 *
 * @param resultContainer - 查询结果容器
 * @param format - 目标复制格式
 * @param confirmLargeCopy - 长表格复制确认函数
 * @param dependencies - 可替换依赖，便于业务策略测试
 * @returns 复制内容或失败原因
 */
export async function buildCopyPayload(
  resultContainer: Element,
  format: CopyFormat,
  confirmLargeCopy: ConfirmLargeCopy,
  dependencies: CopyStrategyDependencies,
): Promise<CopyResult> {
  if (dependencies.getCopyMode() === 'dom') {
    return buildDomCopyPayload(
      resultContainer,
      format,
      confirmLargeCopy,
      dependencies,
    )
  }

  const exportAttempt = await dependencies.exportNativeCsv(resultContainer)
  if (exportAttempt.result) {
    const exportedText = formatExportedCsv(exportAttempt.result.csvText, format)
    if (exportedText) {
      return {
        ok: true,
        text: exportedText,
        copiedType: `${getFormatLabel(format)}（导出）`,
        source: 'dms-export-api',
      }
    }
  }

  const fallbackReason = getExportFallbackReason(exportAttempt)
  return buildDomCopyPayload(
    resultContainer,
    format,
    confirmLargeCopy,
    dependencies,
    fallbackReason,
  )
}

/**
 * 使用 DOM 表格数据构建复制内容。
 *
 * @param resultContainer - 查询结果容器
 * @param format - 目标复制格式
 * @param confirmLargeCopy - 长表格复制确认函数
 * @param dependencies - 可替换依赖
 * @param fallbackReason - 从导出接口回退到 DOM 的原因
 * @returns 复制内容或失败原因
 */
async function buildDomCopyPayload(
  resultContainer: Element,
  format: CopyFormat,
  confirmLargeCopy: ConfirmLargeCopy,
  dependencies: CopyStrategyDependencies,
  fallbackReason?: string,
): Promise<CopyResult> {
  const result = await dependencies.collectTableData(resultContainer, {
    rowLimit: COPY_CONFIG.slowRowThreshold,
    confirmLargeCopy,
  })

  if (!result.data || result.data.rows.length === 0) {
    return {
      ok: false,
      reason: '未找到可复制的表格数据',
      fallbackReason,
    }
  }

  const text = formatTableData(result.data, format)
  if (!text) {
    return {
      ok: false,
      reason: '未找到可复制的表格数据',
      fallbackReason,
    }
  }

  const label = getFormatLabel(format)
  return {
    ok: true,
    text,
    copiedType: result.truncated
      ? `${label}（前 ${result.rowLimit} 行）`
      : label,
    source: 'dom',
    fallbackReason,
  }
}

/**
 * 将导出接口返回的 CSV 转成目标格式。
 *
 * @param csvText - 导出接口返回的 CSV 文本
 * @param format - 目标复制格式
 * @returns 目标格式文本
 */
function formatExportedCsv(csvText: string, format: CopyFormat): string {
  if (format === 'csv') return csvText
  return toMarkdown(parseCSV(csvText))
}

/**
 * 将 DOM 表格数据转成目标格式。
 *
 * @param data - 表格数据
 * @param format - 目标复制格式
 * @returns 目标格式文本
 */
function formatTableData(data: TableData, format: CopyFormat): string {
  return format === 'csv' ? toCSV(data) : toMarkdown(data)
}

/**
 * 获取格式展示名称。
 *
 * @param format - 目标复制格式
 * @returns 展示名称
 */
function getFormatLabel(format: CopyFormat): string {
  return format === 'csv' ? 'CSV' : 'Markdown'
}

/**
 * 获取导出接口失败后的回退原因。
 *
 * @param exportAttempt - DMS 导出尝试结果
 * @returns 回退原因
 */
function getExportFallbackReason(
  exportAttempt: NativeCsvExportAttempt,
): string {
  if (exportAttempt.error) return `DMS 导出接口失败：${exportAttempt.error}`
  if (exportAttempt.exportButtonFound) return 'DMS 导出接口未返回 CSV'
  return '未捕获到导出 CSV'
}
