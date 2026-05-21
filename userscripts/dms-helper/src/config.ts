/** 复制行为配置 */
export const COPY_CONFIG = {
  /** 长表格确认阈值，超过后需要用户确认才继续完整复制 */
  slowRowThreshold: 300,
  /** 虚拟表格滚动后等待渲染完成的时间 */
  scrollRenderDelayMs: 80,
  /** 每次滚动时保留的重叠行数量，用于合并相邻视口数据 */
  scrollOverlapRows: 2,
  /** 探测滚动容器时最多试滚动的候选元素数量 */
  scrollProbeCandidateLimit: 6,
  /** 虚拟滚动最大步数，避免页面结构异常时陷入循环 */
  maxVirtualScrollSteps: 2000,
} as const
