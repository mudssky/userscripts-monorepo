# Research: Current Release/Publishing Setup

- **Query**: Research the current release/publishing setup across all userscript packages
- **Scope**: Internal
- **Date**: 2026-05-11

## Findings

### Overview

The monorepo contains 3 userscript packages and 1 shared utility package:

| Package | Location | Has semantic-release | Has GitHub Actions workflow |
|---|---|---|---|
| highlight-keywords | `userscripts/highlight-keywords/` | YES | YES (in subtree) |
| github-enhance | `userscripts/github-enhance/` | YES | YES (in subtree) |
| dms-helper | `userscripts/dms-helper/` | NO | NO |
| @mudssky/userscript-utils | `packages/userscript-utils/` | NO | NO (library, not published externally) |

---

### 1. Semantic-Release Configuration

Two packages have full semantic-release setups: **highlight-keywords** and **github-enhance**.

#### highlight-keywords (`userscripts/highlight-keywords/.releaserc.cjs`)

- Branch: `main`
- Plugin pipeline:
  1. `@semantic-release/commit-analyzer` -- conventional commit analysis
  2. `@semantic-release/release-notes-generator` -- changelog generation
  3. `@semantic-release/npm` with `npmPublish: false` -- updates version in package.json only, does NOT publish to npm
  4. `@semantic-release/exec` -- runs `pnpm build` on prepare, echoes on publish
  5. `@semantic-release/github` -- creates GitHub Release, uploads `dist/highlight-keywords.user.js` as asset
  6. `@semantic-release/changelog` -- updates `CHANGELOG.md`
  7. `@semantic-release/git` -- commits `package.json` + `CHANGELOG.md` with `[skip ci]` message

- `package.json` script: `"semantic-release": "semantic-release"`
- All semantic-release plugins are devDependencies (v25.0.3)

#### github-enhance (`userscripts/github-enhance/.releaserc.cjs`)

- Identical structure to highlight-keywords
- Asset uploaded: `dist/github-enhance.user.js`
- Also has `husky` + `lint-staged` configured (has `prepare` script)
- All semantic-release plugins are devDependencies (v25.0.3)

#### dms-helper

- **No semantic-release** configured
- No semantic-release related devDependencies
- Scripts only: `dev`, `build`, `preview`

---

### 2. vite-plugin-monkey URL Patterns

All three userscripts use `vite-plugin-monkey` (v8.x) with consistent URL patterns.

| Package | updateURL pattern | downloadURL pattern |
|---|---|---|
| highlight-keywords | `https://github.com/mudssky/highlight-keywords/releases/latest/download/highlight-keywords.user.js` | Same as updateURL |
| github-enhance | `${packageJson.homepage}/releases/latest/download/github-enhance.user.js` | Same as updateURL |
| dms-helper | `${packageJson.homepage}/releases/latest/download/dms-helper.user.js` | Same as updateURL |

Key observations:
- All use GitHub Releases as the download/update host
- Pattern: `https://github.com/mudssky/<repo>/releases/latest/download/<name>.user.js`
- `updateURL` and `downloadURL` are set to the **same value** (the built `.user.js` file)
- github-enhance and dms-helper use `packageJson.homepage` dynamically; highlight-keywords hardcodes the URL
- highlight-keywords has additional CDN externalization for `vue` and `element-plus`
- github-enhance has CDN externalization config commented out
- dms-helper has no CDN externalization

---

### 3. GitHub Actions Workflows

**There is NO monorepo-level `.github/workflows/` directory.**

Both highlight-keywords and github-enhance have their own `.github/workflows/release.yml` **inside their subtree directories**. These are remnants from the pre-monorepo era when each was an independent repo.

#### highlight-keywords (`.github/workflows/release.yml`)
```yaml
name: release-userscript
on:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  release-userscript:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write
    steps:
      - checkout (fetch-depth: 0, persist-credentials: false)
      - setup node (lts/*)
      - setup pnpm
      - pnpm i
      - pnpm semantic-release (with GITHUB_TOKEN)
```

#### github-enhance (`.github/workflows/release.yml`)
- Identical to highlight-keywords
- Has an additional commented-out note: "临时改为手动触发" (temporarily changed to manual trigger)

#### dms-helper
- **No workflow file at all**

---

### 4. Publish-Related Scripts in package.json

| Package | Relevant scripts |
|---|---|
| highlight-keywords | `semantic-release` |
| github-enhance | `semantic-release`, plus `test`, `test:run`, `test:ui`, `format`, `lint`, `biome:check`, `prepare` (husky) |
| dms-helper | `dev`, `build`, `preview` only |
| Root monorepo | `build` (all userscripts), `subtree`/`subtree:pull`/`subtree:push`/`subtree:list`/`subtree:status` |

---

### 5. Subtree Configuration

`scripts/subtrees.json` registers two subtrees:
```json
[
  { "name": "highlight-keywords", "prefix": "userscripts/highlight-keywords", "repository": "https://github.com/mudssky/highlight-keywords.git", "ref": "main" },
  { "name": "github-enhance", "prefix": "userscripts/github-enhance", "repository": "https://github.com/mudssky/github-enhance.git", "ref": "main" }
]
```

dms-helper is **NOT** registered as a subtree -- it was migrated directly (commit message: "迁移 DMS 表格复制工具到 monorepo").

The monorepo's own remote is: `https://github.com/mudssky/userscripts-monorepo.git`

---

### 6. What Exists vs What's Missing

#### What Exists
- Full semantic-release + GitHub Actions for highlight-keywords and github-enhance (inherited from pre-monorepo independent repos)
- Working `updateURL`/`downloadURL` patterns pointing to GitHub Releases in all 3 packages
- Subtree CLI tooling for syncing changes back to individual repos

#### What's Missing / Gaps
- **No monorepo-level CI/CD**: There is no `.github/workflows/` at the monorepo root. The existing workflow files live inside subtree directories and were designed for single-repo use.
- **dms-helper has no release pipeline**: No semantic-release config, no workflow file, no publish-related scripts.
- **Subtree workflows may not work in monorepo context**: The existing `release.yml` files run `pnpm i` at the subtree directory level, which may not correctly resolve workspace dependencies (`workspace:*` protocol).
- **No unified release strategy**: The monorepo root has no script for releasing any or all packages. The subtree push workflow is a sync mechanism, not a release mechanism.
- **dms-helper updateURL points to a repo without releases**: Its `homepage` is `https://github.com/mudssky/dms-helper` but that repo may not have releases set up (it was migrated directly to the monorepo).

---

## Caveats / Not Found

- No `.github/` directory exists at the monorepo root level
- No `release.config.*` files found (all configs use `.releaserc.cjs`)
- The `subtrees.json` file lives under `scripts/` not at the root as the config.ts suggests (`resolve(__dirname, '..', 'subtrees.json')`) -- this resolves to `scripts/subtrees.json` which does exist
- highlight-keywords hardcodes its GitHub URLs while the other two use `packageJson.homepage` -- inconsistency but functionally equivalent given the `homepage` field values
