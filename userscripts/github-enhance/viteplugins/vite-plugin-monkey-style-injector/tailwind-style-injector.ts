import fs from 'node:fs'
import type { Logger, Plugin } from 'vite'
import type { TailwindStyleInjectorOptions } from './types'

const pluginLogPrefix = 'TailwindStyleInjector: '

/**
 * Vite插件：将Tailwind CSS样式注入到指定占位符位置
 * 用于在用户脚本中实现Shadow DOM样式隔离
 */
export function tailwindStyleInjector(
  options: TailwindStyleInjectorOptions = {},
): Plugin {
  const { placeholder = 'TAILWIND_STYLES_PLACEHOLDER', cssOutputPath } = options

  let logger: Logger
  let cssContent = ''

  return {
    name: 'tailwind-style-injector',
    apply: 'build', // 只在构建时应用
    enforce: 'post',
    configResolved(resolvedConfig) {
      logger = resolvedConfig.logger
    },
    generateBundle(opts, bundle) {
      logger.info(
        `${pluginLogPrefix}Bundle keys: ${Object.keys(bundle).join(', ')}`,
      )
      let cssAssetKey = ''

      // 从bundle中查找CSS文件
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && chunk.type === 'asset') {
          cssContent = chunk.source as string
          cssAssetKey = fileName
          logger.info(
            `${pluginLogPrefix}Found CSS file ${fileName} with ${cssContent.length} characters`,
          )
          break
        }
      }

      if (cssAssetKey) {
        logger.info(`${pluginLogPrefix}Deleting CSS file ${cssAssetKey}`)
        if (cssOutputPath) {
          fs.writeFileSync(cssOutputPath, cssContent)
        }
        delete bundle[cssAssetKey]
      } else {
        logger.warn(`${pluginLogPrefix}No CSS file found`)
        return
      }

      // 创建style标签字符串
      const styleTag = cssContent

      // 在所有JS文件中替换占位符
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
          const originalCode = chunk.code
          if (originalCode.includes(placeholder)) {
            chunk.code = originalCode.replace(
              new RegExp(placeholder, 'g'),
              styleTag,
            )
            logger.info(`${pluginLogPrefix}Replaced placeholder in ${fileName}`)
          }
        }
      }
    },
  }
}

export default tailwindStyleInjector
