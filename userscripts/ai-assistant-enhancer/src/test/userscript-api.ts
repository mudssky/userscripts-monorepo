export const GM_getValue = <T>(key: string, defaultValue: T): T => {
  const value = window.localStorage.getItem(`ai-assistant-enhancer:${key}`)
  return value === null ? defaultValue : (JSON.parse(value) as T)
}

export const GM_setValue = <T>(key: string, value: T): void => {
  window.localStorage.setItem(
    `ai-assistant-enhancer:${key}`,
    JSON.stringify(value),
  )
}

export const GM_registerMenuCommand = (
  _caption: string,
  _commandFunc: () => void,
): void => {}
