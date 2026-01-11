import { describe, expect, test } from 'bun:test'
import {
  createNotificationAudio,
  notifyWithAudio,
  shouldRequestPermission,
  shouldShowNotification,
} from '../hooks/useNotifications'

describe('notifications helpers', () => {
  test('creates audio with volume set', () => {
    class FakeAudio {
      volume = 1
      constructor(public src: string) {}
    }

    const audio = createNotificationAudio(FakeAudio as unknown as typeof Audio)
    expect(audio).toBeTruthy()
    expect(audio?.volume).toBe(0.6)
    expect((audio as unknown as FakeAudio).src).toBe('/notification.mp3')
  })

  test('checks permission request and notification visibility', () => {
    class FakeNotification {
      static permission: NotificationPermission = 'default'
      static requestPermission = async () => FakeNotification.permission
    }

    const NotificationCtor = FakeNotification as unknown as typeof Notification

    expect(shouldRequestPermission(NotificationCtor)).toBe(true)

    FakeNotification.permission = 'granted'
    const docHidden = { hidden: true } as unknown as Document
    expect(shouldShowNotification(NotificationCtor, docHidden)).toBe(true)

    const docVisible = { hidden: false } as unknown as Document
    expect(shouldShowNotification(NotificationCtor, docVisible)).toBe(false)
  })

  test('notifies when allowed and plays audio', async () => {
    const created: Array<{ title: string; body: string }> = []

    class FakeNotification {
      static permission: NotificationPermission = 'granted'
      static requestPermission = async () => FakeNotification.permission
      constructor(title: string, options: { body?: string }) {
        created.push({ title, body: options.body ?? '' })
      }
    }

    let played = false
    const audio = {
      play: () => {
        played = true
        return Promise.resolve()
      },
    } as HTMLAudioElement

    notifyWithAudio({
      title: 'Hello',
      body: 'World',
      NotificationCtor: FakeNotification as unknown as typeof Notification,
      doc: { hidden: true } as Document,
      audio,
    })

    expect(created).toEqual([{ title: 'Hello', body: 'World' }])
    expect(played).toBe(true)
  })
})
