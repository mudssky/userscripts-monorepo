import type * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps
  extends Omit<React.ComponentProps<'button'>, 'onChange'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/**
 * 轻量开关组件。
 *
 * @param props - 开关属性
 * @returns 开关组件
 */
export function Switch({
  checked,
  onCheckedChange,
  className,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        'inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors',
        checked ? 'bg-primary' : 'bg-input',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-background shadow-sm transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  )
}
