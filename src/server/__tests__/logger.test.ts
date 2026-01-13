import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

const ORIGINAL_LOG_LEVEL = process.env.LOG_LEVEL

function restoreEnv() {
  if (ORIGINAL_LOG_LEVEL === undefined) {
    delete process.env.LOG_LEVEL
  } else {
    process.env.LOG_LEVEL = ORIGINAL_LOG_LEVEL
  }
}

async function loadLogger(tag: string) {
  const modulePath = `../logger?${tag}`
  const module = await import(modulePath)
  return module.logger as {
    debug: (event: string, data?: Record<string, unknown>) => void
    info: (event: string, data?: Record<string, unknown>) => void
    warn: (event: string, data?: Record<string, unknown>) => void
    error: (event: string, data?: Record<string, unknown>) => void
  }
}

describe('logger', () => {
  let consoleLogMock: ReturnType<typeof mock>
  let consoleErrorMock: ReturnType<typeof mock>
  let originalLog: typeof console.log
  let originalError: typeof console.error

  beforeEach(() => {
    originalLog = console.log
    originalError = console.error
    consoleLogMock = mock(() => {})
    consoleErrorMock = mock(() => {})
    console.log = consoleLogMock
    console.error = consoleErrorMock
  })

  afterEach(() => {
    console.log = originalLog
    console.error = originalError
    restoreEnv()
  })

  test('outputs structured JSON with timestamp', async () => {
    delete process.env.LOG_LEVEL
    const logger = await loadLogger('json-format')

    logger.info('test_event', { foo: 'bar' })

    expect(consoleLogMock).toHaveBeenCalledTimes(1)
    const output = JSON.parse(consoleLogMock.mock.calls[0][0])
    expect(output.level).toBe('info')
    expect(output.event).toBe('test_event')
    expect(output.foo).toBe('bar')
    expect(output.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  test('uses console.error for error level', async () => {
    delete process.env.LOG_LEVEL
    const logger = await loadLogger('error-stderr')

    logger.error('error_event', { code: 500 })

    expect(consoleErrorMock).toHaveBeenCalledTimes(1)
    expect(consoleLogMock).not.toHaveBeenCalled()
    const output = JSON.parse(consoleErrorMock.mock.calls[0][0])
    expect(output.level).toBe('error')
    expect(output.event).toBe('error_event')
  })

  test('filters by log level - info filters out debug', async () => {
    process.env.LOG_LEVEL = 'info'
    const logger = await loadLogger('level-info')

    logger.debug('debug_event')
    logger.info('info_event')

    expect(consoleLogMock).toHaveBeenCalledTimes(1)
    const output = JSON.parse(consoleLogMock.mock.calls[0][0])
    expect(output.event).toBe('info_event')
  })

  test('filters by log level - error filters out warn/info/debug', async () => {
    process.env.LOG_LEVEL = 'error'
    const logger = await loadLogger('level-error')

    logger.debug('debug_event')
    logger.info('info_event')
    logger.warn('warn_event')
    logger.error('error_event')

    expect(consoleLogMock).not.toHaveBeenCalled()
    expect(consoleErrorMock).toHaveBeenCalledTimes(1)
  })

  test('debug level shows all logs', async () => {
    process.env.LOG_LEVEL = 'debug'
    const logger = await loadLogger('level-debug')

    logger.debug('debug_event')
    logger.info('info_event')
    logger.warn('warn_event')
    logger.error('error_event')

    expect(consoleLogMock).toHaveBeenCalledTimes(3) // debug, info, warn
    expect(consoleErrorMock).toHaveBeenCalledTimes(1) // error
  })

  test('defaults to info level when LOG_LEVEL not set', async () => {
    delete process.env.LOG_LEVEL
    const logger = await loadLogger('default-level')

    logger.debug('debug_event')
    logger.info('info_event')

    expect(consoleLogMock).toHaveBeenCalledTimes(1)
    const output = JSON.parse(consoleLogMock.mock.calls[0][0])
    expect(output.event).toBe('info_event')
  })

  test('handles invalid LOG_LEVEL gracefully', async () => {
    process.env.LOG_LEVEL = 'invalid'
    const logger = await loadLogger('invalid-level')

    logger.debug('debug_event')
    logger.info('info_event')

    // Should default to info level
    expect(consoleLogMock).toHaveBeenCalledTimes(1)
    const output = JSON.parse(consoleLogMock.mock.calls[0][0])
    expect(output.event).toBe('info_event')
  })
})
