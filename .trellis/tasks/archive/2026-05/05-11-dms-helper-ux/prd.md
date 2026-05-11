# brainstorm: dms-helper 交互优化

## Goal

优化 DMS Helper 油猴脚本中"复制 CSV"和"复制 Markdown"两个按钮的交互体验，使操作更高效、更符合用户使用习惯。

## What I already know

* 当前有两个独立按钮："复制 CSV" 和 "复制 Markdown"，注入到工具栏 `.bar-top` 中
* 按钮样式复用宿主页面 class: `next-btn next-small next-btn-normal is-wind`
* 按钮通过 `navigator.clipboard.writeText` + `document.execCommand('copy')` 双重兜底
* 成功后显示 Toast 提示（固定顶部居中，2.5s 自动消失）
* 脚本运行在跨域 iframe（`dmsnext.console.aliyun.com`）内，使用 Tampermonkey `@grant` API
* 工具栏本身是 DMS 原生组件，空间有限

## Assumptions (temporary)

* 用户频繁使用的是其中一种格式（需确认），另一个按钮可能是低频操作
* 用户可能希望在不需要移动鼠标到工具栏的情况下快速复制

## Open Questions

* 用户使用 CSV vs Markdown 的频率偏好？
* 是否需要支持更多格式？
* 快捷键是否有冲突风险？

## Requirements (evolving)

* 保持现有两个格式的复制能力
* 提升操作效率

## Acceptance Criteria (evolving)

* [ ] 操作步骤 ≤ 当前方案（2次点击）
* [ ] 不破坏 DMS 原有工具栏功能
* [ ] 跨浏览器兼容（至少 Chrome + Firefox + Tampermonkey）

## Definition of Done

* Lint / typecheck / build 通过
* 在 DMS 生产环境实际验证

## Out of Scope (explicit)

* 新增导出格式（JSON、SQL INSERT 等）
* 修改 DMS 原生 UI
* 数据转换逻辑变更

## Technical Notes

* 关键文件: `userscripts/dms-helper/src/ui.ts`（按钮注入）、`userscripts/dms-helper/src/format.ts`（格式化）
* 运行环境: 跨域 iframe + Tampermonkey sandbox
* 可用 GM API: `GM_setClipboard`, `GM_notification`, `GM_registerMenuCommand`
