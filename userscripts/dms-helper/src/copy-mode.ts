import { GM_getValue, GM_notification, GM_registerMenuCommand, GM_setValue } from '$'

const COPY_MODE_STORAGE_KEY = 'dms-helper-copy-mode'

/** 复制模式 */
export type CopyMode = 'export' | 'dom'

/**
 * 校验复制模式配置值
 *
 * @param value - 待校验的持久化配置值
 * @returns 是否为合法复制模式
 */
function isCopyMode(value: unknown): value is CopyMode {
  return value === 'export' || value === 'dom'
}

/**
 * 获取当前复制模式
 *
 * @returns 当前复制模式，默认导出模式
 */
export function getCopyMode(): CopyMode {
  if (typeof GM_getValue === 'undefined') {
    return 'export'
  }

  const value = GM_getValue(COPY_MODE_STORAGE_KEY, 'export')
  return isCopyMode(value) ? value : 'export'
}

/**
 * 保存当前复制模式
 *
 * @param mode - 复制模式
 * @returns 无返回值
 */
function setCopyMode(mode: CopyMode): void {
  if (typeof GM_setValue === 'undefined') {
    notifyCopyMode('当前环境不支持保存复制模式')
    return
  }

  GM_setValue(COPY_MODE_STORAGE_KEY, mode)
}

/**
 * 获取下一个复制模式
 *
 * @param mode - 当前复制模式
 * @returns 下一个复制模式
 */
function getNextCopyMode(mode: CopyMode): CopyMode {
  return mode === 'export' ? 'dom' : 'export'
}

/**
 * 获取复制模式展示名称
 *
 * @param mode - 复制模式
 * @returns 展示名称
 */
function getCopyModeLabel(mode: CopyMode): string {
  return mode === 'export' ? '导出模式' : '复制模式'
}

/**
 * 注册复制模式切换菜单
 *
 * @returns 无返回值
 */
export function registerCopyModeMenu(): void {
  if (typeof GM_registerMenuCommand === 'undefined') {
    console.warn('[DMS Helper] GM_registerMenuCommand 不可用，跳过复制模式菜单注册')
    return
  }

  GM_registerMenuCommand(`切换复制模式（当前：${getCopyModeLabel(getCopyMode())}）`, () => {
    const nextMode = getNextCopyMode(getCopyMode())
    setCopyMode(nextMode)
    notifyCopyMode(`已切换为${getCopyModeLabel(nextMode)}，刷新页面后菜单文案会更新`)
  })
}

/**
 * 显示复制模式切换通知
 *
 * @param message - 通知内容
 * @returns 无返回值
 */
function notifyCopyMode(message: string): void {
  if (typeof GM_notification !== 'undefined') {
    GM_notification({ title: 'DMS Helper', text: message, timeout: 3000 })
    return
  }

  console.info(`[DMS Helper] ${message}`)
}
