import { afterEach, describe, expect, test } from 'bun:test'
import { generateSessionName } from '../nameGenerator'

const originalRandom = Math.random

afterEach(() => {
  Math.random = originalRandom
})

describe('generateSessionName', () => {
  test('uses adjective and noun with hyphen', () => {
    Math.random = () => 0
    expect(generateSessionName()).toBe('bold-arch')
  })

  test('picks last entries when random is near 1', () => {
    Math.random = () => 0.999999
    expect(generateSessionName()).toBe('fresh-yarn')
  })
})
