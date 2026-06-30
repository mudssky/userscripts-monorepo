import { describe, expect, it, vi } from 'vitest'
import { buildCopyPayload, type CopyFormat } from './copy-strategy'
import type { NativeCsvExportAttempt } from './csv-exporter'
import type { TableCollectionResult } from './table-collector'

/**
 * 创建复制策略测试依赖。
 *
 * @param options - 依赖覆盖项
 * @returns 复制策略依赖
 */
function createDependencies(options: {
  copyMode?: 'export' | 'dom'
  exportAttempt?: NativeCsvExportAttempt
  tableResult?: TableCollectionResult
}) {
  return {
    getCopyMode: vi.fn(() => options.copyMode ?? 'export'),
    exportNativeCsv: vi.fn(
      async () =>
        options.exportAttempt ?? {
          result: null,
          exportButtonFound: false,
        },
    ),
    collectTableData: vi.fn(
      async () => options.tableResult ?? createTableResult(),
    ),
  }
}

/**
 * 创建 DOM 表格收集结果。
 *
 * @returns 表格收集结果
 */
function createTableResult(): TableCollectionResult {
  return {
    data: {
      headers: ['id', 'name'],
      rows: [
        ['1', 'alpha'],
        ['2', 'beta'],
      ],
    },
    truncated: false,
    rowLimit: 300,
  }
}

/**
 * 执行复制策略。
 *
 * @param format - 复制格式
 * @param dependencies - 策略依赖
 * @returns 复制策略结果
 */
function runStrategy(
  format: CopyFormat,
  dependencies: ReturnType<typeof createDependencies>,
) {
  return buildCopyPayload({} as Element, format, () => true, dependencies)
}

describe('buildCopyPayload', () => {
  it('CSV 导出接口失败时回退 DOM 表格提取', async () => {
    const dependencies = createDependencies({
      exportAttempt: {
        result: null,
        exportButtonFound: true,
        error: '接口限流',
      },
    })

    const result = await runStrategy('csv', dependencies)

    expect(result).toEqual({
      ok: true,
      text: 'id,name\n1,alpha\n2,beta',
      copiedType: 'CSV',
      source: 'dom',
      fallbackReason: 'DMS 导出接口失败：接口限流',
    })
    expect(dependencies.collectTableData).toHaveBeenCalledTimes(1)
  })

  it('Markdown 优先复用导出 CSV 并转换为 Markdown 表格', async () => {
    const dependencies = createDependencies({
      exportAttempt: {
        result: {
          csvText: 'id,name\n1,alpha\n2,beta',
          source: 'dms-export-api',
        },
        exportButtonFound: true,
      },
    })

    const result = await runStrategy('markdown', dependencies)

    expect(result).toEqual({
      ok: true,
      text: '| id | name |\n| --- | --- |\n| 1 | alpha |\n| 2 | beta |',
      copiedType: 'Markdown（导出）',
      source: 'dms-export-api',
    })
    expect(dependencies.collectTableData).not.toHaveBeenCalled()
  })

  it('Markdown 导出接口失败时回退 DOM 表格提取', async () => {
    const dependencies = createDependencies({
      exportAttempt: {
        result: null,
        exportButtonFound: true,
        error: '未找到 dbId',
      },
    })

    const result = await runStrategy('markdown', dependencies)

    expect(result).toEqual({
      ok: true,
      text: '| id | name |\n| --- | --- |\n| 1 | alpha |\n| 2 | beta |',
      copiedType: 'Markdown',
      source: 'dom',
      fallbackReason: 'DMS 导出接口失败：未找到 dbId',
    })
  })
})
