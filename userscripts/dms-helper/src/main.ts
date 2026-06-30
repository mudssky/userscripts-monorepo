import { registerDomDebuggerMenu } from '@mudssky/userscript-utils'
import { registerCopyModeMenu } from './copy-mode'
import { hasActiveExecutionResult } from './result-context'
import { SELECTORS } from './selectors'
import { injectButtons, removeInjectedButtons } from './ui'

const isInIframe = window.self !== window.top
const isSqlConsolePage =
  window.location.hostname === 'dmsnext.console.aliyun.com' &&
  window.location.pathname.startsWith('/_console/sql-console')
const shouldRunInCurrentPage = isInIframe || isSqlConsolePage

/**
 * 获取当前活动执行结果 tab 的结果容器
 *
 * @returns 当前活动结果容器；不存在时返回 null
 */
function getActiveResultContainer(): Element | null {
  const resultAreas = document.querySelectorAll(SELECTORS.resultContainer)
  for (const resultArea of resultAreas) {
    // 非活动执行结果 tab 的 tabpane 会加 hidden 类
    if (resultArea.closest('.next-tabs-tabpane.hidden')) {
      continue
    }
    if (isPanelResult(resultArea) && !hasActiveExecutionResult(resultArea)) {
      continue
    }
    return resultArea
  }
  return null
}

/**
 * 判断是否为新版 SQL Console 结果面板
 *
 * @param element - 待判断的结果容器
 * @returns 是否为新版结果面板
 */
function isPanelResult(element: Element): boolean {
  return element.matches('.panel-result')
}

/**
 * 检查并注入或移除复制按钮
 *
 * @returns 无返回值
 */
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

/** 注册 DOM Debugger 诊断菜单 —— 仅在 SQL 控制台运行环境内 */
if (shouldRunInCurrentPage) {
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

// 仅在 SQL 控制台运行环境内执行按钮注入
if (shouldRunInCurrentPage) {
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
