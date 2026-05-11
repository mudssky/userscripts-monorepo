import { Command } from 'commander'
import { execGit, assertCleanWorkingTree, selectRepositories } from '../utils.js'

/**
 * 注册 pull 子命令。等价于旧版 subtree-pull.ts 的功能。
 *
 * @returns Commander Command 实例。
 */
export function createPullCommand(): Command {
  return new Command('pull')
    .description('从上游仓库拉取 subtree 更新')
    .argument('[names...]', '要拉取的仓库名称，不传则拉取全部')
    .option('--dry-run', '只打印命令而不执行')
    .option('--allow-dirty', '允许工作区存在未提交改动时继续')
    .action(async (names: string[], options: { dryRun?: boolean; allowDirty?: boolean }) => {
      const repos = await selectRepositories(names)
      await assertCleanWorkingTree(options.allowDirty ?? false)

      for (const repo of repos) {
        const args = [
          'subtree',
          'pull',
          `--prefix=${repo.prefix}`,
          repo.repository,
          repo.ref,
        ]
        const command = `git ${args.join(' ')}`

        console.log(`\n[subtree] ${repo.name}`)
        console.log(command)

        if (options.dryRun) {
          continue
        }

        await execGit(args, { stdio: 'inherit' })
      }
    })
}
