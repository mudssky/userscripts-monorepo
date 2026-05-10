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
git subtree pull --prefix=userscripts/highlight-keywords https://github.com/mudssky/highlight-keywords.git main
```

如需把 monorepo 内的修改推回上游：

```bash
git subtree push --prefix=userscripts/highlight-keywords https://github.com/mudssky/highlight-keywords.git main
```

依赖锁定统一使用仓库根目录的 `pnpm-lock.yaml`，子项目目录不保留独立 lockfile。
