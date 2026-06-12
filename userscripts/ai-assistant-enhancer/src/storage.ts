import { GM_getValue, GM_setValue } from '$'
import {
  type AppConfig,
  CONFIG_STORAGE_KEY,
  DEFAULT_CONFIG,
  normalizeConfig,
} from './config'

export interface ConfigStore {
  getConfig: () => AppConfig
  setConfig: (config: AppConfig) => void
  updateConfig: (updater: (config: AppConfig) => AppConfig) => AppConfig
}

/**
 * 创建 GM storage 配置仓库。
 *
 * @returns 配置读写接口
 */
export function createConfigStore(): ConfigStore {
  const getConfig = (): AppConfig =>
    normalizeConfig(GM_getValue<unknown>(CONFIG_STORAGE_KEY, DEFAULT_CONFIG))

  return {
    getConfig,
    setConfig: (config: AppConfig): void => {
      GM_setValue(CONFIG_STORAGE_KEY, normalizeConfig(config))
    },
    updateConfig: (updater: (config: AppConfig) => AppConfig): AppConfig => {
      const nextConfig = normalizeConfig(updater(getConfig()))
      GM_setValue(CONFIG_STORAGE_KEY, nextConfig)
      return nextConfig
    },
  }
}
