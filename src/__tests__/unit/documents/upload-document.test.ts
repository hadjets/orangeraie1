import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    document:       { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    documentFolder: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}))
vi.mock('@/lib/auth',  () => ({ auth: vi.fn() }))
vi.mock('next/cache',  () => ({ revalidatePath: vi.fn() }))

import { prisma }       from '@/lib/prisma'
import { auth }         from '@/lib/auth'
import { uploadDocument, deleteDocument } from '@/app/(dashboard)/admin/documents/actions'

const mockPrisma = prisma as unknown as {
  document:       { findMany: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }
  documentFolder: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> }
}
const mockAuth = auth as ReturnType<typeof vi.fn>

beforeEach(() => { vi.clearAllMocks() })

describe('uploadDocument action', () => {
  it('CONSEIL peut uploader un document', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'CONSEIL' } })
    mockPrisma.documentFolder.findUnique.mockResolvedValue({ id: 'f1', name: 'Règlements' })
    mockPrisma.document.create.mockResolvedValue({ id: 'd1', name: 'reglement.pdf' })

    const result = await uploadDocument({
      name:     'reglement.pdf',
      fileUrl:  'https://cdn.example.com/reglement.pdf',
      fileType: 'application/pdf',
      fileSize: 102400,
      folderId: 'f1',
    })
    expect(result.success).toBe(true)
  })

  it('LOCATAIRE ne peut pas uploader', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'LOCATAIRE' } })
    await expect(uploadDocument({
      name: 'x.pdf', fileUrl: 'https://cdn.example.com/x.pdf',
      fileType: 'application/pdf', fileSize: 1000, folderId: 'f1',
    })).rejects.toThrow('Permission refusee')
  })

  it('rejette si le dossier n\'existe pas', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'CONSEIL' } })
    mockPrisma.documentFolder.findUnique.mockResolvedValue(null)
    await expect(uploadDocument({
      name: 'x.pdf', fileUrl: 'https://cdn.example.com/x.pdf',
      fileType: 'application/pdf', fileSize: 1000, folderId: 'inexistant',
    })).rejects.toThrow('Dossier introuvable')
  })

  it('rejette un nom vide', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'CONSEIL' } })
    await expect(uploadDocument({
      name: '', fileUrl: 'https://cdn.example.com/x.pdf',
      fileType: 'application/pdf', fileSize: 1000, folderId: 'f1',
    })).rejects.toThrow()
  })

  it('non authentifié → erreur', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(uploadDocument({
      name: 'x.pdf', fileUrl: 'https://cdn.example.com/x.pdf',
      fileType: 'application/pdf', fileSize: 1000, folderId: 'f1',
    })).rejects.toThrow('Non authentifie')
  })
})

describe('deleteDocument action', () => {
  it('CONSEIL peut supprimer un document', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'CONSEIL' } })
    mockPrisma.document.delete.mockResolvedValue({})

    const result = await deleteDocument('doc1')
    expect(result.success).toBe(true)
  })

  it('LOCATAIRE ne peut pas supprimer', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u2', role: 'LOCATAIRE' } })
    await expect(deleteDocument('doc1')).rejects.toThrow('Permission refusee')
  })
})
