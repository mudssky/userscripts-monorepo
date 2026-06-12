import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AssistantAdapter } from './adapters/types'
import { DEFAULT_CONFIG } from './config'
import { createEnhancerController } from './controller'
import { createDoubaoStatus, createStatusStore } from './status'

const locationLike = window.location

/**
 * 创建测试适配器。
 *
 * @param switchResult - 自动切换结果
 * @returns 测试适配器
 */
function createAdapter(
  switchResult: Awaited<ReturnType<AssistantAdapter['switchToBestMode']>>,
): AssistantAdapter {
  return {
    id: 'doubao',
    name: '豆包',
    matches: () => true,
    getCurrentMode: () => 'fast',
    switchToBestMode: vi.fn().mockResolvedValue(switchResult),
    watch: vi.fn(() => vi.fn()),
  }
}

describe('createEnhancerController', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('sets fallback status when expert falls back to thinking', async () => {
    const statusStore = createStatusStore(createDoubaoStatus('idle', '等待'))
    const adapter = createAdapter({
      mode: 'thinking',
      changed: true,
      reason: '专家不可用，已回退到思考',
    })
    const controller = createEnhancerController({
      adapter,
      getConfig: () => DEFAULT_CONFIG,
      statusStore,
      debounceMs: 1,
    })

    await controller.runOnce()

    expect(statusStore.getStatus().kind).toBe('fallback-thinking')
    expect(statusStore.getStatus().message).toContain('回退')
    expect(adapter.switchToBestMode).toHaveBeenCalledWith({
      modeSwitchConfirmMs: DEFAULT_CONFIG.assistants.doubao.modeSwitchConfirmMs,
    })
  })

  it('does not switch when global config is disabled', async () => {
    const statusStore = createStatusStore(createDoubaoStatus('idle', '等待'))
    const adapter = createAdapter({
      mode: 'thinking',
      changed: true,
      reason: '已切换到思考',
    })
    const controller = createEnhancerController({
      adapter,
      getConfig: () => ({ ...DEFAULT_CONFIG, enabled: false }),
      statusStore,
    })

    await controller.runOnce()

    expect(adapter.switchToBestMode).not.toHaveBeenCalled()
    expect(statusStore.getStatus().kind).toBe('disabled')
  })

  it('starts watcher and schedules a run', () => {
    const statusStore = createStatusStore(createDoubaoStatus('idle', '等待'))
    const adapter = createAdapter({
      mode: 'expert',
      changed: true,
      reason: '已切换到专家',
    })
    const controller = createEnhancerController({
      adapter,
      getConfig: () => DEFAULT_CONFIG,
      statusStore,
      debounceMs: 1,
    })

    controller.start()
    vi.runOnlyPendingTimers()

    expect(adapter.watch).toHaveBeenCalled()
    expect(adapter.matches(locationLike)).toBe(true)
  })
})
