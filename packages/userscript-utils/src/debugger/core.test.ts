import { beforeEach, describe, expect, it } from 'vitest'
import {
  debugSelectors,
  diagnoseSelectors,
  formatDiagnostics,
  isValidSelector,
} from './core'
import type { SelectorMap } from './type'

describe('isValidSelector', () => {
  it('returns true for valid selectors', () => {
    expect(isValidSelector('.class')).toBe(true)
    expect(isValidSelector('#id')).toBe(true)
    expect(isValidSelector('div > span')).toBe(true)
  })

  it('returns false for invalid selectors', () => {
    expect(isValidSelector('[[')).toBe(false)
    expect(isValidSelector('')).toBe(false)
  })
})

describe('debugSelectors', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="container">
        <div class="toolbar">Toolbar</div>
        <table class="data-table">
          <tr><td>Cell</td></tr>
        </table>
      </div>
    `
  })

  it('matches existing selectors', () => {
    const selectors: SelectorMap = {
      container: '.container',
      toolbar: '.toolbar',
      table: '.data-table',
    }
    const results = debugSelectors(selectors)

    expect(results).toHaveLength(3)
    expect(results.find((r) => r.name === 'container')?.matched).toBe(true)
    expect(results.find((r) => r.name === 'toolbar')?.matched).toBe(true)
    expect(results.find((r) => r.name === 'table')?.count).toBe(1)
  })

  it('reports unmatched selectors', () => {
    const results = debugSelectors({ missing: '.nonexistent' })
    expect(results[0].matched).toBe(false)
    expect(results[0].reason).toBe('NOT_FOUND')
  })

  it('supports custom query functions', () => {
    const selectors: SelectorMap = {
      custom: (root) => root.querySelector('.toolbar'),
    }
    const results = debugSelectors(selectors)
    expect(results[0].matched).toBe(true)
  })

  it('reports invalid selectors', () => {
    const results = debugSelectors({ bad: '[[' })
    expect(results[0].matched).toBe(false)
    expect(results[0].reason).toBe('INVALID_SELECTOR')
  })
})

describe('diagnoseSelectors', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="container">
        <div class="toolbar">Toolbar</div>
      </div>
    `
  })

  it('includes suggestion for unmatched selectors', () => {
    const diagnostics = diagnoseSelectors({ missing: '.nonexistent' })
    expect(diagnostics[0].matched).toBe(false)
    expect(diagnostics[0].suggestion).toContain('missing')
  })

  it('includes context for unmatched string selectors', () => {
    const diagnostics = diagnoseSelectors({ deep: '.container .nonexistent' })
    expect(diagnostics[0].context).toBeDefined()
    expect(diagnostics[0].context?.nearestMatchedAncestor).toBe('.container')
  })
})

describe('formatDiagnostics', () => {
  it('formats matched and unmatched selectors', () => {
    document.body.innerHTML = '<div class="found"></div>'
    const diagnostics = diagnoseSelectors({
      found: '.found',
      missing: '.missing',
    })
    const text = formatDiagnostics(diagnostics)

    expect(text).toContain('1/2 选择器匹配')
    expect(text).toContain('✓ found')
    expect(text).toContain('✗ missing')
  })
})
