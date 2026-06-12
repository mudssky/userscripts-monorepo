import { createShadowContainer } from '@mudssky/userscript-utils'
import { render } from 'react'
import { GM_registerMenuCommand } from '$'
import { App } from './App'
import { doubaoAdapter } from './adapters/doubao'
import { createEnhancerController } from './controller'
import styles from './index.css?inline'
import { createDoubaoStatus, createStatusStore } from './status'
import { createConfigStore } from './storage'

const configStore = createConfigStore()
const statusStore = createStatusStore(
  createDoubaoStatus('idle', '等待页面加载'),
)
const controller = createEnhancerController({
  adapter: doubaoAdapter,
  getConfig: configStore.getConfig,
  statusStore,
})

/**
 * 切换脚本总开关。
 *
 * @returns 无返回值
 */
function toggleEnabled(): void {
  configStore.updateConfig((config) => ({
    ...config,
    enabled: !config.enabled,
  }))
  controller.scheduleRun()
}

/**
 * 注册油猴菜单命令。
 *
 * @returns 无返回值
 */
function registerMenus(): void {
  if (typeof GM_registerMenuCommand === 'undefined') {
    return
  }

  GM_registerMenuCommand('切换 AI 助手增强器开关', toggleEnabled)
  GM_registerMenuCommand('立即检查豆包模式', () => {
    void controller.runOnce()
  })
}

/**
 * 挂载右侧配置面板。
 *
 * @returns 无返回值
 */
function mountPanel(): void {
  const { container } = createShadowContainer({
    hostTag: 'div',
    attachTo: document.documentElement,
    containerClass: 'ai-assistant-enhancer-root',
    containerAttrs: {
      'data-script': 'ai-assistant-enhancer',
    },
    styles: [styles],
  })

  render(
    <App
      configStore={configStore}
      statusStore={statusStore}
      onRunNow={() => {
        void controller.runOnce()
      }}
      onConfigChanged={() => undefined}
    />,
    container,
  )
}

registerMenus()
mountPanel()
controller.start()
