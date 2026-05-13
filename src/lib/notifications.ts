import { prisma } from './prisma'
import { sendPushToUser as sendPush } from './push'
import type { NotificationPreference } from '@prisma/client'

type NotifType = keyof Omit<NotificationPreference, 'id' | 'userId' | 'emailEnabled' | 'pushEnabled'>

export function shouldNotify(
  prefs: NotificationPreference | null,
  type: NotifType,
): boolean {
  if (!prefs) return true
  return prefs[type] === true
}

export function shouldSendPush(prefs: NotificationPreference | null): boolean {
  if (!prefs) return true
  return prefs.pushEnabled === true
}

export function shouldSendEmail(prefs: NotificationPreference | null): boolean {
  if (!prefs) return true
  return prefs.emailEnabled === true
}

/**
 * Notifie un utilisateur en respectant ses préférences.
 */
export async function notifyUser(
  userId: string,
  type: NotifType,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } })

  if (!shouldNotify(prefs, type)) return
  if (shouldSendPush(prefs)) {
    await sendPush(userId, {
      title: payload.title,
      body:  payload.body,
      data:  { url: payload.url ?? '/' },
    })
  }
  // Email via Resend — activé quand RESEND_API_KEY est présent
  if (shouldSendEmail(prefs) && process.env.RESEND_API_KEY) {
    // TODO : appel Resend (Phase 4b — nécessite template email)
  }
}

/**
 * Notifie tous les résidents actifs.
 */
export async function notifyAllResidents(
  type: NotifType,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const residents = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  })
  await Promise.allSettled(residents.map((r) => notifyUser(r.id, type, payload)))
}
