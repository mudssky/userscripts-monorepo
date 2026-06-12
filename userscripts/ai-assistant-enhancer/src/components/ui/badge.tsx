import type * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * shadcn 风格状态徽标。
 *
 * @param props - 徽标属性
 * @returns 徽标组件
 */
export function Badge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        'bg-secondary text-secondary-foreground',
        className,
      )}
      {...props}
    />
  )
}
