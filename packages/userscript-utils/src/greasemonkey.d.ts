/**
 * Greasemonkey/Tampermonkey 全局 API 类型声明
 */
declare const GM_getValue: ((key: string, defaultValue?: unknown) => unknown) | undefined
declare const GM_setValue: ((key: string, value: unknown) => void) | undefined
declare const GM_registerMenuCommand: ((name: string, callback: () => void) => number) | undefined
declare const GM_setClipboard: ((text: string, info?: string) => void) | undefined
declare const GM_notification: ((details: { text: string; title?: string; timeout?: number }) => void) | undefined
declare const GM_info: { script: { version: string; name: string; namespace: string } } | undefined
