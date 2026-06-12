export type AssistantId = 'doubao'
export type PreferredModeStrategy = 'expert-first'

export interface AssistantConfig {
  enabled: boolean
  preferredModeStrategy: PreferredModeStrategy
  modeSwitchConfirmMs: number
}

export interface AppConfig {
  enabled: boolean
  panelCollapsed: boolean
  assistants: Record<AssistantId, AssistantConfig>
}

export const CONFIG_STORAGE_KEY = 'aiAssistantEnhancerConfig'
export const MIN_MODE_SWITCH_CONFIRM_MS = 500
export const MAX_MODE_SWITCH_CONFIRM_MS = 5000

export const DEFAULT_CONFIG: AppConfig = {
  enabled: true,
  panelCollapsed: true,
  assistants: {
    doubao: {
      enabled: true,
      preferredModeStrategy: 'expert-first',
      modeSwitchConfirmMs: 1600,
    },
  },
}

/**
 * 判断输入是否为普通对象。
 *
 * @param value - 待判断输入
 * @returns 如果输入是非数组对象则返回 true
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 归一化模式切换确认时长。
 *
 * @param value - 未知来源的确认时长
 * @returns 已限制范围的确认时长
 */
export function normalizeModeSwitchConfirmMs(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_CONFIG.assistants.doubao.modeSwitchConfirmMs
  }

  return Math.min(
    MAX_MODE_SWITCH_CONFIRM_MS,
    Math.max(MIN_MODE_SWITCH_CONFIRM_MS, Math.round(value)),
  )
}

/**
 * 合并用户配置与默认配置。
 *
 * @param value - 未知来源的配置值
 * @returns 已校验并补齐默认值的配置
 */
export function normalizeConfig(value: unknown): AppConfig {
  if (!isRecord(value)) {
    return DEFAULT_CONFIG
  }

  const assistants = isRecord(value.assistants) ? value.assistants : {}
  const doubao = isRecord(assistants.doubao) ? assistants.doubao : {}
  const preferredModeStrategy =
    doubao.preferredModeStrategy === 'expert-first'
      ? doubao.preferredModeStrategy
      : DEFAULT_CONFIG.assistants.doubao.preferredModeStrategy

  return {
    enabled:
      typeof value.enabled === 'boolean'
        ? value.enabled
        : DEFAULT_CONFIG.enabled,
    panelCollapsed:
      typeof value.panelCollapsed === 'boolean'
        ? value.panelCollapsed
        : DEFAULT_CONFIG.panelCollapsed,
    assistants: {
      doubao: {
        enabled:
          typeof doubao.enabled === 'boolean'
            ? doubao.enabled
            : DEFAULT_CONFIG.assistants.doubao.enabled,
        preferredModeStrategy,
        modeSwitchConfirmMs: normalizeModeSwitchConfirmMs(
          doubao.modeSwitchConfirmMs,
        ),
      },
    },
  }
}

/**
 * 判断豆包自动切换是否启用。
 *
 * @param config - 应用配置
 * @returns 豆包适配器是否应运行
 */
export function isDoubaoEnabled(config: AppConfig): boolean {
  return config.enabled && config.assistants.doubao.enabled
}
