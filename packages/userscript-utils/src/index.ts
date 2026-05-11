/// <reference path="./greasemonkey.d.ts" />

// Shadow DOM 容器工具
export {
  createShadowContainer,
  type ShadowContainerOptions,
  type ShadowContainerResult,
  type StyleSource,
} from './shadow-container'

// Debug 日志器
export {
  DebugLogger,
  type DebugLoggerOptions,
  type LogEntry,
  type LogLevel,
} from './debug-logger'

// DOM Debugger
export {
  DomDebugger,
  debugSelectors,
  diagnoseSelectors,
  formatDiagnostics,
  isValidSelector,
  SelectorFailReason,
  FailReason,
  type DebugOptions,
  type SelectorDiagnostic,
  type SelectorDiagnosticContext,
  type SelectorMap,
  type SelectorResult,
  type SelectorValue,
  type WaitForOptions,
  type WaitForResult,
} from './debugger'

// DOM Debugger 菜单接入
export {
  registerDomDebuggerMenu,
  type DomDebuggerMenuOptions,
} from './dom-debugger-menu'
