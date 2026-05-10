# userscripts-monorepo

用于集中维护 userscript 项目的 pnpm monorepo。

## Workspace

当前 workspace 包目录：

```text
userscripts/
  highlight-keywords/
```

## Commands

```bash
pnpm install
pnpm build
pnpm dev:highlight-keywords
pnpm build:highlight-keywords
pnpm preview:highlight-keywords
pnpm subtree:pull
pnpm subtree:pull:highlight-keywords
pnpm subtree:push:highlight-keywords
pnpm typecheck:scripts
```

也可以直接使用 pnpm filter：

```bash
pnpm --filter highlight-keywords run build
pnpm --filter ./userscripts/highlight-keywords run dev
```

## Subtree Maintenance

`highlight-keywords` 通过 git subtree 完整历史导入到 `userscripts/highlight-keywords`，未使用 `--squash`。

后续从上游同步：

```bash
pnpm subtree:pull
pnpm subtree:pull:highlight-keywords
```

`pnpm subtree:pull` 会按 `scripts/subtree-pull.ts` 里的仓库配置顺序同步全部 subtree 仓库；也可以在命令后追加仓库名，只同步指定仓库：

```bash
pnpm subtree:pull -- highlight-keywords
pnpm subtree:pull -- --dry-run
```

如需把 monorepo 内的修改推回上游：

```bash
pnpm subtree:push:highlight-keywords
```

这些命令只是封装 `git subtree pull/push`。subtree 不会自动拉取上游仓库；每次要同步时都需要显式运行 pull 脚本，并检查产生的合并结果。

依赖锁定统一使用仓库根目录的 `pnpm-lock.yaml`，子项目目录不保留独立 lockfile。
