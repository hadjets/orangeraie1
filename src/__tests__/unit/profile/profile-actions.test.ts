import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
  },
}))
vi.mock('@/lib/auth',   () => ({ auth: vi.fn() }))
vi.mock('next/cache',   () => ({ revalidatePath: vi.fn() }))

import { prisma }              from '@/lib/prisma'
import { auth }                from '@/lib/auth'
import { updateProfile }       from '@/app/(dashboard)/settings/profile/actions'

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
}
const mockAuth = auth as ReturnType<typeof vi.fn>

beforeEach(() => { vi.clearAllMocks() })

describe('updateProfile action', () => {
  it('met à jour le nom', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', name: 'Nouveau Nom' })

    const result = await updateProfile({ name: 'Nouveau Nom' })
    expect(result.success).toBe(true)
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'Nouveau Nom' }) })
    )
  })

  it('rejette un nom trop court (< 2 caractères)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    await expect(updateProfile({ name: 'A' })).rejects.toThrow()
  })

  it('rejette un nom vide', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    await expect(updateProfile({ name: '' })).rejects.toThrow()
  })

  it('non authentifié → erreur', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(updateProfile({ name: 'Test' })).rejects.toThrow('Non authentifie')
  })

  it('met à jour l apartment', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } })
    mockPrisma.user.update.mockResolvedValue({ id: 'u1', apartment: 'B12' })

    const result = await updateProfile({ name: 'Jean Dupont', apartment: 'B12' })
    expect(result.success).toBe(true)
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ apartment: 'B12' }) })
    )
  })
})
