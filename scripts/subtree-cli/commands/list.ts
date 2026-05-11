import { Command } from 'commander'
import { loadConfig } from '../config.js'

/**
 * 注册 list 子命令。列出所有已注册的 subtree 仓库。
 *
 * @returns Commander Command 实例。
 */
export function createListCommand(): Command {
  return new Command('list')
    .description('列出所有已注册的 subtree 仓库')
    .action(() => {
      const repos = loadConfig()

      if (repos.length === 0) {
        console.log('No subtrees registered.')
        return
      }

      // 表头
      const nameWidth = Math.max('name'.length, ...repos.map((r) => r.name.length))
      const prefixWidth = Math.max('prefix'.length, ...repos.map((r) => r.prefix.length))
      const refWidth = Math.max('ref'.length, ...repos.map((r) => r.ref.length))

      const header = [
        'name'.padEnd(nameWidth),
        'prefix'.padEnd(prefixWidth),
        'repository'.padEnd(10),
        'ref'.padEnd(refWidth),
      ].join('  ')

      console.log(header)
      console.log('-'.repeat(header.length))

      for (const repo of repos) {
        console.log(
          [
            repo.name.padEnd(nameWidth),
            repo.prefix.padEnd(prefixWidth),
            repo.repository.padEnd(10),
            repo.ref.padEnd(refWidth),
          ].join('  '),
        )
      }
    })
}
