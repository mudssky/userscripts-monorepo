import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DebugLogger } from './debug-logger'

describe('DebugLogger', () => {
  let logger: DebugLogger

  beforeEach(() => {
    logger = new DebugLogger({ scriptName: 'TestScript', maxLogs: 5 })
  })

  it('creates logger with correct prefix', () => {
    expect(logger).toBeDefined()
  })

  it('exports empty logs initially', () => {
    expect(logger.getLogs()).toHaveLength(0)
  })

  it('appends logs and respects maxLogs limit', () => {
    for (let i = 0; i < 8; i++) {
      logger.log(`msg ${i}`)
    }
    expect(logger.getLogs()).toHaveLength(5)
  })

  it('exports logs as formatted text', () => {
    logger.info('hello')
    logger.warn('warning')
    const text = logger.exportLogs()
    expect(text).toContain('[info]')
    expect(text).toContain('[warn]')
    expect(text).toContain('hello')
  })

  it('stores log entries with correct structure', () => {
    logger.info('test message')
    const logs = logger.getLogs()
    expect(logs[0].level).toBe('info')
    expect(logs[0].timestamp).toBeTypeOf('number')
    expect(logs[0].args).toEqual(['test message'])
  })

  it('handles multiple arg types', () => {
    logger.info('str', 42, { key: 'val' })
    const logs = logger.getLogs()
    expect(logs[0].args).toEqual(['str', 42, { key: 'val' }])
  })
})
