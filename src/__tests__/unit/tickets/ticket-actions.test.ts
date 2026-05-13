import { describe, it, expect, vi, beforeEach } from 'vitest'

// Les mocks DOIVENT être déclarés avant tous les imports de modules qui les utilisent
vi.mock('@/lib/prisma', () => ({
  prisma: {
    ticket: {
      create:     vi.fn(),
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
    ticketComment: {
      create: vi.fn(),
    },
  },
}))
vi.mock('@/lib/auth',  () => ({ auth: vi.fn() }))
vi.mock('next/cache',  () => ({ revalidatePath: vi.fn() }))

import { prisma } from '@/lib/prisma'
import { auth }   from '@/lib/auth'
import { createTicket, updateTicketStatus, addTicketComment } from '@/app/(dashboard)/tickets/actions'

const mockAuth = auth as ReturnType<typeof vi.fn>

function makeSession(role: string, id = 'user-1') {
  return { user: { id, role, status: 'ACTIVE', name: 'Test User' } }
}

describe('createTicket action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cree un ticket avec status PENDING', async () => {
    mockAuth.mockResolvedValue(makeSession('COPROPRIETAIRE'))
    ;(prisma.ticket.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ticket-1', status: 'PENDING',
    })

    const result = await createTicket({
      title:       'Fuite cave',
      description: 'Il y a une fuite importante dans la cave.',
      location:    'COMMUN',
      photoUrls:   [],
    })

    expect(result.success).toBe(true)
    expect(prisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING', createdById: 'user-1' }),
      }),
    )
  })

  it('leve une erreur si non authentifie', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(
      createTicket({ title: 'Test', description: 'Description valide ok.', location: 'COMMUN', photoUrls: [] }),
    ).rejects.toThrow('Non authentifie')
  })

  it('rejette un titre trop court (validation Zod)', async () => {
    mockAuth.mockResolvedValue(makeSession('COPROPRIETAIRE'))
    await expect(
      createTicket({ title: 'AB', description: 'Description valide ok.', location: 'COMMUN', photoUrls: [] }),
    ).rejects.toThrow()
  })
})

describe('updateTicketStatus action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('permet a CONSEIL d approuver un ticket', async () => {
    mockAuth.mockResolvedValue(makeSession('CONSEIL'))
    ;(prisma.ticket.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ticket-1', status: 'APPROVED',
    })

    const result = await updateTicketStatus('ticket-1', 'APPROVED')
    expect(result.success).toBe(true)
    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED', validatedById: 'user-1' }),
      }),
    )
  })

  it('bloque un LOCATAIRE qui tente de valider', async () => {
    mockAuth.mockResolvedValue(makeSession('LOCATAIRE'))
    await expect(updateTicketStatus('ticket-1', 'APPROVED')).rejects.toThrow('Permission refusee')
  })

  it('bloque un SYNDIC qui tente de valider', async () => {
    mockAuth.mockResolvedValue(makeSession('SYNDIC'))
    await expect(updateTicketStatus('ticket-1', 'APPROVED')).rejects.toThrow('Permission refusee')
  })

  it('permet a SYNDIC de passer a IN_PROGRESS', async () => {
    mockAuth.mockResolvedValue(makeSession('SYNDIC'))
    ;(prisma.ticket.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ticket-1', status: 'IN_PROGRESS',
    })
    const result = await updateTicketStatus('ticket-1', 'IN_PROGRESS')
    expect(result.success).toBe(true)
  })
})

describe('addTicketComment action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('le createur peut commenter son ticket', async () => {
    mockAuth.mockResolvedValue(makeSession('COPROPRIETAIRE', 'creator-1'))
    ;(prisma.ticket.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ticket-1', createdById: 'creator-1',
    })
    ;(prisma.ticketComment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'comment-1',
      author: { name: 'Test', role: 'COPROPRIETAIRE' },
    })

    const result = await addTicketComment('ticket-1', 'Merci pour le suivi.')
    expect(result.success).toBe(true)
    expect(prisma.ticketComment.create).toHaveBeenCalled()
  })

  it('CONSEIL peut commenter n importe quel ticket', async () => {
    mockAuth.mockResolvedValue(makeSession('CONSEIL', 'conseil-1'))
    ;(prisma.ticket.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ticket-1', createdById: 'autre-user',
    })
    ;(prisma.ticketComment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'comment-2',
      author: { name: 'Conseil', role: 'CONSEIL' },
    })

    const result = await addTicketComment('ticket-1', 'Pris en charge.')
    expect(result.success).toBe(true)
  })

  it('un COPROPRIETAIRE ne peut pas commenter le ticket de quelqu un d autre', async () => {
    mockAuth.mockResolvedValue(makeSession('COPROPRIETAIRE', 'user-B'))
    ;(prisma.ticket.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ticket-1', createdById: 'user-A',
    })

    await expect(addTicketComment('ticket-1', 'Commentaire non autorise')).rejects.toThrow('Acces refuse')
    expect(prisma.ticketComment.create).not.toHaveBeenCalled()
  })

  it('rejette un commentaire vide', async () => {
    mockAuth.mockResolvedValue(makeSession('CONSEIL'))
    ;(prisma.ticket.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ticket-1', createdById: 'other',
    })

    await expect(addTicketComment('ticket-1', '   ')).rejects.toThrow('vide')
  })
})
