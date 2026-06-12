import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __doubaoTestUtils, doubaoAdapter } from './doubao'

const VISIBLE_RECT = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 72,
  bottom: 32,
  width: 72,
  height: 32,
  toJSON: () => ({}),
} as DOMRect

/**
 * 重置测试页面 DOM。
 *
 * @returns 无返回值
 */
function resetDom(): void {
  document.body.innerHTML = ''
}

/**
 * 挂载豆包当前模式按钮。
 *
 * @returns 外层模式触发按钮
 */
function mountClosedModeTrigger(): HTMLButtonElement {
  const trigger = document.createElement('button')
  trigger.dataset.slot = 'dropdown-menu-trigger'
  trigger.setAttribute('aria-haspopup', 'menu')
  trigger.dataset.state = 'closed'

  const action = document.createElement('div')
  action.dataset.validBtn = 'mode-select-action-btn'
  action.className = 'relative'

  const childButton = document.createElement('button')
  childButton.type = 'button'
  childButton.textContent = '快速'

  action.append(childButton)
  trigger.append(action)
  document.body.append(trigger)

  return trigger
}

describe('doubaoAdapter', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
      VISIBLE_RECT,
    )
  })

  afterEach(() => {
    resetDom()
    vi.restoreAllMocks()
  })

  it('只在菜单未展开时识别当前按钮模式', () => {
    mountClosedModeTrigger()

    expect(doubaoAdapter.getCurrentMode()).toBe('fast')
  })

  it('忽略已展开菜单中的其他模式文案', () => {
    const trigger = mountClosedModeTrigger()
    trigger.dataset.state = 'open'
    const action = trigger.querySelector(
      '[data-valid-btn="mode-select-action-btn"]',
    ) as HTMLDivElement
    action.prepend(createModeMenu())

    expect(doubaoAdapter.getCurrentMode()).toBe('fast')
  })

  it('点击嵌套的真实按钮打开模式菜单', async () => {
    const trigger = mountClosedModeTrigger()
    const childButton = trigger.querySelector('button') as HTMLButtonElement
    childButton.addEventListener('click', () => {
      trigger.dataset.state = 'open'
      document.body.insertAdjacentHTML(
        'beforeend',
        `
          <div role="menu">
            <div role="menuitem">快速 适用于大部分情况</div>
            <div role="menuitem">思考 擅长解决更难的问题</div>
            <div role="menuitem">专家 研究级智能模型</div>
          </div>
        `,
      )
    })

    const clickSpy = vi.spyOn(childButton, 'click')

    await expect(__doubaoTestUtils.openModeMenu()).resolves.toBe(true)
    expect(clickSpy).toHaveBeenCalled()
  })

  it('把菜单按钮缺失和菜单打开失败区分开', async () => {
    await expect(__doubaoTestUtils.openModeMenu()).resolves.toBe(false)
  }, 6000)
})

/**
 * 创建豆包模式菜单。
 *
 * @returns 菜单元素
 */
function createModeMenu(): HTMLDivElement {
  const menu = document.createElement('div')
  menu.setAttribute('role', 'menu')

  for (const text of [
    '快速 适用于大部分情况',
    '思考 擅长解决更难的问题',
    '专家 研究级智能模型',
  ]) {
    const item = document.createElement('div')
    item.setAttribute('role', 'menuitem')
    item.textContent = text
    menu.append(item)
  }

  return menu
}
