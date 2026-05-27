/** DMS 页面 CSS 选择器配置 */
export const SELECTORS = {
  /** 查询结果容器 */
  resultContainer: '.con-sql-result, .panel-result',
  /** 工具栏 */
  toolbar: '.bar-top, .sql-console-results-tab > .next-tabs-bar .next-tabs-nav-extra',
  /** 表格 */
  table: '.art-table, .next-table',
  /** 表格滚动主体 */
  tableBody: '.art-table-body, .next-table-body',
  /** 可能承载虚拟滚动的表格容器 */
  tableScrollCandidates:
    '.art-table-wrapper, .art-table-body, .art-table-body-wrapper, .art-table-scroll, .art-table-container, .art-table-content, .dui-use-virtual, .next-table-body, .next-table-body-wrapper, .next-table-scroller, .next-table-scroll, .next-table-inner, [class*="virtual"], [class*="Virtual"], [class*="scroll"], [class*="Scroll"]',
  /** 表头行 */
  headerRow: '.art-table-header-row, .next-table-header tr',
  /** 数据行 */
  bodyRows: '.art-table-body .art-table-row, .next-table-body .next-table-row',
  /** 数据单元格 */
  bodyCell: '.art-table-cell, .next-table-cell',
  /** 文本元素 */
  headerText: '.text, .next-table-cell-wrapper',
  /** 单元格文本 */
  cellText: '.text, .next-table-cell-wrapper',
  /** 活动标签面板 */
  activeTabPane: '.next-tabs-tabpane.active',
} as const
