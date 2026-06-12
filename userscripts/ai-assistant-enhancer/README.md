# AI 助手增强器

AI 助手体验增强油猴脚本。首版支持豆包，进入聊天页或点击新对话后，自动将默认「快速」模式切换为「专家」，专家不可用时回退到「思考」。

## 功能

- 默认启用豆包模式优化。
- 油猴菜单可切换脚本总开关。
- 页面右侧提供收起式配置面板。
- 配置持久化到油猴存储。
- 面板显示最近一次切换状态，便于排查页面 DOM 变化。

## 开发

```powershell
pnpm --filter ai-assistant-enhancer dev
pnpm --filter ai-assistant-enhancer build
pnpm --filter ai-assistant-enhancer qa
```

## 验证

1. 打开 `https://www.doubao.com/chat`。
2. 确认脚本开启时，模式会从「快速」自动切到「专家」或「思考」。
3. 未登录时点击「新对话」，应自动回退到「思考」。
4. 通过油猴菜单关闭脚本后，不再自动切换。
