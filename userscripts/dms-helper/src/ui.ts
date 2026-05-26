import { COPY_CONFIG } from './config'
import { getCopyMode } from './copy-mode'
import { exportNativeCsv } from './csv-exporter'
import { toCSV, toMarkdown, type TableData } from './format'
import { collectTableData } from './table-collector'

/**
 * 复制文本到剪贴板
 *
 * @param text - 待复制文本
 * @param type - 复制内容类型
 * @returns 复制完成后的 Promise
 */
export async function copyText(text: string, type: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    showToast(`✅ ${type} 已复制到剪贴板`)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      showToast(`✅ ${type} 已复制到剪贴板`)
    } catch {
      showToast('❌ 复制失败')
    }
    document.body.removeChild(textarea)
  }
}

/**
 * 显示 Toast 提示
 *
 * @param message - 提示内容
 * @returns 无返回值
 */
export function showToast(message: string): void {
  document.getElementById('dms-custom-toast')?.remove()

  const toast = document.createElement('div')
  toast.id = 'dms-custom-toast'
  toast.textContent = message
  toast.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background-color: #333; color: #fff; padding: 10px 20px; border-radius: 4px;
    font-size: 14px; z-index: 999999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    opacity: 0; transition: opacity 0.3s ease; cursor: pointer;
  `
  toast.onclick = () => toast.remove()
  document.body.appendChild(toast)
  requestAnimationFrame(() => (toast.style.opacity = '1'))
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 300)
  }, 2500)
}

/**
 * 移除已注入的按钮
 *
 * @param toolbar - 结果工具栏元素
 * @returns 无返回值
 */
function removeInjectedButtons(toolbar: Element): void {
  toolbar.querySelectorAll('#dms-helper-csv-btn, #dms-helper-md-btn').forEach((btn) => btn.remove())
}

/**
 * 确认是否继续复制长表格
 *
 * @param rowLimit - 长表格确认阈值
 * @returns 用户是否确认继续复制全部数据
 */
function confirmLargeCopy(rowLimit: number): boolean {
  return window.confirm(
    `检测到查询结果超过 ${rowLimit} 行，完整复制可能会比较慢。\n\n点击“确定”继续完整复制，点击“取消”只复制前 ${rowLimit} 行。`,
  )
}

/**
 * 复制格式化后的表格数据
 *
 * @param resultContainer - 查询结果容器
 * @param type - 复制内容类型
 * @param formatter - 表格格式化函数
 * @returns 复制完成后的 Promise
 */
async function copyFormattedTable(
  resultContainer: Element,
  type: string,
  formatter: (data: TableData | null) => string,
): Promise<void> {
  showToast(`正在收集 ${type} 数据...`)

  const result = await collectTableData(resultContainer, {
    rowLimit: COPY_CONFIG.slowRowThreshold,
    confirmLargeCopy,
  })
  const text = formatter(result.data)

  if (!text) {
    showToast('❌ 未找到可复制的表格数据')
    return
  }

  const copiedType = result.truncated ? `${type}（前 ${result.rowLimit} 行）` : type
  await copyText(text, copiedType)
}

/**
 * 使用现有 DOM/虚拟滚动收集逻辑复制 CSV
 *
 * @param resultContainer - 查询结果容器
 * @returns 复制完成后的 Promise
 */
async function copyCsvFromDom(resultContainer: Element): Promise<void> {
  await copyFormattedTable(resultContainer, 'CSV', toCSV)
}

/**
 * 优先使用 DMS 原生导出能力复制 CSV，失败时回退到 DOM 复制模式
 *
 * @param resultContainer - 查询结果容器
 * @returns 复制完成后的 Promise
 */
async function copyCsvWithPreferredMode(resultContainer: Element): Promise<void> {
  if (getCopyMode() === 'dom') {
    await copyCsvFromDom(resultContainer)
    return
  }

  showToast('正在通过 DMS 导出 CSV...')
  const exportResult = await exportNativeCsv(resultContainer)

  if (exportResult) {
    await copyText(exportResult.csvText, 'CSV（导出）')
    return
  }

  showToast('⚠️ 未捕获到导出 CSV，已切换为复制模式')
  await copyCsvFromDom(resultContainer)
}

/**
 * 创建操作按钮并注入到工具栏
 *
 * @param toolbar - 结果工具栏元素
 * @param resultContainer - 查询结果容器
 * @returns 无返回值
 */
export function injectButtons(toolbar: Element, resultContainer: Element): void {
  if (toolbar.querySelector('#dms-helper-csv-btn')) return

  /**
   * 创建复制按钮
   *
   * @param text - 按钮文本
   * @param onClick - 点击回调
   * @returns 按钮元素
   */
  const createBtn = (text: string, onClick: () => Promise<void>): HTMLButtonElement => {
    const btn = document.createElement('button')
    btn.className = 'next-btn next-small next-btn-normal is-wind'
    btn.style.marginLeft = '8px'
    btn.textContent = text
    btn.onclick = () => {
      btn.disabled = true
      onClick()
        .catch(() => showToast('❌ 复制失败'))
        .finally(() => {
          btn.disabled = false
        })
    }
    return btn
  }

  const csvBtn = createBtn('复制 CSV', () => copyCsvWithPreferredMode(resultContainer))
  csvBtn.id = 'dms-helper-csv-btn'

  const mdBtn = createBtn('复制 Markdown', () => copyFormattedTable(resultContainer, 'Markdown', toMarkdown))
  mdBtn.id = 'dms-helper-md-btn'

  toolbar.appendChild(csvBtn)
  toolbar.appendChild(mdBtn)
}

export { removeInjectedButtons }
