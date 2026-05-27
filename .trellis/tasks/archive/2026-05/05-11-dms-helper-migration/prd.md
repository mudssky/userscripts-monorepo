# 引入 dmsHelper 脚本到 monorepo + 创建共享工具包

## Goal

将独立 userscript `dmsHelper.user.js` 迁移到 monorepo，转为 TypeScript；同时创建 `packages/userscript-utils/` 共享包，封装通用工具供现有和未来 userscript 使用。

## Decision (ADR-lite)

1. **DOM Debugger 接入**：运行时调试菜单（`GM_registerMenuCommand`），随时触发诊断
2. **共享包方案**：`packages/userscript-utils/` 单包，sub-path exports 区分运行时/Vite 插件
3. **重构范围**：现有包重构引用共享包，仅验证构建通过，不手动测试功能
4. **测试要求**：共享包需 vitest 单元测试

## Requirements

### 1. 共享包 `packages/userscript-utils/`

**运行时工具（主入口）：**
- `createShadowContainer` — 从 highlight-keywords 提取
- Debug 模式日志器 — 统一两包实现，基于 GM_getValue/GM_setValue
- DOM Debugger 接入 — 封装 `GM_registerMenuCommand` + `DomDebugger`

**构建时工具（`/vite` sub-path）：**
- Vite 样式注入插件 — 从 github-enhance 提取

**工程要求：**
- vitest 单元测试
- TypeScript，sub-path exports
- workspace 内部使用，不发布 npm

### 2. dms-helper 脚本 `userscripts/dms-helper/`

- 纯 TypeScript，无框架（Vue/Preact）
- vite-plugin-monkey 构建
- 依赖 `@mudssky/jsutils` + `userscript-utils`
- `GM_registerMenuCommand` 注册 DOM Debugger 诊断菜单
- 修复/更新失效的 CSS 选择器

### 3. 现有包重构

- highlight-keywords / github-enhance 改为引用 `userscript-utils`
- 移除内联重复实现
- 仅验证 `pnpm build` 通过

## Acceptance Criteria

- [ ] `packages/userscript-utils/` 可被 workspace 包引用
- [ ] 共享包 vitest 测试通过
- [ ] `pnpm build` 在 dms-helper 上成功，产物含正确 Tampermonkey 元数据
- [ ] DOM Debugger 菜单命令可触发，输出选择器诊断到控制台
- [ ] highlight-keywords / github-enhance 重构后构建通过
- [ ] dms-helper 脚本在 DMS 页面正常工作

## Definition of Done

- TypeScript 编译无错误
- Lint/typecheck 通过
- 所有三个 userscript 包 + 共享包构建成功
- 共享包测试覆盖核心逻辑

## Out of Scope

- 重构脚本 UI 设计
- 添加其他格式导出
- 发布 `userscript-utils` 到 npm
- 手动回归测试 highlight-keywords / github-enhance 功能

## Technical Approach

### 实施顺序

**Step 1: 共享包脚手架**
- 创建 `packages/userscript-utils/`（package.json、tsconfig、vitest 配置）
- 更新 `pnpm-workspace.yaml` 增加 `packages/*`

**Step 2: 提取共享工具**
- 从 highlight-keywords 提取 `createShadowContainer`
- 从 github-enhance 提取 Vite 样式注入插件
- 封装 Debug 日志器（融合两包实现）
- 封装 DOM Debugger 接入模块
- 编写 vitest 测试

**Step 3: dms-helper 迁移**
- 创建包脚手架（vite.config.ts、tsconfig、package.json）
- JS → TS 转换，模块化拆分
- 接入 DOM Debugger 菜单
- 选择器更新（需实际页面验证）

**Step 4: 现有包重构**
- highlight-keywords 引用 `userscript-utils` 的 `createShadowContainer`
- github-enhance 引用 `userscript-utils` 的 Vite 插件
- 验证构建通过

## Technical Notes

- **workspace 配置**：pnpm-workspace.yaml 增加 `packages/*`
- **DOM Debugger API**：`DomDebugger` / `debugSelectors` / `diagnoseSelectors` / `formatDiagnostics`
- **sub-path exports**：
  - `userscript-utils` → 运行时工具
  - `userscript-utils/vite` → Vite 插件
- **选择器列表**（待诊断）：`.con-sql-result`、`.bar-top`、`.art-table`、`.art-table-header-row`、`.art-table-body .art-table-row`、`.text`、`.next-tabs-tabpane.active`
