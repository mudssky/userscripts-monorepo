# Research: Greasyfork 发布/更新自动化

- **Query**: How to programmatically publish/update userscripts to Greasyfork
- **Scope**: mixed (external API analysis + internal project context)
- **Date**: 2026-05-11

## Findings

### 1. Greasyfork API 概况

Greasyfork 的 API 是**只读的 (read-only)**，**没有提供发布或更新脚本的写入 API**。

**只读 API 端点示例**:
- 用户信息: `https://greasyfork.org/en/users/{id}-{name}.json`
- 脚本信息: `https://greasyfork.org/scripts/{id}.json`
- 脚本列表: `https://greasyfork.org/scripts.json` (最多 50 条，支持分页)
- 按站点统计: `https://greasyfork.org/en/scripts/by-site.json`

已验证本项目 highlight-keywords 的 API 数据:
```
GET https://greasyfork.org/zh-CN/scripts/461411-highlight-keywords.json
```
返回字段: id, name, description, version, license, namespace, total_installs, code_url, code_updated_at, users, url 等。

### 2. Greasyfork 支持的自动化更新方式

虽然没有写入 API，Greasyfork 提供了以下三种机制来自动更新脚本:

#### 方式 A: Webhook 自动同步 (推荐)

Greasyfork 支持 GitHub / GitLab / Bitbucket 的 webhook 通知，当代码仓库有变更时自动更新 Greasyfork 上的脚本。

**支持的 webhook 事件**:
- `push` 事件 - 监控 commit 中 modified 的文件
- `release` 事件 - 监控发布的 release assets 或分支文件

**GitHub Webhook 配置步骤**:
1. 在 Greasyfork 的 "User > Webhook Info" 页面生成 webhook secret
2. 在 GitHub 仓库 Settings > Webhooks > Add webhook 配置:
   - Payload URL: `https://greasyfork.org/users/{userId}/webhook`
   - Content type: `application/json`
   - Secret: 上一步生成的 secret
   - Events: "Just the push event" 或 "Releases" (二选一)
3. 在 Greasyfork 脚本编辑页面的 "Code Syncing" 区域设置 sync URL

**Sync URL 格式** (Greasyfork 能识别的 raw 文件 URL):
```
https://raw.githubusercontent.com/{user}/{repo}/{branch}/path/to/script.user.js
https://raw.githubusercontent.com/{user}/{repo}/refs/heads/{branch}/path/to/script.user.js
https://github.com/{user}/{repo}/raw/{branch}/path/to/script.user.js
https://github.com/{user}/{repo}/raw/refs/heads/{branch}/path/to/script.user.js
https://github.com/{user}/{repo}/releases/latest/download/script.user.js  (仅 release 事件)
```

**Sync 类型** (从源码分析):
- `automatic` - 每 12 小时自动检查一次 (由 `ScriptSyncQueueingJob` 定时任务驱动)
- `manual` - 手动触发同步
- `webhook` - 通过 webhook 事件触发同步 (sync_type 在首次 webhook 触发时自动设为此值)

**Webhook 工作流程** (从 `app/controllers/concerns/webhooks.rb` 源码分析):
1. GitHub 发送 push/release 事件到 Greasyfork webhook endpoint
2. Greasyfork 验证 HMAC-SHA1 签名
3. 从 webhook payload 中提取 modified files
4. 将文件路径与已注册的 `sync_identifier` URL 匹配
5. 从 GitHub raw URL 下载最新代码
6. 解析 userscript metadata block
7. 如果代码有变化，创建新的 script_version 并保存

#### 方式 B: Prefilled Update URL (半自动)

Greasyfork 提供了一个预填充更新表单的 URL。这不是完全自动化的，但可以减少手动操作。

**端点**:
- 新脚本: `POST /script_versions/prefill`
- 更新现有脚本: `POST /scripts/{scriptId}/script_versions/prefill`

**参数**:
- `script_version[code]` - 脚本代码
- Content-Type: `multipart/form-data`
- 必须包含用户的 session cookie (需要登录状态)

**局限**: 需要用户手动在浏览器中提交，不能完全通过 API 自动化。

#### 方式 C: 定时自动同步

脚本设置 `sync_type = 'automatic'` 后，Greasyfork 后台每 12 小时会自动检查 sync_identifier URL 的代码是否有更新。如果代码变了就自动更新。

### 3. Greasyfork 要求的 Metadata

从 Greasyfork 源码 `app/views/help/meta_keys.html.erb` 分析，Greasyfork 识别以下 metadata keys:

| Metadata Key | 说明 |
|---|---|
| `@name` | 脚本名称 (必填) |
| `@name:XX-YY` | 本地化名称 |
| `@description` | 脚本描述 (必填) |
| `@description:XX-YY` | 本地化描述 |
| `@namespace` | 命名空间 (Greasyfork 用此区分不同脚本) |
| `@version` | 版本号 (必填，遵循 browser extension version format) |
| `@include` / `@exclude` / `@match` | URL 匹配规则 |
| `@require` | 外部依赖脚本 |
| `@resource` | 外部资源 |
| `@updateURL` / `@installURL` / `@downloadURL` | 更新/下载 URL |
| `@license` | 许可证 (推荐使用 SPDX 格式) |
| `@supportURL` | 支持页面 URL |
| `@contributionURL` | 赞助链接 |
| `@contributionAmount` | 建议赞助金额 |
| `@compatible` | 兼容浏览器 |
| `@incompatible` | 不兼容浏览器 |
| `@antifeature` | 反特性声明 |
| `@antifeature:XX-YY` | 本地化反特性声明 |

**与标准 Tampermonkey metadata 的对比**:
- Greasyfork **不识别**: `@homepage`, `@homepageURL`, `@icon`, `@run-at`, `@grant`
- Greasyfork **额外支持**: `@contributionURL`, `@contributionAmount`, `@compatible`, `@incompatible`, `@antifeature`, `@name:XX-YY`, `@description:XX-YY`
- 两者共享: `@name`, `@description`, `@namespace`, `@version`, `@match`, `@include`, `@exclude`, `@require`, `@resource`, `@license`, `@supportURL`, `@updateURL`, `@downloadURL`

### 4. 本项目现状分析

#### 现有发布流程

每个 userscript 子项目都有独立的 `.github/workflows/release.yml`，使用 `semantic-release` 进行版本发布:

| 脚本 | GitHub Release URL | Greasyfork URL | 构建工具 |
|---|---|---|---|
| highlight-keywords | github.com/mudssky/highlight-keywords | greasyfork.org/scripts/461411 | vite-plugin-monkey + Vue 3 |
| github-enhance | github.com/mudssky/github-enhance | (未确认) | vite-plugin-monkey + Preact |
| dms-helper | github.com/mudssky/dms-helper | (未确认) | vite-plugin-monkey + TypeScript |

**现有 release workflow** (以 highlight-keywords 为例):
1. push 到 main 分支
2. GitHub Actions 触发 semantic-release
3. semantic-release 创建 GitHub Release
4. 构建产物 (`dist/*.user.js`) 附带在 release assets 中
5. **没有**自动同步到 Greasyfork 的步骤

**现有 vite-plugin-monkey 配置**:
- `updateURL` 和 `downloadURL` 都指向 GitHub Releases
- 这意味着 Tampermonkey 用户会从 GitHub Releases 更新，而不是 Greasyfork
- 如果要让 Greasyfork 同步，需要将 sync_identifier 指向 GitHub Release 的 raw URL

#### Monorepo 架构下的挑战

本项目是一个 **pnpm workspace monorepo**:
- 根目录: `userscripts-monorepo`
- 子项目: `userscripts/highlight-keywords`, `userscripts/github-enhance`, `userscripts/dms-helper`
- 共享包: `packages/userscript-utils`

**关键问题**: Greasyfork webhook 是基于 **文件路径匹配** 的。在 monorepo 中:
1. Greasyfork webhook 收到 push 事件时，会从 commit 中提取 modified files
2. 用 modified files 的路径去匹配脚本的 `sync_identifier`
3. **每个脚本目前指向各自独立的 GitHub 仓库**，而不是 monorepo 中的路径

### 5. 推荐的自动化方案

#### 方案 A: GitHub Webhook + Release Event (推荐)

在 monorepo 中使用 GitHub release event 触发 Greasyfork 同步:

1. **将 Greasyfork 脚本的 sync_identifier 改为 monorepo 的 release asset URL**:
   ```
   https://github.com/mudssky/userscripts-monorepo/releases/latest/download/{script-name}.user.js
   ```

2. **在 monorepo GitHub 仓库配置 Greasyfork webhook**:
   - 选择 "Releases" 事件
   - Greasyfork 会在收到 release 事件时，检查 release assets 中是否有匹配的脚本文件

3. **CI/CD 流程**:
   - 构建 all scripts
   - 创建 GitHub Release (可继续使用 semantic-release)
   - 将所有 `dist/*.user.js` 作为 release assets 上传
   - Greasyfork webhook 自动触发同步

**注意**: 从源码看，release event 的 URL 匹配逻辑 (`Github.info_from_release_event`) 是通过查询数据库中 `sync_identifier LIKE '%releases/latest/download/%'` 来匹配的，所以 sync_identifier 需要使用 `releases/latest/download/` 格式。

#### 方案 B: GitHub Webhook + Push Event

在 monorepo 中使用 push event:
1. 将 sync_identifier 改为 monorepo 分支的 raw URL:
   ```
   https://raw.githubusercontent.com/mudssky/userscripts-monorepo/main/userscripts/{script-name}/dist/{script-name}.user.js
   ```
2. **问题**: 需要将构建产物提交到 git 仓库 (不推荐)

#### 方案 C: 自动同步 (定时检查)

将 sync_type 设为 `automatic`，Greasyfork 每 12 小时自动检查一次:
- 最简单但延迟最大
- 同样需要 sync_identifier 指向可公开访问的 raw URL

### 6. External References

- [Greasyfork API Wiki](https://raw.githubusercontent.com/wiki/greasyfork-org/greasyfork/API.md) - 只读 API 文档
- [Greasyfork 源码](https://github.com/greasyfork-org/greasyfork) - Ruby on Rails 应用
- [Greasyfork Webhook 源码](https://github.com/greasyfork-org/greasyfork/blob/main/app/controllers/concerns/webhooks.rb) - Webhook 处理逻辑
- [Greasyfork Script Syncer 源码](https://github.com/greasyfork-org/greasyfork/blob/main/lib/script_importer/script_syncer.rb) - 同步逻辑
- [Greasyfork GitHub 模块源码](https://github.com/greasyfork-org/greasyfork/blob/main/lib/github.rb) - GitHub URL 匹配逻辑
- [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey) - 本项目使用的 userscript 构建插件

### 7. Related Specs

- `.trellis/spec/frontend/directory-structure.md` - 项目目录结构
- `.trellis/spec/frontend/component-guidelines.md` - 组件开发规范

## Caveats / Not Found

1. **Greasyfork 没有写入 API** - 这是最重要的限制。所有自动化方案都依赖于 Greasyfork 主动拉取代码，而不是推送。
2. **Monorepo 适配** - 现有每个脚本有独立的 GitHub 仓库和 GitHub Actions。迁移到 monorepo 发布需要:
   - 修改各脚本的 sync_identifier
   - 确保 release assets 包含所有构建产物
   - 调整 semantic-release 配置以支持 monorepo 多包发布
3. **私有仓库** - Greasyfork 同步要求脚本代码是公开可访问的。如果 monorepo 是私有的，需要使用 release assets (这些是公开的)。
4. **webhook 只匹配 modified files** - 如果 push 没有修改对应的文件路径，不会触发同步。
5. **版本号处理** - Greasyfork 从 userscript metadata block 的 `@version` 读取版本号。vite-plugin-monkey 从 package.json 读取，需确保版本一致。
6. **Greasyfork API 返回中文域名** - API 实际使用 `greasyfork.org` (不带子域名前缀)，但访问页面可用 `/zh-CN/` 路径。
7. **未找到现成的 GitHub Action** - 没有发现广泛使用的 "publish to greasyfork" GitHub Action。主要原因就是 Greasyfork 没有写入 API，自动化只能通过 webhook 被动触发。
