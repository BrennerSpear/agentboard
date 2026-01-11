import { useEffect } from 'react'

export function updateFaviconBadge(
  active: boolean,
  doc: Document = document
): boolean {
  const link = doc.querySelector(
    'link[rel="icon"]'
  ) as HTMLLinkElement | null
  if (!link) {
    return false
  }

  link.href = active ? '/favicon-badge.svg' : '/favicon.svg'
  return true
}

export function useFaviconBadge(active: boolean) {
  useEffect(() => {
    updateFaviconBadge(active)
  }, [active])
}
