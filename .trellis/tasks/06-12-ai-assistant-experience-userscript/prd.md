# AI 助手体验优化油猴脚本

## Goal

新增一个独立 userscript 项目，用 React + Tailwind + shadcn 风格组件构建「AI 助手体验优化」脚本。首批支持豆包，在进入 `https://www.doubao.com/chat` 或点击「新对话」后，自动把官方默认的「快速」模式切到更高质量的模式：优先「专家」，专家不可用时回退「思考」。同时提供油猴菜单与右侧收起面板，用于开启/关闭脚本能力。

## What I already know

- 用户希望新建一个项目，未来支持多个 AI 助手，首批支持豆包。
- 豆包目标页面是 `https://www.doubao.com/chat`。
- 官方在进入 chat 或点击「新对话」后会默认切到「快速」，需要自动修正。
- 期望策略：默认切「专家」；专家不能切时切「思考」，并且要先检测再切换。
- 配置界面要通过油猴脚本菜单开启/关闭，默认开启；界面缩到屏幕右侧。
- 技术栈要求：React 开发，Tailwind + shadcn 做样式。
- 仓库已有 `userscripts/github-enhance` 使用 React 兼容写法、Tailwind v4、shadcn `components.json`、`vite-plugin-monkey` 与 GM 存储，可作为新 React userscript 的主要参考。
- 仓库规范要求复杂 UI userscript 位于 `userscripts/<script-name>/`，优先使用 Vite + `vite-plugin-monkey`，并保持脚本业务边界独立。
- 通过 Playwright CLI 未登录探测确认：豆包菜单存在「快速 / 思考 / 专家」三个 `role="menuitem"`；未登录点击「专家」会弹「登录以解锁更多功能」，模式保持快速；未登录点击「思考」可成功切换；点击侧边栏「新对话」会重置回快速。

## Requirements

- 新增独立 workspace userscript 项目，目录名与包名使用 `ai-assistant-enhancer`。
- userscript 展示名使用 `AI Assistant Enhancer`，中文 README 名称使用「AI 助手增强器」。
- 使用 Vite + `vite-plugin-monkey` 生成 userscript metadata，匹配豆包 chat 页面。
- 使用 React 风格开发 UI；实现时可参考仓库现有 React userscript 的依赖与构建方式。
- 使用 Tailwind v4 + shadcn 组件约定构建配置面板，不污染宿主页面样式。
- 默认启用豆包自动模式修正。
- 在进入豆包 chat 页面、SPA 路由变化、点击「新对话」导致模式回到快速后，自动触发模式修正。
- 豆包模式修正策略：
  - 检测当前模式，若已经是「专家」或「思考」则不重复切换。
  - 优先打开模式菜单并尝试选择「专家」。
  - 若专家切换后出现登录弹窗、按钮文本未变为「专家」、菜单项不存在或不可点击，则关闭/避让弹窗并回退切换「思考」。
  - 回退「思考」成功后记录状态提示，避免短时间内反复打扰。
- 提供油猴菜单命令，可切换脚本总开关；默认开启，设置持久化到 GM storage。
- 提供收起在屏幕右侧的配置入口，展开后能查看/修改基础配置。
- 配置至少包含：
  - 总开关。
  - 豆包适配开关。
  - 首选模式策略：专家优先，思考兜底。
- 多 AI 助手扩展应通过站点适配器/配置表扩展，首版只实现豆包，不提前实现其他平台。
- 首版保留多助手适配器扩展骨架，但配置面板只展示豆包相关选项。
- 配置面板展示最近一次自动切换结果、失败原因或回退原因，便于豆包 DOM 变更后排查。

## Acceptance Criteria

- [ ] 根目录 workspace 能识别新 userscript 包，包内提供标准 `build`、`typecheck`、`test`、`lint`、`format`、`biome:check`、`qa` 命令。
- [ ] 安装脚本后打开 `https://www.doubao.com/chat`，默认开启时会自动把「快速」纠正为「专家」或「思考」。
- [ ] 未登录场景下点击「专家」触发登录弹窗时，脚本能回退到「思考」，并避免把登录弹窗留作持续阻塞。
- [ ] 从「思考」状态点击豆包侧边栏「新对话」后，脚本能再次把「快速」纠正为「思考」或登录态可用时的「专家」。
- [ ] 通过油猴菜单关闭脚本后，进入 chat 或点击新对话不再自动切换模式；再次开启后恢复自动修正。
- [ ] 屏幕右侧有收起的配置入口，展开后可以修改总开关与豆包适配开关。
- [ ] 配置面板能显示最近一次切换状态，例如已切专家、专家不可用已回退思考、等待页面元素、脚本已关闭。
- [ ] 配置持久化，刷新页面后保持上一次设置。
- [ ] UI 样式不影响豆包页面原有布局和样式。
- [ ] 关键业务逻辑、配置校验、模式切换状态机有测试或可重复验证命令；不为纯 CSS 或静态页面结构写测试。

## Definition of Done

- Tests added/updated where business logic warrants it.
- Lint / typecheck / package QA pass.
- Build produces installable `.user.js`.
- README 或项目说明补充安装、配置和豆包验证方式。
- 如新增 React userscript 约定，应评估是否需要同步补充 `.trellis/spec/frontend/`。
- Rollout/rollback considered: 用户可通过油猴菜单关闭脚本；卸载 userscript 即可完全回滚。

## Technical Approach

- 采用独立 Vite userscript 包，沿用 `userscripts/github-enhance` 的 React/Tailwind/shadcn 基础结构，并按项目规范避免跨脚本直接 import 其 `src/`。
- 把站点逻辑拆成适配器：`DoubaoAdapter` 负责匹配页面、读取当前模式、打开模式菜单、选择专家/思考、处理登录弹窗和监听新对话重置。
- UI 与宿主页面通过固定右侧容器隔离，优先使用 Shadow DOM 或等价样式隔离方案；Tailwind preflight 不注入宿主页面。
- 配置通过 GM storage 读写，所有配置进入业务逻辑前做运行时校验并合并默认值。
- 使用 MutationObserver + 防抖 + 简单状态机处理 SPA 页面变化和 DOM 重绘，避免无限点击或高频轮询。

## Research References

- [`research/doubao-dom-probe.md`](research/doubao-dom-probe.md) — 豆包未登录场景下专家会触发登录弹窗，思考可用，新对话会重置为快速。

## Decision (ADR-lite)

**Context**: 新脚本需要支持当前豆包页面，同时保留未来扩展到多个 AI 助手的空间。

**Decision**: 首版以独立 userscript 包实现，并使用站点适配器模式。UI 只做总开关、豆包基础配置和最近一次切换状态；模式切换只实现豆包「专家优先，思考兜底」。

**Consequences**: 首版范围可控，能快速验证豆包行为；未来新增平台时可以增加适配器。代价是豆包 DOM 选择器会随官方页面变化而脆弱，需要把选择器集中管理并提供可关闭开关。

## Out of Scope

- 首版不支持除豆包以外的 AI 助手。
- 首版不做云同步、跨浏览器配置同步或复杂规则编辑器。
- 首版不绕过登录限制，不自动登录，不处理账号权益。
- 首版不修改用户输入内容、不自动发送消息。
- 首版不做大而全的插件市场或平台发现机制。

## Technical Notes

- 相关规范：
  - `.trellis/spec/frontend/index.md`
  - `.trellis/spec/frontend/directory-structure.md`
  - `.trellis/spec/frontend/quality-guidelines.md`
- 参考项目：
  - `userscripts/github-enhance/package.json`
  - `userscripts/github-enhance/vite.config.ts`
  - `userscripts/github-enhance/components.json`
  - `userscripts/github-enhance/src/index.css`
  - `userscripts/dms-helper/vite.config.ts`
- ctx7 shadcn 文档确认：Vite + Tailwind v4 的 `components.json` 可使用空 `tailwind.config`、`src/index.css`、CSS variables 和 `lucide` iconLibrary；`cn()` 由 `clsx` + `tailwind-merge` 组成。
- `pnpm dlx shadcn@latest info --json` 在当前 Node 24 环境下触发 `ERR_PACKAGE_PATH_NOT_EXPORTED`，实施期如需运行 shadcn CLI，应优先复用已有 `components.json` 或调整 CLI/Node 环境后再执行。
