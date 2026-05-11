/**
 * 全局 GitHubEnhance 对象的类型声明
 */
declare global {
  interface Window {
    GitHubEnhance: {
      /**
       * 切换调试模式状态
       * @param enabled 可选参数，指定调试模式状态。如果不提供，则切换当前状态
       * @returns 切换后的调试模式状态
       */
      toggleDebugMode(enabled?: boolean): boolean

      /**
       * 获取调试模式状态的字符串描述
       * @returns 调试模式状态描述
       */
      getDebugModeStatus(): string

      /**
       * 输出调试模式相关的帮助信息到控制台
       */
      showDebugHelp(): void

      /**
       * 判断是否处于调试模式
       * @returns 如果处于调试模式则返回 true，否则返回 false
       */
      isDebugMode(): boolean

      /**
       * 脚本版本号
       */
      version: string
    }
  }
}

export {}
