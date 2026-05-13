/**
 * Utilitaire serveur — envoi de push notifications via web-push
 *
 * Usage :
 *   import { sendPushToUser } from '@/lib/push'
 *   await sendPushToUser(userId, { title: 'Nouveau message', body: 'Alice : Bonjour !', data: { url: '/messages/xxx' } })
 */

import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

// ── Configuration VAPID ────────────────────────────────────────────────────
// Les clés sont générées une seule fois avec :  npx web-push generate-vapid-keys
// Puis injectées dans .env / Vercel Environment Variables
webpush.setVapidDetails(
  'mailto:admin@orangeraie1.fr',
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export interface PushPayload {
  title:    string
  body:     string
  icon?:    string
  badge?:   string
  tag?:     string
  data?:    Record<string, unknown>
  actions?: Array<{ action: string; title: string }>
}

/**
 * Envoie une notification push à tous les appareils enregistrés d'un utilisateur.
 * Les abonnements expirés (410 Gone) sont supprimés automatiquement.
 */
export async function sendPushToUser(
  userId:  string,
  payload: PushPayload,
): Promise<void> {
  // Charger les préférences + subscriptions en une seule requête
  const [prefs, subscriptions] = await Promise.all([
    prisma.notificationPreference.findUnique({ where: { userId } }),
    prisma.pushSubscription.findMany({ where: { userId } }),
  ])

  // Respecter le choix de l'utilisateur
  if (prefs && !prefs.pushEnabled) return
  if (subscriptions.length === 0)  return

  const body = JSON.stringify(payload)

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            ...(sub.p256dh && sub.auth
              ? { keys: { p256dh: sub.p256dh, auth: sub.auth } }
              : {}),
          } as any,
          body,
        )
      } catch (err: unknown) {
        // 410 Gone = subscription révoquée par le navigateur → nettoyage
        if (
          err &&
          typeof err === 'object' &&
          'statusCode' in err &&
          (err as { statusCode: number }).statusCode === 410
        ) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null)
        }
        // Les autres erreurs sont silencieuses (réseau, etc.) — ne pas faire planter l'action
      }
    }),
  )
}

/**
 * Supprime toutes les subscriptions d'un utilisateur
 * (appelé quand pushEnabled passe à false)
 */
export async function clearPushSubscriptions(userId: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { userId } })
}
