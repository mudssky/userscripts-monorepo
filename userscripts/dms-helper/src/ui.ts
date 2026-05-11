import { toCSV, toMarkdown, parseTable } from './format'

/**
 * 复制文本到剪贴板
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
    opacity: 0; transition: opacity 0.3s ease; pointer-events: none;
  `
  document.body.appendChild(toast)
  requestAnimationFrame(() => (toast.style.opacity = '1'))
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.parentNode?.removeChild(toast), 300)
  }, 2500)
}

/** 移除已注入的按钮 */
function removeInjectedButtons(toolbar: Element): void {
  toolbar.querySelectorAll('#dms-helper-csv-btn, #dms-helper-md-btn').forEach((btn) => btn.remove())
}

/** 创建操作按钮并注入到工具栏 */
export function injectButtons(toolbar: Element, resultContainer: Element): void {
  if (toolbar.querySelector('#dms-helper-csv-btn')) return

  const createBtn = (text: string, onClick: () => void): HTMLButtonElement => {
    const btn = document.createElement('button')
    btn.className = 'next-btn next-small next-btn-normal is-wind'
    btn.style.marginLeft = '8px'
    btn.textContent = text
    btn.onclick = onClick
    return btn
  }

  const csvBtn = createBtn('复制 CSV', () => {
    const data = parseTable(resultContainer)
    if (data) copyText(toCSV(data), 'CSV')
  })
  csvBtn.id = 'dms-helper-csv-btn'

  const mdBtn = createBtn('复制 Markdown', () => {
    const data = parseTable(resultContainer)
    if (data) copyText(toMarkdown(data), 'Markdown')
  })
  mdBtn.id = 'dms-helper-md-btn'

  toolbar.appendChild(csvBtn)
  toolbar.appendChild(mdBtn)
}

export { removeInjectedButtons }
