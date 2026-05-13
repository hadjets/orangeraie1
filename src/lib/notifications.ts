import { prisma } from './prisma'
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

export function buildPushPayload(
  title: string,
  body: string,
  url?: string,
): string {
  return JSON.stringify({ title, body, url: url ?? '/' })
}

/**
 * Envoie une notification push web à tous les appareils d'un utilisateur.
 * Nécessite NEXT_PUBLIC_VAPID_KEY et VAPID_PRIVATE_KEY dans .env.
 * En dev sans clés VAPID : log console uniquement.
 */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, type: 'web' },
  })

  if (subscriptions.length === 0) return

  const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY

  if (!vapidPublic || !vapidPrivate) {
    console.log('[notifications] VAPID keys not configured — skipping push:', payload)
    return
  }

  // Import dynamique pour éviter l'erreur côté client
  const webpush = await import('web-push')
  webpush.default.setVapidDetails(
    'mailto:admin@orangeraie1.fr',
    vapidPublic,
    vapidPrivate,
  )

  await Promise.allSettled(
    subscriptions
      .filter((s) => s.p256dh && s.auth)
      .map((sub) =>
        webpush.default.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh!, auth: sub.auth! } },
          buildPushPayload(payload.title, payload.body, payload.url),
        ),
      ),
  )
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
    await sendPushToUser(userId, payload)
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
