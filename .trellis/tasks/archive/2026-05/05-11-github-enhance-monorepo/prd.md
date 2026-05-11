# PRD: 添加 github-enhance 到 monorepo

## 目标

将 [mudssky/github-enhance](https://github.com/mudssky/github-enhance) 以 git subtree 方式导入 monorepo，放置于 `userscripts/github-enhance/`。

## 背景

- github-enhance 是一个 Tampermonkey 用户脚本，为 GitHub 仓库页面添加"快速访问"下拉菜单（Zread、Deepwiki、GitHub1s、Sourcegraph）
- 技术栈：Preact + Radix UI + Tailwind CSS 4 + Vite 8 + vite-plugin-monkey 8
- monorepo 已有 git subtree 导入模式（highlight-keywords），应复用此模式

## 实施步骤

1. 注册 subtree：在 `scripts/subtree-pull.ts` 的 `repositories` 数组中添加 github-enhance 条目
2. 执行 `git subtree add` 将仓库导入 `userscripts/github-enhance/`
3. 验证 `pnpm install` 正常工作
4. 验证 `pnpm --filter github-enhance build` 可正常构建

## 不做的事

- 不修改 github-enhance 的内部代码或依赖
- 不调整其构建配置以适配 monorepo（保持独立可运行）
- 不添加 shared biome.json（项目自带 biome.json）

## 验收标准

- [ ] github-enhance 代码存在于 `userscripts/github-enhance/`
- [ ] `subtree-pull.ts` 包含 github-enhance 条目
- [ ] `pnpm install` 无报错
- [ ] `pnpm --filter github-enhance build` 构建成功
