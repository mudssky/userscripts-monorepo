import { SELECTORS } from './selectors'
import { injectButtons, removeInjectedButtons } from './ui'
import { registerDomDebuggerMenu } from '@mudssky/userscript-utils'

/** 获取当前活动标签页的结果容器 */
function getActiveResultContainer(): Element | null {
  const resultAreas = document.querySelectorAll(SELECTORS.resultContainer)
  for (const resultArea of resultAreas) {
    const tabPane = resultArea.closest('.next-tabs-tabpane')
    if (tabPane?.matches(SELECTORS.activeTabPane)) {
      return resultArea
    }
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

/** 注册 DOM Debugger 诊断菜单 */
registerDomDebuggerMenu({
  scriptName: 'DMS Helper',
  selectors: {
    resultContainer: SELECTORS.resultContainer,
    toolbar: SELECTORS.toolbar,
    table: SELECTORS.table,
    headerRow: SELECTORS.headerRow,
    bodyRows: SELECTORS.bodyRows,
    activeTabPane: SELECTORS.activeTabPane,
  },
  autoDiagnose: true,
})

// 初始检查
checkAndInject()

// 监听页面变化（SPA 路由切换或内容加载）
const observer = new MutationObserver(checkAndInject)
observer.observe(document.body, { childList: true, subtree: true })
