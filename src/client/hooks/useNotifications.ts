import { useCallback, useEffect, useRef } from 'react'

export function createNotificationAudio(
  AudioCtor: typeof Audio | undefined = typeof Audio === 'undefined' ? undefined : Audio
): HTMLAudioElement | null {
  if (!AudioCtor) {
    return null
  }
  const audio = new AudioCtor('/notification.mp3')
  audio.volume = 0.6
  return audio
}

export function shouldRequestPermission(
  NotificationCtor: typeof Notification | undefined
): boolean {
  return NotificationCtor?.permission === 'default'
}

export function shouldShowNotification(
  NotificationCtor: typeof Notification | undefined,
  doc: Document | undefined
): boolean {
  return !!NotificationCtor && !!doc?.hidden && NotificationCtor.permission === 'granted'
}

export function notifyWithAudio({
  title,
  body,
  NotificationCtor,
  doc,
  audio,
}: {
  title: string
  body: string
  NotificationCtor: typeof Notification | undefined
  doc: Document | undefined
  audio: HTMLAudioElement | null
}) {
  if (shouldShowNotification(NotificationCtor, doc)) {
    // eslint-disable-next-line no-new
    new NotificationCtor!(title, { body })
  }

  audio
    ?.play()
    .catch(() => {
      // Ignore audio playback errors (often blocked by autoplay policy).
    })
}

export function useNotifications() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = createNotificationAudio()
  }, [])

  const requestPermission = useCallback(() => {
    const NotificationCtor =
      typeof Notification === 'undefined' ? undefined : Notification
    if (shouldRequestPermission(NotificationCtor)) {
      void NotificationCtor!.requestPermission()
    }
  }, [])

  const notify = useCallback((title: string, body: string) => {
    notifyWithAudio({
      title,
      body,
      NotificationCtor:
        typeof Notification === 'undefined' ? undefined : Notification,
      doc: typeof document === 'undefined' ? undefined : document,
      audio: audioRef.current,
    })
  }, [])

  return { requestPermission, notify }
}
