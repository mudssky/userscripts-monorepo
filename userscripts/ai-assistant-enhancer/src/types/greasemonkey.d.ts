declare module '$' {
  export function GM_getValue<T>(key: string, defaultValue: T): T
  export function GM_setValue<T>(key: string, value: T): void
  export function GM_registerMenuCommand(
    caption: string,
    commandFunc: () => void,
  ): void
}
