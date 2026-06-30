# Directory Structure

> 本项目的前端与 userscript 目录组织规范。

---

## Overview

本仓库是集中维护 userscript 项目的 pnpm monorepo。多脚本采用“独立脚本目录”模式：每个脚本都位于 `userscripts/<script-name>/` 下，保持业务边界独立；是否配置成独立 workspace 包取决于脚本复杂度、依赖和构建方式。

根目录负责工作区编排、批量命令、轻量脚本的集中构建、subtree 同步和跨脚本工具配置。技术栈不强制统一：复杂 UI 脚本可以使用 Vite + Vue 或 Vite + React；简单脚本可以考虑根级 Rolldown 等轻量构建，但前提是项目已经补齐 userscript metadata 生成能力。

当前已有脚本示例：

- `userscripts/highlight-keywords/`：独立 Vue + Vite + `vite-plugin-monkey` userscript 项目。

---

## Directory Layout

```text
userscripts-monorepo/
├── package.json                 # 根级批量命令与 monorepo 工具依赖
├── pnpm-workspace.yaml          # workspace 范围：userscripts/*
├── scripts/
│   └── subtree-pull.ts          # 批量同步 git subtree 仓库
└── userscripts/
    └── highlight-keywords/
        ├── package.json         # 复杂脚本或 subtree 脚本可拥有独立依赖、构建、发布脚本
        ├── vite.config.ts       # 复杂 UI 脚本可拥有自己的 Vite 与 monkey 元数据
        ├── src/
        │   ├── main.ts          # Vue 应用挂载与 Shadow DOM 容器初始化
        │   ├── App.vue          # 应用根组件
        │   ├── style.css        # 脚本级全局样式入口
        │   ├── views/
        │   │   └── app/
        │   │       ├── index.vue
        │   │       ├── hook.ts
        │   │       ├── config.ts
        │   │       ├── types.ts
        │   │       └── components/
        │   ├── util/            # 现有业务工具函数目录
        │   ├── utils/           # 现有基础设施工具函数目录
        │   └── assets/
        └── README.md
```

---

## Multi-Script Organization

- 新增脚本时，在 `userscripts/<script-name>/` 下创建独立目录，不把多个脚本的业务代码混在同一个源码目录里。
- 复杂脚本如果需要独立依赖、开发服务器、框架插件、发布配置或 subtree 同步，应配置成独立 workspace 包，并维护自己的 `package.json`、构建配置、README 和 userscript metadata。
- UI 框架按脚本需求选择，不强制 Vue；需要 React 生态时可以使用 Vite + React，需要 Vue 生态时可以使用 Vite + Vue。
- 默认优先使用 `vite-plugin-monkey` 处理 userscript metadata、grant、match、updateURL、downloadURL 等油猴脚本配置，避免重复开发脚本头部生成逻辑。
- 维护或迁移 userscript 发布入口时，`package.json.homepage`、`namespace`、`homepage`、`supportURL`、`updateURL`、`downloadURL`、README 安装链接和徽章必须一起全局搜索并同步。Tampermonkey 更新检查依赖 `@updateURL` 与递增的 `@version`，`@downloadURL` 用于检测到更新后下载完整脚本；当前仓库默认二者都指向 `https://github.com/mudssky/userscripts-monorepo/releases/latest/download/<script>.user.js`。
- 简单脚本如果没有复杂 UI、独立依赖或独立发布流程，可以考虑由根目录的 Rolldown 等集中构建配置负责打包；但只有在根级构建已经提供等价的 userscript metadata 生成能力后才能这么做。
- 根目录的 `package.json` 登记通用批量命令、根级轻量构建命令，以及常用的单脚本别名，例如 `dev:<script-name>`、`build:<script-name>`。
- 根级批量构建继续使用 pnpm filter，例如 `pnpm --filter ./userscripts/* run build`。
- 不允许一个脚本直接 import 另一个脚本的 `src/` 代码，例如不要写 `../other-script/src/...`。
- 只有当两个及以上脚本真实复用同一类逻辑时，才抽到独立共享包；共享包应放在 `packages/<package-name>/`，再由各脚本通过依赖引用。
- 通过 git subtree 导入的脚本尽量保持上游项目结构；根目录只维护 subtree 同步配置与封装命令。

---

## Build Strategy

- **默认成熟路径**：优先使用 Vite + `vite-plugin-monkey`。当前 `highlight-keywords` 已通过 `monkey({ userscript: ... })` 管理 `match`、`grant`、`run-at`、`updateURL`、`downloadURL` 等 userscript metadata。
- **复杂 UI 脚本**：需要组件化 UI、开发服务器、Shadow DOM 样式隔离、框架插件或复杂资源处理时，使用脚本内独立构建配置；可按需求选择 Vite + Vue 或 Vite + React。
- **轻量脚本**：纯 TypeScript、少量 DOM 操作、无复杂面板或框架依赖时，可以考虑根级 Rolldown 集中构建，减少重复 Vite 配置。
- **Rolldown 前置条件**：如果使用 Rolldown，需要先在根目录实现或引入类似 `vite-plugin-monkey` 的 userscript metadata 配置与头部生成能力，否则不要用 Rolldown 替代 Vite + `vite-plugin-monkey`。
- **Rolldown 延后决策**：暂不提前设计根级 metadata 配置格式；等第一个轻量脚本确实需要根级 Rolldown 构建时，再同步设计配置接口、头部生成逻辑和命令约定。
- **subtree 脚本**：从独立仓库导入的脚本，以保持上游结构和发布方式为优先；monorepo 根目录只提供同步和批量命令。
- 当前仓库尚未落地根级 Rolldown 配置；真正新增轻量脚本时，需要同步补充根级构建配置、metadata 生成能力和对应命令。

---

## Module Organization

- `src/main.ts` 负责应用启动、Shadow DOM 容器创建、全局插件注册和挂载，不承载具体业务流程。
- `src/App.vue` 作为根组件，当前项目中主要负责承载 `views/app/index.vue` 这类视图入口。
- `src/views/<feature>/` 存放某个完整功能视图的组件、hook、配置和类型；当前示例是 `src/views/app/`。
- `src/views/<feature>/components/` 存放只服务于该功能视图的局部组件。
- `src/views/<feature>/hook.ts` 用于收拢该视图的主要状态与交互逻辑，导出 `useXxx()` 形式的组合式函数。
- `src/views/<feature>/config.ts` 存放该视图的常量、默认配置、样式预设和轻量校验逻辑。
- `src/views/<feature>/types.ts` 存放该视图共享的 TypeScript 类型。
- `src/assets/` 存放静态资源、截图和图标等资源文件。

---

## Naming Conventions

- userscript 包名、目录名、根级命令后缀使用 kebab-case，并保持一致，例如 `highlight-keywords`、`dev:highlight-keywords`。
- Vue 单文件组件使用 PascalCase，例如 `ConfigDialog.vue`、`NavigationPanel.vue`、`TriggerButtons.vue`。
- 视图目录使用小写语义名；当前单视图脚本使用 `views/app/`。
- 组合式函数使用 `useXxx` 命名，例如 `useHighlightApp()`。
- subtree 配置里的 `name` 与 `prefix` 必须对应实际脚本目录，避免同步命令指向错误路径。

---

## Examples

- `userscripts/highlight-keywords/src/main.ts`：展示 userscript 如何创建 Shadow DOM 容器并挂载 Vue 应用。
- `userscripts/highlight-keywords/src/views/app/index.vue`：展示视图入口如何组合局部组件与 `useHighlightApp()`。
- `userscripts/highlight-keywords/src/views/app/hook.ts`：展示复杂页面交互逻辑如何集中到组合式函数中。
- `scripts/subtree-pull.ts`：展示根目录如何集中登记与同步多个 subtree userscript 仓库。
