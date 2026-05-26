# 优化 dms-helper 虚拟表格完整复制

## Goal

优化 `userscripts/dms-helper` 的复制功能，避免 DMS 查询结果表格使用虚拟滚动时只复制当前可见 DOM 行；优先复用 DMS 页面原生 CSV 导出能力，把导出的 CSV 内容直接复制到剪贴板，降低虚拟滚动 DOM 收集遇到长文本截断或长表格慢的问题。

## What I Already Know

- 当前 `parseTable()` 从 `.art-table-body .art-table-row` 读取 DOM 行，虚拟滚动只渲染视口内行，所以只能复制当前可见内容。
- 用户提供的 `userscripts/dms-helper/local/DMS - Data Management Service2.html` 是 DMS 外层页面，真正 SQL 控制台位于 iframe：`./DMS - Data Management Service2_files/sql-console.html`。
- 本地样本未包含 iframe 文件，因此无法从样本中直接确认 DMS 查询接口 URL 和响应字段。
- 现有脚本是纯 TypeScript + Vite + `vite-plugin-monkey`，没有 UI 框架，代码集中在 `src/main.ts`、`src/ui.ts`、`src/format.ts`、`src/selectors.ts`。
- 用户关注 1000+ 行长表格的性能；纯滚动收集需要逐屏触发虚拟列表渲染，可能明显慢于直接读取数据源。
- Tampermonkey 中拦截页面 `fetch` / `XMLHttpRequest` 可行，但需要在页面真实 window 上执行；沙盒上下文直接 patch `window.fetch` 可能只影响 userscript 自己。可通过 `unsafeWindow` 或注入页面脚本实现，并尽量使用 `document-start` 早于 DMS 应用发起请求。
- 用户反馈 DOM 提取在内容过长时会发生截断，滚动收集仍无法保证复制到完整单元格内容。
- 用户提出新方向：优先走页面已有的 CSV 导出能力；文件下载本身不方便，但若能在导出后直接复制到剪贴板，使用体验更好。
- 本次暂不做接口拦截；接口拦截可获取完整内容但复杂度更高，作为后续优化方向保留。
- 油猴脚本需要支持导出模式与复制模式切换；默认走导出模式，导出按钮不存在时自动切到复制模式；用户选择通过油猴菜单持久保存。

## Requirements

- CSV 复制应默认优先复用 DMS 页面原生导出 CSV 功能，并把导出内容直接复制到剪贴板。
- 脚本应支持导出模式与复制模式切换；默认模式为导出，切换入口使用油猴菜单，并持久保存用户选择。
- 当 DMS 原生导出按钮不存在、不可用或导出流程无法捕获 CSV 内容时，应自动回退到现有复制模式。
- 复制模式继续复用当前 DOM/虚拟滚动收集逻辑，作为导出能力不可用时的兜底。
- 复制过程中应给出清晰提示，区分正在导出、已复制、已回退、失败等状态。
- 逻辑应保持在 `dms-helper` 脚本边界内，不引入共享包或新的前端框架。

## Acceptance Criteria

- [x] 默认模式下点击「复制 CSV」会优先触发 DMS 原生 CSV 导出，并把导出的 CSV 文本复制到剪贴板。
- [x] 页面不存在可用导出按钮时，点击「复制 CSV」自动回退到现有复制模式。
- [x] 导出流程无法捕获 CSV 内容时，用户能看到回退或失败提示，不静默下载后无反馈。
- [x] 用户可以通过油猴菜单在导出模式与复制模式之间切换。
- [x] 模式切换后刷新或重新进入 DMS 页面仍保持上次选择。
- [x] 复制模式下仍保留现有 DOM/虚拟滚动收集能力。
- [x] `pnpm --filter ./userscripts/dms-helper run typecheck` 通过。
- [x] `pnpm --filter ./userscripts/dms-helper run build` 通过。

## Definition of Done

- TypeScript 编译无错误。
- 函数参数和返回值具备 JSDoc 说明。
- 复杂业务逻辑使用中文注释解释设计意图。
- 不新增显式 `any`。
- README 或变更说明同步描述虚拟滚动复制能力。

## Technical Approach

实现「原生 CSV 导出优先 + DOM 复制兜底」方案：识别当前查询结果区域内 DMS 自带的 CSV 导出入口，触发导出后尽量在页面侧捕获生成的 CSV 文本或下载 Blob，并直接写入剪贴板。若导出入口不存在、不可点击或无法捕获导出内容，则自动回退到现有 `collectTableData()` DOM/虚拟滚动收集逻辑。

性能策略：本次不做请求拦截，避免页面上下文注入与接口字段解析复杂度；优先借助 DMS 已有导出链路解决长文本截断和虚拟滚动不完整问题。请求拦截作为后续高可靠数据源保留。

## Decision (ADR-lite)

**Context**: 虚拟滚动表格不会把所有行同时放进 DOM，现有复制逻辑天然只能拿到视口行；即便滚动收集，过长单元格也可能在 DOM 展示层被截断。DMS 页面已有 CSV 导出能力，更接近真实结果集数据源，但直接下载文件对用户不方便。

**Decision**: 本次采用原生 CSV 导出优先，导出后复制到剪贴板；导出入口不存在或捕获失败时自动回退到复制模式。请求拦截作为后续优化方向保留。

**Consequences**: 默认路径更可能拿到完整 CSV，且避免长表格滚动收集；代价是需要适配 DMS 原生导出按钮和浏览器下载机制，若页面导出实现变化，需要回退到复制模式保障可用性。

### 模式切换入口

**Context**: 导出模式是默认推荐路径，但调试或页面导出异常时需要允许用户强制回到旧复制模式。

**Decision**: 使用油猴菜单做持久切换，不在 DMS 工具栏新增额外切换控件。

**Consequences**: 页面按钮保持简洁，用户选择跨刷新保留；代价是切换入口不如页面内控件直观。

## Out of Scope

- 绕过 DMS 服务端分页限制复制未加载页。
- 拦截 `fetch` / `XMLHttpRequest` 或解析接口响应缓存。
- 绕过权限或请求未由用户当前页面触发的接口。
- 重做按钮 UI 或新增独立文件下载管理器。

## Technical Notes

- 相关代码：
  - `userscripts/dms-helper/src/format.ts`
  - `userscripts/dms-helper/src/ui.ts`
  - `userscripts/dms-helper/src/selectors.ts`
  - `userscripts/dms-helper/src/main.ts`
- 相关规范：
  - `.trellis/spec/frontend/index.md`
  - `.trellis/spec/frontend/directory-structure.md`
  - `.trellis/spec/frontend/quality-guidelines.md`
  - `.trellis/spec/frontend/type-safety.md`
- 本地 HTML 样本缺少 `DMS - Data Management Service2_files/sql-console.html`，无法直接分析 iframe 内查询结果 DOM 和网络响应。
- 2026-05-26 新增需求：默认优先走 DMS 原生 CSV 导出；导出入口不可用时自动回退到复制模式；需要用 Playwright CLI + Edge 调试真实 DMS 页面确认导出按钮选择器和下载捕获方式。
