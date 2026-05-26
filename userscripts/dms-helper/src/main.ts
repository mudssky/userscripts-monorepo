import { SELECTORS } from './selectors'
import { injectButtons, removeInjectedButtons } from './ui'
import { registerDomDebuggerMenu } from '@mudssky/userscript-utils'
import { registerCopyModeMenu } from './copy-mode'

const isInIframe = window.self !== window.top

/** 获取当前活动执行结果 tab 的结果容器 */
function getActiveResultContainer(): Element | null {
  const resultAreas = document.querySelectorAll(SELECTORS.resultContainer)
  for (const resultArea of resultAreas) {
    // 非活动执行结果 tab 的 tabpane 会加 hidden 类
    if (resultArea.closest('.next-tabs-tabpane.hidden')) {
      continue
    }
    return resultArea
  }
  return null
}

/** 检查并注入/移除按钮 */
function checkAndInject(): void {
  const resultAreas = document.querySelectorAll(SELECTORS.resultContainer)
  const activeResultArea = getActiveResultContainer()

  resultAreas.forEach((resultArea) => {
    const toolbar = resultArea.querySelector(SELECTORS.toolbar)
    if (!toolbar) return

    if (resultArea === activeResultArea) {
      injectButtons(toolbar, resultArea)
    } else {
      removeInjectedButtons(toolbar)
    }
  })
}

/** 注册 DOM Debugger 诊断菜单 —— 仅在 iframe（SQL 控制台）内 */
if (isInIframe) {
  registerCopyModeMenu()
  registerDomDebuggerMenu({
    scriptName: 'DMS Helper',
    selectors: {
      resultContainer: SELECTORS.resultContainer,
      toolbar: SELECTORS.toolbar,
      table: SELECTORS.table,
      headerRow: SELECTORS.headerRow,
      bodyRows: SELECTORS.bodyRows,
    },
    autoDiagnose: true,
    domDumpDepth: 6,
  })
}

// 仅在 iframe（SQL 控制台）内执行按钮注入
if (isInIframe) {
  checkAndInject()

  // 防抖：避免 MutationObserver 高频触发
  let timer: ReturnType<typeof setTimeout> | undefined
  const debouncedCheck = (): void => {
    clearTimeout(timer)
    timer = setTimeout(checkAndInject, 100)
  }

  const observer = new MutationObserver(debouncedCheck)
  // childList + subtree: 监听新结果面板加载
  // attributes + attributeFilter: 监听 tab 切换时的 class 变化
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  })
}
