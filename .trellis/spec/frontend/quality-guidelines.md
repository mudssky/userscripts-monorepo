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

## Scenario: Workspace Quality Scripts

### 1. Scope / Trigger

- Trigger: 新增或维护 workspace 包级质量命令，根目录需要通过 Turborepo 批量调用。
- Scope: 根 `package.json`、`turbo.json`、`packages/*/package.json`、`userscripts/*/package.json`。

### 2. Signatures

- 根目录脚本必须暴露：
  - `pnpm typecheck` -> `turbo run typecheck`
  - `pnpm test` -> `turbo run test`
  - `pnpm lint` -> `turbo run lint`
  - `pnpm format` -> `turbo run format`
  - `pnpm biome:check` -> `turbo run biome:check`
  - `pnpm qa` -> `turbo run qa`
- 每个 workspace 包必须暴露：
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm lint`
  - `pnpm format`
  - `pnpm biome:check`
  - `pnpm qa`

### 3. Contracts

- `typecheck` 只做 TypeScript 类型检查，不产生构建产物。
- `test` 必须是一次性测试命令，不能进入 watch 模式；当前推荐 `vitest run --passWithNoTests`。
- `lint` 是修复型 lint 命令，当前推荐 `biome lint --write .`。
- `format` 是修复型格式化命令，当前推荐 `biome format --write .`。
- `biome:check` 是只检查不写文件的质量门，当前推荐 `biome check .`。
- `qa` 必须串行执行 `pnpm typecheck && pnpm biome:check && pnpm test`，保证先类型、再 Biome、最后测试。
- 根级 `turbo.json` 必须声明同名任务；写文件任务 `lint`、`format` 应设置 `"cache": false`，`qa` 只调度包级 `qa`，不要再依赖同包 `typecheck`、`biome:check`、`test` 造成重复执行。
- `@biomejs/biome`、`typescript`、`vite`、`vitest` 属于 workspace 统一工具，只在根 `package.json` 安装；子包不要重复声明这些 devDependency。

### 4. Validation & Error Matrix

- 包缺少任一标准脚本 -> 根级 `turbo run <task>` 无法覆盖该包，补齐脚本后再合入。
- `test` 使用 `vitest` 而不是 `vitest run` -> Turbo 批量调用可能卡在 watch，改成一次性命令。
- `biome:check` 使用 `--write` -> 质量门会悄悄改文件，改为只读检查。
- 包内没有测试文件 -> `test` 应使用 `--passWithNoTests`，避免空测试集阻断统一 QA。
- 写文件任务开启缓存 -> 修复命令可能被 Turbo 跳过，应关闭缓存。
- Biome 2 忽略生成目录应使用 `!!dist`，不要使用旧版 `files.ignore` 或 `!!dist/**`。

### 5. Good/Base/Bad Cases

- Good: 新增 userscript 包时同步添加 6 个标准脚本，并能被根 `pnpm qa` 调用。
- Base: 仅修改某个包业务代码时，至少运行该包 `pnpm qa`；跨包或根工具变更运行根 `pnpm qa`。
- Bad: 只在某个包里保留自定义 `check` 命令，导致根级 Turbo 无法统一调度。

### 6. Tests Required

- 修改脚本契约后，运行 `pnpm turbo run typecheck test biome:check --filter <package>` 验证目标包脚本可被 Turbo 调用。
- 修改根 `turbo.json` 或根脚本后，运行根级 `pnpm typecheck`、`pnpm test` 或 `pnpm qa` 中至少一个代表性命令。
- 修改 Biome 版本或配置后，运行对应包的 `pnpm biome:check`，确认不会写入文件。

### 7. Wrong vs Correct

#### Wrong

```json
{
  "scripts": {
    "test": "vitest",
    "biome:check": "biome check --write ."
  }
}
```

#### Correct

```json
{
  "scripts": {
    "test": "vitest run --passWithNoTests",
    "biome:check": "biome check .",
    "qa": "pnpm typecheck && pnpm biome:check && pnpm test"
  }
}
```

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
