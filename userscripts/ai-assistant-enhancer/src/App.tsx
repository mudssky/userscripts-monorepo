import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { SettingsPanel } from './components/SettingsPanel'
import type { AppConfig } from './config'
import type { createStatusStore } from './status'
import type { createConfigStore } from './storage'

export interface AppProps {
  configStore: ReturnType<typeof createConfigStore>
  statusStore: ReturnType<typeof createStatusStore>
  onRunNow: () => void
  onConfigChanged: () => void
}

/**
 * 应用根组件。
 *
 * @param props - 应用依赖
 * @returns 应用组件
 */
export function App({
  configStore,
  statusStore,
  onRunNow,
  onConfigChanged,
}: AppProps): JSX.Element {
  const [config, setConfig] = useState<AppConfig>(() => configStore.getConfig())
  const [status, setStatus] = useState(() => statusStore.getStatus())

  useEffect(() => statusStore.subscribe(setStatus), [statusStore])

  /**
   * 保存配置并通知控制器。
   *
   * @param nextConfig - 下一份配置
   * @returns 无返回值
   */
  function handleConfigChange(nextConfig: AppConfig): void {
    configStore.setConfig(nextConfig)
    setConfig(configStore.getConfig())
    onConfigChanged()
  }

  return (
    <SettingsPanel
      config={config}
      status={status}
      onConfigChange={handleConfigChange}
      onRunNow={onRunNow}
    />
  )
}
