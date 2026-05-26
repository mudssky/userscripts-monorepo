import { SELECTORS } from './selectors'

const EXPORT_CAPTURE_TIMEOUT_MS = 6000
const EXPORT_MENU_WAIT_MS = 1200
const EXPORT_POLL_INTERVAL_MS = 120
const EXPORT_BUTTON_TEXT_PATTERN = /导出|export/i
const CSV_TEXT_PATTERN = /csv|逗号分隔/i
const CSV_CAPTURE_EVENT_NAME = 'dms-helper:native-csv-captured'
const CSV_CAPTURE_RESTORE_EVENT_NAME = 'dms-helper:restore-native-csv-capture'

interface BlobCapture {
  readonly text: Promise<string>
  restore: () => void
}

/** CSV 导出结果 */
export interface NativeCsvExportResult {
  csvText: string
  source: 'native-export'
}

/**
 * 尝试通过 DMS 原生 CSV 导出获取完整 CSV 文本
 *
 * @param resultContainer - 查询结果容器
 * @returns 捕获到的 CSV 导出结果；失败时返回 null
 */
export async function exportNativeCsv(resultContainer: Element): Promise<NativeCsvExportResult | null> {
  const exportButton = findExportButton(resultContainer)
  if (!exportButton) return null

  const capture = installBlobCapture()
  try {
    exportButton.click()
    await clickCsvMenuItem()
    const csvText = await withTimeout(capture.text, EXPORT_CAPTURE_TIMEOUT_MS)
    const normalizedCsvText = csvText.trimEnd()

    if (!normalizedCsvText) {
      return null
    }

    return {
      csvText: normalizedCsvText,
      source: 'native-export',
    }
  } catch {
    return null
  } finally {
    capture.restore()
  }
}

/**
 * 查找当前结果区域内的原生导出按钮
 *
 * @param resultContainer - 查询结果容器
 * @returns 可点击的导出按钮或 null
 */
function findExportButton(resultContainer: Element): HTMLElement | null {
  const toolbar = resultContainer.querySelector(SELECTORS.toolbar) ?? resultContainer
  const candidates = Array.from(
    toolbar.querySelectorAll<HTMLElement>('button, [role="button"], a, .next-btn, .next-menu-btn'),
  )

  return candidates.find((candidate) => EXPORT_BUTTON_TEXT_PATTERN.test(getElementText(candidate))) ?? null
}

/**
 * 点击 CSV 菜单项；若导出按钮本身已经直接导出 CSV，则等待超时后交给捕获逻辑处理
 *
 * @returns 菜单项点击完成后的 Promise
 */
async function clickCsvMenuItem(): Promise<void> {
  const menuItem = await waitForCsvMenuItem()
  menuItem?.click()
}

/**
 * 等待导出菜单中的 CSV 菜单项出现
 *
 * @returns CSV 菜单项或 null
 */
async function waitForCsvMenuItem(): Promise<HTMLElement | null> {
  const deadline = Date.now() + EXPORT_MENU_WAIT_MS

  while (Date.now() < deadline) {
    const menuItem = findCsvMenuItem()
    if (menuItem) return menuItem
    await wait(EXPORT_POLL_INTERVAL_MS)
  }

  return null
}

/**
 * 查找页面弹层里的 CSV 菜单项
 *
 * @returns CSV 菜单项或 null
 */
function findCsvMenuItem(): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="menuitem"], .next-menu-item, .next-menu-item-text, li, button, a',
    ),
  )

  return (
    candidates.find((candidate) => {
      if (!isVisibleElement(candidate)) return false
      const text = getElementText(candidate)
      return CSV_TEXT_PATTERN.test(text) && EXPORT_BUTTON_TEXT_PATTERN.test(text)
    }) ??
    candidates.find((candidate) => {
      if (!isVisibleElement(candidate)) return false
      return CSV_TEXT_PATTERN.test(getElementText(candidate))
    }) ??
    null
  )
}

/**
 * 临时安装 Blob 导出捕获器
 *
 * @returns Blob 捕获器
 */
function installBlobCapture(): BlobCapture {
  let settleText: (text: string) => void = () => undefined
  let rejectText: (error: unknown) => void = () => undefined
  const captureId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  const text = new Promise<string>((resolve, reject) => {
    settleText = resolve
    rejectText = reject
  })
  const handleCaptured = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return
    if (!isCapturedCsvEventDetail(event.detail, captureId)) return

    settleText(event.detail.csvText)
  }

  window.addEventListener(CSV_CAPTURE_EVENT_NAME, handleCaptured)
  injectPageBlobCapture(captureId)

  return {
    text,
    restore: () => {
      window.removeEventListener(CSV_CAPTURE_EVENT_NAME, handleCaptured)
      window.dispatchEvent(
        new CustomEvent(CSV_CAPTURE_RESTORE_EVENT_NAME, {
          detail: { captureId },
        }),
      )
    },
  }
}

/**
 * 注入页面上下文的 Blob 捕获器
 *
 * @param captureId - 本次导出捕获 ID
 * @returns 无返回值
 */
function injectPageBlobCapture(captureId: string): void {
  const script = document.createElement('script')
  script.textContent = `
    (() => {
      const captureId = ${JSON.stringify(captureId)};
      const capturedEventName = ${JSON.stringify(CSV_CAPTURE_EVENT_NAME)};
      const restoreEventName = ${JSON.stringify(CSV_CAPTURE_RESTORE_EVENT_NAME)};
      const originalCreateObjectUrl = URL.createObjectURL.bind(URL);
      let hasCaptured = false;

      const isLikelyCsvBlob = (blob) => {
        if (!blob || !blob.size) return false;
        const type = String(blob.type || '').toLowerCase();
        return !type || type.includes('csv') || type.includes('text') || type.includes('octet-stream');
      };
      const restore = (event) => {
        if (event.detail && event.detail.captureId !== captureId) return;
        URL.createObjectURL = originalCreateObjectUrl;
        window.removeEventListener(restoreEventName, restore);
      };

      URL.createObjectURL = (object) => {
        if (!hasCaptured && object instanceof Blob && isLikelyCsvBlob(object)) {
          hasCaptured = true;
          object
            .text()
            .then((csvText) => {
              window.dispatchEvent(new CustomEvent(capturedEventName, { detail: { captureId, csvText } }));
            })
            .catch(() => undefined);
        }

        return originalCreateObjectUrl(object);
      };
      window.addEventListener(restoreEventName, restore);
    })();
  `
  document.documentElement.appendChild(script)
  script.remove()
}

/**
 * 校验 CSV 捕获事件 detail
 *
 * @param detail - 事件 detail
 * @param captureId - 本次捕获 ID
 * @returns 是否为当前捕获事件
 */
function isCapturedCsvEventDetail(detail: unknown, captureId: string): detail is { captureId: string; csvText: string } {
  if (!detail || typeof detail !== 'object') return false

  const record = detail as Record<string, unknown>
  return record.captureId === captureId && typeof record.csvText === 'string'
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
    const timer = window.setTimeout(() => reject(new Error('等待 CSV 导出超时')), timeoutMs)
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
 * 等待指定时间
 *
 * @param delayMs - 等待毫秒数
 * @returns 等待完成后的 Promise
 */
function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs))
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

/**
 * 判断元素是否可见
 *
 * @param element - 待检测元素
 * @returns 是否可见
 */
function isVisibleElement(element: HTMLElement): boolean {
  return element.offsetParent !== null || element.getClientRects().length > 0
}
