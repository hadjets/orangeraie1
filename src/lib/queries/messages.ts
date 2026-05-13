import { prisma } from '@/lib/prisma'

export async function getConversationsForUser(userId: string) {
  return prisma.conversation.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
      },
      messages: {
        where: {
          deletedBy: { none: { userId } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getMessages(conversationId: string, currentUserId: string) {
  return prisma.message.findMany({
    where: {
      conversationId,
      deletedBy: { none: { userId: currentUserId } },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
    },
  })
}

export async function getOrCreateDirectConversation(
  userAId: string,
  userBId: string,
): Promise<string> {
  // Chercher une conversation directe existante entre les deux utilisateurs
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId: userAId } } },
        { members: { some: { userId: userBId } } },
      ],
    },
  })

  if (existing) return existing.id

  const conv = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        create: [{ userId: userAId }, { userId: userBId }],
      },
    },
  })

  return conv.id
}
