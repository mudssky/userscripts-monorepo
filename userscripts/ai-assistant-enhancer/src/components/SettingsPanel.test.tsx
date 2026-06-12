import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG } from '@/config'
import { createDoubaoStatus } from '@/status'
import { SettingsPanel } from './SettingsPanel'

vi.mock('lucide-preact', () => ({
  Bot: () => 'Bot',
  ChevronLeft: () => 'ChevronLeft',
  ChevronRight: () => 'ChevronRight',
  RefreshCw: () => 'RefreshCw',
}))

describe('SettingsPanel', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders collapsed trigger by default', () => {
    render(
      <SettingsPanel
        config={DEFAULT_CONFIG}
        status={createDoubaoStatus('idle', '等待页面加载')}
        onConfigChange={vi.fn()}
        onRunNow={vi.fn()}
      />,
    )

    expect(screen.getByTitle('展开 AI 助手增强器')).toBeInTheDocument()
  })

  it('shows status and switches when expanded', () => {
    render(
      <SettingsPanel
        config={{ ...DEFAULT_CONFIG, panelCollapsed: false }}
        status={createDoubaoStatus('fallback-thinking', '已回退到思考')}
        onConfigChange={vi.fn()}
        onRunNow={vi.fn()}
      />,
    )

    expect(screen.getByText('AI 助手增强器')).toBeInTheDocument()
    expect(screen.getByText('已回退到思考')).toBeInTheDocument()
    expect(screen.getAllByRole('switch')).toHaveLength(2)
    expect(screen.getAllByText('已开启')).toHaveLength(2)
  })

  it('updates global switch', () => {
    const onConfigChange = vi.fn()
    render(
      <SettingsPanel
        config={{ ...DEFAULT_CONFIG, panelCollapsed: false }}
        status={createDoubaoStatus('idle', '等待页面加载')}
        onConfigChange={onConfigChange}
        onRunNow={vi.fn()}
      />,
    )

    fireEvent.click(screen.getAllByRole('switch')[0])

    expect(onConfigChange).toHaveBeenCalledWith({
      ...DEFAULT_CONFIG,
      panelCollapsed: false,
      enabled: false,
    })
  })

  it('updates doubao switch from the row control', () => {
    const onConfigChange = vi.fn()
    render(
      <SettingsPanel
        config={{ ...DEFAULT_CONFIG, panelCollapsed: false }}
        status={createDoubaoStatus('idle', '等待页面加载')}
        onConfigChange={onConfigChange}
        onRunNow={vi.fn()}
      />,
    )

    fireEvent.click(screen.getAllByRole('switch')[1])

    expect(onConfigChange).toHaveBeenCalledWith({
      ...DEFAULT_CONFIG,
      panelCollapsed: false,
      assistants: {
        doubao: {
          ...DEFAULT_CONFIG.assistants.doubao,
          enabled: false,
        },
      },
    })
  })

  it('updates auto check delay', () => {
    const onConfigChange = vi.fn()
    render(
      <SettingsPanel
        config={{ ...DEFAULT_CONFIG, panelCollapsed: false }}
        status={createDoubaoStatus('idle', '等待页面加载')}
        onConfigChange={onConfigChange}
        onRunNow={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText(/开始检查延迟/), {
      target: { value: '3600' },
    })

    expect(onConfigChange).toHaveBeenCalledWith({
      ...DEFAULT_CONFIG,
      panelCollapsed: false,
      assistants: {
        doubao: {
          ...DEFAULT_CONFIG.assistants.doubao,
          autoCheckDelayMs: 3600,
        },
      },
    })
  })

  it('updates mode switch confirm delay', () => {
    const onConfigChange = vi.fn()
    render(
      <SettingsPanel
        config={{ ...DEFAULT_CONFIG, panelCollapsed: false }}
        status={createDoubaoStatus('idle', '等待页面加载')}
        onConfigChange={onConfigChange}
        onRunNow={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText(/专家确认延迟/), {
      target: { value: '2600' },
    })

    expect(onConfigChange).toHaveBeenCalledWith({
      ...DEFAULT_CONFIG,
      panelCollapsed: false,
      assistants: {
        doubao: {
          ...DEFAULT_CONFIG.assistants.doubao,
          modeSwitchConfirmMs: 2600,
        },
      },
    })
  })

  it('disables doubao switch when global switch is off', () => {
    render(
      <SettingsPanel
        config={{ ...DEFAULT_CONFIG, panelCollapsed: false, enabled: false }}
        status={createDoubaoStatus('disabled', '脚本已关闭')}
        onConfigChange={vi.fn()}
        onRunNow={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('switch')[1]).toBeDisabled()
    expect(screen.getByRole('button', { name: /立即检查/ })).toBeDisabled()
  })
})
