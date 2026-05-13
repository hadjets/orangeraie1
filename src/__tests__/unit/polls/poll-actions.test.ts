import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    poll: {
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    pollResponse: {
      upsert: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth',  () => ({ auth: vi.fn() }))
vi.mock('next/cache',  () => ({ revalidatePath: vi.fn() }))

import { prisma } from '@/lib/prisma'
import { auth }   from '@/lib/auth'
import { submitVote, createPoll } from '@/app/(dashboard)/polls/actions'

const mockAuth = auth as ReturnType<typeof vi.fn>

function makeSession(role: string, id = 'user-1') {
  return { user: { id, role, status: 'ACTIVE', name: 'Test' } }
}

describe('submitVote action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('enregistre un vote si l utilisateur est dans l audience', async () => {
    mockAuth.mockResolvedValue(makeSession('COPROPRIETAIRE'))
    ;(prisma.poll.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'poll-1',
      targetRoles: ['COPROPRIETAIRE', 'LOCATAIRE'],
      endsAt: null,
    })
    ;(prisma.pollResponse.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({})

    const result = await submitVote('poll-1', 'option-1')
    expect(result.success).toBe(true)
    expect(prisma.pollResponse.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ pollId: 'poll-1', userId: 'user-1' }),
      }),
    )
  })

  it('bloque si l utilisateur n est PAS dans l audience', async () => {
    mockAuth.mockResolvedValue(makeSession('SYNDIC'))
    ;(prisma.poll.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      targetRoles: ['COPROPRIETAIRE'],
      endsAt: null,
    })

    await expect(submitVote('poll-1', 'option-1')).rejects.toThrow('audience')
    expect(prisma.pollResponse.upsert).not.toHaveBeenCalled()
  })

  it('bloque si le sondage est expire', async () => {
    mockAuth.mockResolvedValue(makeSession('COPROPRIETAIRE'))
    ;(prisma.poll.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      targetRoles: ['COPROPRIETAIRE'],
      endsAt: new Date('2020-01-01'),
    })

    await expect(submitVote('poll-1', 'option-1')).rejects.toThrow('termine')
    expect(prisma.pollResponse.upsert).not.toHaveBeenCalled()
  })

  it('leve une erreur si sondage introuvable', async () => {
    mockAuth.mockResolvedValue(makeSession('COPROPRIETAIRE'))
    ;(prisma.poll.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(submitVote('inexistant', 'option-1')).rejects.toThrow('introuvable')
  })
})

describe('createPoll action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('CONSEIL peut creer un sondage', async () => {
    mockAuth.mockResolvedValue(makeSession('CONSEIL'))
    ;(prisma.poll.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'poll-new', options: [],
    })

    const result = await createPoll({
      question:    'Etes-vous favorables aux nouveaux horaires ?',
      options:     ['Oui', 'Non'],
      targetRoles: ['COPROPRIETAIRE'],
    })
    expect(result.success).toBe(true)
    expect(prisma.poll.create).toHaveBeenCalled()
  })

  it('LOCATAIRE ne peut PAS creer un sondage', async () => {
    mockAuth.mockResolvedValue(makeSession('LOCATAIRE'))
    await expect(
      createPoll({ question: 'Test ?', options: ['Oui', 'Non'], targetRoles: ['LOCATAIRE'] }),
    ).rejects.toThrow('Permission refusee')
    expect(prisma.poll.create).not.toHaveBeenCalled()
  })
})
