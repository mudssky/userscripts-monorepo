# 升级 subtree 管理为完整 CLI

## Goal

将当前单功能 `scripts/subtree-pull.ts` 升级为基于 Commander.js + execa 的完整 subtree 管理 CLI，支持 add/pull/push/list/status 五个子命令。

## Requirements

- 使用 Commander.js 定义子命令
- 使用 execa 替代 spawnSync
- 5 个子命令：pull, list, add, push, status
- 保留现有 pull 功能和所有选项（--dry-run, --allow-dirty）
- add 命令：从 repo URL 自动推导 name/prefix，ref 默认 main，支持 --name/--prefix/--ref 覆盖
- 配置独立为 `scripts/subtrees.json`，add 成功后自动写入配置
- push 默认不 squash，提供 --squash 选项

## Acceptance Criteria

- [ ] `pnpm subtree pull [names...]` 等价于当前 `pnpm subtree:pull`
- [ ] `pnpm subtree add <repo-url>` 自动推导 name/prefix，可选 --name/--prefix/--ref 覆盖
- [ ] `pnpm subtree add` 成功后自动更新 `scripts/subtrees.json`
- [ ] `pnpm subtree push [names...]` 推送到上游，可选 --squash
- [ ] `pnpm subtree list` 列出所有已注册的 subtrees
- [ ] `pnpm subtree status [names...]` 显示与上游的同步状态
- [ ] 现有 npm scripts 迁移到新 CLI（subtree:pull, subtree:push 等）

## Definition of Done

- Lint / typecheck 通过
- 所有子命令有 --help 文档
- 现有工作流不受影响

## Out of Scope

- remove 子命令（手动 git subtree split + rm 即可）
- merge 子命令
- 交互式提示（add 通过参数推导，不做 prompts）
- CI 集成

## Technical Approach

**Decision (ADR-lite)**:
- 配置: 独立 `scripts/subtrees.json`，add 时自动写入
- CLI 框架: Commander.js
- 进程管理: execa
- 目录: `scripts/subtree-cli/`，入口 `index.ts`
- add URL 推导: 从 git URL 提取仓库名作为 name，`userscripts/<name>` 作为 prefix
- push 策略: 默认不 squash（与现有行为一致），提供 --squash 选项

## Project Structure

```
scripts/
├── subtree-cli/
│   ├── index.ts        # CLI 入口，注册 Commander 命令
│   ├── config.ts       # subtrees.json 读写
│   ├── commands/
│   │   ├── pull.ts
│   │   ├── push.ts
│   │   ├── add.ts
│   │   ├── list.ts
│   │   └── status.ts
│   └── utils.ts        # git 操作、工作区检查等共享工具
├── subtree-pull.ts     # 旧脚本，迁移后删除
└── subtrees.json       # 仓库配置
```

## Technical Notes

- 当前脚本路径: `scripts/subtree-pull.ts` → 迁移后删除
- 运行方式: `tsx scripts/subtree-cli/index.ts <command>`
- 依赖新增: commander, execa（添加到 root devDependencies）
- git subtree 常用命令: add, pull, push, merge, split
