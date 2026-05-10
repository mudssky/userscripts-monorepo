# Hook Guidelines

> 本项目组合式函数、页面逻辑和副作用管理规范。

---

## Overview

当前复杂 userscript 使用 Vue Composition API。功能级逻辑集中在 `src/views/<feature>/hook.ts` 中，组件通过调用 `useXxx()` 获取状态、计算属性和事件处理函数。

本文件只描述当前 Vue userscript 的组合式函数规范。React 脚本可以使用 React hooks，但应单独记录 useState/useReducer/useEffect、自定义 hook 和副作用清理约定，不直接套用 Vue Composition API 规则。

当前示例：

- `userscripts/highlight-keywords/src/views/app/hook.ts`：`useHighlightApp()` 管理高亮规则、面板状态、调试信息、GM 存储、生命周期清理和用户交互。
- `userscripts/highlight-keywords/src/views/app/config.ts`：提供默认配置、主题预设、动态颜色生成和配置校验。
- `userscripts/highlight-keywords/src/util/tools.ts`：封装 Highlighter 单例和高亮工具函数。

---

## Custom Hook Patterns

- 功能 hook 使用 `useXxx()` 命名，例如 `useHighlightApp()`。
- hook 内部按“响应式状态、计算属性、事件处理、业务方法、生命周期、返回值”组织。
- 简单标量状态使用 `ref()`，结构化对象使用 `reactive()`。
- 派生状态使用 `computed()`，例如通过规则列表和当前 URL 计算匹配规则与关键词。
- 外部副作用集中在 hook 内处理，包括 GM 存储、DOM 操作、菜单注册、样式注入和调试日志。
- `onUnmounted()` 必须清理高亮器、全局样式、定时器等资源。
- hook 返回对象要保持显式列出，便于视图入口清楚知道可用状态和方法。

---

## Data Fetching

当前 userscript 没有服务端数据获取层，也没有 React Query / SWR / Pinia 等数据同步库。

- 持久化配置通过油猴 API 读写，例如 `GM_getValue()`、`GM_setValue()`。
- 页面信息来自浏览器 API，例如 `window.location`、`document`、`performance`。
- 剪贴板、下载调试信息等浏览器能力封装到工具函数里，不直接散落在组件模板中。
- 如果后续某个脚本需要远程请求，应在该脚本自己的功能 hook 或工具模块中封装，不作为仓库级默认能力。

---

## Naming Conventions

- `useXxx()`：功能级组合式函数。
- `handleXxx()`：响应用户操作或组件事件，例如 `handleUpdateConfig()`。
- `toggleXxx()`：布尔状态切换，例如 `toggleDarkMode()`。
- `loadXxx()`：从持久化存储、DOM 或外部环境加载数据，例如 `loadRuleList()`。
- `updateXxx()`：更新派生资源或持久化配置，例如 `updateHighlightStyle()`。
- `refreshXxx()`：重新采集状态或调试信息，例如 `refreshDebugInfo()`。

---

## Common Mistakes

- 不要在 hook 外部重复维护同一份业务状态；能从现有状态推导的值使用 `computed()`。
- 不要忘记清理定时器、DOM 样式节点和高亮器实例。
- 不要把长期单例随意放到组件文件里；需要单例时放到工具模块并提供初始化、读取、清理能力。
- 不要在 hook 中吞掉错误且没有用户反馈；当前高亮与配置更新流程会用 `ElMessage` 和调试日志反馈。
