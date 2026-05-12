# Release — 发布流程

## 何时使用

用户要求发布新版本时触发。典型指令："发布"、"提交并发布"、"release"、"publish"。

---

## 发布流程概览

```
feature 分支开发 → 合并到 main → 创建 changeset → push → CI 创建 Version PR → 合并 PR → 自动构建+发布
```

---

## 详细步骤

### 1. 确认变更已提交

```bash
git status
git diff
```

如果有未提交的变更，先提交：

```bash
git add <files>
git commit -m "<type>(<scope>): <中文描述>"
```

### 2. 合并到 main（如当前在 feature 分支）

```bash
git checkout main
git merge <feature-branch>
```

### 3. 创建 changeset

```bash
pnpm changeset add --empty
```

这会创建 `.changeset/<随机名>.md`，编辑其内容：

```markdown
---
"<包名>": patch|minor|major
---

<中文变更描述>
```

**包名规则**：必须与 `package.json` 中的 `name` 一致（含 `@mudssky/` scope）。

| 版本类型 | 何时使用 |
|---------|---------|
| `patch` | Bug 修复、小调整 |
| `minor` | 新功能、向后兼容 |
| `major` | 破坏性变更 |

### 4. 提交 changeset 并 push

```bash
git add .changeset/*.md
git commit -m "chore(changeset): <包名> <版本类型> — <简要描述>"
git push
```

### 5. 等待 CI 创建 Version PR

push 到 main 后，GitHub Actions 自动触发：

1. **有 changeset 时**：自动创建/更新 Version PR（`chore: version packages`）
2. **无 changeset 时**（Version PR 合并后）：自动构建 + 创建 GitHub Release

```bash
# 查看 workflow 状态
gh run list --limit 3

# 等待完成
gh run watch <run-id> --exit-status
```

### 6. 检查并合并 Version PR

```bash
# 查看打开的 PR
gh pr list --state open

# 检查 PR 内容（确认版本号和 changelog）
gh pr view <pr-number>

# 合并
gh pr merge <pr-number> --merge
```

### 7. 等待自动发布

Version PR 合并后，CI 再次触发，自动：

1. 运行 `pnpm run build`
2. 为每个有变更的包创建 GitHub Release（tag: `@mudssky/<包名>@<版本>`）
3. 上传构建产物（`<包名>.user.js`）作为 Release asset

```bash
# 确认发布成功
gh release list --limit 5
```

---

## Greasyfork 发布链接

构建产物（`.user.js` 文件）作为 GitHub Release asset，下载链接格式：

```
https://github.com/mudssky/userscripts-monorepo/releases/latest/download/<包名>.user.js
```

`latest` 始终指向最新 release，无需手动更新。

---

## 常见问题

### changeset 包名不匹配

错误：`Found changeset xxx for package @mudssky/yyy which is not in the workspace`

原因：changeset 中的包名与 `package.json` 的 `name` 不一致。

修复：检查 `.changeset/<name>.md` 中的包名是否与对应 `package.json` 完全一致（含 scope）。

### Release asset 文件名

workflow 中用 `${pkg_name##*/}` 去除 scope 前缀，因为 vite 输出的文件名不含 scope：

- 包名：`@mudssky/dms-helper`
- 构建产物：`dms-helper.user.js`
- Release tag：`@mudssky/dms-helper@1.2.1`
- Asset 名：`dms-helper.user.js`

### 想跳过发布

如果某次 push 不想触发发布流程（如纯 CI 修复），可以不创建 changeset，workflow 检测到无待处理 changeset 且版本未变化时会跳过。
