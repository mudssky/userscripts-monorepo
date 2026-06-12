export type AssistantId = 'doubao'
export type PreferredModeStrategy = 'expert-first'

export interface AssistantConfig {
  enabled: boolean
  preferredModeStrategy: PreferredModeStrategy
}

export interface AppConfig {
  enabled: boolean
  panelCollapsed: boolean
  assistants: Record<AssistantId, AssistantConfig>
}

export const CONFIG_STORAGE_KEY = 'aiAssistantEnhancerConfig'

export const DEFAULT_CONFIG: AppConfig = {
  enabled: true,
  panelCollapsed: true,
  assistants: {
    doubao: {
      enabled: true,
      preferredModeStrategy: 'expert-first',
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
