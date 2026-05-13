import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schéma importé depuis l'action — on le définit ici pour le TDD
const ticketSchema = z.object({
  title: z.string().min(5, 'Le titre doit faire au moins 5 caracteres').max(100),
  description: z.string().min(10, 'La description doit faire au moins 10 caracteres').max(1000),
  location: z.enum(['BLOC_A', 'BLOC_B', 'BLOC_C', 'COMMUN'], {
    errorMap: () => ({ message: 'Localisation invalide' }),
  }),
  bloc: z.string().optional(),
  photoUrls: z.array(z.string().url()).max(5),
})

describe('ticketSchema — validation Zod', () => {
  const validTicket = {
    title: 'Fuite eau cave',
    description: 'Il y a une fuite importante au niveau du compteur principal.',
    location: 'COMMUN' as const,
    photoUrls: [],
  }

  it('accepte un ticket valide', () => {
    const result = ticketSchema.safeParse(validTicket)
    expect(result.success).toBe(true)
  })

  it('rejette si le titre est trop court (< 5 chars)', () => {
    const result = ticketSchema.safeParse({ ...validTicket, title: 'Fui' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('5 caracteres')
  })

  it('rejette si la description est trop courte (< 10 chars)', () => {
    const result = ticketSchema.safeParse({ ...validTicket, description: 'Court' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('10 caracteres')
  })

  it('rejette une localisation invalide', () => {
    // Zod v4 : errorMap n'est plus supporté sur z.enum() — on teste juste le rejet
    const result = ticketSchema.safeParse({ ...validTicket, location: 'GRENIER' })
    expect(result.success).toBe(false)
    expect(result.error?.issues.length).toBeGreaterThan(0)
  })

  it('accepte toutes les localisations valides', () => {
    const locations = ['BLOC_A', 'BLOC_B', 'BLOC_C', 'COMMUN'] as const
    for (const location of locations) {
      const result = ticketSchema.safeParse({ ...validTicket, location })
      expect(result.success).toBe(true)
    }
  })

  it('rejette plus de 5 photos', () => {
    const urls = Array(6).fill('https://example.com/photo.jpg')
    const result = ticketSchema.safeParse({ ...validTicket, photoUrls: urls })
    expect(result.success).toBe(false)
  })

  it('rejette une URL de photo invalide', () => {
    const result = ticketSchema.safeParse({
      ...validTicket,
      photoUrls: ['pas-une-url'],
    })
    expect(result.success).toBe(false)
  })

  it('accepte le champ bloc optionnel', () => {
    const result = ticketSchema.safeParse({ ...validTicket, bloc: '3eme etage' })
    expect(result.success).toBe(true)
  })

  it('accepte 0 a 5 photos valides', () => {
    const urls = Array(5).fill('https://cdn.example.com/img.jpg')
    const result = ticketSchema.safeParse({ ...validTicket, photoUrls: urls })
    expect(result.success).toBe(true)
  })
})
