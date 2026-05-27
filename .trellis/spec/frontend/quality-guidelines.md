# Quality Guidelines

> 本项目 frontend / userscript 代码质量、测试和审查规范。

---

## Overview

当前仓库使用 TypeScript strict、Biome 和各脚本自己的构建命令保障质量。规范目标是让 userscript 在宿主页面中稳定运行，并尽量避免污染宿主页面环境。

当前示例：

- 根级 `biome.json`：单引号、按需分号、空格缩进、推荐 lint、禁止显式 `any`。
- `userscripts/highlight-keywords/biome.json`：脚本内同样启用 Biome 推荐规则。
- `userscripts/highlight-keywords/package.json`：`build` 先运行 `vue-tsc --noEmit`，再运行 `vite build`。
- `tsconfig.scripts.json`：根级脚本执行 TypeScript strict 检查。

---

## Forbidden Patterns

- 不要新增显式 `any`。
- 不要让一个 userscript 直接 import 另一个 userscript 的 `src/`。
- 不要在组件中散落 GM 存储、DOM 高亮器、下载、剪贴板等副作用。
- 不要在 userscript 中留下未清理的定时器、样式节点、高亮节点或全局实例。
- 不要提前创建共享包、状态库或构建抽象；等至少两个真实脚本需要时再抽。
- 不要为了根级 Rolldown 构建绕开 userscript metadata 生成；缺少头部生成能力时继续使用 Vite + `vite-plugin-monkey`。

---

## Required Patterns

- 中文注释只解释复杂业务逻辑和设计意图，不解释基础语法。
- 所有新增或修改函数必须标注参数与返回值说明；公共工具函数使用标准 JSDoc 的 `@param`、`@returns`。
- 复杂 UI 脚本优先隔离到 Shadow DOM，样式随 Shadow Root 注入。
- Element Plus 弹窗在 Shadow DOM 内使用时设置 `:teleported="false"`。
- 配置文件或用户输入进入业务逻辑前必须校验。
- 修改常量、配置、脚本名、metadata、subtree prefix 前必须先全局搜索引用。
- 资源初始化要有对应清理路径，尤其是高亮器、style 标签、定时器和事件监听。
- 带 `GM_setClipboard` grant 的 userscript 应优先使用 `GM_setClipboard` 写剪贴板，再回退到 `navigator.clipboard`；宿主 iframe 或扩展沙箱内可能被 Permissions Policy 阻止 Clipboard API。
- 带 `grant` 的 userscript 若需要 hook 宿主页面自身 JS（如 `fetch`、`XMLHttpRequest`、`URL.createObjectURL`），应注入页面上下文执行，并通过 `CustomEvent` 等显式通道传回结果；hook 必须限定在用户操作窗口内，并在成功、失败、超时后恢复原函数。

---

## Testing Requirements

- 配置文件不需要单元测试，例如 Dockerfile、nginx.conf、静态 JSON 配置等。
- 前端测试不测试页面结构和 CSS 样式本身，重点测试业务逻辑、组件行为、通用函数、配置校验和边界条件。
- 新增复杂工具函数、配置校验、构建脚本或 subtree 脚本时，应补业务逻辑测试或至少提供可重复的命令验证。
- 当前仓库尚未形成统一前端测试套件；若新增测试，优先使用已有依赖中的 Vitest。

---

## Code Review Checklist

- 目录边界是否正确：新增脚本是否位于 `userscripts/<script-name>/`，是否避免跨脚本 import。
- 构建策略是否合理：复杂 UI 是否使用成熟的 Vite + `vite-plugin-monkey` 路径；Rolldown 是否满足 metadata 生成前置条件。
- 框架规范是否匹配：Vue 脚本遵守当前 Vue guideline；React 脚本出现时是否补充并遵守 React 专属 guideline。
- 类型是否完整：props、emits、配置、工具函数返回值是否有明确类型。
- 副作用是否集中：GM 存储、DOM 操作、下载、剪贴板、菜单注册是否在 hook 或工具函数中处理。
- 清理是否完整：卸载时是否清除定时器、样式、高亮器和 DOM 资源。
- 用户配置是否校验：JSON.parse 后是否经过运行时校验再进入业务状态。
- 命令是否可用：修改脚本或根工具后是否运行对应 typecheck、build 或脚本验证命令。
