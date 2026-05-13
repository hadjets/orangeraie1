import { describe, it, expect, vi, beforeEach } from 'vitest'

// Logique pure des préférences — testable sans DB ni web-push
interface NotifPrefs {
  newMessage:      boolean
  ticketUpdate:    boolean
  newAnnouncement: boolean
  newPoll:         boolean
  emailEnabled:    boolean
  pushEnabled:     boolean
}

// Retourne true si on doit envoyer une notification de ce type
function shouldNotify(
  prefs: NotifPrefs | null,
  type: keyof Omit<NotifPrefs, 'emailEnabled' | 'pushEnabled'>,
): boolean {
  if (!prefs) return true          // Pas de préfs = comportement par défaut = notifier
  return prefs[type] === true
}

function shouldSendPush(prefs: NotifPrefs | null): boolean {
  if (!prefs) return true
  return prefs.pushEnabled === true
}

function shouldSendEmail(prefs: NotifPrefs | null): boolean {
  if (!prefs) return true
  return prefs.emailEnabled === true
}

// Construit le payload push
function buildPushPayload(title: string, body: string, url?: string): string {
  return JSON.stringify({ title, body, url: url ?? '/' })
}

describe('notifications — shouldNotify', () => {
  const fullPrefs: NotifPrefs = {
    newMessage:      true,
    ticketUpdate:    true,
    newAnnouncement: true,
    newPoll:         true,
    emailEnabled:    true,
    pushEnabled:     true,
  }

  it('notifie si prefs = null (defaut activé)', () => {
    expect(shouldNotify(null, 'newMessage')).toBe(true)
  })

  it('notifie si la préference est activée', () => {
    expect(shouldNotify(fullPrefs, 'newMessage')).toBe(true)
  })

  it('ne notifie PAS si la préférence est désactivée', () => {
    const prefs: NotifPrefs = { ...fullPrefs, newMessage: false }
    expect(shouldNotify(prefs, 'newMessage')).toBe(false)
  })

  it('ne notifie PAS newPoll si désactivé', () => {
    const prefs: NotifPrefs = { ...fullPrefs, newPoll: false }
    expect(shouldNotify(prefs, 'newPoll')).toBe(false)
  })

  it('respecte chaque type independamment', () => {
    const prefs: NotifPrefs = {
      ...fullPrefs,
      ticketUpdate:    false,
      newAnnouncement: true,
    }
    expect(shouldNotify(prefs, 'ticketUpdate')).toBe(false)
    expect(shouldNotify(prefs, 'newAnnouncement')).toBe(true)
  })
})

describe('notifications — shouldSendPush / shouldSendEmail', () => {
  it('envoie push si pushEnabled = true', () => {
    expect(shouldSendPush({ pushEnabled: true, emailEnabled: true, newMessage: true, ticketUpdate: true, newAnnouncement: true, newPoll: true })).toBe(true)
  })

  it('ne envoie PAS push si pushEnabled = false', () => {
    expect(shouldSendPush({ pushEnabled: false, emailEnabled: true, newMessage: true, ticketUpdate: true, newAnnouncement: true, newPoll: true })).toBe(false)
  })

  it('envoie email si emailEnabled = true', () => {
    expect(shouldSendEmail({ emailEnabled: true, pushEnabled: true, newMessage: true, ticketUpdate: true, newAnnouncement: true, newPoll: true })).toBe(true)
  })

  it('ne envoie PAS email si emailEnabled = false', () => {
    expect(shouldSendEmail({ emailEnabled: false, pushEnabled: true, newMessage: true, ticketUpdate: true, newAnnouncement: true, newPoll: true })).toBe(false)
  })

  it('envoie par defaut si prefs = null', () => {
    expect(shouldSendPush(null)).toBe(true)
    expect(shouldSendEmail(null)).toBe(true)
  })
})

describe('notifications — buildPushPayload', () => {
  it('serialise correctement le payload', () => {
    const payload = JSON.parse(buildPushPayload('Titre', 'Corps', '/feed'))
    expect(payload.title).toBe('Titre')
    expect(payload.body).toBe('Corps')
    expect(payload.url).toBe('/feed')
  })

  it('url par defaut = "/" si non fournie', () => {
    const payload = JSON.parse(buildPushPayload('T', 'B'))
    expect(payload.url).toBe('/')
  })
})
