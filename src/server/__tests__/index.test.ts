import { afterAll, describe, expect, test } from 'bun:test'

const bunAny = Bun as typeof Bun & {
  serve: typeof Bun.serve
  spawnSync: typeof Bun.spawnSync
}

const originalServe = bunAny.serve
const originalSpawnSync = bunAny.spawnSync
const originalSetInterval = globalThis.setInterval

const serveCalls: Array<{ port: number }> = []

describe('server entrypoint', () => {
  test('starts server without side effects', async () => {
    bunAny.spawnSync = () =>
      ({
        exitCode: 0,
        stdout: Buffer.from(''),
        stderr: Buffer.from(''),
      }) as ReturnType<typeof Bun.spawnSync>
    bunAny.serve = ((options: { port?: number }) => {
      serveCalls.push({ port: options.port ?? 0 })
      return {} as ReturnType<typeof Bun.serve>
    }) as unknown as typeof Bun.serve
    globalThis.setInterval = (() => 0) as unknown as typeof globalThis.setInterval

    await import('../index')

    const expectedPort = Number(process.env.PORT) || 4040
    expect(serveCalls).toHaveLength(1)
    expect(serveCalls[0]?.port).toBe(expectedPort)
  })
})

afterAll(() => {
  bunAny.serve = originalServe
  bunAny.spawnSync = originalSpawnSync
  globalThis.setInterval = originalSetInterval
})
