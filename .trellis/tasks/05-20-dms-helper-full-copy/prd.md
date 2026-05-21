# 优化 dms-helper 虚拟表格完整复制

## Goal

优化 `userscripts/dms-helper` 的复制功能，避免 DMS 查询结果表格使用虚拟滚动时只复制当前可见 DOM 行；同时对长表格复制做行数阈值保护，避免 300 行以上结果集复制时页面长时间滚动收集。

## What I Already Know

- 当前 `parseTable()` 从 `.art-table-body .art-table-row` 读取 DOM 行，虚拟滚动只渲染视口内行，所以只能复制当前可见内容。
- 用户提供的 `userscripts/dms-helper/local/DMS - Data Management Service2.html` 是 DMS 外层页面，真正 SQL 控制台位于 iframe：`./DMS - Data Management Service2_files/sql-console.html`。
- 本地样本未包含 iframe 文件，因此无法从样本中直接确认 DMS 查询接口 URL 和响应字段。
- 现有脚本是纯 TypeScript + Vite + `vite-plugin-monkey`，没有 UI 框架，代码集中在 `src/main.ts`、`src/ui.ts`、`src/format.ts`、`src/selectors.ts`。
- 用户关注 1000+ 行长表格的性能；纯滚动收集需要逐屏触发虚拟列表渲染，可能明显慢于直接读取数据源。
- Tampermonkey 中拦截页面 `fetch` / `XMLHttpRequest` 可行，但需要在页面真实 window 上执行；沙盒上下文直接 patch `window.fetch` 可能只影响 userscript 自己。可通过 `unsafeWindow` 或注入页面脚本实现，并尽量使用 `document-start` 早于 DMS 应用发起请求。
- 用户决定暂不做请求拦截，作为后续优化；本次采用滚动收集，并通过可配置阈值控制长表格性能风险。

## Requirements

- CSV 和 Markdown 复制按钮应优先复制虚拟表格的完整已加载结果，而不是只复制当前可见行。
- 当无法识别虚拟滚动容器、无法稳定收集完整行或页面结构变化时，保留现有 DOM 解析兜底。
- 复制过程应恢复用户原本的滚动位置，尽量降低对 DMS 页面操作状态的影响。
- 复制过程中应给出清晰提示，避免大结果集收集时用户误以为无响应。
- 提供配置常量控制默认行数阈值，初始值为 300 行。
- 滚动收集发现结果超过阈值时，提示用户继续完整复制可能较慢。
- 用户确认继续时，继续滚动收集完整结果；用户取消时，只复制前 300 行。
- 逻辑应保持在 `dms-helper` 脚本边界内，不引入共享包或新的前端框架。

## Acceptance Criteria

- [ ] 在虚拟滚动表格中点击「复制 CSV」可收集滚动区域内的所有已加载行。
- [ ] 在虚拟滚动表格中点击「复制 Markdown」可收集滚动区域内的所有已加载行。
- [ ] 行数达到配置阈值 300 且仍有更多内容时，弹出确认提示。
- [ ] 用户取消长表格确认时，只复制前 300 行，并提示已截断。
- [ ] 用户确认长表格继续复制时，继续滚动收集完整结果。
- [ ] 非虚拟表格或收集失败时仍能按原方式复制当前 DOM 表格。
- [ ] 收集完成后恢复表格滚动位置。
- [ ] `pnpm --filter ./userscripts/dms-helper run typecheck` 通过。
- [ ] `pnpm --filter ./userscripts/dms-helper run build` 通过。

## Definition of Done

- TypeScript 编译无错误。
- 函数参数和返回值具备 JSDoc 说明。
- 复杂业务逻辑使用中文注释解释设计意图。
- 不新增显式 `any`。
- README 或变更说明同步描述虚拟滚动复制能力。

## Technical Approach

实现「滚动收集 + 阈值确认」方案：识别表格滚动容器，保存滚动位置，从顶部到末尾分段滚动，等待虚拟列表重新渲染后解析当前可见行，并基于行内容去重合并结果。收集到配置阈值 `300` 行且检测到仍可继续滚动时，弹出确认提示；用户确认则继续收集完整结果，用户取消则停止并只复制已收集的前 300 行。收集结束后恢复滚动位置，再复用现有 CSV / Markdown 格式化函数。

性能策略：本次不做请求拦截，避免页面上下文注入复杂度；用 300 行阈值阻止长表格默认全量滚动，用户需要完整复制时显式确认。

## Decision (ADR-lite)

**Context**: 虚拟滚动表格不会把所有行同时放进 DOM，现有复制逻辑天然只能拿到视口行。下载的 HTML 只包含外层 iframe 壳，无法确认 DMS 数据接口结构；请求拦截在 userscript 中可行但实现和调试成本较高。

**Decision**: 本次不做请求拦截；采用滚动收集，并增加默认 300 行阈值确认。请求拦截作为后续优化方向保留。

**Consequences**: 实现复杂度较低，能快速改善虚拟滚动复制；代价是长表格全量复制仍会慢，但用户会在超过阈值前得到提示，并可选择只复制前 300 行。

## Out of Scope

- 绕过 DMS 服务端分页限制复制未加载页。
- 调用 DMS 导出工单或 SQL 结果集导出能力。
- 拦截 `fetch` / `XMLHttpRequest` 或解析接口响应缓存。
- 绕过权限或请求未由用户当前页面触发的接口。
- 重做按钮 UI 或新增导出文件下载功能。

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
