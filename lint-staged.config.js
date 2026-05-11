import path from 'node:path'
import { cwd } from 'node:process'

const ignoredDirs = ['.agents', '.claude', '.codex', '.trellis']

/**
 * 将 lint-staged 传入的绝对路径转换为仓库相对路径。
 *
 * @param {string[]} files lint-staged 匹配到的暂存文件路径。
 * @returns {string[]} 仓库根目录下的相对路径列表。
 */
const toRelativePaths = (files) =>
  files.map((file) => path.relative(cwd(), file).replaceAll('\\', '/'))

/**
 * 过滤掉本地 AI/Trellis 配置目录，避免临时生成文件进入提交前格式化流程。
 *
 * @param {string[]} files 仓库根目录下的相对路径列表。
 * @returns {string[]} 需要继续交给格式化工具处理的文件路径列表。
 */
const filterIgnoredDirs = (files) =>
  files.filter(
    (file) =>
      !ignoredDirs.some((dir) => file === dir || file.startsWith(`${dir}/`)),
  )

/**
 * 从变更文件列表中提取需要 typecheck 的包目录。
 *
 * @param {string[]} files 仓库根目录下的相对路径列表。
 * @returns {string[]} 需要运行 tsc --noEmit 的包目录列表（去重）。
 */
const getAffectedPackages = (files) => {
  const prefixes = ['packages/', 'userscripts/']
  return [
    ...new Set(
      files
        .filter((f) => prefixes.some((p) => f.startsWith(p)))
        .map((f) => f.split('/').slice(0, 2).join('/')),
    ),
  ]
}

export default {
  '*.{js,jsx,ts,tsx,json}': (files) => {
    const matchedFiles = filterIgnoredDirs(toRelativePaths(files))
    return matchedFiles.length
      ? `biome check --write ${matchedFiles.join(' ')}`
      : []
  },
  '*.{ts,tsx}': (files) => {
    const matchedFiles = filterIgnoredDirs(toRelativePaths(files))
    const packages = getAffectedPackages(matchedFiles)
    if (packages.length === 0) return []

    const typecheckCmds = packages
      .map((pkg) => `cd ${pkg} && npx tsc --noEmit`)
      .join(' && ')
    return [`echo "[typecheck] ${packages.join(', ')}" && ${typecheckCmds}`]
  },
}
