import { Command } from 'commander'
import { execGit, selectRepositories } from '../utils.js'

/**
 * 注册 push 子命令。将本地 subtree 变更推送到上游仓库。
 *
 * @returns Commander Command 实例。
 */
export function createPushCommand(): Command {
  return new Command('push')
    .description('将 subtree 变更推送到上游仓库')
    .argument('[names...]', '要推送的仓库名称，不传则推送全部')
    .option('--squash', '推送前 squash（默认不 squash）')
    .option('--dry-run', '只打印命令而不执行')
    .action(async (names: string[], options: { squash?: boolean; dryRun?: boolean }) => {
      const repos = await selectRepositories(names)

      for (const repo of repos) {
        const args = ['subtree', 'push', `--prefix=${repo.prefix}`]

        if (options.squash) {
          args.push('--squash')
        }

        args.push(repo.repository, repo.ref)

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
