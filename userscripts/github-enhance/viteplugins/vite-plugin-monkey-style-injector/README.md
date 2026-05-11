# Tailwind Style Injector Plugin

一个用于将 Tailwind CSS 样式注入到指定占位符的 Vite 插件，专为用户脚本的 Shadow DOM 样式隔离而设计。

## 功能特性

- 🎯 **占位符替换**：将指定占位符替换为包含 Tailwind CSS 样式的 `<style>` 标签
- 🗜️ **CSS 压缩**：自动压缩 CSS 代码，减少文件体积
- 🔧 **灵活配置**：支持自定义占位符和 CSS 路径
- 🚀 **构建时处理**：仅在构建阶段生效，不影响开发体验
- 🎭 **Shadow DOM 友好**：完美适配用户脚本的样式隔离需求

## 安装使用

### 1. 在 vite.config.ts 中配置

```typescript
import { tailwindStyleInjector } from './viteplugins'

export default defineConfig({
  plugins: [
    // 其他插件...
    tailwindcss(),
    tailwindStyleInjector({
      placeholder: 'TAILWIND_STYLES_PLACEHOLDER',
      minify: true
    }),
    // 其他插件...
  ],
})
```

### 2. 在代码中使用占位符

```typescript
// 在需要注入样式的地方使用占位符（注意：不要用注释形式）
const styleContent = `TAILWIND_STYLES_PLACEHOLDER`

// 在 Shadow DOM 中注入样式
function injectStyles(shadowRoot: ShadowRoot) {
  const styleElement = document.createElement('div')
  styleElement.innerHTML = styleContent
  shadowRoot.appendChild(styleElement.firstElementChild!)
}

// 或者直接使用
function createStyledComponent() {
  const container = document.createElement('div')
  const shadowRoot = container.attachShadow({ mode: 'open' })
  
  // 注入样式
  shadowRoot.innerHTML = `
    ${styleContent}
    <div class="p-4 bg-blue-500 text-white rounded-lg">
      这是一个使用 Tailwind 样式的组件
    </div>
  `
  
  return container
}
```

## 配置选项

```typescript
interface TailwindStyleInjectorOptions {
  /**
   * 占位符字符串，将被替换为style标签
   * @default 'TAILWIND_STYLES_PLACEHOLDER'
   */
  placeholder?: string
  
  /**
   * 是否压缩CSS
   * @default true
   */
  minify?: boolean
}
```

## 工作原理

1. **构建阶段检测**：插件仅在 `vite build` 时生效
2. **CSS 收集**：从构建产物中提取 Tailwind CSS 样式
3. **样式处理**：可选择性地压缩 CSS 代码
4. **占位符替换**：在 JS 文件中查找占位符并替换为 `<style>` 标签
5. **文件清理**：删除独立的 CSS 文件，实现样式内联

## 使用场景

### 用户脚本 Shadow DOM 样式隔离

```typescript
// main.tsx
function createEnhancedUI() {
  const container = document.createElement('div')
  const shadowRoot = container.attachShadow({ mode: 'open' })
  
  // 样式将在构建时被注入到这里
  const styles = `TAILWIND_STYLES_PLACEHOLDER`
  
  shadowRoot.innerHTML = `
    ${styles}
    <div class="fixed top-4 right-4 p-4 bg-white shadow-lg rounded-lg border">
      <h3 class="text-lg font-semibold mb-2">GitHub 增强工具</h3>
      <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        点击操作
      </button>
    </div>
  `
  
  document.body.appendChild(container)
}
```

## 注意事项

- 占位符必须作为完整的字符串存在，不要使用注释形式
- 插件会自动处理 CSS 中的特殊字符转义
- 建议在生产构建中启用 CSS 压缩以减少文件体积
- 确保 Tailwind CSS 插件在此插件之前加载
- 插件仅在构建时生效，开发模式下占位符不会被替换

## 兼容性

- ✅ Vite 4.x+
- ✅ Tailwind CSS 3.x+
- ✅ 现代浏览器
- ✅ 用户脚本环境（Tampermonkey、Greasemonkey 等）