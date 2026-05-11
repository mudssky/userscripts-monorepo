import fs from 'node:fs'
import type { Logger, Plugin } from 'vite'

/**
 * Tailwind 样式注入器插件配置选项
 */
export interface StyleInjectorOptions {
  /** 占位符字符串，默认 'TAILWIND_STYLES_PLACEHOLDER' */
  placeholder?: string
  /** CSS 输出路径，设置后在插件执行时额外输出 css 文件 */
  cssOutputPath?: string
}

/**
 * Vite 插件：构建时提取 CSS 并内联替换 JS 中的占位符。
 *
 * 用于 userscript Shadow DOM 场景：构建产物为单一 JS 文件，
 * CSS 作为字符串嵌入代码，运行时注入到 Shadow Root。
 */
export function styleInjector(options: StyleInjectorOptions = {}): Plugin {
  const { placeholder = 'TAILWIND_STYLES_PLACEHOLDER', cssOutputPath } = options

  let logger: Logger
  let cssContent = ''
  const logPrefix = 'StyleInjector: '

  return {
    name: 'style-injector',
    apply: 'build',
    enforce: 'post',
    configResolved(resolvedConfig) {
      logger = resolvedConfig.logger
    },
    generateBundle(_opts, bundle) {
      let cssAssetKey = ''

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && chunk.type === 'asset') {
          cssContent = chunk.source as string
          cssAssetKey = fileName
          logger.info(`${logPrefix}Found CSS: ${fileName} (${cssContent.length} chars)`)
          break
        }
      }

      if (cssAssetKey) {
        if (cssOutputPath) {
          fs.writeFileSync(cssOutputPath, cssContent)
        }
        delete bundle[cssAssetKey]
      } else {
        logger.warn(`${logPrefix}No CSS file found in bundle`)
        return
      }

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
          if (chunk.code.includes(placeholder)) {
            chunk.code = chunk.code.replace(new RegExp(placeholder, 'g'), cssContent)
            logger.info(`${logPrefix}Replaced placeholder in ${fileName}`)
          }
        }
      }
    },
  }
}
