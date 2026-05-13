import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/messages/unread
 * Retourne le nombre total de messages non lus pour l'utilisateur connecté.
 * Utilisé par le badge dans la nav.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ count: 0 })

  // Pour chaque conversation dont l'utilisateur est membre,
  // compter les messages postés après son lastReadAt (ou depuis le début si jamais lu)
  const memberships = await prisma.conversationMember.findMany({
    where: { userId: session.user.id },
    select: { conversationId: true, lastReadAt: true },
  })

  if (memberships.length === 0) return NextResponse.json({ count: 0 })

  const counts = await Promise.all(
    memberships.map((m) =>
      prisma.message.count({
        where: {
          conversationId: m.conversationId,
          senderId: { not: session.user.id }, // ne pas compter ses propres messages
          createdAt: m.lastReadAt ? { gt: m.lastReadAt } : undefined,
        },
      }),
    ),
  )

  const total = counts.reduce((a, b) => a + b, 0)
  return NextResponse.json({ count: total })
}
