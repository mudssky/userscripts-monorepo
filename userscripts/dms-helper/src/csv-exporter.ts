import { SELECTORS } from './selectors'
import { getActiveExecutionResultContext, hasActiveExecutionResult } from './result-context'

const DMS_EXPORT_TIMEOUT_MS = 30000
const DMS_EXPORT_EVENT_NAME = 'dms-helper:dms-export-result'

/** DMS 导出结果 */
export interface NativeCsvExportResult {
  csvText: string
  source: 'dms-export-api'
}

/** DMS 导出尝试结果 */
export interface NativeCsvExportAttempt {
  result: NativeCsvExportResult | null
  exportButtonFound: boolean
  error?: string
}

interface DmsExportEventDetail {
  captureId: string
  success: boolean
  csvText?: string
  error?: string
}

/**
 * 通过 DMS 页面内部导出执行器获取完整 CSV 文本
 *
 * @param resultContainer - 查询结果容器
 * @returns 导出尝试结果
 */
export async function exportNativeCsv(resultContainer: Element): Promise<NativeCsvExportAttempt> {
  if (!canUseNativeExport(resultContainer)) {
    return {
      result: null,
      exportButtonFound: false,
    }
  }

  const sql = getResultSql(resultContainer)
  if (!sql) {
    return {
      result: null,
      exportButtonFound: true,
    }
  }

  const captureId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const result = waitForDmsExportResult(captureId)
  injectDmsExportRunner(captureId, sql)

  const detail = await withTimeout(result, DMS_EXPORT_TIMEOUT_MS)
  if (!detail.success || !detail.csvText) {
    return {
      result: null,
      exportButtonFound: true,
      error: detail.error ?? 'DMS 导出接口未返回 CSV',
    }
  }

  return {
    result: {
      csvText: detail.csvText,
      source: 'dms-export-api',
    },
    exportButtonFound: true,
  }
}

/**
 * 查找当前结果区域内的原生导出按钮
 *
 * @param resultContainer - 查询结果容器
 * @returns 可点击的导出按钮或 null
 */
function findExportButton(resultContainer: Element): HTMLElement | null {
  const toolbar = resultContainer.querySelector(SELECTORS.toolbar) ?? document.querySelector('.con-summary .btns') ?? resultContainer
  const candidates = Array.from(
    toolbar.querySelectorAll<HTMLElement>('button, [role="button"], a, .next-btn, .next-menu-btn'),
  )

  return candidates.find((candidate) => /导出|export|popup-exports/i.test(`${getElementText(candidate)} ${candidate.className}`)) ?? null
}

/**
 * 判断当前页面是否具备 DMS 原生导出能力
 *
 * @param resultContainer - 查询结果容器
 * @returns 是否可以尝试原生导出
 */
function canUseNativeExport(resultContainer: Element): boolean {
  if (resultContainer.querySelector('.sql-console-results-tab') && !hasActiveExecutionResult(resultContainer)) {
    return false
  }

  return Boolean(findExportButton(resultContainer) || getActiveExecutionResultContext(resultContainer)?.tabPane.querySelector(SELECTORS.table))
}

/**
 * 获取结果集对应 SQL
 *
 * @param resultContainer - 查询结果容器
 * @returns SQL 文本或空字符串
 */
function getResultSql(resultContainer: Element): string {
  return (
    getSqlFromResultState(resultContainer) ||
    (resultContainer.matches('.con-sql-result') ? getSqlFromActiveEditor() || getSqlFromTextArea() || getSqlFromCodeMirrorDom() : '')
  ).trim()
}

/**
 * 从结果容器挂载的 React props 中读取执行 SQL
 *
 * @param resultContainer - 查询结果容器
 * @returns SQL 文本或空字符串
 */
function getSqlFromResultState(resultContainer: Element): string {
  const context = getActiveExecutionResultContext(resultContainer)
  const candidates = context
    ? collectReactSqlCandidates(context.tabPane)
    : collectReactSqlCandidates(resultContainer)

  return candidates.find((value) => value) ?? ''
}

/**
 * 从 React props 和 fiber 节点中收集执行 SQL 候选
 *
 * @param root - 搜索根元素
 * @returns SQL 候选列表
 */
function collectReactSqlCandidates(root: Element): string[] {
  const candidates: string[] = []

  for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
    const reactProps = findReactProps(element)
    candidates.push(
      getNestedString(reactProps, ['data', 'executeSQL']),
      getNestedString(reactProps, ['record', 'executeSQL']),
      getNestedString(reactProps, ['result', 'executeSQL']),
      getNestedString(reactProps, ['children', 'props', 'data', 'executeSQL']),
    )

    const fiber = findReactFiber(element)
    candidates.push(...collectSqlFromFiber(fiber))

    if (candidates.some((value) => value)) break
  }

  return candidates.map((value) => value.trim()).filter((value) => value)
}

/**
 * 从当前编辑器实例读取 SQL
 *
 * @returns SQL 文本或空字符串
 */
function getSqlFromActiveEditor(): string {
  const editor = findEditorLikeObject(window)
  if (!editor) return ''

  try {
    if (typeof editor.getSelection === 'function') {
      const selected = editor.getSelection()
      if (typeof selected === 'string' && selected.trim()) return selected
    }

    if (typeof editor.getValue === 'function') {
      const value = editor.getValue()
      if (typeof value === 'string') return value
    }
  } catch {
    return ''
  }

  return ''
}

/**
 * 从 textarea 兜底读取 SQL
 *
 * @returns SQL 文本或空字符串
 */
function getSqlFromTextArea(): string {
  const textarea = document.querySelector<HTMLTextAreaElement>('textarea')
  return textarea?.value ?? ''
}

/**
 * 从 CodeMirror DOM 兜底读取 SQL
 *
 * @returns SQL 文本或空字符串
 */
function getSqlFromCodeMirrorDom(): string {
  const lines = Array.from(document.querySelectorAll<HTMLElement>('.cm-line, .CodeMirror-line'))
    .map((line) => line.textContent ?? '')
    .filter((line) => line.trim())

  return lines.join('\n')
}

/**
 * 等待页面上下文导出结果
 *
 * @param captureId - 本次导出捕获 ID
 * @returns 导出事件 detail
 */
function waitForDmsExportResult(captureId: string): Promise<DmsExportEventDetail> {
  return new Promise((resolve) => {
    const handler = (event: Event): void => {
      if (!(event instanceof CustomEvent)) return
      if (!isDmsExportEventDetail(event.detail, captureId)) return

      window.removeEventListener(DMS_EXPORT_EVENT_NAME, handler)
      resolve(event.detail)
    }

    window.addEventListener(DMS_EXPORT_EVENT_NAME, handler)
  })
}

/**
 * 注入页面上下文导出执行器
 *
 * @param captureId - 本次导出捕获 ID
 * @param sql - 待执行 SQL
 * @returns 无返回值
 */
function injectDmsExportRunner(captureId: string, sql: string): void {
  const script = document.createElement('script')
  script.textContent = `
    (async () => {
      const captureId = ${JSON.stringify(captureId)};
      const sql = ${JSON.stringify(sql)};
      const eventName = ${JSON.stringify(DMS_EXPORT_EVENT_NAME)};
      const dispatch = (detail) => window.dispatchEvent(new CustomEvent(eventName, { detail: { captureId, ...detail } }));
      try {
      const readParams = () => {
        const params = new URLSearchParams(window.location.search);
        return {
          dbId: params.get('dbId') || '',
          region: params.get('regionId') || params.get('region') || undefined,
        };
      };
      const getWebpackRequire = () => {
        const chunk = window.webpackChunk_ali_idb_style;
        if (!chunk || typeof chunk.push !== 'function') return null;
        let requireFn = null;
        chunk.push([[Date.now()], {}, (runtimeRequire) => {
          requireFn = runtimeRequire;
        }]);
        return requireFn;
      };
      const getLocalJson = (key) => {
        try {
          return JSON.parse(localStorage.getItem(key) || 'null');
        } catch {
          return null;
        }
      };
      const readRegionFromLocalStorage = (dbId) => {
        for (let index = 0; index < localStorage.length; index += 1) {
          const key = localStorage.key(index) || '';
          if (!key.includes(String(dbId))) continue;
          const value = getLocalJson(key);
          const region = value && (value.idc || value.idcTitle || value.region || value.dataRegion);
          if (typeof region === 'string' && region) return region;
        }
        return '';
      };
      const requestRegionFromDms = async (dbId) => {
        const params = new URLSearchParams(window.location.search);
        const instanceId = params.get('instanceId') || '';
        const dbType = params.get('dbType') || '';
        if (!instanceId || !dbType) return '';
        const body = new URLSearchParams({ dbType, instanceId, dbId });
        const response = await fetch('https://dms.aliyun.com/database/detailInfo', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body,
          credentials: 'include',
        });
        const payload = await response.json();
        const root = payload && payload.root;
        return (root && (root.idc || root.idcTitle || root.region || root.dataRegion)) || '';
      };
      const readRegion = async (dbId, fallbackRegion) => {
        return fallbackRegion || readRegionFromLocalStorage(dbId) || await requestRegionFromDms(dbId) || 'cn-shanghai';
      };
      const getLanguage = (requireFn) => {
        try {
          const langModule = requireFn(53764);
          return typeof langModule.VQ === 'function' ? langModule.VQ() : 'zh';
        } catch {
          return 'zh';
        }
      };
      const convertRawResultData = (result) => {
        const data = result && result.data;
        const columns = data && data.columnMetaList ? data.columnMetaList.map((column, index) => ({
          field: 'C_' + (index + 1),
          realName: column.columnName,
          title: column.columnLabel || column.columnName,
        })) : [];
        const toRecordRow = (row) => {
          const record = {};
          if (Array.isArray(row)) {
            row.forEach((cell, index) => {
              if (cell !== null && cell !== undefined) record['C_' + (index + 1)] = cell;
            });
            return record;
          }
          if (row && typeof row === 'object') {
            columns.forEach((column) => {
              const cell = row[column.field];
              if (cell !== null && cell !== undefined) record[column.field] = cell;
            });
          }
          return record;
        };
        const rows = data && data.rowDataList ? data.rowDataList.map(toRecordRow) : [];
        return { columns, result: rows };
      };
      const getFieldText = (field) => {
        if (field === null || field === undefined) return '';
        if (typeof field === 'object' && 'value' in field) return String(field.value ?? '');
        return String(field);
      };
      const escapeCsv = (value) => {
        const text = getFieldText(value);
        return /[",\\n\\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
      };
      const toCsv = (resultData) => {
        const columns = resultData && resultData.columns ? resultData.columns : [];
        const rows = resultData && resultData.result ? resultData.result : [];
        const headers = columns.map((column) => column.realName || column.title || column.name || column.field || '');
        const fields = columns.map((column, index) => column.field || ('C_' + (index + 1)));
        return [headers.map(escapeCsv).join(','), ...rows.map((row) => fields.map((field) => escapeCsv(row && row[field])).join(','))].join('\\n');
      };
      const executeByWebpackExecutor = async (dbId, region) => {
        const requireFn = getWebpackRequire();
        if (!requireFn) throw new Error('未找到 DMS webpack 运行时');
        const Executor = requireFn(73623).u0;
        if (typeof Executor !== 'function') throw new Error('未找到 DMS SQL 执行器');
        const executor = new Executor(dbId, getLanguage(requireFn));
        executor.region = region;
        executor.columnTruncate = 0;
        try {
          let hasResult = false;
          await executor.executeSqlsWithCallback(sql, (result) => {
            if (hasResult) return;
            if (result && result.type === 'RESOLVED') return;
            if (!result || result.success === false) {
              hasResult = true;
              dispatch({ success: false, error: (result && (result.error || result.message)) || 'DMS 导出执行失败' });
              return;
            }
            const csvText = toCsv(convertRawResultData(result));
            hasResult = true;
            dispatch({ success: Boolean(csvText), csvText, error: csvText ? undefined : 'DMS 导出结果为空' });
          }, { pageNum: 1 }, { executionAbort: false, ignoreConfirm: true });
          if (!hasResult) dispatch({ success: false, error: 'DMS 导出结果为空' });
        } finally {
          executor.destroy();
        }
      };
      const { dbId, region } = readParams();
      if (!dbId) {
        dispatch({ success: false, error: '未找到 dbId' });
        return;
      }
      const resolvedRegion = await readRegion(dbId, region);
      executeByWebpackExecutor(dbId, resolvedRegion).catch((error) => {
        dispatch({ success: false, error: error instanceof Error ? error.message : String(error) });
      });
      } catch (error) {
        dispatch({ success: false, error: error instanceof Error ? error.message : String(error) });
      }
    })();
  `
  document.documentElement.appendChild(script)
  script.remove()
}

/**
 * 校验 DMS 导出事件 detail
 *
 * @param detail - 事件 detail
 * @param captureId - 本次捕获 ID
 * @returns 是否为当前导出事件
 */
function isDmsExportEventDetail(detail: unknown, captureId: string): detail is DmsExportEventDetail {
  if (!detail || typeof detail !== 'object') return false

  const record = detail as Record<string, unknown>
  return record.captureId === captureId && typeof record.success === 'boolean'
}

/**
 * 为 Promise 增加超时保护
 *
 * @param promise - 待等待的 Promise
 * @param timeoutMs - 超时时间
 * @returns Promise 结果
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('等待 DMS 导出接口超时')), timeoutMs)
    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })
}

/**
 * 查找 React props
 *
 * @param element - DOM 元素
 * @returns React props 或 null
 */
function findReactProps(element: Element): Record<string, unknown> | null {
  const key = Object.keys(element).find((name) => name.startsWith('__reactProps$') || name.startsWith('__reactEventHandlers$'))
  if (!key) return null

  const value = (element as unknown as Record<string, unknown>)[key]
  return isRecord(value) ? value : null
}

/**
 * 查找 React fiber
 *
 * @param element - DOM 元素
 * @returns React fiber 或 null
 */
function findReactFiber(element: Element): Record<string, unknown> | null {
  const key = Object.keys(element).find((name) => name.startsWith('__reactFiber$') || name.startsWith('__reactInternalInstance$'))
  if (!key) return null

  const value = (element as unknown as Record<string, unknown>)[key]
  return isRecord(value) ? value : null
}

/**
 * 从 React fiber 链路中收集执行 SQL
 *
 * @param fiber - React fiber
 * @returns SQL 候选列表
 */
function collectSqlFromFiber(fiber: Record<string, unknown> | null): string[] {
  const candidates: string[] = []
  let current: unknown = fiber

  for (let depth = 0; isRecord(current) && depth < 20; depth += 1) {
    candidates.push(...collectSqlFromUnknown(current['memoizedProps'], 0))
    candidates.push(...collectSqlFromUnknown(current['pendingProps'], 0))
    candidates.push(...collectSqlFromUnknown(current['memoizedState'], 0))
    current = current['return']
  }

  return candidates
}

/**
 * 从未知对象中递归收集 executeSQL 字段
 *
 * @param source - 待搜索对象
 * @param depth - 当前递归深度
 * @returns SQL 候选列表
 */
function collectSqlFromUnknown(source: unknown, depth: number): string[] {
  if (depth > 5 || !source) return []
  if (typeof source === 'string') return []
  if (Array.isArray(source)) {
    return source.flatMap((item) => collectSqlFromUnknown(item, depth + 1))
  }
  if (!isRecord(source)) return []

  const candidates: string[] = []
  for (const [key, value] of Object.entries(source)) {
    if (key === 'executeSQL' && typeof value === 'string') {
      candidates.push(value)
      continue
    }

    if (!shouldTraverseKey(key, value)) continue
    candidates.push(...collectSqlFromUnknown(value, depth + 1))
  }

  return candidates
}

/**
 * 判断递归搜索时是否应进入该字段
 *
 * @param key - 字段名
 * @param value - 字段值
 * @returns 是否继续遍历
 */
function shouldTraverseKey(key: string, value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (/^(stateNode|child|sibling|return|alternate|ref|elementType|type|_owner)$/i.test(key)) return false
  return /data|record|result|row|props|state|list|tabs|pane|children|item/i.test(key)
}

/**
 * 从对象中读取嵌套字符串
 *
 * @param source - 数据源
 * @param path - 属性路径
 * @returns 字符串值或空字符串
 */
function getNestedString(source: unknown, path: string[]): string {
  let current = source

  for (const key of path) {
    if (!isRecord(current)) return ''
    current = current[key]
  }

  return typeof current === 'string' ? current : ''
}

/**
 * 查找页面上的编辑器对象
 *
 * @param root - 搜索根对象
 * @returns 编辑器对象或 null
 */
function findEditorLikeObject(root: unknown): { getValue?: () => unknown; getSelection?: () => unknown } | null {
  const visited = new Set<unknown>()
  const queue: unknown[] = [root]

  for (let index = 0; index < queue.length && index < 2000; index += 1) {
    const current = queue[index]
    if (!isRecord(current) || visited.has(current)) continue
    visited.add(current)

    if (typeof current.getValue === 'function' && typeof current.getSelection === 'function') {
      return current as { getValue?: () => unknown; getSelection?: () => unknown }
    }

    for (const key of Object.keys(current).slice(0, 80)) {
      if (!/editor|cm|code|view|state|tabs|current/i.test(key)) continue
      queue.push(current[key])
    }
  }

  return null
}

/**
 * 判断值是否为普通对象
 *
 * @param value - 待检测值
 * @returns 是否为对象记录
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

/**
 * 获取元素可见文本
 *
 * @param element - DOM 元素
 * @returns 元素文本
 */
function getElementText(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim()
}
