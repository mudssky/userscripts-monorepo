import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { GM_getValue, GM_setValue } from '$'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 判断是否处于调试模式。
 * 调试模式通过 Greasemonkey 的 GM_getValue('debugMode', false) 来控制。
 * @returns {boolean} 如果处于调试模式则返回 true，否则返回 false。
 */
export function isDebugMode(): boolean {
  return typeof GM_getValue !== 'undefined' && GM_getValue('debugMode', false)
}

/**
 * 切换调试模式状态。
 * @param enabled 可选参数，指定调试模式状态。如果不提供，则切换当前状态。
 * @returns {boolean} 切换后的调试模式状态。
 */
export function toggleDebugMode(enabled?: boolean): boolean {
  if (typeof GM_setValue === 'undefined') {
    console.warn('[GitHubEnhance] GM_setValue 不可用，无法切换调试模式')
    return false
  }

  const newState = enabled !== undefined ? enabled : !isDebugMode()
  GM_setValue('debugMode', newState)

  console.log(`[GitHubEnhance] 调试模式已${newState ? '开启' : '关闭'}`)
  return newState
}

/**
 * 获取调试模式状态的字符串描述。
 * @returns {string} 调试模式状态描述。
 */
export function getDebugModeStatus(): string {
  return isDebugMode() ? '开启' : '关闭'
}

/**
 * 有条件地输出日志，仅在调试模式下输出。
 * @param messages 任何要输出到控制台的消息。
 */
export function log(...messages: any[]): void {
  if (isDebugMode()) {
    console.log('[GitHubEnhance]', ...messages)
  }
}

/**
 * 输出调试模式相关的帮助信息到控制台。
 */
export function showDebugHelp(): void {
  console.group('[GitHubEnhance] 调试模式帮助')
  console.log('当前调试模式状态:', getDebugModeStatus())
  console.log('切换调试模式: window.GitHubEnhance.toggleDebugMode()')
  console.log('开启调试模式: window.GitHubEnhance.toggleDebugMode(true)')
  console.log('关闭调试模式: window.GitHubEnhance.toggleDebugMode(false)')
  console.log('查看状态: window.GitHubEnhance.getDebugModeStatus()')
  console.log('显示帮助: window.GitHubEnhance.showDebugHelp()')
  console.groupEnd()
}
