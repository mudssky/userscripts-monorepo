# 通用油猴脚本发布方案

## Goal

为 userscripts monorepo 建立统一的发布方案：changesets 管理版本 + monorepo CI/CD 发布到 GitHub Release + Greasyfork webhook 自动同步。

## Decision (ADR-lite)

1. **版本管理**：changesets 替换 semantic-release（monorepo 友好）
2. **Release 粒度**：每个包独立 release（Greasyfork URL 匹配清晰）
3. **Greasyfork**：GitHub Release Event webhook 触发自动同步，手动在 Greasyfork 后台配置
4. **清理范围**：semantic-release 配置归档到参考目录

## Requirements

### changesets 配置

- 根级安装 `@changesets/cli` + `@changesets/changelog-github`
- `.changeset/config.json` 配置（独立版本、changelog 格式）
- 每个包通过 `pnpm changeset` 记录变更

### CI/CD Pipeline

- **PR 检查**：lint + typecheck + build 验证
- **Version PR**：`changeset version` 生成版本号更新 + changelog
- **Release workflow**：
  1. 检测 version PR 合并（或手动触发）
  2. `pnpm build` 构建所有变更的包
  3. `changeset publish` 发布到 npm（可选）+ 创建 GitHub Release
  4. 上传 `.user.js` 产物到对应 Release
  5. 构建前验证产物存在且含正确 Tampermonkey 元数据

### Greasyfork 同步

- 每个 userscript 在 Greasyfork 后台配置 sync_identifier 指向 GitHub Release URL
- GitHub Release Event webhook 触发自动拉取

### 清理

- 现有 semantic-release 配置归档到 `scripts/archive/semantic-release/`
- 移除各包的 `.releaserc.cjs`、`semantic-release` 依赖和相关 workflow

## Acceptance Criteria

- [ ] `pnpm changeset` + 合并 version PR 后自动发布到 GitHub Release
- [ ] 每个 release 包含对应的 `.user.js` 构建产物
- [ ] Greasyfork 通过 webhook 自动同步最新版本
- [ ] 新建 userscript 包时只需 `pnpm changeset` 即可接入发布
- [ ] semantic-release 配置已归档
- [ ] monorepo PR 检查 workflow 配置完成

## Definition of Done

- changesets 配置完成
- monorepo CI/CD workflow 配置完成
- 三个包都能通过 changesets 发布
- semantic-release 遗留清理完成
- 发布流程文档完成

## Out of Scope

- 发布到 npm registry（userscript 包为 private）
- Chrome Web Store / Firefox Add-ons
- Greasyfork 脚本页面创建（需手动）

## Technical Notes

- **Greasyfork sync_identifier 格式**：`https://github.com/mudssky/userscripts-monorepo/releases/latest/download/{name}.user.js`
- **vite-plugin-monkey**：downloadURL/updateURL 需更新为 monorepo 的 release URL（当前指向各独立仓库）
- **changesets + pnpm workspace**：原生支持 `workspace:*` 依赖
- [`research/greasyfork-publishing.md`](research/greasyfork-publishing.md) — Greasyfork 发布机制
- [`research/current-release-setup.md`](research/current-release-setup.md) — 现有发布配置分析

## Implementation Plan

**Step 1: changesets 初始化**
- 安装 @changesets/cli + @changesets/changelog-github
- 创建 .changeset/config.json
- 更新 vite-plugin-monkey 的 downloadURL/updateURL 指向 monorepo

**Step 2: CI/CD workflow**
- 创建 .github/workflows/pr-check.yml（lint + typecheck + build）
- 创建 .github/workflows/release.yml（changeset publish + release assets）

**Step 3: 清理 semantic-release**
- 归档 .releaserc.cjs 到 scripts/archive/semantic-release/
- 移除 semantic-release 相关依赖和 scripts
- 移除旧的 .github/ workflow（子包级别的）

**Step 4: Greasyfork 配置**
- 文档说明 Greasyfork 后台配置步骤
- 更新每个脚本的 sync_identifier
