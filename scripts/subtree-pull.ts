import { spawnSync } from 'node:child_process'

interface SubtreeRepository {
  name: string
  prefix: string
  repository: string
  ref: string
}

interface CliOptions {
  allowDirty: boolean
  dryRun: boolean
  help: boolean
  names: string[]
}

const repositories: SubtreeRepository[] = [
  {
    name: 'highlight-keywords',
    prefix: 'userscripts/highlight-keywords',
    repository: 'https://github.com/mudssky/highlight-keywords.git',
    ref: 'main',
  },
]

/**
 * 解析命令行参数。
 *
 * @param argv - 从命令行传入的参数列表，不包含 node 与脚本路径。
 * @returns 标准化后的命令行选项。
 */
function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    allowDirty: false,
    dryRun: false,
    help: false,
    names: [],
  }

  for (const arg of argv) {
    if (arg === '--allow-dirty') {
      options.allowDirty = true
      continue
    }

    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }

    options.names.push(arg)
  }

  return options
}

/**
 * 输出脚本使用说明。
 *
 * @returns 无返回值。
 */
function printHelp(): void {
  console.log(`Usage:
  pnpm subtree:pull
  pnpm subtree:pull -- --dry-run
  pnpm subtree:pull -- highlight-keywords
  pnpm subtree:pull -- --allow-dirty highlight-keywords

Options:
  --dry-run      Print git subtree commands without executing them.
  --allow-dirty Allow running when the working tree has local changes.
  -h, --help    Show this help message.
`)
}

/**
 * 运行 Git 命令并返回 stdout。
 *
 * @param args - 传给 git 的参数列表。
 * @returns 命令的标准输出文本。
 */
function readGitOutput(args: string[]): string {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }

  return result.stdout.trim()
}

/**
 * 校验工作区是否干净。
 *
 * @param allowDirty - 是否允许在存在本地改动时继续执行。
 * @returns 无返回值。
 */
function assertCleanWorkingTree(allowDirty: boolean): void {
  if (allowDirty) {
    return
  }

  const status = readGitOutput(['status', '--porcelain'])
  if (!status) {
    return
  }

  console.error('Working tree is not clean. Commit or stash changes before pulling subtrees.')
  console.error('Use --allow-dirty only when you intentionally want to merge with local changes.')
  process.exit(1)
}

/**
 * 按名称筛选需要同步的 subtree 仓库。
 *
 * @param names - 用户指定的仓库名称列表，为空时表示同步全部仓库。
 * @returns 需要同步的仓库配置列表。
 */
function selectRepositories(names: string[]): SubtreeRepository[] {
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
 * 同步单个 subtree 仓库。
 *
 * @param repo - subtree 仓库配置。
 * @param dryRun - 是否只打印命令而不执行。
 * @returns 无返回值。
 */
function pullRepository(repo: SubtreeRepository, dryRun: boolean): void {
  const args = ['subtree', 'pull', `--prefix=${repo.prefix}`, repo.repository, repo.ref]
  const command = `git ${args.join(' ')}`

  console.log(`\n[subtree] ${repo.name}`)
  console.log(command)

  if (dryRun) {
    return
  }

  const result = spawnSync('git', args, {
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

/**
 * 脚本入口。
 *
 * @returns 无返回值。
 */
function main(): void {
  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    printHelp()
    return
  }

  const selectedRepositories = selectRepositories(options.names)
  assertCleanWorkingTree(options.allowDirty || options.dryRun)

  for (const repo of selectedRepositories) {
    pullRepository(repo, options.dryRun)
  }
}

main()
