# 验证 dms-helper 本地预览安装

## Goal

通过 `pnpm build` 与 `pnpm preview` 安装当前本地构建的 `dms-helper.user.js`，再连接真实 Edge/DMS 页面验证 CSV 导出优先复制逻辑，避免误测浏览器中已安装的旧版本。

## Requirements

- 使用 `userscripts/dms-helper` 当前源码构建本地产物。
- 启动本地 preview 服务，提供 `.user.js` 安装地址。
- 通过 Playwright CLI 连接 Edge，并打开本地脚本安装页。
- 安装或更新油猴脚本后，在真实 DMS SQL 控制台验证脚本按钮与 CSV 复制行为。

## Acceptance Criteria

- [x] `pnpm --filter ./userscripts/dms-helper run build` 通过。
- [x] preview 服务可访问 `dms-helper.user.js`。
- [x] Edge 中可打开本地 `.user.js` 安装/更新页面。
- [x] DMS 页面加载后 helper 按钮来自当前构建版本。
- [x] CSV 复制路径验证完成，记录导出命中或回退行为。

## Verification Notes

- `pnpm --filter ./userscripts/dms-helper run typecheck` 通过。
- `pnpm --filter ./userscripts/dms-helper run build` 通过；因 `4173` 被占用，preview 实际切到 `http://127.0.0.1:4174/dms-helper.user.js` 并可返回当前构建产物。
- 真实 Edge/DMS 验证中，SQL 控制台可执行查询，结果区出现 `.con-sql-result` 与 `.bar-top`，并复现长字段截断文案：`内容已被截断，请提交sql结果集导出工单获取完整内容`。
- 验证发现旧实现问题：Tampermonkey 沙箱里 `navigator.clipboard.writeText` 被 Permissions Policy 阻止，需优先使用 `GM_setClipboard`。
- 验证发现兼容问题：SQL 控制台也可能作为顶层 `dmsnext.console.aliyun.com/_console/sql-console` 页面打开，不能只在 iframe 环境运行注入逻辑。
- Playwright 可打开 Tampermonkey 本地安装中转页，但安装/更新确认 UI 未暴露给自动化；当前 DMS 页仍未显示 helper 按钮，需要在 Tampermonkey 中确认更新当前本地构建后继续验证复制路径。
- 用户澄清目标不是点击页面导出菜单，而是调用 DMS 导出接口/执行器拿 CSV 文本后写入剪贴板。
- DMS 前端 bundle 中存在 `@sql-editor/executeDownloadSql` effect：它创建 SQL 执行器，设置 `columnTruncate=0`，调用 `executeSqlsWithCallback` 重新执行 SQL，并通过 `onResult` 返回完整结果。
- 验证发现新版 SQL Console 不稳定暴露 DVA store；最终方案改为页面上下文直接从 `window.webpackChunk_ali_idb_style` 取 DMS SQL executor 模块，设置 `columnTruncate=0` 后重新执行当前 SQL 并格式化 CSV。
- 真实页面中手动直调 DMS executor 验证通过：当前 SQL 返回 `RESULTSET`、24 列、20 行，`truncatedColumns=[]`，首行不包含 `内容已被截断`。
- 已调整导出模式：页面上下文注入 runner，直接调用 DMS SQL executor 获取完整结果并在脚本内格式化 CSV；接口失败时再回退 DOM 复制模式。
- 新版 DMS 顶层页面结果区为 `.panel-result`，同一面板同时包含“我的SQL”和“执行结果”tab；验证曾复现旧路径在活动 tab 为“我的SQL”时复制出执行历史表格。
- 已新增活动执行结果上下文判断：只有当前 tab 为 `执行结果N` 时才注入/执行 CSV 复制，导出 SQL 优先从该活动 tabpane 的 React fiber 中读取 `executeSQL`，避免误用编辑器 SQL 或“我的SQL”历史表。
- DMS executor 返回的 `rowDataList` 在当前页面为 `C_1`/`C_2` 形式对象行；已兼容数组行与对象行，避免 `row.forEach is not a function` 后回退 DOM 截断文本。
- 真实 Edge/DMS 验证通过：当前活动 tab 为 `执行结果1`，导出事件 `success=true`，剪贴板首行为 `id,c_workflow_name,c_execution_type,...`，长度约 205KB；不包含 `SQL (双击SQL粘贴至上方)` / 历史 SQL，也不包含 `内容已被截断`。
- Playwright 可打开 Tampermonkey 本地安装中转页，但安装/更新确认 UI 未暴露给自动化；真实验证中使用当前 preview dist 注入页面确认新版按钮注入与 executor 链路。

## Out of Scope

- 不修改功能代码，除非验证发现必须修复的问题。
- 不发布版本。
