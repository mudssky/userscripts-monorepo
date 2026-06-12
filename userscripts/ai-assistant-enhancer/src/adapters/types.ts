export type AssistantMode = 'fast' | 'thinking' | 'expert' | 'unknown'

export interface ModeSwitchResult {
  mode: AssistantMode
  changed: boolean
  reason: string
}

export interface AssistantAdapter {
  id: 'doubao'
  name: string
  matches: (location: Location) => boolean
  getCurrentMode: () => AssistantMode
  switchToBestMode: () => Promise<ModeSwitchResult>
  watch: (onChange: () => void) => () => void
}
