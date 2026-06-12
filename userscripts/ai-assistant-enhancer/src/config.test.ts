import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, isDoubaoEnabled, normalizeConfig } from './config'

describe('normalizeConfig', () => {
  it('returns defaults for invalid input', () => {
    expect(normalizeConfig(null)).toEqual(DEFAULT_CONFIG)
  })

  it('merges partial config with defaults', () => {
    expect(
      normalizeConfig({
        enabled: false,
        assistants: {
          doubao: {
            enabled: false,
          },
        },
      }),
    ).toEqual({
      ...DEFAULT_CONFIG,
      enabled: false,
      assistants: {
        doubao: {
          enabled: false,
          preferredModeStrategy: 'expert-first',
        },
      },
    })
  })
})

describe('isDoubaoEnabled', () => {
  it('requires both global and doubao switches', () => {
    expect(isDoubaoEnabled(DEFAULT_CONFIG)).toBe(true)
    expect(isDoubaoEnabled({ ...DEFAULT_CONFIG, enabled: false })).toBe(false)
    expect(
      isDoubaoEnabled({
        ...DEFAULT_CONFIG,
        assistants: {
          doubao: {
            ...DEFAULT_CONFIG.assistants.doubao,
            enabled: false,
          },
        },
      }),
    ).toBe(false)
  })
})
