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

/**
 * 读取模式按钮内层真实按钮。
 *
 * @param trigger - 外层模式触发按钮
 * @returns 内层按钮
 */
function getModeChildButton(trigger: HTMLButtonElement): HTMLButtonElement {
  return trigger.querySelector('button') as HTMLButtonElement
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
    const childButton = getModeChildButton(trigger)
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

  it('等待专家模式异步生效后不回退思考', async () => {
    const trigger = mountClosedModeTrigger()
    const childButton = getModeChildButton(trigger)
    childButton.addEventListener('click', () => {
      trigger.dataset.state = 'open'
      const menu = createModeMenu()
      const expertItem = Array.from(
        menu.querySelectorAll('[role="menuitem"]'),
      ).find((item) => item.textContent?.includes('专家')) as HTMLDivElement
      expertItem.addEventListener('click', () => {
        window.setTimeout(() => {
          childButton.textContent = '专家'
          menu.remove()
        }, 300)
      })
      document.body.append(menu)
    })

    await expect(
      doubaoAdapter.switchToBestMode({
        modeSwitchConfirmMs: 1200,
      }),
    ).resolves.toMatchObject({
      mode: 'expert',
      changed: true,
    })
  })

  it('确认窗口太短时会进入回退流程', async () => {
    const trigger = mountClosedModeTrigger()
    const childButton = getModeChildButton(trigger)
    childButton.addEventListener('click', () => {
      trigger.dataset.state = 'open'
      const menu = createModeMenu()
      const expertItem = Array.from(
        menu.querySelectorAll('[role="menuitem"]'),
      ).find((item) => item.textContent?.includes('专家')) as HTMLDivElement
      expertItem.addEventListener('click', () => {
        window.setTimeout(() => {
          childButton.textContent = '专家'
          menu.remove()
        }, 300)
      })
      document.body.append(menu)
    })

    await expect(
      doubaoAdapter.switchToBestMode({
        modeSwitchConfirmMs: 100,
      }),
    ).resolves.toMatchObject({
      mode: 'fast',
      changed: false,
    })
  })

  it('监听新对话点击但不监听模式文案变化', () => {
    const onChange = vi.fn()
    const cleanup = doubaoAdapter.watch(onChange)
    document.body.innerHTML = `
      <div>
        <button data-slot="dropdown-menu-trigger">快速</button>
        <div class="mode-label">思考</div>
        <button class="new-chat">新对话</button>
      </div>
    `

    document
      .querySelector('[data-slot="dropdown-menu-trigger"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const modeLabel = document.querySelector('.mode-label')
    if (modeLabel) {
      modeLabel.textContent = '专家'
    }

    expect(onChange).not.toHaveBeenCalled()

    document
      .querySelector('.new-chat')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onChange).toHaveBeenCalledTimes(1)
    cleanup()
  })
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
