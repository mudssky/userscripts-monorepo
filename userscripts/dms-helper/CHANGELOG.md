# dms-helper

## 1.4.0

### Minor Changes

- [`5446471`](https://github.com/mudssky/userscripts-monorepo/commit/54464712ad57f3ba7ba8361b99d377911bcd9136) Thanks [@mudssky](https://github.com/mudssky)! - 修复 CSV 复制优先调用 DMS 导出执行器，并提升 Edge/Tampermonkey 沙箱内剪贴板写入稳定性。

### Patch Changes

- [`2cd4cff`](https://github.com/mudssky/userscripts-monorepo/commit/2cd4cff49213b5be9db9a8a12762d73e1d6959cb) Thanks [@mudssky](https://github.com/mudssky)! - CSV 复制默认优先复用 DMS 原生导出，并支持通过油猴菜单持久切换复制模式。

## 1.3.0

### Minor Changes

- [`65136a5`](https://github.com/mudssky/userscripts-monorepo/commit/65136a524d7f60a4fe52a9e0038d2f0bc94d5a85) Thanks [@mudssky](https://github.com/mudssky)! - 支持虚拟滚动表格复制完整已加载结果，并为长表格复制增加 300 行确认阈值

## 1.2.2

### Patch Changes

- [`39d14e3`](https://github.com/mudssky/userscripts-monorepo/commit/39d14e3360a797d360dafca78337fd4fb0280d84) Thanks [@mudssky](https://github.com/mudssky)! - 移除主页面 DOM Debugger 菜单，仅在 iframe 内注册，避免菜单重复

## 1.2.1

### Patch Changes

- [`b6edd91`](https://github.com/mudssky/userscripts-monorepo/commit/b6edd91bce30a44b7cd3f9a44df98e645e5c9ce8) Thanks [@mudssky](https://github.com/mudssky)! - 修复执行结果 tab 切换时按钮不跟随切换的问题

## 1.2.0

### Minor Changes

- [`ef90b35`](https://github.com/mudssky/userscripts-monorepo/commit/ef90b3512cf667901ccfaa2708014494fe8548c2) Thanks [@mudssky](https://github.com/mudssky)! - 支持跨域 iframe 注入，增强 DOM Debugger 诊断能力
  - 修复 SQL 控制台按钮不显示：添加 iframe match URL，按上下文拆分选择器诊断
  - DOM Debugger 菜单增强：点击自动复制报告、GM_notification 通知、DOM 结构导出
  - MutationObserver 注入成功后自动 disconnect
  - Toast 支持点击关闭
