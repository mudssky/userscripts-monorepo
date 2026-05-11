/**
 * 支持的样式来源类型
 */
export type StyleSource = HTMLStyleElement | CSSStyleSheet | string

/**
 * Shadow DOM 容器创建配置
 */
export interface ShadowContainerOptions {
  /** ShadowRoot 模式，默认 'open' */
  mode?: 'open' | 'closed'
  /** 宿主元素标签名，默认 'div' */
  hostTag?: keyof HTMLElementTagNameMap
  /** 宿主元素插入位置，默认 document.documentElement */
  attachTo?: Element
  /** 容器的 class（用于 Tailwind 作用域等），默认 'tailwind' */
  containerClass?: string
  /** 容器额外属性，例如 data-* */
  containerAttrs?: Record<string, string>
  /** 要注入到 Shadow DOM 的样式集合 */
  styles?: StyleSource[]
}

/**
 * Shadow DOM 容器创建结果
 */
export interface ShadowContainerResult {
  /** 宿主元素（挂载 shadowRoot 的元素） */
  host: HTMLElement
  /** 创建的 ShadowRoot */
  shadow: ShadowRoot
  /** 应用挂载容器 */
  container: HTMLElement
  /** 卸载函数：移除宿主元素 */
  teardown: () => void
}

/**
 * 创建带样式隔离的 Shadow DOM 容器
 *
 * @param options - 容器配置项
 * @returns 容器相关信息及卸载函数
 */
export function createShadowContainer(
  options: ShadowContainerOptions = {},
): ShadowContainerResult {
  const {
    mode = 'open',
    hostTag = 'div',
    attachTo = document.documentElement,
    containerClass = 'tailwind',
    containerAttrs = {},
    styles = [],
  } = options

  const host = document.createElement(hostTag)
  attachTo.append(host)
  const shadow = host.attachShadow({ mode })

  const sheets: CSSStyleSheet[] = []
  for (const s of styles) {
    if (s instanceof CSSStyleSheet) {
      sheets.push(s)
    } else if (typeof s === 'string') {
      const styleEl = document.createElement('style')
      styleEl.textContent = s
      shadow.appendChild(styleEl)
    } else {
      shadow.appendChild(s)
    }
  }

  const supportsAdopted =
    'adoptedStyleSheets' in Document.prototype &&
    'replaceSync' in CSSStyleSheet.prototype
  if (supportsAdopted && sheets.length) {
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, ...sheets]
  }

  const container = document.createElement('div')
  if (containerClass) container.classList.add(containerClass)
  for (const k in containerAttrs) container.setAttribute(k, containerAttrs[k])
  shadow.appendChild(container)

  const teardown = () => {
    host.remove()
  }

  return { host, shadow, container, teardown }
}
