export const GM_getValue = <T>(key: string, defaultValue: T): T => {
  const value = window.localStorage.getItem(`github-enhance:${key}`)
  return value === null ? defaultValue : (JSON.parse(value) as T)
}

export const GM_setValue = <T>(key: string, value: T): void => {
  window.localStorage.setItem(`github-enhance:${key}`, JSON.stringify(value))
}
