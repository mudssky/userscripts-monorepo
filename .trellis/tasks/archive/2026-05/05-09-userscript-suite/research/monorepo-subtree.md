# pnpm monorepo + highlight-keywords subtree research

## 资料来源

* Context7 `/pnpm/pnpm`：pnpm workspace 通过仓库根目录 `pnpm-workspace.yaml` 声明包目录，常用 `pnpm -r run <script>` 或 `pnpm --filter <package|path> run <script>` 调用子包脚本。
* GitHub 远端：`https://github.com/mudssky/highlight-keywords`
* `highlight-keywords` 远端 `package.json`、`README.md`、`vite.config.ts`、`biome.json`、`.gitignore`

## highlight-keywords 现状

* 单包项目，包名为 `highlight-keywords`，`private: true`，版本 `3.2.3`。
* 使用 `pnpm@10.13.1`，当前仓库根项目使用 `pnpm@10.33.0`。
* 技术栈是 Vue 3、TypeScript、Tailwind CSS 4、Element Plus、Vite 7、`vite-plugin-monkey`。
* 现有脚本：
  * `dev`: `cross-env DEBUG_MODE=true vite`
  * `build`: `vue-tsc --noEmit && vite build`
  * `preview`: `vite preview`
  * `semantic-release`: `semantic-release`
* 远端根目录包含项目级配置：`biome.json`、`.releaserc.cjs`、`vite.config.ts`、`tsconfig*.json`、`pnpm-lock.yaml`、`.github/` 等。
* README 中提到 `lint`、`format` 命令，但当前 `package.json` 未声明这两个脚本，导入后不应假设它们可用。

## pnpm workspace 约定

* 根目录新增 `pnpm-workspace.yaml`，例如：

```yaml
packages:
  - 'packages/*'
```

* 根脚本可以用递归方式聚合：

```json
{
  "scripts": {
    "build": "pnpm -r run build"
  }
}
```

* 针对单个包可以使用过滤器：

```bash
pnpm --filter highlight-keywords run build
pnpm --filter ./userscripts/highlight-keywords run dev
```

## subtree 导入方式

候选导入命令：

```bash
git subtree add --prefix=userscripts/highlight-keywords https://github.com/mudssky/highlight-keywords.git main
```

后续同步候选命令：

```bash
git subtree pull --prefix=userscripts/highlight-keywords https://github.com/mudssky/highlight-keywords.git main
```

说明：

* subtree 会把外部仓库内容放入指定子目录，适合 monorepo 中保留上游项目历史和后续同步。
* 若使用 `--squash`，主仓库历史更短但不能逐提交追溯上游细节；若不使用 `--squash`，历史完整但会导入更多提交。
* 用户明确提到“要加入 subtree”，因此 MVP 应优先保留 subtree 导入记录，而不是只复制文件。

## 可行方案

### 方案 A：`packages/highlight-keywords`，最小 monorepo 包装（推荐）

做法：

* 根目录新增 `pnpm-workspace.yaml`，使用 `packages/*`。
* 通过 subtree 将远端导入 `packages/highlight-keywords`。
* 根 `package.json` 设为 `private: true`，增加 `build` / `dev:highlight-keywords` 等过滤脚本。
* 暂不重写子项目内部配置，只处理 monorepo 必需的包管理与文档。

优点：

* 最贴近 pnpm 常见布局。
* 导入风险最低，后续可继续 `git subtree pull`。
* 对 `highlight-keywords` 现有构建影响小。

缺点：

* userscript 语义不如 `userscripts/*` 直观。

### 方案 B：`userscripts/highlight-keywords`，领域语义优先

做法：

* 根目录新增 `pnpm-workspace.yaml`，使用 `userscripts/*`。
* subtree 导入到 `userscripts/highlight-keywords`。
* 根脚本按 userscript 子项目命名。

优点：

* 目录语义清晰，未来继续迁入油猴脚本时更直观。
* 与仓库名 `userscripts-monorepo` 更贴合。

缺点：

* 相比 `packages/*`，部分通用 monorepo 工具默认示例不完全一致，但 pnpm 本身完全支持。

### 方案 C：先建立根工具链，再导入并整理子项目配置

做法：

* 在方案 A 或 B 的基础上，统一根 Biome/TypeScript/Release 配置。
* 导入后立即调整 `highlight-keywords` 的脚本、lockfile、release 配置。

优点：

* 一步到位，长期维护更统一。

缺点：

* 首次导入风险高，容易把“迁仓”和“重构工具链”混在一起。
* 需要更多验证，可能影响现有 semantic-release 和构建产物路径。

## 推荐

推荐方案 A 或 B 中的“最小 monorepo 包装”，先完成可追溯的 subtree 导入和 pnpm workspace 骨架，再把工具链统一作为后续任务处理。
