import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schéma announcement — même logique que dans la server action
const announcementSchema = z.object({
  title: z.string().min(3, 'Titre trop court').max(150, 'Titre trop long'),
  content: z.string().min(10, 'Contenu trop court').max(5000, 'Contenu trop long'),
  imageUrl: z.string().url('URL image invalide').optional(),
})

// Logique pure du calcul de status selon le rôle
function getAnnouncementStatus(role: string): 'PUBLISHED' | 'PENDING_APPROVAL' {
  return ['ADMIN', 'CONSEIL'].includes(role) ? 'PUBLISHED' : 'PENDING_APPROVAL'
}

function canCreateAnnouncement(role: string): boolean {
  return ['ADMIN', 'CONSEIL', 'SYNDIC'].includes(role)
}

describe('announcementSchema — validation Zod', () => {
  const valid = {
    title: 'Réunion AG 2026',
    content: 'Nous vous informons de la tenue de l\'assemblée générale le 15 juin.',
  }

  it('accepte une annonce valide', () => {
    const result = announcementSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejette un titre trop court (< 3 chars)', () => {
    const result = announcementSchema.safeParse({ ...valid, title: 'AG' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Titre trop court')
  })

  it('rejette un contenu trop court (< 10 chars)', () => {
    const result = announcementSchema.safeParse({ ...valid, content: 'Court' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Contenu trop court')
  })

  it('rejette une URL image invalide', () => {
    const result = announcementSchema.safeParse({ ...valid, imageUrl: 'pas-une-url' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('URL image invalide')
  })

  it('accepte une URL image valide', () => {
    const result = announcementSchema.safeParse({
      ...valid,
      imageUrl: 'https://cdn.example.com/image.jpg',
    })
    expect(result.success).toBe(true)
  })

  it('accepte sans imageUrl (optionnel)', () => {
    const result = announcementSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('announcement — getAnnouncementStatus', () => {
  it('CONSEIL → PUBLISHED directement', () => {
    expect(getAnnouncementStatus('CONSEIL')).toBe('PUBLISHED')
  })

  it('ADMIN → PUBLISHED directement', () => {
    expect(getAnnouncementStatus('ADMIN')).toBe('PUBLISHED')
  })

  it('SYNDIC → PENDING_APPROVAL', () => {
    expect(getAnnouncementStatus('SYNDIC')).toBe('PENDING_APPROVAL')
  })

  it('COPROPRIETAIRE → PENDING_APPROVAL (bien que bloqué avant)', () => {
    expect(getAnnouncementStatus('COPROPRIETAIRE')).toBe('PENDING_APPROVAL')
  })
})

describe('announcement — canCreateAnnouncement', () => {
  it('ADMIN peut créer', () => {
    expect(canCreateAnnouncement('ADMIN')).toBe(true)
  })

  it('CONSEIL peut créer', () => {
    expect(canCreateAnnouncement('CONSEIL')).toBe(true)
  })

  it('SYNDIC peut créer (soumet pour approbation)', () => {
    expect(canCreateAnnouncement('SYNDIC')).toBe(true)
  })

  it('COPROPRIETAIRE ne peut PAS créer', () => {
    expect(canCreateAnnouncement('COPROPRIETAIRE')).toBe(false)
  })

  it('LOCATAIRE ne peut PAS créer', () => {
    expect(canCreateAnnouncement('LOCATAIRE')).toBe(false)
  })
})
