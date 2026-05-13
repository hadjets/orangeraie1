import { describe, it, expect } from 'vitest'

// ── Logique pure testable sans Prisma ───────────────────────────────────────

function generateToken(): string {
  // En prod : cuid() via Prisma @default. Ici on simule un token opaque.
  return 'tok_' + Math.random().toString(36).slice(2)
}

function isExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt)
}

function invitationExpiryDate(daysFromNow = 7): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Validation du payload de création
function validateInvitePayload(
  payload: { email: string; role: string },
  validRoles: string[],
): { ok: true } | { ok: false; error: string } {
  if (!isValidEmail(payload.email)) return { ok: false, error: 'Email invalide' }
  if (!validRoles.includes(payload.role)) return { ok: false, error: 'Rôle invalide' }
  return { ok: true }
}

// ── Tests ────────────────────────────────────────────────────────────────────

const VALID_ROLES = ['ADMIN', 'CONSEIL', 'SYNDIC', 'COPROPRIETAIRE', 'LOCATAIRE']

describe('invitations — logique', () => {
  describe('isExpired', () => {
    it('retourne false si la date est dans le futur', () => {
      const future = new Date(Date.now() + 60_000)
      expect(isExpired(future)).toBe(false)
    })

    it('retourne true si la date est dans le passé', () => {
      const past = new Date(Date.now() - 60_000)
      expect(isExpired(past)).toBe(true)
    })
  })

  describe('invitationExpiryDate', () => {
    it('produit une date dans 7 jours par défaut', () => {
      const expiry = invitationExpiryDate()
      const diff   = expiry.getTime() - Date.now()
      // entre 6.9 et 7.1 jours
      expect(diff).toBeGreaterThan(6.9 * 86_400_000)
      expect(diff).toBeLessThan(7.1 * 86_400_000)
    })

    it('accepte un délai personnalisé', () => {
      const expiry = invitationExpiryDate(3)
      const diff   = expiry.getTime() - Date.now()
      expect(diff).toBeGreaterThan(2.9 * 86_400_000)
      expect(diff).toBeLessThan(3.1 * 86_400_000)
    })
  })

  describe('validateInvitePayload', () => {
    it('accepte un payload valide', () => {
      const r = validateInvitePayload({ email: 'a@b.com', role: 'LOCATAIRE' }, VALID_ROLES)
      expect(r.ok).toBe(true)
    })

    it('rejette un email malformé', () => {
      const r = validateInvitePayload({ email: 'pas-un-email', role: 'LOCATAIRE' }, VALID_ROLES)
      expect(r).toMatchObject({ ok: false, error: 'Email invalide' })
    })

    it('rejette un rôle inconnu', () => {
      const r = validateInvitePayload({ email: 'a@b.com', role: 'FANTOME' }, VALID_ROLES)
      expect(r).toMatchObject({ ok: false, error: 'Rôle invalide' })
    })

    it('rejette email vide', () => {
      const r = validateInvitePayload({ email: '', role: 'LOCATAIRE' }, VALID_ROLES)
      expect(r).toMatchObject({ ok: false, error: 'Email invalide' })
    })
  })

  describe('generateToken', () => {
    it('génère des tokens différents à chaque appel', () => {
      const t1 = generateToken()
      const t2 = generateToken()
      expect(t1).not.toBe(t2)
    })

    it('le token commence par tok_', () => {
      expect(generateToken()).toMatch(/^tok_/)
    })
  })
})
