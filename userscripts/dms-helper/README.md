# DMS Helper - 阿里云 DMS 查询结果复制工具

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/mudssky/dms-helper)](https://github.com/mudssky/dms-helper/releases/latest)
[![GitHub](https://img.shields.io/github/license/mudssky/dms-helper)](https://github.com/mudssky/dms-helper/blob/main/LICENSE)

阿里云 DMS SQL 控制台增强脚本，一键复制查询结果为 CSV 或 Markdown 格式。

## 功能特性

- **复制 CSV**：将查询结果表格导出为 CSV 格式，可直接粘贴到 Excel
- **复制 Markdown**：将查询结果表格导出为 Markdown 表格，适合文档和笔记
- **虚拟滚动复制**：自动滚动收集虚拟表格数据；超过 300 行时会先确认，取消后仅复制前 300 行
- **Tab 切换跟随**：多个执行结果切换时，按钮自动跟随到当前活动 tab
- **DOM Debugger**：内置选择器诊断菜单，方便排查页面结构变化导致的兼容问题

## 安装方法

1. 确保已安装 [Tampermonkey](https://www.tampermonkey.net/) 或其他油猴脚本管理器
2. 点击安装脚本：[dms-helper.user.js](https://github.com/mudssky/userscripts-monorepo/releases/latest/download/dms-helper.user.js)
3. 油猴管理器会自动弹出安装确认，点击"安装"即可

## 使用方法

1. 打开阿里云 DMS 控制台（`dms.aliyun.com`）
2. 在 SQL 控制台中执行查询
3. 查询结果工具栏右侧会出现「复制 CSV」和「复制 Markdown」按钮
4. 点击按钮即可将结果复制到剪贴板

### 长表格复制

遇到虚拟滚动表格时，脚本会自动滚动收集已加载的结果行。为避免长表格复制过慢，默认超过 300 行会弹出确认；点击「确定」继续完整复制，点击「取消」只复制前 300 行。

### 多结果 Tab

当执行多次查询产生多个结果 tab 时，按钮会自动出现在当前选中的 tab 工具栏上，切换 tab 时自动跟随。

### 诊断菜单

在 Tampermonkey 菜单中提供三个诊断工具（仅在 SQL 控制台 iframe 内生效）：

- **诊断选择器**：生成完整的选择器匹配报告
- **快速检测**：检查各选择器是否匹配
- **DOM 结构**：打印当前页面 DOM 大纲

## 技术栈

- **TypeScript** - 类型安全
- **Vite** + **vite-plugin-monkey** - 构建工具
- **Biome** - 代码检查和格式化

## 开发

```bash
# 开发模式（热重载）
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck
```

## 项目结构

```
src/
├── config.ts     # 配置：复制阈值、虚拟滚动等待时间
├── main.ts       # 入口：按钮注入 + MutationObserver + DOM Debugger
├── ui.ts         # UI：按钮创建/移除、Toast 提示
├── table-collector.ts # 表格收集：虚拟滚动收集 + 阈值确认
├── format.ts     # 格式化：CSV/Markdown 转换、表格解析
└── selectors.ts  # CSS 选择器配置
```

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 联系方式

- 作者：mudssky
- 问题反馈：[Issues](https://github.com/mudssky/userscripts-monorepo/issues)
