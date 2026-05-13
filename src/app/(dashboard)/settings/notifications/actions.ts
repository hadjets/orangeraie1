'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const prefsSchema = z.object({
  newMessage:      z.boolean(),
  ticketUpdate:    z.boolean(),
  newAnnouncement: z.boolean(),
  newPoll:         z.boolean(),
  emailEnabled:    z.boolean(),
  pushEnabled:     z.boolean(),
})

export async function updateNotificationPreferences(
  input: z.infer<typeof prefsSchema>,
) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')

  const data = prefsSchema.parse(input)

  await prisma.notificationPreference.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  })

  revalidatePath('/settings/notifications')
  return { success: true }
}

export async function subscribeWebPush(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')

  await prisma.pushSubscription.upsert({
    where:  { endpoint: subscription.endpoint },
    create: {
      userId:   session.user.id,
      endpoint: subscription.endpoint,
      type:     'web',
      p256dh:   subscription.keys.p256dh,
      auth:     subscription.keys.auth,
    },
    update: {
      userId: session.user.id,
      p256dh: subscription.keys.p256dh,
      auth:   subscription.keys.auth,
    },
  })

  return { success: true }
}
