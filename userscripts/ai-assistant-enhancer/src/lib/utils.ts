import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind className。
 *
 * @param inputs - className 输入集合
 * @returns 合并后的 className
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
