# Userscript suite pnpm monorepo

## Goal

将当前仓库建设为 pnpm monorepo，用来承载多个 userscript 项目；首个要纳入的项目是 `https://github.com/mudssky/highlight-keywords`，预期通过 git subtree 保留其历史并成为 monorepo 中的一个工作区包。

## What I already know

* 当前仓库是 `userscripts-monorepo`，目前只有根 `package.json`、`AGENTS.md` 和 Trellis 文件。
* 根 `package.json` 声明 `packageManager` 为 `pnpm@10.33.0`，尚未配置 `pnpm-workspace.yaml`。
* 用户指定的任务目录为 `.trellis/tasks/05-09-userscript-suite`，已创建。
* 需要加入 subtree 的远端仓库是 `https://github.com/mudssky/highlight-keywords`。
* `highlight-keywords` 远端存在 `main`、`dev` 分支以及 `v3.0.0` 到 `v3.2.3` 标签；`main` 当前指向 `v3.2.3`。
* `highlight-keywords` 是 pnpm 单包项目，使用 Vue 3、TypeScript、Tailwind CSS 4、Element Plus、Vite 7 和 `vite-plugin-monkey`。
* `highlight-keywords` 当前有 `dev`、`build`、`preview`、`semantic-release` 脚本；README 提到的 `lint`、`format` 未在当前 `package.json` 中声明。
* pnpm workspace 通过根目录 `pnpm-workspace.yaml` 声明 workspace 包目录，可使用 `pnpm -r run <script>` 或 `pnpm --filter <name|path> run <script>` 调用子项目。

## Assumptions (temporary)

* monorepo 会使用 `pnpm` workspace 管理包，不引入 npm/yarn workspace。
* `highlight-keywords` 会作为一个独立 workspace package 放在类似 `packages/highlight-keywords` 或 `userscripts/highlight-keywords` 的目录下。
* 需要尽量保留 `highlight-keywords` 原仓库历史，因此优先考虑 `git subtree add` 而不是简单复制文件。
* 当前阶段先完成仓库骨架和第一个子项目迁入；不会一次性重构 `highlight-keywords` 的全部构建系统，除非 monorepo 必须。

## Open Questions

* 无。

## Requirements (evolving)

* 创建 pnpm monorepo 基础配置。
* 将 `highlight-keywords` 作为第一个 userscript 子项目加入当前仓库，目标目录为 `userscripts/highlight-keywords`。
* 采用 git subtree 完整历史导入，不使用 `--squash`。
* 保持现有仓库 Trellis/AGENTS 约定不被破坏。
* 根 `package.json` 应标记为私有仓库，并提供能调用 `highlight-keywords` 基础脚本的入口。
* 本任务采用最小 monorepo 包装：创建 workspace、导入 subtree、补充根脚本/说明；暂不主动重构子项目工具链。
* 迁入后移除 `userscripts/highlight-keywords/pnpm-lock.yaml`，由仓库根目录生成统一的 `pnpm-lock.yaml`。

## Acceptance Criteria

* [x] 根目录存在有效的 pnpm workspace 配置。
* [x] `highlight-keywords` 被纳入 `userscripts/highlight-keywords`。
* [x] 能在当前仓库 git 历史中追溯 `highlight-keywords` 的上游提交记录。
* [x] 根脚本能至少发现/调用子项目的基础校验或构建脚本。
* [x] 根目录存在统一的 `pnpm-lock.yaml`，子项目目录不保留独立 lockfile。
* [x] 相关规划、导入方式、后续维护命令记录在 PRD 或仓库文档中。

## Definition of Done (team quality bar)

* Tests added/updated when business logic or shared utilities change.
* Lint / typecheck / CI green where project scripts exist.
* Docs/notes updated if repository workflow changes.
* Rollout/rollback considered for subtree import and monorepo restructuring.

## Out of Scope (explicit)

* 暂不默认重写 `highlight-keywords` 的业务逻辑。
* 暂不默认迁入除 `highlight-keywords` 之外的其他 userscript 仓库。
* 暂不默认发布新 npm 包或配置完整 CI，除非后续确认纳入 MVP。
* 暂不统一根级 Biome、TypeScript、semantic-release 等工具链配置。

## Technical Notes

* 本仓库当前处于干净工作区，分支为 `main`。
* `.trellis/spec/guides/index.md` 提供通用思考指南；当前项目尚未发现包级 spec。
* 研究记录：[`research/monorepo-subtree.md`](research/monorepo-subtree.md)。
* 可选布局：
  * `packages/highlight-keywords`：pnpm monorepo 常见布局，工具兼容心智负担低。
  * `userscripts/highlight-keywords`：更贴合 userscript 套件语义。已选择用于本任务。
* 建议先做最小 monorepo 包装，避免把 subtree 迁入和工具链重构混成同一次高风险改动。

## Research References

* [`research/monorepo-subtree.md`](research/monorepo-subtree.md) — pnpm workspace、`highlight-keywords` 远端结构、subtree 导入方案和推荐 MVP。

## Decision (ADR-lite)

**Context**: 当前仓库要从空的 userscript 集合仓库演进为 pnpm monorepo，第一个迁入项目是独立 userscript 仓库 `highlight-keywords`。

**Decision**: workspace 包目录采用 `userscripts/*`，`highlight-keywords` 导入到 `userscripts/highlight-keywords`；本任务只做最小 monorepo 包装，不在首次迁入中重构子项目工具链。

**Consequences**: 目录语义更贴合 userscript 套件，后续迁入其他脚本时路径一致；相较 `packages/*` 少一点通用 monorepo 默认示例优势，但 pnpm 完全支持该布局。工具链统一会留到后续任务，降低首次 subtree 导入风险。

## Decision (ADR-lite): subtree history

**Context**: `highlight-keywords` 是已有独立仓库，迁入 monorepo 后仍需要能追溯历史来源和后续同步。

**Decision**: 使用 `git subtree add --prefix=userscripts/highlight-keywords https://github.com/mudssky/highlight-keywords.git main` 完整历史导入，不加 `--squash`。

**Consequences**: 主仓库会引入更多历史提交，但可以在 monorepo 内直接追溯 `highlight-keywords` 的上游提交，后续排查迁移问题更清楚。

## Decision (ADR-lite): lockfile strategy

**Context**: `highlight-keywords` 原仓库包含独立 `pnpm-lock.yaml`，迁入 monorepo 后需要决定依赖锁定入口。

**Decision**: 迁入后移除子项目 `pnpm-lock.yaml`，使用根目录统一 `pnpm-lock.yaml`。

**Consequences**: 依赖解析集中到 monorepo 根目录，符合 pnpm workspace 的常见维护方式；子项目原 lockfile 仍可通过 subtree 导入历史追溯。

## Implementation Notes

* 已通过 `git subtree add --prefix=userscripts/highlight-keywords https://github.com/mudssky/highlight-keywords.git main` 完整历史导入。
* 已新增根 `pnpm-workspace.yaml`，workspace 范围为 `userscripts/*`。
* 已将根 `package.json` 标记为私有仓库，并新增 `build`、`build:highlight-keywords`、`dev:highlight-keywords`、`preview:highlight-keywords`。
* 已移除 `userscripts/highlight-keywords/pnpm-lock.yaml`，并将其锁定内容迁移为根 `pnpm-lock.yaml` 的 `userscripts/highlight-keywords` importer，避免迁仓时顺带升级依赖。
* 已新增根 `README.md`，记录 workspace 命令与 subtree pull/push 维护命令。

## Verification

* `pnpm -r list --depth -1`：识别根包与 `highlight-keywords` 两个 workspace project。
* `pnpm install --frozen-lockfile`：通过，确认根 lockfile 与 workspace 配置一致。
* `pnpm --filter highlight-keywords exec vue-tsc --noEmit`：通过。
* `pnpm build`：通过。
* `pnpm --filter highlight-keywords exec biome check .`：未通过；原因是上游子项目 `biome.json` 使用了当前 Biome 2.3.7 不认识的 `files.ignore` 与 `linter.ignore` 配置键，且子项目当前 `package.json` 没有声明 `lint` 脚本。按本任务最小迁仓边界，暂不重构子项目工具链配置。
