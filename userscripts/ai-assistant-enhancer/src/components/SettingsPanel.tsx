import {
  ArrowDown,
  ArrowUp,
  Bot,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-preact'
import type { JSX } from 'react'
import type { SelectableAssistantMode } from '@/adapters/types'
import {
  type AppConfig,
  DOUBAO_MODE_LABELS,
  MAX_AUTO_CHECK_DELAY_MS,
  MAX_MODE_SWITCH_CONFIRM_MS,
  MIN_AUTO_CHECK_DELAY_MS,
  MIN_MODE_SWITCH_CONFIRM_MS,
  normalizeAutoCheckDelayMs,
  normalizeModeSwitchConfirmMs,
} from '@/config'
import { cn } from '@/lib/utils'
import type { SwitchStatus } from '@/status'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

export interface SettingsPanelProps {
  config: AppConfig
  status: SwitchStatus
  onConfigChange: (config: AppConfig) => void
  onRunNow: () => void
}

interface SettingSwitchRowProps {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}

interface ModeOrderEditorProps {
  order: readonly SelectableAssistantMode[]
  disabled: boolean
  onOrderChange: (order: SelectableAssistantMode[]) => void
}

/**
 * 格式化状态更新时间。
 *
 * @param timestamp - 时间戳
 * @returns 本地时间字符串
 */
function formatStatusTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

/**
 * 获取状态徽标文案。
 *
 * @param status - 切换状态
 * @returns 徽标文案
 */
function getStatusLabel(status: SwitchStatus): string {
  if (status.kind === 'expert') return '专家'
  if (status.kind === 'office') return '办公'
  if (status.kind === 'fast') return '快速'
  if (status.kind === 'fallback-thinking') return '思考'
  if (status.kind === 'disabled') return '关闭'
  if (status.kind === 'waiting') return '检查中'
  if (status.kind === 'failed') return '失败'
  return '待机'
}

/**
 * 调整数组中模式的位置。
 *
 * @param order - 当前模式顺序
 * @param fromIndex - 起始位置
 * @param toIndex - 目标位置
 * @returns 调整后的模式顺序
 */
function moveModeOrderItem(
  order: readonly SelectableAssistantMode[],
  fromIndex: number,
  toIndex: number,
): SelectableAssistantMode[] {
  const nextOrder = [...order]
  const [item] = nextOrder.splice(fromIndex, 1)
  if (!item) {
    return nextOrder
  }
  nextOrder.splice(toIndex, 0, item)
  return nextOrder
}

/**
 * 豆包模式顺序编辑器。
 *
 * @param props - 模式顺序编辑器属性
 * @returns 模式顺序编辑器组件
 */
function ModeOrderEditor({
  order,
  disabled,
  onOrderChange,
}: ModeOrderEditorProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background p-3">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">模式优先级</span>
        <span className="text-xs text-muted-foreground">从上到下</span>
      </span>
      <div className="flex flex-col gap-2">
        {order.map((mode, index) => (
          <div
            key={mode}
            className={cn(
              'flex h-9 items-center justify-between gap-2 rounded-md border bg-muted/30 px-2',
              disabled && 'opacity-50',
            )}
          >
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-background text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <span className="truncate">{DOUBAO_MODE_LABELS[mode]}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7"
                title={`上移${DOUBAO_MODE_LABELS[mode]}`}
                disabled={disabled || index === 0}
                onClick={() =>
                  onOrderChange(moveModeOrderItem(order, index, index - 1))
                }
              >
                <ArrowUp data-icon="inline-start" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7"
                title={`下移${DOUBAO_MODE_LABELS[mode]}`}
                disabled={disabled || index === order.length - 1}
                onClick={() =>
                  onOrderChange(moveModeOrderItem(order, index, index + 1))
                }
              >
                <ArrowDown data-icon="inline-start" />
              </Button>
            </span>
          </div>
        ))}
      </div>
      <span className="text-xs leading-5 text-muted-foreground">
        自动检查时会按顺序尝试可用模式
      </span>
    </div>
  )
}

/**
 * 整行可点击的设置开关。
 *
 * @param props - 设置开关属性
 * @returns 设置开关组件
 */
function SettingSwitchRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: SettingSwitchRowProps): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-between gap-4 rounded-md border bg-background p-3 text-left transition-colors',
        'hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-background',
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {checked ? '已开启' : '已关闭'}
        </span>
        <span
          className={cn(
            'inline-flex h-6 w-10 items-center rounded-full border border-transparent transition-colors',
            checked ? 'bg-primary' : 'bg-input',
          )}
        >
          <span
            className={cn(
              'block size-5 rounded-full bg-background shadow-sm transition-transform',
              checked ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </span>
      </span>
    </button>
  )
}

/**
 * AI 助手增强器右侧设置面板。
 *
 * @param props - 面板属性
 * @returns 设置面板组件
 */
export function SettingsPanel({
  config,
  status,
  onConfigChange,
  onRunNow,
}: SettingsPanelProps): JSX.Element {
  const collapsed = config.panelCollapsed

  /**
   * 更新部分配置。
   *
   * @param patch - 部分配置
   * @returns 无返回值
   */
  function updateConfig(patch: Partial<AppConfig>): void {
    onConfigChange({ ...config, ...patch })
  }

  /**
   * 更新豆包配置。
   *
   * @param enabled - 豆包适配是否开启
   * @returns 无返回值
   */
  function updateDoubaoEnabled(enabled: boolean): void {
    onConfigChange({
      ...config,
      assistants: {
        ...config.assistants,
        doubao: {
          ...config.assistants.doubao,
          enabled,
        },
      },
    })
  }

  /**
   * 更新自动检查开始延迟。
   *
   * @param value - 输入框字符串值
   * @returns 无返回值
   */
  function updateAutoCheckDelayMs(value: string): void {
    const autoCheckDelayMs = normalizeAutoCheckDelayMs(Number(value))
    onConfigChange({
      ...config,
      assistants: {
        ...config.assistants,
        doubao: {
          ...config.assistants.doubao,
          autoCheckDelayMs,
        },
      },
    })
  }

  /**
   * 更新模式切换确认时长。
   *
   * @param value - 输入框字符串值
   * @returns 无返回值
   */
  function updateModeSwitchConfirmMs(value: string): void {
    const modeSwitchConfirmMs = normalizeModeSwitchConfirmMs(Number(value))
    onConfigChange({
      ...config,
      assistants: {
        ...config.assistants,
        doubao: {
          ...config.assistants.doubao,
          modeSwitchConfirmMs,
        },
      },
    })
  }

  /**
   * 更新豆包模式优先级顺序。
   *
   * @param preferredModeOrder - 下一份模式顺序
   * @returns 无返回值
   */
  function updatePreferredModeOrder(
    preferredModeOrder: SelectableAssistantMode[],
  ): void {
    onConfigChange({
      ...config,
      assistants: {
        ...config.assistants,
        doubao: {
          ...config.assistants.doubao,
          preferredModeOrder,
        },
      },
    })
  }

  return (
    <div
      className={cn(
        'ai-assistant-enhancer fixed top-1/2 right-0 z-[2147483647] -translate-y-1/2',
        'flex items-center gap-2 text-foreground',
      )}
    >
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="rounded-r-none border-r-0 bg-background shadow-md"
        title={collapsed ? '展开 AI 助手增强器' : '收起 AI 助手增强器'}
        onClick={() => updateConfig({ panelCollapsed: !collapsed })}
      >
        {collapsed ? (
          <ChevronLeft data-icon="inline-start" />
        ) : (
          <ChevronRight data-icon="inline-start" />
        )}
      </Button>

      {!collapsed && (
        <section className="w-80 rounded-l-md border bg-background p-4 shadow-lg">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bot />
              <div>
                <h2 className="text-sm font-semibold">AI 助手增强器</h2>
                <p className="text-xs text-muted-foreground">
                  豆包模式自动优化
                </p>
              </div>
            </div>
            <Badge>{getStatusLabel(status)}</Badge>
          </div>

          <div className="flex flex-col gap-4">
            <SettingSwitchRow
              title="总开关"
              description="关闭后不再自动切换任何助手"
              checked={config.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />

            <SettingSwitchRow
              title="豆包"
              description="按优先级自动选择模式"
              checked={config.assistants.doubao.enabled}
              disabled={!config.enabled}
              onCheckedChange={updateDoubaoEnabled}
            />

            <ModeOrderEditor
              order={config.assistants.doubao.preferredModeOrder}
              disabled={!config.enabled || !config.assistants.doubao.enabled}
              onOrderChange={updatePreferredModeOrder}
            />

            <label className="flex flex-col gap-2 rounded-md border bg-background p-3">
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">开始检查延迟</span>
                <span className="text-xs text-muted-foreground">毫秒</span>
              </span>
              <input
                type="number"
                min={MIN_AUTO_CHECK_DELAY_MS}
                max={MAX_AUTO_CHECK_DELAY_MS}
                step={100}
                value={config.assistants.doubao.autoCheckDelayMs}
                disabled={!config.enabled || !config.assistants.doubao.enabled}
                className={cn(
                  'h-8 rounded-md border bg-background px-2 text-sm outline-none transition-colors',
                  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
                onChange={(event) =>
                  updateAutoCheckDelayMs(event.currentTarget.value)
                }
              />
              <span className="text-xs leading-5 text-muted-foreground">
                刷新或新对话后等待页面稳定再检查；过早可能误判模式
              </span>
            </label>

            <label className="flex flex-col gap-2 rounded-md border bg-background p-3">
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">模式确认延迟</span>
                <span className="text-xs text-muted-foreground">毫秒</span>
              </span>
              <input
                type="number"
                min={MIN_MODE_SWITCH_CONFIRM_MS}
                max={MAX_MODE_SWITCH_CONFIRM_MS}
                step={100}
                value={config.assistants.doubao.modeSwitchConfirmMs}
                disabled={!config.enabled || !config.assistants.doubao.enabled}
                className={cn(
                  'h-8 rounded-md border bg-background px-2 text-sm outline-none transition-colors',
                  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
                onChange={(event) =>
                  updateModeSwitchConfirmMs(event.currentTarget.value)
                }
              />
              <span className="text-xs leading-5 text-muted-foreground">
                模式切换较慢时调大；超时仍未生效才尝试下一项
              </span>
            </label>

            <div className="rounded-md border bg-muted/30 p-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-xs font-medium">最近状态</span>
                <span className="text-xs text-muted-foreground">
                  {formatStatusTime(status.updatedAt)}
                </span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {status.message}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!config.enabled || !config.assistants.doubao.enabled}
              onClick={onRunNow}
            >
              <RefreshCw data-icon="inline-start" />
              立即检查
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
