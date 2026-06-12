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
  autoRetryDelaysMs?: readonly number[]
}

const AUTO_RECHECK_INTERVAL_MS = 1500

/**
 * 创建自动切换控制器。
 *
 * @param options - 控制器配置
 * @returns 控制器启动与停止接口
 */
export function createEnhancerController(options: EnhancerControllerOptions) {
  const {
    adapter,
    getConfig,
    statusStore,
    debounceMs = 300,
    autoRetryDelaysMs,
  } = options
  let cleanupWatcher: (() => void) | undefined
  let timer: ReturnType<typeof window.setTimeout> | undefined
  const autoTimers = new Set<ReturnType<typeof window.setTimeout>>()
  let running = false
  let rerunAfterCurrent = false

  /**
   * 清理单次待执行任务。
   *
   * @returns 无返回值
   */
  function clearScheduledRun(): void {
    if (timer) {
      window.clearTimeout(timer)
      timer = undefined
    }
  }

  /**
   * 清理自动复查任务。
   *
   * @returns 无返回值
   */
  function clearAutoRuns(): void {
    for (const autoTimer of autoTimers) {
      window.clearTimeout(autoTimer)
    }
    autoTimers.clear()
  }

  /**
   * 清理所有待执行任务。
   *
   * @returns 无返回值
   */
  function clearPendingRun(): void {
    clearScheduledRun()
    clearAutoRuns()
    rerunAfterCurrent = false
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
      const result = await adapter.switchToBestMode({
        modeSwitchConfirmMs: config.assistants.doubao.modeSwitchConfirmMs,
      })
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
      if (rerunAfterCurrent) {
        rerunAfterCurrent = false
        scheduleRun()
      }
    }
  }

  /**
   * 执行计划任务；若上一轮仍在运行，则在结束后补一次检查。
   *
   * @returns 无返回值
   */
  function runScheduledOnce(): void {
    if (running) {
      rerunAfterCurrent = true
      return
    }

    void runOnce()
  }

  /**
   * 调度一次自动切换。
   *
   * @returns 无返回值
   */
  function scheduleRun(): void {
    clearPendingRun()
    timer = window.setTimeout(() => {
      timer = undefined
      runScheduledOnce()
    }, debounceMs)
  }

  /**
   * 获取当前配置下的自动检查延迟序列。
   *
   * @returns 自动检查延迟序列
   */
  function getAutoRunDelays(): readonly number[] {
    if (autoRetryDelaysMs) {
      return autoRetryDelaysMs
    }

    const { autoCheckDelayMs } = getConfig().assistants.doubao
    return [autoCheckDelayMs, autoCheckDelayMs + AUTO_RECHECK_INTERVAL_MS]
  }

  /**
   * 调度一组自动复查，覆盖页面刷新和新对话后延迟重置默认模型的时序。
   *
   * @returns 无返回值
   */
  function scheduleAutoRun(): void {
    clearPendingRun()
    for (const delayMs of getAutoRunDelays()) {
      const autoTimer = window.setTimeout(() => {
        autoTimers.delete(autoTimer)
        runScheduledOnce()
      }, delayMs)
      autoTimers.add(autoTimer)
    }
  }

  return {
    start: (): void => {
      if (cleanupWatcher) {
        return
      }
      cleanupWatcher = adapter.watch(scheduleAutoRun)
      scheduleAutoRun()
    },
    stop: (): void => {
      clearPendingRun()
      cleanupWatcher?.()
      cleanupWatcher = undefined
    },
    runOnce,
    scheduleRun,
    scheduleAutoRun,
  }
}
