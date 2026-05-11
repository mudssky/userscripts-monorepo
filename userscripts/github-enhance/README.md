# GitHub Enhance - GitHub 增强脚本

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/mudssky/github-enhance)](https://github.com/mudssky/github-enhance/releases/latest)
[![GitHub](https://img.shields.io/github/license/mudssky/github-enhance)](https://github.com/mudssky/github-enhance/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/mudssky/github-enhance)](https://github.com/mudssky/github-enhance/stargazers)

一个强大的油猴脚本，为 GitHub 仓库页面添加快速跳转到各种外部开发工具和服务的功能。

## ✨ 功能特性

- 🚀 **一键跳转**：在 GitHub 仓库页面添加"快速访问"下拉菜单
- 🎯 **智能定位**：自动识别当前仓库信息，生成正确的跳转链接
- 📱 **响应式设计**：适配不同屏幕尺寸，界面美观现代
- 🔧 **多种工具**：集成 4 个热门的代码分析和开发工具
- ⚡ **性能优化**：使用 CDN 加载依赖，脚本体积小，加载快
- 🛡️ **安全可靠**：仅在 GitHub 页面运行，不收集任何用户数据
- 🐛 **调试模式**：内置调试功能，支持实时切换，方便问题排查和开发调试

## 🛠️ 支持的外部服务

### 在线 IDE

- **GitHub1s** - 在网页版 VS Code 环境中浏览代码

### 代码搜索

- **Sourcegraph** - 强大的代码搜索和导航引擎

### AI 工具

- **Deepwiki** - 基于 AI 的知识库，项目文档管理
- **Zread** - AI 知识管理工具，个人知识库

## 📦 安装方法

### 方法一：直接安装（推荐）

1. 确保已安装 [Tampermonkey](https://www.tampermonkey.net/) 或其他油猴脚本管理器
2. 点击下载脚本：[github-enhance.user.js](https://github.com/mudssky/github-enhance/releases/latest/download/github-enhance.user.js)
3. 油猴管理器会自动弹出安装确认，点击"安装"即可

### 方法二：从源码构建

```bash
# 克隆仓库
git clone https://github.com/mudssky/github-enhance.git
cd github-enhance

# 安装依赖
pnpm install

# 构建脚本
pnpm build

# 生成的脚本位于 dist/github-enhance.user.js
```

## 🎮 使用方法

### 基本使用

1. 安装脚本后，访问任意 GitHub 仓库页面
2. 在页面右上角的操作区域会出现"扩展打开"按钮
3. 点击按钮展开下拉菜单，选择想要使用的外部服务
4. 点击服务名称即可在新标签页中打开对应的工具

![使用示例](./docs/screenshot.png)

### 调试模式快速使用

如果遇到问题，可以快速开启调试模式：

1. 按 `F12` 打开浏览器开发者工具
2. 切换到 `Console`（控制台）标签
3. 输入 `window.GitHubEnhance.toggleDebugMode(true)` 并按回车
4. 刷新页面，查看控制台中的详细日志信息
5. 问题解决后，输入 `window.GitHubEnhance.toggleDebugMode(false)` 关闭调试模式

## 🧪 开发与测试

### 技术栈

- **React 18** + **TypeScript** - 现代化的前端开发
- **Tailwind CSS** - 原子化 CSS 框架
- **Vite** - 快速的构建工具
- **Vitest** - 单元测试框架
- **Biome** - 代码格式化和质量检查

### 开发命令

```bash
# 开发模式（热重载）
pnpm dev

# 运行测试
pnpm test

# 运行测试（单次）
pnpm test:run

# 代码格式化
pnpm format

# 代码检查
pnpm lint

# 构建生产版本
pnpm build
```

### 项目结构

```
src/
├── components/
│   ├── ui/                 # UI 基础组件
│   ├── GitHubEnhancer.tsx  # 主要功能组件
│   └── GitHubEnhancer.test.tsx # 组件测试
├── lib/
│   └── utils.ts            # 工具函数
├── main.tsx                # 入口文件
└── index.css               # 全局样式
```

## 🔧 配置说明

### 脚本元数据

- **运行时机**：`document-end` - 页面 DOM 加载完成后运行
- **匹配规则**：`https://github.com/*` - 仅在 GitHub 页面运行
- **权限申请**：`GM_getValue`、`GM_setValue` - 用于调试模式设置存储

### 调试模式

脚本内置了调试模式功能，方便开发者和用户进行问题排查：

#### 开启/关闭调试模式

在浏览器控制台中输入以下命令：

```javascript
// 开启调试模式
window.GitHubEnhance.toggleDebugMode(true)

// 关闭调试模式
window.GitHubEnhance.toggleDebugMode(false)

// 切换调试模式（开启↔关闭）
window.GitHubEnhance.toggleDebugMode()

// 查看当前调试模式状态
window.GitHubEnhance.getDebugModeStatus()

// 显示调试帮助信息
window.GitHubEnhance.showDebugHelp()
```

#### 调试模式功能

- **详细日志**：开启后会在控制台输出详细的运行日志
- **状态持久化**：调试模式状态会保存在 Tampermonkey 存储中
- **实时切换**：无需刷新页面即可切换调试模式
- **帮助信息**：提供完整的调试命令说明

#### 使用场景

- **问题排查**：当脚本运行异常时，开启调试模式查看详细日志
- **功能验证**：验证脚本是否正确识别页面元素和执行逻辑
- **开发调试**：开发者进行功能开发和测试时使用

### 自定义配置

如需添加新的外部服务，可修改 `src/components/GitHubEnhancer.tsx` 中的 `EXTERNAL_SERVICES` 配置：

```typescript
const EXTERNAL_SERVICES: ExternalService[] = [
  {
    name: '服务名称',
    description: '服务描述',
    icon: <YourIcon className="w-4 h-4" />,
    urlTemplate: 'https://example.com/{owner}/{repo}',
    category: 'ide' | 'search' | 'ai' | 'analysis'
  },
  // ... 其他服务
]
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 代码规范

- 使用 TypeScript 编写所有代码
- 遵循 React Hooks 最佳实践
- 优先使用 Tailwind CSS 类名
- 为新功能添加相应的测试
- 提交前运行 `pnpm biome:check` 检查代码质量

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 📋 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解详细的版本更新历史。

## 🔄 自动更新

脚本支持通过 Tampermonkey 自动更新。当有新版本发布时，Tampermonkey 会自动检测并提示更新。

## 🙏 致谢

- [Tampermonkey](https://www.tampermonkey.net/) - 优秀的用户脚本管理器
- [Vite Plugin Monkey](https://github.com/lisonge/vite-plugin-monkey) - 用户脚本开发工具
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架
- [Lucide React](https://lucide.dev/) - 美观的图标库

## 📞 联系方式

- 作者：mudssky
- 项目主页：[GitHub](https://github.com/mudssky/github-enhance)
- 问题反馈：[Issues](https://github.com/mudssky/github-enhance/issues)

---

如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！
