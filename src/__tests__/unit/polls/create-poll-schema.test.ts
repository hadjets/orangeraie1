import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const createPollSchema = z.object({
  question: z.string().min(5, 'Question trop courte').max(500),
  options: z
    .array(z.string().min(1, 'Option vide'))
    .min(2, 'Au moins 2 options requises')
    .max(6, 'Maximum 6 options'),
  targetRoles: z.array(z.string()).min(1, 'Au moins un role cible requis'),
  targetBloc: z.string().optional(),
  endsAt: z.string().datetime({ offset: true }).optional(),
})

describe('createPollSchema — validation Zod', () => {
  const valid = {
    question: 'Etes-vous favorables aux nouveaux horaires de la salle commune ?',
    options: ['Oui', 'Non', 'Abstention'],
    targetRoles: ['COPROPRIETAIRE', 'LOCATAIRE'],
  }

  it('accepte un sondage valide', () => {
    expect(createPollSchema.safeParse(valid).success).toBe(true)
  })

  it('rejette une question trop courte', () => {
    const r = createPollSchema.safeParse({ ...valid, question: 'Ok?' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Question trop courte')
  })

  it('rejette moins de 2 options', () => {
    const r = createPollSchema.safeParse({ ...valid, options: ['Oui'] })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Au moins 2 options requises')
  })

  it('rejette plus de 6 options', () => {
    const opts = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const r = createPollSchema.safeParse({ ...valid, options: opts })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Maximum 6 options')
  })

  it('rejette une option vide dans le tableau', () => {
    const r = createPollSchema.safeParse({ ...valid, options: ['Oui', ''] })
    expect(r.success).toBe(false)
  })

  it('rejette targetRoles vide', () => {
    const r = createPollSchema.safeParse({ ...valid, targetRoles: [] })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Au moins un role cible requis')
  })

  it('accepte targetBloc optionnel', () => {
    const r = createPollSchema.safeParse({ ...valid, targetBloc: 'A' })
    expect(r.success).toBe(true)
  })

  it('accepte endsAt ISO valide', () => {
    const r = createPollSchema.safeParse({
      ...valid,
      endsAt: '2026-12-31T23:59:59+00:00',
    })
    expect(r.success).toBe(true)
  })

  it('rejette endsAt format invalide', () => {
    const r = createPollSchema.safeParse({ ...valid, endsAt: '31/12/2026' })
    expect(r.success).toBe(false)
  })
})
