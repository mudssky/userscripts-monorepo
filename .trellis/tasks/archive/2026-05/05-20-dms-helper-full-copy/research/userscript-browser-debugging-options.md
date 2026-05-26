# 油猴脚本调试连接现有浏览器方案调研（背景材料）

> 当前重点是调研现成工具，不是开发新调试工具。现成方案清单见
> [`existing-browser-automation-solutions.md`](./existing-browser-automation-solutions.md)。
> 本文件保留自研扩展、油猴诊断桥等可行性背景，避免后续讨论时混淆方案边界。

## 背景

目标是在调试 DMS 这类需要真实登录态的油猴脚本时，尽量复用用户已经登录的浏览器页面，减少重新登录、复制 cookie、另开调试浏览器等操作成本。

## 资料来源

- Chrome DevTools 远程调试文档：`--remote-debugging-port` 可用于调试另一个 Chrome 实例。
  - https://developer.chrome.com/docs/devtools/remote-debugging/local-server
- Chrome `chrome.debugger` 扩展 API：扩展可作为 CDP 的替代传输，附加到一个或多个 tab。
  - https://developer.chrome.com/docs/extensions/reference/api/debugger
- Chrome 扩展消息通信：content script、service worker、扩展页面之间可互相传递 JSON 消息。
  - https://developer.chrome.com/docs/extensions/develop/concepts/messaging
- Chrome Native Messaging：扩展可和本机进程通信，适合把浏览器内数据桥接到本地 CLI。
  - https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging
- Chrome DevTools Panel 扩展：扩展可增加 DevTools 面板/侧栏，适合做人工调试辅助。
  - https://developer.chrome.com/docs/extensions/reference/api/devtools/panels
- Tampermonkey 文档：支持菜单命令、`unsafeWindow`、`GM_xmlhttpRequest`、`@connect` 等能力。
  - https://www.tampermonkey.net/documentation.php?locale=en

## 可行方案

### 方案 A：CDP 远程调试端口

通过 `--remote-debugging-port` 启动 Chrome/Edge，再由 `agent-browser --cdp <port>` 连接。

优点：
- 能复用 CDP 生态，agent-browser/Playwright/Puppeteer 都容易接。
- 自动化能力完整：DOM、截图、网络、console、JS eval 都能做。

缺点：
- 需要浏览器进程启动时带参数；普通已打开的浏览器通常不能热开启端口。
- 若使用独立 profile，需要重新登录；若使用原 profile，往往要先关闭已有浏览器。
- 调试端口本机可控，安全边界较宽，用完应关闭。

适合：
- 能接受单独调试浏览器，或能接受一次性登录调试 profile。

### 方案 B：浏览器扩展 + `chrome.debugger`

写一个开发用 Chrome/Edge 扩展，请求 `debugger` 权限，用户在已登录页面点击扩展按钮后，扩展通过 `chrome.debugger.attach({ tabId })` 附加当前 tab，并执行 CDP 命令。

优点：
- 可以附加到当前已经登录的普通浏览器 tab，不要求浏览器启动时开启远程调试端口。
- 能覆盖较强调试能力：DOM、Runtime、Network、CSS、截图等 CDP 域。
- 可以只对用户主动选择的 tab 生效，使用体验比全局调试端口收敛。

缺点：
- 需要开发和安装一个扩展；`debugger` 是高敏感权限，浏览器会有明显提示。
- 扩展内部要实现一层命令协议；如果要给本地 agent 使用，还需要 Native Messaging 或本地 WebSocket/HTTP 桥。
- 这已经超出油猴脚本本身，维护成本高于简单 userscript。

适合：
- 长期调试 DMS/内部系统，强烈希望复用现有登录态，并愿意维护一个专用开发扩展。

### 方案 C：油猴脚本内诊断桥

在 userscript 中加入调试菜单或轻量本地桥：比如 `GM_registerMenuCommand` 导出 DOM/滚动候选/表格数据；或用 `GM_xmlhttpRequest` 向 `http://127.0.0.1:<port>` 发送诊断信息，再由本地 CLI 接收。

优点：
- 不需要控制整个浏览器，不需要重新登录。
- 与油猴脚本问题最贴近，能直接跑在目标页面和 iframe 中，拿到真实 DOM、`unsafeWindow`、脚本状态。
- 实现成本低，适合当前 DMS helper 这类“看选择器、看滚动容器、看接口响应”的调试。

缺点：
- 不是通用浏览器自动化，不能像 CDP 一样任意点击/截图/抓所有网络。
- 本地桥需要处理 `@connect`、CORS/端口、安全开关，避免在生产页面常驻暴露调试能力。
- 需要用户触发菜单或开启调试模式。

适合：
- 当前这种油猴脚本专项调试，尤其是收集 DOM 结构、滚动容器、可见行、接口缓存等诊断数据。

### 方案 D：DevTools Panel 扩展

写一个 DevTools 扩展面板，用户打开 DevTools 时看到专用调试 UI，可读取 inspected window、执行表达式、展示脚本状态。

优点：
- 不需要远程调试端口，也能运行在用户当前已登录页面的 DevTools 语境里。
- 对人工调试友好，可做成“DMS Helper”专用面板。

缺点：
- 仍然是扩展开发；需要用户打开 DevTools。
- 更偏人工诊断，不太适合 agent-browser 直接自动操作。

适合：
- 需要可视化调试面板，但不追求无人值守自动化。

### 方案 E：登录态导入/独立调试 Profile

使用独立浏览器 profile 或 agent-browser state 文件；第一次登录后保存，后续复用。

优点：
- 实现最简单，和 agent-browser 现有能力契合。
- 不影响日常浏览器，安全边界比较清晰。

缺点：
- 首次仍需要登录；DMS/阿里云 SSO、MFA、风控可能让登录成本仍然不低。
- state 文件包含 cookie/token，需要严格避免提交和泄漏。

适合：
- 可接受一次性登录，想快速获得完整自动化能力。

## 推荐结论

短期推荐采用「方案 C：油猴脚本内诊断桥」作为当前 DMS helper 的调试增强：用菜单导出滚动容器候选、当前表格结构、可见行、关键网络缓存等信息，用户无需重登，也不用改浏览器启动方式。

中期如果调试需求长期存在，再考虑「方案 B：浏览器扩展 + `chrome.debugger` + Native Messaging」，它是最接近“连接现有浏览器并给本地 agent 操作”的正统方案，但开发和权限成本明显更高。

CDP 远程调试端口仍保留为通用自动化方案，适合接受独立调试浏览器或一次性调试 profile 的场景。
