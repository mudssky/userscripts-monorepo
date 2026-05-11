# 项目规则文档

## 🔧 核心技术栈

🔴 **必须使用的技术**：
- **React 18+**：函数式组件 + Hooks
- **TypeScript**：所有代码必须使用 TS，提供完整类型定义
- **Tailwind CSS**：样式框架，禁用 Preflight
- **Vite**：构建工具
- **Biome**：代码格式化和质量检查

🟡 **推荐使用**：
- **Shadcn UI**：UI 组件库

## 📝 代码规范

### 命名规范
- **变量**：camelCase
- **组件**：PascalCase
- **文件/目录**：PascalCase（如：`src/components/HighlightPanel/`）
- **CSS类**：BEM 命名法（仅自定义样式）

### 样式规范
🔴 **优先使用 Tailwind CSS 类名**，避免内联样式
🟡 复杂渐变可保留内联样式
🟢 使用响应式前缀（sm:, md:, lg:, xl:）和透明度语法（`bg-white/10`）

### React 规范
🔴 **核心要求**：
- 仅使用函数式组件和 Hooks
- 必须提供 TypeScript 类型定义
- useEffect 清理函数中移除所有监听器和定时器

🟡 **状态管理策略**：
- 简单状态：useState
- 复杂逻辑：useReducer
- 跨组件共享：useContext
- 可复用逻辑：自定义 Hooks

## 🚀 用户脚本特定要求

### 脚本配置
🔴 **元数据块配置**：
- `@grant`：仅申请必要的 GM_* 权限
- `@run-at`：document-end
- `@match/@exclude`：精确匹配目标页面
- `@require`：通过 CDN 引入 React 等大型库

🔴 **架构要求**：
- 全局功能使用单例模式（高亮器、设置管理器等）
- 样式文件在 main.tsx 中导入
- 禁用 Tailwind Preflight 避免样式污染

## ⚡ 性能与安全

### 性能优化
🔴 **必须实现**：
- 大型库通过 CDN @require 引入
- useEffect 清理函数中移除所有资源
- 频繁事件使用防抖/节流

🟡 **推荐实现**：
- React.lazy + Suspense 懒加载组件
- React.memo、useMemo、useCallback 优化渲染
- 大量数据使用虚拟列表（react-window）

### 安全规范
🔴 **严格禁止**：
- 使用 dangerouslySetInnerHTML 渲染外部内容
- 在 localStorage 存储敏感信息

🔴 **必须实现**：
- 使用 GM_setValue/GM_getValue 存储敏感数据
- 严格验证所有用户输入和 GM_getValue 数据

## 🧪 测试与文档

### 测试要求
🔴 **必须测试**：
- 核心功能的单元/集成测试
- 使用 React Testing Library + Jest 测试关键组件
- 跨浏览器兼容性（Chrome、Firefox、Edge）

🟡 **推荐测试**：
- 边界情况（空值、超长输入、大量数据）
- 大文档性能测试
- 内存泄漏检查

### 文档规范
🔴 **必须提供**：
- 自定义组件和 Hooks 的 TSDoc 注释
- 复杂逻辑的行内注释
- 使用 `// TODO:` 标记待办事项

🟡 **版本管理**：
- 遵循 Conventional Commits 规范

---

## ✅ 快速检查清单

### 代码提交前检查
- [ ] 所有组件使用 TypeScript 和函数式组件
- [ ] 样式优先使用 Tailwind CSS
- [ ] useEffect 有清理函数
- [ ] 敏感数据使用 GM_setValue 存储
- [ ] 元数据块配置正确
- [ ] 核心功能有测试覆盖
- [ ] 代码有必要的注释
- [ ] Git 提交信息符合规范

### 性能检查
- [ ] 大型库通过 CDN 引入
- [ ] 频繁事件使用防抖/节流
- [ ] 组件使用 memo/useMemo/useCallback 优化
- [ ] 无内存泄漏

### 安全检查
- [ ] 无 dangerouslySetInnerHTML 使用
- [ ] 用户输入已验证
- [ ] 权限申请最小化

  
