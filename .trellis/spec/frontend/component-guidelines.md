# Component Guidelines

> 本项目 userscript 前端组件的组织与写法规范。

---

## Overview

当前复杂 UI 脚本以 Vue 单文件组件为主。组件负责展示、接收 props、发出事件，不直接承载核心业务流程；业务状态和交互逻辑优先放在同一功能目录的 `hook.ts` 中。

本文件只描述当前 Vue userscript 的组件规范。React 脚本不能直接套用这里的 props、emits、SFC、Element Plus 约定；新增第一个 React 脚本时，需要基于真实代码补充 React 专属组件规范。

当前示例：

- `userscripts/highlight-keywords/src/views/app/index.vue`：视图入口，组合多个局部组件并连接 `useHighlightApp()`。
- `userscripts/highlight-keywords/src/views/app/components/TriggerButtons.vue`：只接收状态并 emit 面板操作事件。
- `userscripts/highlight-keywords/src/views/app/components/ConfigDialog.vue`：Element Plus 对话框组件，使用 props + emits 与父级同步。
- `userscripts/highlight-keywords/src/views/app/components/DebugDialog.vue`：调试面板组件，展示调试信息并发出刷新、导出、清空日志等事件。

---

## Component Structure

- Vue 组件使用 `<script lang="ts" setup>`。
- 组件文件优先按 `<template>`、`<script>`、`<style scoped>` 顺序组织。
- 局部组件放在功能目录的 `components/` 下，只服务当前功能时不要提升到全局共享目录。
- 视图入口组件负责组合子组件、传递状态和绑定事件，不在模板里写复杂业务判断。
- 复杂业务逻辑放到 `hook.ts`、`config.ts` 或 `util/` 中，组件只调用清晰的 handler。

示例：

```vue
<script lang="ts" setup>
import type { DynamicColors } from '../types'

interface Props {
  isDarkMode: boolean
  panelPinned: boolean
  dynamicColors: DynamicColors
}

interface Emits {
  toggleDarkMode: []
  togglePanelPin: []
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function onToggleDarkMode() {
  emit('toggleDarkMode')
}
</script>
```

---

## Props Conventions

- props 使用本地 `interface Props` 定义，复杂类型从同功能目录的 `types.ts` 引入。
- emits 使用本地 `interface Emits` 定义，事件名使用 camelCase；`v-model` 事件保留 Vue 约定，例如 `'update:visible'`。
- 子组件不直接修改 props；需要变更时通过 emit 通知父级。
- 组件之间传递领域对象时复用 `types.ts` 的类型，例如 `HighlightState`、`DynamicColors`、`RuleItem`。
- 对话框可使用 `:model-value` + `@update:model-value`，避免把内部状态和父级状态拆散。

---

## Styling Patterns

- 当前复杂 UI 脚本使用 Tailwind 工具类、Element Plus 组件和少量 scoped CSS 组合。
- userscript UI 默认挂载到 Shadow DOM 内，样式通过 `?style` 导入后注入 Shadow Root。
- Element Plus 弹窗在 Shadow DOM 内使用时要注意 `:teleported="false"`，避免弹窗被传送到宿主页导致样式隔离失效。
- 组件级样式使用 `<style scoped>`；需要覆盖 Element Plus 内部结构时使用 `:deep(...)`。
- 动态主题颜色集中由 `config.ts` 生成，例如 `generateDynamicColors()`，组件只消费结果。

---

## Accessibility

- 图标按钮、emoji 按钮或纯视觉按钮必须提供 `title` 或明确文本。
- 能使用原生 `<button>` 的交互优先使用 `<button>`，尤其是面板操作、提交、取消等命令。
- 当前 Biome 配置关闭了 `a11y.useKeyWithClickEvents`，这是为了兼容 userscript 浮动面板的现有写法；新增复杂交互仍应优先考虑键盘可达性。
- 禁用态使用真实 `disabled` 属性，不只靠样式表达。

---

## Common Mistakes

- 不要在子组件里直接读写 GM 存储、DOM 高亮器或全局配置；这些属于 hook 或工具函数职责。
- 不要让组件直接 import 另一个 userscript 的 `src/` 文件。
- 不要把 Element Plus 弹窗默认 teleport 到宿主页；在 Shadow DOM 场景下容易造成样式错位。
- 不要把大量业务状态散落到多个组件里；优先收拢到功能 hook，再由视图入口分发给子组件。
