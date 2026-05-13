import { describe, it, expect } from 'vitest'

// Logique pure de gestion des utilisateurs — testable sans DB
type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED'
type Role = 'ADMIN' | 'CONSEIL' | 'SYNDIC' | 'COPROPRIETAIRE' | 'LOCATAIRE'

function canValidateUser(actorRole: Role): boolean {
  return ['ADMIN', 'CONSEIL'].includes(actorRole)
}

function canChangeRole(actorRole: Role): boolean {
  return actorRole === 'ADMIN'
}

function canSuspendUser(actorRole: Role): boolean {
  return ['ADMIN', 'CONSEIL'].includes(actorRole)
}

function filterUsers(
  users: { id: string; status: UserStatus; role: Role }[],
  filter: { status?: UserStatus; role?: Role },
) {
  return users.filter((u) => {
    if (filter.status && u.status !== filter.status) return false
    if (filter.role && u.role !== filter.role) return false
    return true
  })
}

describe('admin users — permissions', () => {
  it('ADMIN peut valider un compte', () => {
    expect(canValidateUser('ADMIN')).toBe(true)
  })

  it('CONSEIL peut valider un compte', () => {
    expect(canValidateUser('CONSEIL')).toBe(true)
  })

  it('SYNDIC ne peut PAS valider', () => {
    expect(canValidateUser('SYNDIC')).toBe(false)
  })

  it('COPROPRIETAIRE ne peut PAS valider', () => {
    expect(canValidateUser('COPROPRIETAIRE')).toBe(false)
  })

  it('seul ADMIN peut changer un role', () => {
    expect(canChangeRole('ADMIN')).toBe(true)
    expect(canChangeRole('CONSEIL')).toBe(false)
    expect(canChangeRole('SYNDIC')).toBe(false)
  })

  it('ADMIN et CONSEIL peuvent suspendre', () => {
    expect(canSuspendUser('ADMIN')).toBe(true)
    expect(canSuspendUser('CONSEIL')).toBe(true)
    expect(canSuspendUser('SYNDIC')).toBe(false)
  })
})

describe('admin users — filterUsers', () => {
  const users = [
    { id: '1', status: 'PENDING' as UserStatus,    role: 'COPROPRIETAIRE' as Role },
    { id: '2', status: 'ACTIVE' as UserStatus,     role: 'LOCATAIRE' as Role      },
    { id: '3', status: 'ACTIVE' as UserStatus,     role: 'COPROPRIETAIRE' as Role },
    { id: '4', status: 'SUSPENDED' as UserStatus,  role: 'LOCATAIRE' as Role      },
  ]

  it('filtre par status PENDING', () => {
    expect(filterUsers(users, { status: 'PENDING' })).toHaveLength(1)
  })

  it('filtre par role LOCATAIRE', () => {
    expect(filterUsers(users, { role: 'LOCATAIRE' })).toHaveLength(2)
  })

  it('filtre par status + role combines', () => {
    expect(filterUsers(users, { status: 'ACTIVE', role: 'COPROPRIETAIRE' })).toHaveLength(1)
  })

  it('retourne tous si aucun filtre', () => {
    expect(filterUsers(users, {})).toHaveLength(4)
  })
})
