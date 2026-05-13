import { describe, it, expect } from 'vitest'
import { can } from '@/lib/permissions'
import type { Role } from '@prisma/client'

// Filtre la liste des utilisateurs selon les règles de contact RBAC
function getContactableUsers(
  users: { id: string; name: string; role: Role }[],
  senderRole: Role,
  senderId: string,
): { id: string; name: string; role: Role }[] {
  return users.filter(
    (u) => u.id !== senderId && can.messageUser(senderRole, u.role),
  )
}

describe('messaging — getContactableUsers', () => {
  const users = [
    { id: 'u1', name: 'Admin',   role: 'ADMIN'          as Role },
    { id: 'u2', name: 'Conseil', role: 'CONSEIL'        as Role },
    { id: 'u3', name: 'Syndic',  role: 'SYNDIC'         as Role },
    { id: 'u4', name: 'Copro',   role: 'COPROPRIETAIRE' as Role },
    { id: 'u5', name: 'Loc',     role: 'LOCATAIRE'      as Role },
    { id: 'u6', name: 'Loc2',    role: 'LOCATAIRE'      as Role },
  ]

  it('exclut toujours l utilisateur lui-meme', () => {
    const result = getContactableUsers(users, 'ADMIN', 'u1')
    expect(result.find((u) => u.id === 'u1')).toBeUndefined()
  })

  it('ADMIN peut contacter tout le monde sauf lui-meme', () => {
    const result = getContactableUsers(users, 'ADMIN', 'u1')
    expect(result).toHaveLength(5)
  })

  it('LOCATAIRE ne peut pas contacter un autre LOCATAIRE', () => {
    const result = getContactableUsers(users, 'LOCATAIRE', 'u5')
    expect(result.find((u) => u.role === 'LOCATAIRE')).toBeUndefined()
  })

  it('LOCATAIRE peut contacter COPRO, CONSEIL, SYNDIC, ADMIN', () => {
    const result = getContactableUsers(users, 'LOCATAIRE', 'u5')
    expect(result.map((u) => u.role)).toContain('COPROPRIETAIRE')
    expect(result.map((u) => u.role)).toContain('CONSEIL')
    expect(result.map((u) => u.role)).toContain('SYNDIC')
    expect(result.map((u) => u.role)).toContain('ADMIN')
  })

  it('SYNDIC ne peut pas contacter un autre SYNDIC', () => {
    const result = getContactableUsers(users, 'SYNDIC', 'u3')
    expect(result.find((u) => u.role === 'SYNDIC')).toBeUndefined()
  })
})
