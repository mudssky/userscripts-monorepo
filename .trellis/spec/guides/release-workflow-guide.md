# Monorepo 发布流程

## 前置条件

- GitHub 仓库 **Settings → Actions → General → Workflow permissions**: Read and write + Allow GitHub Actions to create/approve pull requests
- 本地 typecheck 和 build 通过：`pnpm run typecheck && pnpm run build`

## 发布步骤

### 1. 创建 changeset

```bash
# 交互式（选择包 + 版本级别 + 描述）
pnpm changeset

# 或手动创建 .changeset/<name>.md
```

changeset 文件格式：

```markdown
---
"dms-helper": minor
---

简短描述本次变更
```

版本级别：`patch`（修复）/ `minor`（新功能）/ `major`（破坏性变更）

### 2. 提交并 push

```bash
git add .changeset/<name>.md
git commit -m "chore(changeset): <description>"
git push origin main
```

### 3. GitHub Actions 自动创建 Version Packages PR

- workflow: `.github/workflows/release.yml`
- PR 分支: `changeset-release/main`
- PR 内容：版本号提升、CHANGELOG 生成、删除 changeset 文件

### 4. 合并 Version PR

```bash
gh pr list --head changeset-release/main
gh pr merge <number> --merge
```

### 5. 合并后自动发布

workflow 再次触发，执行：
1. `turbo run build` — 构建所有 userscript 包
2. 为每个变更的包创建 GitHub Release + 上传 `.user.js`

> **注意**：本仓库所有包都是 `private: true`，不走 npm 发布。changesets 仅用于版本号管理，GitHub Release 由 workflow 自动创建。

## 关键配置

| 文件 | 用途 |
|------|------|
| `turbo.json` | build pipeline 定义 |
| `.changeset/config.json` | changesets 配置 |
| `.github/workflows/release.yml` | CI 发布流程 |

## 注意事项

- build 使用 `turbo run build`，不用 `pnpm --filter` glob（CI 环境展开异常）
- 每个 userscript 的 `vite.config.ts` 需配置 `downloadURL` / `updateURL` 指向 monorepo release
- 未修改的包不会出现在 changeset 中，不会被发版
- 已存在的 Release（tag 已创建）会被自动跳过，不会重复创建
