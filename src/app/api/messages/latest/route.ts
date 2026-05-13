import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/messages/latest?conversationId=xxx
 * Retourne le createdAt du message le plus récent dans une conversation.
 * Utilisé par le composant RealtimeMessages pour détecter les nouveaux messages.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ lastAt: null })

  const conversationId = req.nextUrl.searchParams.get('conversationId')
  if (!conversationId) return NextResponse.json({ lastAt: null })

  // Vérifier que l'utilisateur est bien membre
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: session.user.id },
    },
  })
  if (!member) return NextResponse.json({ lastAt: null }, { status: 403 })

  const latest = await prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })

  return NextResponse.json({ lastAt: latest?.createdAt.toISOString() ?? null })
}
