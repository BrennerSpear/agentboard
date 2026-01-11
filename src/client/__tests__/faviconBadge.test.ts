import { describe, expect, test } from 'bun:test'
import { updateFaviconBadge } from '../hooks/useFaviconBadge'

describe('updateFaviconBadge', () => {
  test('updates the favicon href when link exists', () => {
    const link = { href: '' }
    const doc = {
      querySelector: (selector: string) =>
        selector === 'link[rel="icon"]' ? link : null,
    } as unknown as Document

    const updated = updateFaviconBadge(true, doc)
    expect(updated).toBe(true)
    expect(link.href).toBe('/favicon-badge.svg')

    updateFaviconBadge(false, doc)
    expect(link.href).toBe('/favicon.svg')
  })

  test('returns false when favicon link is missing', () => {
    const doc = {
      querySelector: () => null,
    } as unknown as Document

    expect(updateFaviconBadge(true, doc)).toBe(false)
  })
})
