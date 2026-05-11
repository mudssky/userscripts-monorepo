import { Command } from 'commander'
import { loadConfig } from '../config.js'
import { execGit, selectRepositories } from '../utils.js'

/**
 * 注册 status 子命令。显示每个 subtree 与上游的同步状态。
 *
 * @returns Commander Command 实例。
 */
export function createStatusCommand(): Command {
  return new Command('status')
    .description('显示 subtree 与上游的同步状态')
    .argument('[names...]', '要检查的仓库名称，不传则检查全部')
    .action(async (names: string[]) => {
      const repos = await selectRepositories(names)

      for (const repo of repos) {
        console.log(`\n[subtree] ${repo.name} (${repo.prefix})`)

        // 获取 remote 最新信息（不修改本地文件）
        const remoteName = `subtree-${repo.name}`

        // 尝试获取上游引用来比较
        try {
          // 用 git ls-tree 获取当前 HEAD 中 subtree 目录的 commit
          const lsOutput = await execGit([
            'ls-tree',
            'HEAD',
            repo.prefix,
          ])

          if (!lsOutput) {
            console.log('  Directory not found in HEAD')
            continue
          }

          const localCommit = lsOutput.split(/\s+/)[2]

          // 获取上游分支最新的 commit
          const fetchOutput = await execGit([
            'fetch',
            repo.repository,
            `${repo.ref}:refs/remotes/${remoteName}/${repo.ref}`,
          ]).catch(() => '')

          const upstreamCommit = await execGit([
            'rev-parse',
            `refs/remotes/${remoteName}/${repo.ref}`,
          ]).catch(() => '')

          if (!upstreamCommit) {
            console.log(`  Local: ${localCommit.slice(0, 8)}`)
            console.log('  Upstream: unable to fetch')
            continue
          }

          // 比较本地 subtree commit 和上游 commit
          const isUpToDate = localCommit === upstreamCommit
          const localShort = localCommit.slice(0, 8)
          const upstreamShort = upstreamCommit.slice(0, 8)

          if (isUpToDate) {
            console.log(`  Up to date (${localShort})`)
          } else {
            console.log(`  Local:    ${localShort}`)

            // 检查 ahead/behind
            const aheadOutput = await execGit([
              'log',
              '--oneline',
              `${upstreamCommit}..${localCommit}`,
            ]).catch(() => '')

            const behindOutput = await execGit([
              'log',
              '--oneline',
              `${localCommit}..${upstreamCommit}`,
            ]).catch(() => '')

            const aheadCount = aheadOutput ? aheadOutput.split('\n').filter(Boolean).length : 0
            const behindCount = behindOutput ? behindOutput.split('\n').filter(Boolean).length : 0

            console.log(`  Upstream: ${upstreamShort}`)
            console.log(`  Ahead: ${aheadCount}, Behind: ${behindCount}`)
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.log(`  Error: ${message}`)
        }
      }
    })
}
