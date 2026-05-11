import { Command } from 'commander'
import { addRepo, type SubtreeRepository } from '../config.js'
import { deriveNameFromUrl, execGit } from '../utils.js'

/**
 * 注册 add 子命令。将上游仓库作为 subtree 添加到本地，并写入配置。
 *
 * @returns Commander Command 实例。
 */
export function createAddCommand(): Command {
  return new Command('add')
    .description('添加新的 subtree 仓库')
    .argument('<repo-url>', '上游仓库 URL，例如 https://github.com/user/repo.git')
    .option('--name <name>', '仓库名称（默认从 URL 推导）')
    .option('--prefix <prefix>', '本地目录前缀（默认 userscripts/<name>）')
    .option('--ref <ref>', '上游分支名', 'main')
    .option('--squash', '合并前 squash')
    .action(
      async (
        repoUrl: string,
        options: { name?: string; prefix?: string; ref: string; squash?: boolean },
      ) => {
        const name = options.name ?? deriveNameFromUrl(repoUrl)
        const prefix = options.prefix ?? `userscripts/${name}`

        const args = ['subtree', 'add', `--prefix=${prefix}`]

        if (options.squash) {
          args.push('--squash')
        }

        args.push(repoUrl, options.ref)

        const command = `git ${args.join(' ')}`

        console.log(`[subtree] Adding ${name}`)
        console.log(command)

        await execGit(args, { stdio: 'inherit' })

        // git subtree add 成功后写入配置
        const newRepo: SubtreeRepository = {
          name,
          prefix,
          repository: repoUrl,
          ref: options.ref,
        }
        addRepo(newRepo)
        console.log(`[subtree] Config saved: ${name} -> ${prefix}`)
      },
    )
}
