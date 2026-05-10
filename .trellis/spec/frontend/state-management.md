# State Management

> 本项目状态管理与持久化约定。

---

## Overview

当前没有引入 Pinia、Vuex、Redux 等全局状态库。复杂 UI 脚本的状态主要由功能级 hook 管理，必要的跨刷新持久化状态写入油猴存储。

本文件只描述当前 Vue userscript 的状态管理现状。React 脚本的状态规范应在出现真实 React 脚本时单独补充，不能把 `ref()`、`reactive()`、`computed()` 当作 React 项目的默认规则。

当前示例：

- `userscripts/highlight-keywords/src/views/app/hook.ts`：使用 `ref()`、`reactive()`、`computed()` 管理页面状态。
- `userscripts/highlight-keywords/src/views/app/config.ts`：保存默认表单配置、主题预设和配置校验函数。
- `userscripts/highlight-keywords/src/util/tools.ts`：维护 `globalHighlighter` 单例。

---

## State Categories

- **组件展示状态**：面板展开、弹窗显示、当前 tab 等，使用 `ref()` 管理。
- **结构化业务状态**：高亮计数、当前索引、关键词列表、调试信息等，使用 `reactive()` 管理。
- **派生状态**：匹配规则、匹配关键词、动态颜色等，使用 `computed()` 管理。
- **持久化状态**：用户配置、暗色模式、面板固定状态、调试模式等，通过 `GM_getValue()` / `GM_setValue()` 管理。
- **DOM 资源状态**：全局样式节点、高亮器实例、定时器等，需要显式初始化和清理。

---

## When to Use Global State

默认不新增全局状态库。只有满足以下条件时才考虑引入共享状态方案：

- 多个独立功能视图需要长期共享同一份可变状态。
- 状态生命周期超过单个页面入口，且通过 props / emits 传递会明显增加复杂度。
- 多个脚本之间需要复用状态模型；此时应先考虑抽共享包，而不是让脚本互相 import。

单例可以用于浏览器资源封装，例如 `Highlighter` 实例；单例模块必须提供清晰的初始化和获取函数。

---

## Server State

当前 userscript 没有服务端状态。默认不引入请求缓存库。

如果未来脚本需要远程数据：

- 请求逻辑放在该脚本自己的工具模块或功能 hook 中。
- 缓存策略按脚本需求局部设计，不做仓库级默认抽象。
- 用户隐私、跨域权限和油猴 `grant` 配置必须同步检查。

---

## Common Mistakes

- 不要把可推导数据存成独立状态，例如匹配关键词应由规则列表和 URL 推导。
- 不要把 GM 存储当成响应式状态；读取后进入 hook 状态，更新时显式写回。
- 不要忘记卸载时清理 DOM 资源，否则 userscript 在宿主页面上容易留下样式或高亮节点。
- 不要为了一个脚本的局部需求提前引入全局状态库。
