'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { getOrCreateDirectConversation } from '@/lib/queries/messages'
import { revalidatePath } from 'next/cache'
import { sendPushToUser } from '@/lib/push'

const messageSchema = z.object({
  conversationId: z.string().min(1),
  content:        z.string().min(1, 'Message vide').max(5000, 'Message trop long'),
  attachmentUrls: z.array(z.string().url()).max(10).optional(),
})

export async function sendMessage(input: z.infer<typeof messageSchema>) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')

  const data = messageSchema.parse(input)

  // Vérifier que l'utilisateur est membre de la conversation
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId: data.conversationId,
        userId: session.user.id,
      },
    },
  })
  if (!member) throw new Error('Acces refuse : vous n\'etes pas membre de cette conversation')

  const message = await prisma.message.create({
    data: {
      content:        data.content,
      attachmentUrls: data.attachmentUrls ?? [],
      conversationId: data.conversationId,
      senderId:       session.user.id,
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  })

  revalidatePath(`/messages/${data.conversationId}`)

  // Notifier les autres membres de la conversation (push silencieuse si erreur)
  try {
    const members = await prisma.conversationMember.findMany({
      where: { conversationId: data.conversationId, userId: { not: session.user.id } },
      select: { userId: true },
    })
    const senderName = message.sender.name ?? 'Quelqu\'un'
    await Promise.allSettled(
      members.map((m) =>
        sendPushToUser(m.userId, {
          title: `Message de ${senderName}`,
          body:  data.content.length > 80 ? data.content.slice(0, 80) + '…' : data.content,
          tag:   `msg-${data.conversationId}`,
          data:  { url: `/messages/${data.conversationId}` },
        }),
      ),
    )
  } catch { /* push non bloquante */ }

  return { success: true, message }
}

export async function deleteMessageForMe(messageId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')

  // Vérifier que le message existe
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  if (!message) throw new Error('Message introuvable')

  // Soft delete — jamais de DELETE physique
  await prisma.deletedMessage.upsert({
    where:  { messageId_userId: { messageId, userId: session.user.id } },
    create: { messageId, userId: session.user.id },
    update: {},
  })

  revalidatePath(`/messages/${message.conversationId}`)
  return { success: true }
}

export async function startConversation(targetUserId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')
  if (targetUserId === session.user.id) throw new Error('Impossible de se contacter soi-meme')

  // Vérifier la permission RBAC
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true },
  })
  if (!target) throw new Error('Utilisateur introuvable')

  if (!can.messageUser(session.user.role, target.role)) {
    throw new Error('Vous ne pouvez pas contacter cet utilisateur')
  }

  const conversationId = await getOrCreateDirectConversation(
    session.user.id,
    targetUserId,
  )

  revalidatePath('/messages')
  return { success: true, conversationId }
}
