/// <reference path="./greasemonkey.d.ts" />

// Debug 日志器
export {
  DebugLogger,
  type DebugLoggerOptions,
  type LogEntry,
  type LogLevel,
} from './debug-logger'
// DOM Debugger
export {
  type DebugOptions,
  DomDebugger,
  debugSelectors,
  diagnoseSelectors,
  FailReason,
  formatDiagnostics,
  isValidSelector,
  type SelectorDiagnostic,
  type SelectorDiagnosticContext,
  SelectorFailReason,
  type SelectorMap,
  type SelectorResult,
  type SelectorValue,
  type WaitForOptions,
  type WaitForResult,
} from './debugger'
// DOM Debugger 菜单接入
export {
  type DomDebuggerMenuOptions,
  registerDomDebuggerMenu,
} from './dom-debugger-menu'
// Shadow DOM 容器工具
export {
  createShadowContainer,
  type ShadowContainerOptions,
  type ShadowContainerResult,
  type StyleSource,
} from './shadow-container'
