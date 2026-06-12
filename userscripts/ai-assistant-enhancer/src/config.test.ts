import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONFIG,
  isDoubaoEnabled,
  normalizeAutoCheckDelayMs,
  normalizeConfig,
  normalizeModeSwitchConfirmMs,
} from './config'

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
          autoCheckDelayMs: DEFAULT_CONFIG.assistants.doubao.autoCheckDelayMs,
          modeSwitchConfirmMs:
            DEFAULT_CONFIG.assistants.doubao.modeSwitchConfirmMs,
        },
      },
    })
  })

  it('normalizes auto check delay', () => {
    expect(
      normalizeConfig({
        assistants: {
          doubao: {
            autoCheckDelayMs: 3600,
          },
        },
      }).assistants.doubao.autoCheckDelayMs,
    ).toBe(3600)
  })

  it('normalizes mode switch confirm delay', () => {
    expect(
      normalizeConfig({
        assistants: {
          doubao: {
            modeSwitchConfirmMs: 2200,
          },
        },
      }).assistants.doubao.modeSwitchConfirmMs,
    ).toBe(2200)
  })
})

describe('normalizeAutoCheckDelayMs', () => {
  it('clamps invalid and out-of-range values', () => {
    expect(normalizeAutoCheckDelayMs('soon')).toBe(
      DEFAULT_CONFIG.assistants.doubao.autoCheckDelayMs,
    )
    expect(normalizeAutoCheckDelayMs(-100)).toBe(0)
    expect(normalizeAutoCheckDelayMs(12000)).toBe(10000)
  })
})

describe('normalizeModeSwitchConfirmMs', () => {
  it('clamps invalid and out-of-range values', () => {
    expect(normalizeModeSwitchConfirmMs('fast')).toBe(
      DEFAULT_CONFIG.assistants.doubao.modeSwitchConfirmMs,
    )
    expect(normalizeModeSwitchConfirmMs(100)).toBe(500)
    expect(normalizeModeSwitchConfirmMs(8000)).toBe(5000)
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
