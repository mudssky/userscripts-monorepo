import { execa } from 'execa'
import { loadConfig, type SubtreeRepository } from './config.js'

/**
 * 执行 git 命令并返回 stdout。
 *
 * @param args - 传给 git 的参数列表。
 * @param options - execa 选项，默认 stdio 为 pipe。
 * @returns 命令的标准输出文本（已 trim）。
 */
export async function execGit(args: string[], options?: { stdio?: 'inherit' }): Promise<string> {
  const result = await execa('git', args, {
    stdio: options?.stdio ?? 'pipe',
    reject: false,
  })

  if (result.failed) {
    if (options?.stdio === 'inherit') {
      // stdio=inherit 时错误信息已经输出到终端
      throw new Error(`git ${args.join(' ')} failed with exit code ${result.exitCode}`)
    }
    throw new Error(
      `git ${args.join(' ')} failed:\n${result.stderr || result.stdout}`,
    )
  }

  return (result.stdout as string).trim()
}

/**
 * 校验工作区是否干净。当 allowDirty 为 true 时跳过检查。
 *
 * @param allowDirty - 是否允许在存在本地改动时继续执行。
 * @returns 无返回值，检查不通过时直接终止进程。
 */
export async function assertCleanWorkingTree(allowDirty: boolean): Promise<void> {
  if (allowDirty) {
    return
  }

  const status = await execGit(['status', '--porcelain'])
  if (!status) {
    return
  }

  console.error('Working tree is not clean. Commit or stash changes before pulling subtrees.')
  console.error('Use --allow-dirty only when you intentionally want to merge with local changes.')
  process.exit(1)
}

/**
 * 按名称筛选需要操作的 subtree 仓库。不传名称时返回全部。
 *
 * @param names - 用户指定的仓库名称列表。
 * @returns 匹配的仓库配置列表。
 */
export async function selectRepositories(names: string[]): Promise<SubtreeRepository[]> {
  const repositories = loadConfig()

  if (names.length === 0) {
    return repositories
  }

  const selected = repositories.filter((repo) => names.includes(repo.name))
  const selectedNames = new Set(selected.map((repo) => repo.name))
  const unknownNames = names.filter((name) => !selectedNames.has(name))

  if (unknownNames.length > 0) {
    console.error(`Unknown subtree repository: ${unknownNames.join(', ')}`)
    console.error(`Available repositories: ${repositories.map((repo) => repo.name).join(', ')}`)
    process.exit(1)
  }

  return selected
}

/**
 * 从 git 仓库 URL 中提取仓库名（去除 .git 后缀和路径前缀）。
 *
 * @param url - git 仓库 URL。
 * @returns 仓库短名，例如 "highlight-keywords"。
 */
export function deriveNameFromUrl(url: string): string {
  // 取路径最后一段，去掉 .git 后缀
  const pathname = new URL(url.replace(/\.git$/, '')).pathname
  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments.at(-1) ?? ''
  return lastSegment.replace(/\.git$/, '')
}
