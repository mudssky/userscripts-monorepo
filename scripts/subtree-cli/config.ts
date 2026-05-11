import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** 单个 subtree 仓库的配置 */
export interface SubtreeRepository {
  /** 仓库短名，用于 CLI 参数引用 */
  name: string
  /** 本地目录前缀，例如 userscripts/highlight-keywords */
  prefix: string
  /** 上游仓库 URL */
  repository: string
  /** 上游分支名 */
  ref: string
}

// tsx 运行时 __dirname 可用（tsx 注入）
const CONFIG_PATH = resolve(__dirname, '..', 'subtrees.json')

/**
 * 从 subtrees.json 读取所有已注册的 subtree 配置。
 *
 * @returns 已注册的仓库配置列表。
 */
export function loadConfig(): SubtreeRepository[] {
  const raw = readFileSync(CONFIG_PATH, 'utf8')
  return JSON.parse(raw) as SubtreeRepository[]
}

/**
 * 将仓库配置列表写回 subtrees.json。
 *
 * @param repos - 要持久化的仓库配置列表。
 * @returns 无返回值。
 */
export function saveConfig(repos: SubtreeRepository[]): void {
  const json = JSON.stringify(repos, null, 2)
  writeFileSync(CONFIG_PATH, `${json}\n`, 'utf8')
}

/**
 * 按名称查找已注册的 subtree 配置。
 *
 * @param name - 仓库短名。
 * @returns 匹配的仓库配置，未找到时返回 undefined。
 */
export function findRepo(name: string): SubtreeRepository | undefined {
  const repos = loadConfig()
  return repos.find((repo) => repo.name === name)
}

/**
 * 向配置中追加一个新的 subtree 仓库，并持久化。
 *
 * @param repo - 新仓库的配置。
 * @returns 无返回值。
 */
export function addRepo(repo: SubtreeRepository): void {
  const repos = loadConfig()
  if (repos.some((r) => r.name === repo.name)) {
    throw new Error(`subtree "${repo.name}" already exists in config`)
  }
  repos.push(repo)
  saveConfig(repos)
}
