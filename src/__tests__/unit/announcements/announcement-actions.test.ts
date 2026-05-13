import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    announcement: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth',  () => ({ auth: vi.fn() }))
vi.mock('next/cache',  () => ({ revalidatePath: vi.fn() }))

import { prisma } from '@/lib/prisma'
import { auth }   from '@/lib/auth'
import { createAnnouncement, approveAnnouncement, rejectAnnouncement } from '@/app/(dashboard)/admin/announcements/actions'

const mockAuth = auth as ReturnType<typeof vi.fn>

function makeSession(role: string, id = 'user-1') {
  return { user: { id, role, status: 'ACTIVE', name: 'Test' } }
}

describe('createAnnouncement action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('CONSEIL publie directement (status PUBLISHED)', async () => {
    mockAuth.mockResolvedValue(makeSession('CONSEIL'))
    ;(prisma.announcement.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ann-1', status: 'PUBLISHED',
    })

    const result = await createAnnouncement({
      title:   'Reunion AG',
      content: 'Nous vous informons de la prochaine assemblee generale.',
    })

    expect(result.status).toBe('PUBLISHED')
    expect(prisma.announcement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PUBLISHED' }),
      }),
    )
  })

  it('SYNDIC soumet pour approbation (status PENDING_APPROVAL)', async () => {
    mockAuth.mockResolvedValue(makeSession('SYNDIC'))
    ;(prisma.announcement.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ann-2', status: 'PENDING_APPROVAL',
    })

    const result = await createAnnouncement({
      title:   'Info travaux',
      content: 'Les travaux de renovation de la toiture debuteront en juillet.',
    })

    expect(result.status).toBe('PENDING_APPROVAL')
    expect(prisma.announcement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING_APPROVAL', publishedAt: null }),
      }),
    )
  })

  it('LOCATAIRE ne peut PAS creer une annonce', async () => {
    mockAuth.mockResolvedValue(makeSession('LOCATAIRE'))
    await expect(
      createAnnouncement({ title: 'Test', content: 'Contenu test valide ici.' }),
    ).rejects.toThrow('Permission refusee')
    expect(prisma.announcement.create).not.toHaveBeenCalled()
  })

  it('COPROPRIETAIRE ne peut PAS creer une annonce', async () => {
    mockAuth.mockResolvedValue(makeSession('COPROPRIETAIRE'))
    await expect(
      createAnnouncement({ title: 'Test', content: 'Contenu test valide ici.' }),
    ).rejects.toThrow('Permission refusee')
  })
})

describe('approveAnnouncement action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('CONSEIL peut approuver une annonce en attente', async () => {
    mockAuth.mockResolvedValue(makeSession('CONSEIL'))
    ;(prisma.announcement.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ann-2', status: 'PUBLISHED',
    })

    const result = await approveAnnouncement('ann-2')
    expect(result.success).toBe(true)
    expect(prisma.announcement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PUBLISHED' }),
      }),
    )
  })

  it('SYNDIC ne peut PAS approuver', async () => {
    mockAuth.mockResolvedValue(makeSession('SYNDIC'))
    await expect(approveAnnouncement('ann-2')).rejects.toThrow('Permission refusee')
    expect(prisma.announcement.update).not.toHaveBeenCalled()
  })
})

describe('rejectAnnouncement action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('CONSEIL peut rejeter une annonce en attente', async () => {
    mockAuth.mockResolvedValue(makeSession('CONSEIL'))
    ;(prisma.announcement.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'ann-3', status: 'DRAFT',
    })
    const result = await rejectAnnouncement('ann-3')
    expect(result.success).toBe(true)
    expect(prisma.announcement.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DRAFT' }) }),
    )
  })

  it('SYNDIC ne peut PAS rejeter', async () => {
    mockAuth.mockResolvedValue(makeSession('SYNDIC'))
    await expect(rejectAnnouncement('ann-3')).rejects.toThrow('Permission refusee')
  })
})
