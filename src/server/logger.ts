// Simple structured logger with levels and JSON output
// Configure via LOG_LEVEL env var: debug | info | warn | error (default: info)

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel: LogLevel = (() => {
  const env = process.env.LOG_LEVEL?.toLowerCase()
  if (env && env in LEVELS) return env as LogLevel
  return 'info'
})()

function log(level: LogLevel, event: string, data?: Record<string, unknown>): void {
  if (LEVELS[level] < LEVELS[currentLevel]) return

  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  }

  const output = level === 'error' ? console.error : console.log
  output(JSON.stringify(entry))
}

export const logger = {
  debug: (event: string, data?: Record<string, unknown>) => log('debug', event, data),
  info: (event: string, data?: Record<string, unknown>) => log('info', event, data),
  warn: (event: string, data?: Record<string, unknown>) => log('warn', event, data),
  error: (event: string, data?: Record<string, unknown>) => log('error', event, data),
}
