import { describe, it, expect, beforeEach } from 'vitest'
import { createShadowContainer } from './shadow-container'

describe('createShadowContainer', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('creates shadow container with default options', () => {
    const result = createShadowContainer()
    expect(result.host).toBeDefined()
    expect(result.shadow).toBeDefined()
    expect(result.container).toBeDefined()
    expect(result.container.classList.contains('tailwind')).toBe(true)
    result.teardown()
  })

  it('applies custom container class', () => {
    const result = createShadowContainer({ containerClass: 'my-class' })
    expect(result.container.classList.contains('my-class')).toBe(true)
    result.teardown()
  })

  it('applies container attributes', () => {
    const result = createShadowContainer({
      containerAttrs: { 'data-test': 'value' },
    })
    expect(result.container.getAttribute('data-test')).toBe('value')
    result.teardown()
  })

  it('injects string styles', () => {
    const result = createShadowContainer({
      styles: ['body { color: red; }'],
    })
    const styleEl = result.shadow.querySelector('style')
    expect(styleEl?.textContent).toBe('body { color: red; }')
    result.teardown()
  })

  it('teardown removes host element', () => {
    const result = createShadowContainer()
    expect(document.documentElement.contains(result.host)).toBe(true)
    result.teardown()
    expect(document.documentElement.contains(result.host)).toBe(false)
  })
})
