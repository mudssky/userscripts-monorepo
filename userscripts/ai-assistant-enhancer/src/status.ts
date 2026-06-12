import type { AssistantId } from './config'

export type SwitchStatusKind =
  | 'idle'
  | 'disabled'
  | 'waiting'
  | 'expert'
  | 'fallback-thinking'
  | 'failed'

export interface SwitchStatus {
  assistantId: AssistantId
  kind: SwitchStatusKind
  message: string
  updatedAt: number
}

export type StatusListener = (status: SwitchStatus) => void

/**
 * 创建切换状态中心。
 *
 * @param initialStatus - 初始状态
 * @returns 状态读写与订阅接口
 */
export function createStatusStore(initialStatus: SwitchStatus) {
  let currentStatus = initialStatus
  const listeners = new Set<StatusListener>()

  return {
    getStatus: (): SwitchStatus => currentStatus,
    setStatus: (status: SwitchStatus): void => {
      currentStatus = status
      for (const listener of listeners) {
        listener(currentStatus)
      }
    },
    subscribe: (listener: StatusListener): (() => void) => {
      listeners.add(listener)
      listener(currentStatus)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/**
 * 创建豆包状态对象。
 *
 * @param kind - 状态类型
 * @param message - 状态说明
 * @returns 状态对象
 */
export function createDoubaoStatus(
  kind: SwitchStatusKind,
  message: string,
): SwitchStatus {
  return {
    assistantId: 'doubao',
    kind,
    message,
    updatedAt: Date.now(),
  }
}
