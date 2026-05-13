'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { ticketSchema, type CreateTicketInput } from './schemas'

export async function createTicket(input: CreateTicketInput) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')

  const data = ticketSchema.parse(input)

  const ticket = await prisma.ticket.create({
    data: {
      ...data,
      createdById: session.user.id,
      status:      'PENDING',
    },
  })

  revalidatePath('/tickets')
  return { success: true, ticketId: ticket.id }
}

export async function updateTicketStatus(
  ticketId: string,
  status: 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'RESOLVED',
) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')

  if (status === 'APPROVED' || status === 'REJECTED') {
    if (!can.validateTicket(session.user.role)) {
      throw new Error('Permission refusee : seul le Conseil ou Admin peut valider')
    }
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      ...(status === 'APPROVED' || status === 'REJECTED'
        ? { validatedById: session.user.id, validatedAt: new Date() }
        : {}),
    },
  })

  revalidatePath('/tickets')
  revalidatePath(`/tickets/${ticketId}`)
  return { success: true }
}

export async function addTicketComment(ticketId: string, content: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')

  if (!content.trim()) throw new Error('Commentaire vide')

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('Ticket introuvable')

  const canComment =
    ticket.createdById === session.user.id ||
    ['ADMIN', 'CONSEIL', 'SYNDIC'].includes(session.user.role)
  if (!canComment) throw new Error('Acces refuse')

  const comment = await prisma.ticketComment.create({
    data: { content, ticketId, authorId: session.user.id },
    include: { author: { select: { name: true, role: true } } },
  })

  revalidatePath(`/tickets/${ticketId}`)
  return { success: true, comment }
}
