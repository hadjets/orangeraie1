import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Prisma ──────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  prisma: {
    invitation: {
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
  },
}))
vi.mock('@/lib/auth',           () => ({ auth: vi.fn() }))
vi.mock('next/cache',           () => ({ revalidatePath: vi.fn() }))

import { prisma }        from '@/lib/prisma'
import { auth }          from '@/lib/auth'
import { createInvitation, acceptInvitation, revokeInvitation } from '@/app/(dashboard)/admin/users/invite-actions'

const mockPrisma = prisma as unknown as {
  invitation: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  user:       { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
}
const mockAuth = auth as ReturnType<typeof vi.fn>

beforeEach(() => { vi.clearAllMocks() })

// ── createInvitation ─────────────────────────────────────────────────────────
describe('createInvitation action', () => {
  it('CONSEIL peut créer une invitation', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'CONSEIL' } })
    mockPrisma.invitation.create.mockResolvedValue({ id: 'inv1', token: 'tok_abc' })

    const result = await createInvitation({ email: 'new@resident.fr', role: 'LOCATAIRE' })
    expect(result.success).toBe(true)
    expect(mockPrisma.invitation.create).toHaveBeenCalledOnce()
  })

  it('LOCATAIRE ne peut pas créer une invitation', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'LOCATAIRE' } })
    await expect(createInvitation({ email: 'x@y.com', role: 'LOCATAIRE' }))
      .rejects.toThrow('Permission refusee')
  })

  it('non authentifié → erreur', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(createInvitation({ email: 'x@y.com', role: 'LOCATAIRE' }))
      .rejects.toThrow('Non authentifie')
  })

  it('rejette un email invalide', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'CONSEIL' } })
    await expect(createInvitation({ email: 'pas-un-email', role: 'LOCATAIRE' }))
      .rejects.toThrow()
  })
})

// ── revokeInvitation ─────────────────────────────────────────────────────────
describe('revokeInvitation action', () => {
  it('ADMIN peut révoquer une invitation', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
    mockPrisma.invitation.update.mockResolvedValue({})

    const result = await revokeInvitation('inv1')
    expect(result.success).toBe(true)
  })

  it('LOCATAIRE ne peut pas révoquer', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'LOCATAIRE' } })
    await expect(revokeInvitation('inv1')).rejects.toThrow('Permission refusee')
  })
})
describe('acceptInvitation action', () => {
  it('accepte un token valide non expiré', async () => {
    const futureDate = new Date(Date.now() + 86_400_000)
    mockPrisma.invitation.findUnique.mockResolvedValue({
      id: 'inv1', token: 'tok_abc', email: 'a@b.com',
      role: 'LOCATAIRE', expiresAt: futureDate, usedAt: null,
    })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u5', email: 'a@b.com' })
    mockPrisma.invitation.update.mockResolvedValue({})
    mockPrisma.user.update.mockResolvedValue({})

    const result = await acceptInvitation('tok_abc')
    expect(result.success).toBe(true)
  })

  it('rejette un token inexistant', async () => {
    mockPrisma.invitation.findUnique.mockResolvedValue(null)
    await expect(acceptInvitation('tok_invalid')).rejects.toThrow('Invitation introuvable')
  })

  it('rejette un token déjà utilisé', async () => {
    mockPrisma.invitation.findUnique.mockResolvedValue({
      id: 'inv1', token: 'tok_used', usedAt: new Date(), expiresAt: new Date(Date.now() + 86_400_000),
    })
    await expect(acceptInvitation('tok_used')).rejects.toThrow('Invitation déjà utilisée')
  })

  it('rejette un token expiré', async () => {
    mockPrisma.invitation.findUnique.mockResolvedValue({
      id: 'inv1', token: 'tok_exp', usedAt: null, expiresAt: new Date(Date.now() - 1000),
    })
    await expect(acceptInvitation('tok_exp')).rejects.toThrow('Invitation expirée')
  })
})
