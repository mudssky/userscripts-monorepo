# dms-helper

## 1.2.0

### Minor Changes

- [`ef90b35`](https://github.com/mudssky/userscripts-monorepo/commit/ef90b3512cf667901ccfaa2708014494fe8548c2) Thanks [@mudssky](https://github.com/mudssky)! - 支持跨域 iframe 注入，增强 DOM Debugger 诊断能力
  - 修复 SQL 控制台按钮不显示：添加 iframe match URL，按上下文拆分选择器诊断
  - DOM Debugger 菜单增强：点击自动复制报告、GM_notification 通知、DOM 结构导出
  - MutationObserver 注入成功后自动 disconnect
  - Toast 支持点击关闭
