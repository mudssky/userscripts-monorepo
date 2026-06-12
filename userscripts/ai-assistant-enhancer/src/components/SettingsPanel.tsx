import { Bot, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import type { JSX } from 'react'
import type { AppConfig } from '@/config'
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
  if (status.kind === 'fallback-thinking') return '思考'
  if (status.kind === 'disabled') return '关闭'
  if (status.kind === 'waiting') return '检查中'
  if (status.kind === 'failed') return '失败'
  return '待机'
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
              description="专家优先，失败回退思考"
              checked={config.assistants.doubao.enabled}
              disabled={!config.enabled}
              onCheckedChange={updateDoubaoEnabled}
            />

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
