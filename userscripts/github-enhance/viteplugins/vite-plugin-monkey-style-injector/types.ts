import type { Plugin } from 'vite'

/**
 * Tailwind样式注入器插件配置选项
 */
export interface TailwindStyleInjectorOptions {
  /**
   * 占位符字符串，将被替换为style标签
   * @default TAILWIND_STYLES_PLACEHOLDER
   */
  placeholder?: string

  /**
   * Tailwind CSS输出文件路径,如果设置，将在该插件执行过程中输出css
   */
  cssOutputPath?: string
}

/**
 * Tailwind样式注入器插件函数类型
 */
export type TailwindStyleInjectorPlugin = (
  options?: TailwindStyleInjectorOptions,
) => Plugin
