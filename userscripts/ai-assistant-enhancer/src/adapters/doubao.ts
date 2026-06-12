import type { AssistantAdapter, AssistantMode, ModeSwitchResult } from './types'

const MODE_TEXT: Record<Exclude<AssistantMode, 'unknown'>, string> = {
  fast: '快速',
  thinking: '思考',
  expert: '专家',
}
const MODE_LABELS = Object.values(MODE_TEXT)

const MODE_TRIGGER_SELECTOR = [
  'button[data-slot="dropdown-menu-trigger"]',
  '[data-valid-btn="mode-select-action-btn"]',
  'button[aria-haspopup="menu"]',
  '[role="button"][aria-haspopup="menu"]',
  'button',
  '[role="button"]',
].join(',')
const LOGIN_DIALOG_TEXT = '登录以解锁更多功能'
const NEW_CHAT_TEXT = '新对话'
const MODE_TRIGGER_WAIT_MS = 5000
const MODE_MENU_WAIT_MS = 1800

/**
 * 等待指定时长。
 *
 * @param ms - 等待毫秒数
 * @returns 等待完成的 Promise
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/**
 * 读取元素可见文本。
 *
 * @param element - 目标元素
 * @returns 去除空白后的文本
 */
function getElementText(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, '').trim()
}

/**
 * 判断元素文本是否包含目标中文。
 *
 * @param element - 目标元素
 * @param text - 目标文本
 * @returns 是否包含目标文本
 */
function elementHasText(element: Element, text: string): boolean {
  return getElementText(element).includes(text)
}

/**
 * 判断元素是否在页面中可见。
 *
 * @param element - 目标元素
 * @returns 元素是否有可见尺寸
 */
function isVisibleElement(element: Element): boolean {
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

/**
 * 从紧凑文本中识别唯一模式。
 *
 * @param text - 已去空白的元素文本
 * @returns 识别出的模式；无法唯一识别时返回 unknown
 */
function getModeFromText(text: string): AssistantMode {
  const matchedLabels = MODE_LABELS.filter((label) => text.includes(label))
  if (matchedLabels.length !== 1) {
    return 'unknown'
  }

  const matchedMode = Object.entries(MODE_TEXT).find(
    ([, label]) => label === matchedLabels[0],
  )?.[0]
  return (matchedMode as AssistantMode | undefined) ?? 'unknown'
}

/**
 * 触发元素点击事件。
 *
 * @param element - 目标元素
 * @returns 无返回值
 */
function clickElement(element: Element): void {
  if (element instanceof HTMLElement) {
    if (typeof PointerEvent !== 'undefined') {
      element.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerType: 'mouse',
        }),
      )
      element.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          pointerType: 'mouse',
        }),
      )
    }
    element.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    )
    element.dispatchEvent(
      new MouseEvent('mouseup', { bubbles: true, cancelable: true }),
    )
    element.click()
  }
}

/**
 * 等待某个 DOM 条件成立。
 *
 * @param getter - 每轮检查函数
 * @param timeoutMs - 最长等待毫秒数
 * @param intervalMs - 轮询间隔毫秒数
 * @returns 条件结果；超时返回 null
 */
async function waitForElement<T>(
  getter: () => T | null,
  timeoutMs: number,
  intervalMs = 100,
): Promise<T | null> {
  const startedAt = Date.now()

  while (Date.now() - startedAt <= timeoutMs) {
    const value = getter()
    if (value) {
      return value
    }
    await delay(intervalMs)
  }

  return null
}

/**
 * 判断当前页面是否显示登录弹窗。
 *
 * @returns 是否显示登录弹窗
 */
function hasLoginDialog(): boolean {
  return document.body.innerText.includes(LOGIN_DIALOG_TEXT)
}

/**
 * 尝试关闭登录弹窗。
 *
 * @returns 无返回值
 */
function closeLoginDialog(): void {
  const dialog = document.querySelector('[role="dialog"]')
  if (!dialog || !hasLoginDialog()) {
    return
  }

  const closeButton = Array.from(dialog.querySelectorAll('button')).find(
    (button) => {
      const text = getElementText(button)
      return text === 'close' || text === '关闭' || text.length === 0
    },
  )

  if (closeButton) {
    clickElement(closeButton)
    return
  }

  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  )
}

/**
 * 查找当前模式触发按钮。
 *
 * @returns 模式触发按钮；不存在时返回 null
 */
function findModeTrigger(): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll(MODE_TRIGGER_SELECTOR),
  ).filter(isVisibleElement)

  const trigger = candidates.find((element) =>
    MODE_LABELS.some((text) => elementHasText(element, text)),
  )

  if (!trigger) {
    return null
  }

  if (trigger instanceof HTMLElement) {
    return trigger
  }

  const clickable = trigger.closest('button,[role="button"],[aria-haspopup]')
  return clickable instanceof HTMLElement ? clickable : null
}

/**
 * 查找真正可触发菜单的元素。
 *
 * @param trigger - 模式触发区域
 * @returns 可点击元素
 */
function findModeClickTarget(trigger: HTMLElement): HTMLElement {
  const childButton = Array.from(trigger.querySelectorAll('button')).find(
    (element) =>
      isVisibleElement(element) &&
      MODE_LABELS.some((label) => elementHasText(element, label)),
  )

  return childButton instanceof HTMLElement ? childButton : trigger
}

/**
 * 从触发区域读取当前模式。
 *
 * @param trigger - 模式触发区域
 * @returns 当前模式
 */
function getModeFromTrigger(trigger: HTMLElement): AssistantMode {
  const displayCandidates = [trigger, ...trigger.querySelectorAll('*')]
    .filter((element) => {
      if (!isVisibleElement(element)) {
        return false
      }
      const menu = element.closest('[role="menu"]')
      return !menu
    })
    .map((element) => getModeFromText(getElementText(element)))

  return displayCandidates.find((mode) => mode !== 'unknown') ?? 'unknown'
}

/**
 * 查找指定模式菜单项。
 *
 * @param mode - 目标模式
 * @returns 菜单项；不存在时返回 null
 */
function findModeMenuItem(
  mode: Exclude<AssistantMode, 'unknown'>,
): Element | null {
  return findModeMenuItemByText(MODE_TEXT[mode])
}

/**
 * 判断当前是否存在模式菜单项。
 *
 * @returns 是否存在豆包模式菜单项
 */
function hasModeMenuItems(): boolean {
  return MODE_LABELS.some((label) => Boolean(findModeMenuItemByText(label)))
}

/**
 * 按文本查找模式菜单项。
 *
 * @param label - 模式中文文案
 * @returns 菜单项；不存在时返回 null
 */
function findModeMenuItemByText(label: string): Element | null {
  return (
    Array.from(document.querySelectorAll('[role="menuitem"]')).find((element) =>
      elementHasText(element, label),
    ) ?? null
  )
}

/**
 * 打开模式菜单。
 *
 * @returns 是否成功打开菜单
 */
async function openModeMenu(): Promise<boolean> {
  if (hasModeMenuItems()) {
    return true
  }

  const trigger = await waitForElement(findModeTrigger, MODE_TRIGGER_WAIT_MS)
  if (!trigger) {
    return false
  }

  if (trigger.getAttribute('data-state') !== 'open') {
    clickElement(findModeClickTarget(trigger))
  }

  return Boolean(
    await waitForElement(
      () =>
        hasModeMenuItems() ? document.querySelector('[role="menuitem"]') : null,
      MODE_MENU_WAIT_MS,
      80,
    ),
  )
}

/**
 * 识别豆包当前模式。
 *
 * @returns 当前模式
 */
function getCurrentMode(): AssistantMode {
  const trigger = findModeTrigger()
  if (!trigger) {
    return 'unknown'
  }

  return getModeFromTrigger(trigger)
}

/**
 * 尝试选择指定模式。
 *
 * @param mode - 目标模式
 * @returns 切换结果
 */
async function chooseMode(
  mode: Exclude<AssistantMode, 'unknown'>,
): Promise<ModeSwitchResult> {
  const menuOpened = await openModeMenu()
  if (!menuOpened) {
    return {
      mode: getCurrentMode(),
      changed: false,
      reason: findModeTrigger()
        ? '已找到模式按钮，但未能打开豆包模式菜单'
        : '未找到豆包模式按钮',
    }
  }

  const menuItem = findModeMenuItem(mode)
  if (!menuItem) {
    return {
      mode: getCurrentMode(),
      changed: false,
      reason: `未找到${MODE_TEXT[mode]}选项`,
    }
  }

  clickElement(menuItem)
  await delay(400)

  if (hasLoginDialog()) {
    closeLoginDialog()
    await delay(120)
    return {
      mode: getCurrentMode(),
      changed: false,
      reason: `${MODE_TEXT[mode]}需要登录或权益，已关闭登录提示`,
    }
  }

  const currentMode = getCurrentMode()
  return {
    mode: currentMode,
    changed: currentMode === mode,
    reason:
      currentMode === mode
        ? `已切换到${MODE_TEXT[mode]}`
        : `尝试切换${MODE_TEXT[mode]}后仍为${MODE_TEXT[currentMode] ?? '未知模式'}`,
  }
}

/**
 * 切换到豆包最佳可用模式。
 *
 * @returns 切换结果
 */
async function switchToBestMode(): Promise<ModeSwitchResult> {
  const currentMode = getCurrentMode()
  if (currentMode === 'expert' || currentMode === 'thinking') {
    return {
      mode: currentMode,
      changed: false,
      reason: `当前已是${MODE_TEXT[currentMode]}`,
    }
  }

  const expertResult = await chooseMode('expert')
  if (expertResult.mode === 'expert') {
    return expertResult
  }

  const thinkingResult = await chooseMode('thinking')
  if (thinkingResult.mode === 'thinking') {
    return {
      ...thinkingResult,
      reason: `${expertResult.reason}，已回退到思考`,
    }
  }

  return {
    mode: thinkingResult.mode,
    changed: false,
    reason: `${expertResult.reason}；${thinkingResult.reason}`,
  }
}

/**
 * 监听豆包页面变化。
 *
 * @param onChange - 页面可能需要重新切换时的回调
 * @returns 取消监听函数
 */
function watch(onChange: () => void): () => void {
  const observer = new MutationObserver((records) => {
    const shouldCheck = records.some((record) => {
      const targetText =
        record.target instanceof Element ? getElementText(record.target) : ''
      return (
        targetText.includes(NEW_CHAT_TEXT) ||
        targetText.includes(MODE_TEXT.fast) ||
        targetText.includes(MODE_TEXT.thinking) ||
        targetText.includes(MODE_TEXT.expert)
      )
    })

    if (shouldCheck) {
      onChange()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  window.addEventListener('popstate', onChange)

  return () => {
    observer.disconnect()
    window.removeEventListener('popstate', onChange)
  }
}

export const doubaoAdapter: AssistantAdapter = {
  id: 'doubao',
  name: '豆包',
  matches: (location: Location): boolean =>
    location.hostname === 'www.doubao.com' &&
    location.pathname.startsWith('/chat'),
  getCurrentMode,
  switchToBestMode,
  watch,
}

export const __doubaoTestUtils = {
  findModeTrigger,
  findModeClickTarget,
  getCurrentMode,
  openModeMenu,
}
