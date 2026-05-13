import { describe, it, expect, vi, beforeEach } from 'vitest'

// On mock prisma pour ces tests purs de logique métier
vi.mock('@/lib/prisma', () => ({
  prisma: {
    poll: {
      findUnique: vi.fn(),
    },
    pollResponse: {
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// Logique pure extraite de l'action submitVote — testable sans serveur
function isPollOpen(endsAt: Date | null): boolean {
  if (!endsAt) return true
  return endsAt > new Date()
}

function isUserInAudience(targetRoles: string[], userRole: string): boolean {
  return targetRoles.includes(userRole)
}

function computeResults(
  options: { id: string; text: string }[],
  responses: { optionId: string }[],
): { id: string; text: string; count: number; percent: number }[] {
  const total = responses.length
  return options.map((opt) => {
    const count = responses.filter((r) => r.optionId === opt.id).length
    return {
      id: opt.id,
      text: opt.text,
      count,
      percent: total === 0 ? 0 : Math.round((count / total) * 100),
    }
  })
}

describe('polls — isPollOpen', () => {
  it('retourne true si endsAt est null (sondage permanent)', () => {
    expect(isPollOpen(null)).toBe(true)
  })

  it('retourne true si endsAt est dans le futur', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    expect(isPollOpen(future)).toBe(true)
  })

  it('retourne false si endsAt est dans le passé', () => {
    const past = new Date(Date.now() - 1000)
    expect(isPollOpen(past)).toBe(false)
  })
})

describe('polls — isUserInAudience', () => {
  it('retourne true si le rôle est dans targetRoles', () => {
    expect(isUserInAudience(['COPROPRIETAIRE', 'LOCATAIRE'], 'COPROPRIETAIRE')).toBe(true)
  })

  it('retourne false si le rôle est absent de targetRoles', () => {
    expect(isUserInAudience(['COPROPRIETAIRE'], 'LOCATAIRE')).toBe(false)
  })

  it('retourne false pour une liste vide', () => {
    expect(isUserInAudience([], 'ADMIN')).toBe(false)
  })
})

describe('polls — computeResults', () => {
  const options = [
    { id: 'opt-1', text: 'Oui' },
    { id: 'opt-2', text: 'Non' },
    { id: 'opt-3', text: 'Abstention' },
  ]

  it('retourne 0% partout si aucun vote', () => {
    const results = computeResults(options, [])
    results.forEach((r) => {
      expect(r.count).toBe(0)
      expect(r.percent).toBe(0)
    })
  })

  it('calcule correctement les pourcentages', () => {
    const responses = [
      { optionId: 'opt-1' },
      { optionId: 'opt-1' },
      { optionId: 'opt-2' },
      { optionId: 'opt-2' },
      { optionId: 'opt-3' },
    ]
    const results = computeResults(options, responses)
    expect(results[0].count).toBe(2)
    expect(results[0].percent).toBe(40)
    expect(results[1].percent).toBe(40)
    expect(results[2].percent).toBe(20)
  })

  it('le total des pourcentages peut ne pas faire exactement 100 (arrondi)', () => {
    const responses = [{ optionId: 'opt-1' }, { optionId: 'opt-2' }, { optionId: 'opt-3' }]
    const results = computeResults(options, responses)
    const total = results.reduce((sum, r) => sum + r.percent, 0)
    // Avec 3 options à 1/3 chacune → 33+33+33 = 99 ou 100
    expect(total).toBeGreaterThanOrEqual(99)
    expect(total).toBeLessThanOrEqual(101)
  })
})
