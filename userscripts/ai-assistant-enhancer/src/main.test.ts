import { cleanup } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./adapters/doubao', () => ({
  doubaoAdapter: {
    id: 'doubao',
    name: '豆包',
    matches: () => true,
    getCurrentMode: () => 'fast',
    switchToBestMode: vi.fn().mockResolvedValue({
      mode: 'expert',
      changed: true,
      reason: '已切换到专家',
    }),
    watch: vi.fn(() => vi.fn()),
  },
}))

describe('main entry', () => {
  afterEach(() => {
    cleanup()
    for (const element of document.documentElement.querySelectorAll('div')) {
      element.remove()
    }
    vi.resetModules()
  })

  it('mounts the right-side settings panel when userscript loads', async () => {
    await import('./main')

    const host = Array.from(
      document.documentElement.querySelectorAll('div'),
    ).find((element) =>
      element.shadowRoot?.querySelector('.ai-assistant-enhancer-root'),
    )
    const root = host?.shadowRoot?.querySelector('.ai-assistant-enhancer-root')

    expect(root).toBeInTheDocument()
    expect(
      root?.querySelector('[title="展开 AI 助手增强器"]'),
    ).toBeInTheDocument()
  })
})
