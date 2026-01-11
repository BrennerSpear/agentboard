import { EventEmitter } from 'node:events'
import type { Session } from '../shared/types'

export interface RegistryEvents {
  sessions: (sessions: Session[]) => void
  'session-update': (session: Session) => void
  'session-removed': (sessionId: string) => void
}

export class SessionRegistry extends EventEmitter {
  private sessions: Map<string, Session>

  constructor() {
    super()
    this.sessions = new Map<string, Session>()
  }

  getAll(): Session[] {
    return Array.from(this.sessions.values())
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId)
  }

  replaceSessions(nextSessions: Session[]): void {
    const nextMap = new Map<string, Session>()

    for (const session of nextSessions) {
      const existing = this.sessions.get(session.id)
      const nextLastActivity = pickLatestActivity(
        existing?.lastActivity,
        session.lastActivity
      )
      // Preserve createdAt from existing session, or use incoming/current time
      const createdAt =
        existing?.createdAt || session.createdAt || new Date().toISOString()
      nextMap.set(session.id, {
        ...session,
        lastActivity: nextLastActivity,
        createdAt,
      })
    }

    const removedIds = new Set(this.sessions.keys())
    for (const id of nextMap.keys()) {
      removedIds.delete(id)
    }

    // Check if anything actually changed
    const changedSessions: string[] = []
    for (const next of nextMap.values()) {
      const existing = this.sessions.get(next.id)
      if (!existing || !sessionsEqual(existing, next)) {
        const changes: string[] = []
        if (!existing) {
          changes.push('new')
        } else {
          if (existing.status !== next.status) changes.push(`status: ${existing.status} → ${next.status}`)
          if (existing.lastActivity !== next.lastActivity) changes.push(`lastActivity changed`)
          if (existing.name !== next.name) changes.push(`name: ${existing.name} → ${next.name}`)
        }
        changedSessions.push(`${next.name}: ${changes.join(', ')}`)
      }
    }

    const hasChanges = removedIds.size > 0 || nextMap.size !== this.sessions.size || changedSessions.length > 0

    this.sessions = nextMap

    if (hasChanges) {
      console.log('[SessionRegistry] Changes detected:', changedSessions.length > 0 ? changedSessions : 'added/removed')
      this.emit('sessions', this.getAll())
    }

    for (const id of removedIds) {
      this.emit('session-removed', id)
    }
  }

  updateSession(sessionId: string, updates: Partial<Session>): Session | undefined {
    const current = this.sessions.get(sessionId)
    if (!current) {
      return undefined
    }

    const updated = {
      ...current,
      ...updates,
    }

    this.sessions.set(sessionId, updated)
    this.emit('session-update', updated)
    return updated
  }
}

function pickLatestActivity(
  existing: string | undefined,
  incoming: string
): string {
  if (!existing) {
    return incoming
  }

  const existingTime = Date.parse(existing)
  const incomingTime = Date.parse(incoming)

  if (Number.isNaN(existingTime) && Number.isNaN(incomingTime)) {
    return incoming
  }
  if (Number.isNaN(existingTime)) {
    return incoming
  }
  if (Number.isNaN(incomingTime)) {
    return existing
  }

  return incomingTime > existingTime ? incoming : existing
}

function sessionsEqual(a: Session, b: Session): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.status === b.status &&
    a.lastActivity === b.lastActivity &&
    a.projectPath === b.projectPath &&
    a.agentType === b.agentType &&
    a.command === b.command
  )
}
