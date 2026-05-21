# 现成浏览器连接方案调研：复用已登录浏览器调试油猴脚本

## 目标

调研现成工具和已有连接方式，用于在调试油猴脚本时复用用户当前浏览器登录态，尽量避免另开空白自动化浏览器、重复登录 DMS/SSO、手动导出 cookie。

本文件只记录现成方案；自研 Chrome 扩展、油猴诊断桥、本地调试协议不作为当前目标。

## 结论摘要

| 方案 | 是否复用现有登录态 | 是否需要重启浏览器 | 是否适合 agent 操作 | 备注 |
| --- | --- | --- | --- | --- |
| Chrome DevTools MCP `--autoConnect` | 是 | 否，但需在 Chrome 设置启用远程调试 | 是 | 官方方案，要求 Chrome 144+，当前主要面向 Chrome |
| Playwright CLI `attach --extension` | 是 | 否 | 是 | 通过 Playwright Extension 连接现有 tab，可复用 cookies/扩展；优先实测 |
| Browser MCP | 是 | 否 | 是 | Chrome 扩展 + MCP server，当前 tab 点击连接 |
| AlienMcp | 是 | 否 | 是 | Chrome 扩展 + MCP server，可限定 tab group |
| Vibe Browser MCP | 是 | 否 | 是 | 更像独立浏览器/扩展生态，强调真实 profile 和多 agent |
| `remote-debugging-port` + agent-browser/Playwright/Puppeteer | 可复用，但麻烦 | 通常需要 | 是 | 成熟但体验差，可能需要关闭原浏览器或独立 profile |
| 独立 profile/state 文件 | 后续可复用 | 否 | 是 | 首次仍要登录；state 文件需要当作凭据管理 |

## 方案 1：Chrome DevTools MCP `--autoConnect`

现成程度：官方 MCP server。

关键点：
- Chrome 官方文档说明，`--autoConnect` 可以连接用户正在运行的 Chrome 实例，继承当前 tabs、扩展和应用状态。
- 使用前需要在 `chrome://inspect/#remote-debugging` 启用 remote debugging，并在 Chrome 弹窗中允许连接。
- 官方文档明确适合 authenticated dashboards、SSO/VPN 后的页面调试。
- 风险是 agent 能访问当前 profile 的 open tabs、storage、localStorage、cookies 等，需要信任 agent。

适合度：
- 很适合“用户先登录并打开 DMS 页面，然后让 agent 接管调试”的目标。
- 目前资料主要面向 Chrome；Edge 是否等价支持需要实测。

来源：
- https://developer.chrome.com/docs/devtools/agents/use-cases/auto-connect
- https://github.com/ChromeDevTools/chrome-devtools-mcp

## 方案 2：Playwright CLI `attach --extension`（优先尝试）

现成程度：Playwright Agent CLI 官方功能。

关键点：
- Playwright CLI 文档提供 `playwright-cli attach --extension`，通过 Playwright Extension 连接现有浏览器。
- 文档示例包含 `playwright-cli attach --extension=chrome`。
- 文档也列出 `playwright-cli open --browser=msedge`、`playwright-cli attach --cdp=msedge`，说明 CLI 对 Edge channel 有支持；但 `--extension=msedge` 需要实测确认，不能只按 Chrome 示例推断。
- 该方式的核心价值是复用用户浏览器现有的登录态、cookies、installed extensions，比独立 profile / remote debugging port 更贴近“当前已登录页面调试”。
- 如果能连接 Edge 当前 tab，就可以作为 DMS 油猴脚本调试的首选方案；如果 Edge extension attach 不稳定，再退回 Chrome extension attach 或 CDP。

适合度：
- 很适合复用当前登录态，并且有 Playwright 风格的 snapshot/click/screenshot 操作，agent 也容易使用 CLI。
- 当前优先级提升到最高之一，建议先实测它能否连接已登录 DMS 页面的 iframe、读取表格 DOM、触发复制按钮。

建议实测命令：

```powershell
playwright-cli attach --extension=chrome
```

Edge 方向待确认：

```powershell
playwright-cli attach --extension=msedge
playwright-cli attach --cdp=msedge
```

实测前置条件：
- 本机已检测到 `playwright-cli` 命令，版本为 `0.1.13`，CLI 侧暂不需要额外安装。
- 浏览器侧需要安装官方 **Playwright Extension**。
- Playwright 官方文档说明该扩展可安装在 Chrome 或 Edge，并用于复用现有 tabs、登录态、cookies、已安装扩展。
- 若在 Edge 中从 Chrome Web Store 安装，可能需要先允许 “Allow extensions from other stores”。
- 安装后先在已登录 DMS 的 Edge tab 上执行 `playwright-cli attach --extension=msedge -s=dms-edge`，再用 `playwright-cli -s=dms-edge tab-list` / `snapshot` 验证是否接入。

实测结果（2026-05-21）：
- `playwright-cli attach --extension=msedge -s=dms-edge` 成功连接现有 Edge。
- 连接后页面为当前 DMS 页面，说明复用了用户现有登录态。
- `playwright-cli -s=dms-edge tab-list` 能列出当前 DMS tab。
- `playwright-cli -s=dms-edge snapshot` 能看到 DMS 外层页面和 SQL Console iframe 内的可访问内容。
- `playwright-cli -s=dms-edge eval "<表达式>"` 可执行页面脚本并读取 iframe 列表。
- `playwright-cli list` 不列出 attach 到外部浏览器的 session，但 `-s=dms-edge` 命令可正常工作。
- 连接 token 未写入文件；使用时应只作为临时环境变量。

来源：
- https://playwright.dev/agent-cli/commands/attach
- https://playwright.dev/mcp/configuration/browser-extension
- https://chromewebstore.google.com/detail/playwright-extension/mmlmfjhmonkocbjadbfplnigmagldckm
- https://support.microsoft.com/en-us/microsoft-edge/add-turn-off-or-remove-extensions-in-microsoft-edge-9c0ec68c-2fbc-2f2c-9ff0-bdc76f46b026
- Context7: `/microsoft/playwright-cli`，查询 “Playwright CLI attach --extension existing browser tab logged in session Edge”

## 方案 3：Browser MCP

现成程度：Chrome Web Store 扩展 + npm MCP server。

关键点：
- 安装 Browser MCP 扩展，并配置 MCP server：`npx @browsermcp/mcp@latest`。
- 文档说明点击扩展中的 Connect 后，所有 browser actions 会作用于当前连接的 tab。
- Chrome Web Store 页面显示其用途包括 web navigation、form filling、structured content extraction、automated testing。

适合度：
- 很贴近“接现有浏览器 tab，不重登”的需求。
- 功能深度、iframe/油猴脚本调试能力要实测；看起来更偏通用页面自动化。

来源：
- https://docs.browsermcp.io/setup-server
- https://docs.browsermcp.io/setup-extension
- https://chromewebstore.google.com/detail/browser-mcp-automate-your/bjfgambnhccakkhmkepdoekmckoijdlc

## 方案 4：AlienMcp

现成程度：开源项目，Chrome 扩展 + MCP server。

关键点：
- 官网说明可连接真实 Chrome tabs，复用 sessions、cookies、extensions，不使用 headless browser。
- 通过 tab group 限定 agent 能访问的 tabs。
- 工具包括截图、点击、输入、滚动、执行 JS、network、console、cookies、storage 等。

适合度：
- 对“控制当前已登录浏览器”很匹配。
- 需要从源码构建扩展和 MCP server，不如 Chrome Web Store 扩展开箱即用。

来源：
- https://www.alien-mcp.com/
- https://github.com/YasserLoukniti/AlienMcp

## 方案 5：Vibe Browser MCP

现成程度：产品化浏览器/扩展方案 + MCP relay。

关键点：
- 文档说明可让 Claude Code、Cursor、VS Code Copilot、OpenCode、Codex、Gemini CLI 等通过 MCP 控制浏览器。
- 官方对比表强调使用 browser profile、logged-in sessions、无需 separate browser。
- 本地 relay 当前只建模一个连接的 extension session；多浏览器/多 profile 同时开时目标可能不明确。

适合度：
- 如果接受使用它的浏览器/扩展生态，能较好满足复用登录态。
- 对现有日常 Edge/Chrome 的接入体验需要再实测确认。

来源：
- https://docs.vibebrowser.app/mcp-integration
- https://www.vibebrowser.app/mcp

## 方案 6：传统 CDP 端口连接

现成程度：最成熟；agent-browser、Playwright、Puppeteer、Selenium debuggerAddress 都可用。

关键点：
- 启动浏览器时加 `--remote-debugging-port=9222`，再让工具连接。
- 若要复用原 profile，通常需要关闭已有浏览器后用调试参数重开；否则 profile 可能已被原进程占用，端口也不会热开启。
- 若用独立 profile，需要首次重新登录。

适合度：
- 作为保底方案保留。
- 对“免重登、接当前浏览器”的体验不如 extension/autoConnect 方案。

来源：
- https://developer.chrome.com/docs/devtools/remote-debugging/local-server
- https://playwright.dev/agent-cli/commands/attach

## 推荐优先级

1. 优先实测 **Playwright CLI `attach --extension`**：agent 可直接使用 CLI，文档确认 extension attach 模式，最贴近当前需求。
2. 同步实测 **Chrome DevTools MCP `--autoConnect`**：官方、目标也贴近“接当前 Chrome 登录态”。
3. 备选实测 **Browser MCP**：安装简单，适合 MCP 客户端，但要确认能否满足 iframe、滚动、DOM 诊断。
4. 若需要更强 tab 授权边界，再看 **AlienMcp** 的 tab group 方案。
5. `remote-debugging-port` 和独立 profile/state 文件只作为保底。

## 待实测问题

- Playwright CLI extension attach 是否支持 Edge 当前 tab；如果不支持，Chrome 当前 tab 是否满足日常调试。
- Playwright Extension 在当前 DMS iframe 页面中能否稳定读取 iframe DOM、点击油猴注入按钮、处理 confirm dialog。
- Edge 是否支持 Chrome DevTools MCP `--autoConnect` 或等价能力。
- Browser MCP / AlienMcp 对跨域 iframe、油猴脚本注入页、React/虚拟滚动表格的 DOM 访问能力。
- 这些工具对 confirm dialog、剪贴板、浏览器扩展页面、Tampermonkey 沙盒上下文的支持边界。
