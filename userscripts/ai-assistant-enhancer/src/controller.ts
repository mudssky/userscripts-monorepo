import type { AssistantAdapter } from './adapters/types'
import type { AppConfig } from './config'
import { isDoubaoEnabled } from './config'
import type { createStatusStore } from './status'
import { createDoubaoStatus } from './status'

export interface EnhancerControllerOptions {
  adapter: AssistantAdapter
  getConfig: () => AppConfig
  statusStore: ReturnType<typeof createStatusStore>
  debounceMs?: number
}

/**
 * 创建自动切换控制器。
 *
 * @param options - 控制器配置
 * @returns 控制器启动与停止接口
 */
export function createEnhancerController(options: EnhancerControllerOptions) {
  const { adapter, getConfig, statusStore, debounceMs = 300 } = options
  let cleanupWatcher: (() => void) | undefined
  let timer: ReturnType<typeof window.setTimeout> | undefined
  let running = false

  /**
   * 清理待执行任务。
   *
   * @returns 无返回值
   */
  function clearPendingRun(): void {
    if (timer) {
      window.clearTimeout(timer)
      timer = undefined
    }
  }

  /**
   * 执行一次自动切换。
   *
   * @returns 切换完成 Promise
   */
  async function runOnce(): Promise<void> {
    if (running) {
      return
    }

    const config = getConfig()
    if (!adapter.matches(window.location)) {
      return
    }

    if (!isDoubaoEnabled(config)) {
      statusStore.setStatus(createDoubaoStatus('disabled', '脚本已关闭'))
      return
    }

    running = true
    statusStore.setStatus(createDoubaoStatus('waiting', '正在检查豆包模式'))

    try {
      const result = await adapter.switchToBestMode()
      if (result.mode === 'expert') {
        statusStore.setStatus(createDoubaoStatus('expert', result.reason))
      } else if (result.mode === 'thinking') {
        statusStore.setStatus(
          createDoubaoStatus(
            result.changed ? 'fallback-thinking' : 'idle',
            result.reason,
          ),
        )
      } else {
        statusStore.setStatus(createDoubaoStatus('failed', result.reason))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      statusStore.setStatus(
        createDoubaoStatus('failed', `自动切换失败：${message}`),
      )
    } finally {
      running = false
    }
  }

  /**
   * 调度一次自动切换。
   *
   * @returns 无返回值
   */
  function scheduleRun(): void {
    clearPendingRun()
    timer = window.setTimeout(() => {
      void runOnce()
    }, debounceMs)
  }

  return {
    start: (): void => {
      if (cleanupWatcher) {
        return
      }
      cleanupWatcher = adapter.watch(scheduleRun)
      scheduleRun()
    },
    stop: (): void => {
      clearPendingRun()
      cleanupWatcher?.()
      cleanupWatcher = undefined
    },
    runOnce,
    scheduleRun,
  }
}
