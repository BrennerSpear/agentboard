/**
 * useVisualViewport - Handles mobile keyboard appearance by tracking visual viewport
 * Sets CSS custom property --keyboard-inset for bottom offset when keyboard is open
 */

import { useEffect } from 'react'

export function updateKeyboardInset({
  viewport,
  win,
  doc,
}: {
  viewport: VisualViewport | null | undefined
  win: Window
  doc: Document
}): boolean {
  if (!viewport) {
    return false
  }

  const keyboardHeight = win.innerHeight - viewport.height
  doc.documentElement.style.setProperty(
    '--keyboard-inset',
    `${Math.max(0, keyboardHeight)}px`
  )
  return true
}

export function clearKeyboardInset(doc: Document) {
  doc.documentElement.style.removeProperty('--keyboard-inset')
}

export function useVisualViewport() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const updateViewport = () => {
      updateKeyboardInset({ viewport, win: window, doc: document })
    }

    // Initial update
    updateViewport()

    // Listen for viewport changes (keyboard show/hide, zoom, scroll)
    viewport.addEventListener('resize', updateViewport)
    viewport.addEventListener('scroll', updateViewport)

    return () => {
      viewport.removeEventListener('resize', updateViewport)
      viewport.removeEventListener('scroll', updateViewport)
      clearKeyboardInset(document)
    }
  }, [])
}
