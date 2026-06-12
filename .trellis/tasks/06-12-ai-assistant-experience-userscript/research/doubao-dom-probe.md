# 豆包页面 DOM 探测

## 背景

为了确认首批支持豆包时能否稳定识别「快速 / 思考 / 专家」模式，使用 `playwright-cli` 打开 `https://www.doubao.com/chat` 做只读探测。探测时未登录。

## 发现

- 未登录状态可进入基础 chat 页面，页面顶部显示「登录」，输入区附近默认显示模式「快速」。
- 模型选择器是 Radix 风格下拉触发器，外层按钮带 `data-slot="dropdown-menu-trigger"`，内部有 `data-valid-btn="mode-select-action-btn"`。
- 当前页面存在嵌套按钮结构：外层 trigger 带 `data-slot="dropdown-menu-trigger"`，内层 `button` 才是真实可点击的「快速 / 思考 / 专家」按钮。脚本直接对外层执行 `HTMLElement.click()` 可能不会打开菜单。
- 菜单未展开时，页面上只应依赖触发按钮文本识别当前模式；菜单展开后外层 trigger 的文本会包含三个菜单项，识别当前模式时必须排除 `[role="menu"]` 内的文本，否则会误判为 unknown。
- Radix 下拉在页面内通过脚本触发时，需要模拟 `pointerdown` / `pointerup` 并随后 click，单纯 MouseEvent 或外层 click 不稳定。
- 点击「快速」后，下拉菜单中出现三个 `role="menuitem"` 选项：
  - 「快速」：适用于大部分情况。
  - 「思考」：擅长解决更难的问题。
  - 「专家」：研究级智能模型。
- 未登录状态点击「专家」会弹出「登录以解锁更多功能」对话框，当前模式仍保持「快速」。
- 未登录状态点击「思考」可以成功切换，按钮文本变为「思考」。
- 从「思考」状态点击左侧侧边栏「新对话」后，官方页面会把模式重置为「快速」。

## 对实现的影响

- 豆包适配器应在进入 chat 页面和点击/触发新对话后自动纠正模式。
- 自动策略建议为：先尝试切「专家」，等待短时间确认当前按钮是否变为「专家」；若出现登录弹窗、菜单关闭后仍不是「专家」，或专家菜单项不可点击，则关闭弹窗并切「思考」。
- 选择器应优先使用文本、`role="menuitem"`、`data-slot="dropdown-menu-trigger"`、`data-valid-btn="mode-select-action-btn"` 等相对语义化信号，避免依赖 Tailwind/hash class。
- 后续登录态仍需真机验证：登录后「专家」是否可直接切换，以及切换后按钮文本是否稳定显示「专家」。

## 关键命令

```powershell
playwright-cli -s=doubao-ai-helper open https://www.doubao.com/chat --persistent
playwright-cli -s=doubao-ai-helper click "button[data-slot='dropdown-menu-trigger']:has-text('快速')"
playwright-cli -s=doubao-ai-helper click "[role='menuitem']:has-text('专家')"
playwright-cli -s=doubao-ai-helper click "[role='menuitem']:has-text('思考')"
playwright-cli -s=doubao-ai-helper click "#flow_chat_sidebar >> text=新对话"
```
