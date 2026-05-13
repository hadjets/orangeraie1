import { describe, it, expect } from 'vitest'
import { can } from '@/lib/permissions'
import type { Role } from '@prisma/client'

describe('permissions — can.messageUser', () => {
  const allRoles: Role[] = ['ADMIN', 'CONSEIL', 'SYNDIC', 'COPROPRIETAIRE', 'LOCATAIRE']

  // Admin peut contacter tout le monde
  it('ADMIN peut contacter tous les rôles', () => {
    allRoles.forEach(target => {
      expect(can.messageUser('ADMIN', target)).toBe(true)
    })
  })

  // Conseil peut contacter tout le monde
  it('CONSEIL peut contacter tous les rôles', () => {
    allRoles.forEach(target => {
      expect(can.messageUser('CONSEIL', target)).toBe(true)
    })
  })

  // Syndic
  it('SYNDIC peut contacter CONSEIL', () => {
    expect(can.messageUser('SYNDIC', 'CONSEIL')).toBe(true)
  })
  it('SYNDIC peut contacter COPROPRIETAIRE', () => {
    expect(can.messageUser('SYNDIC', 'COPROPRIETAIRE')).toBe(true)
  })
  it('SYNDIC peut contacter LOCATAIRE', () => {
    expect(can.messageUser('SYNDIC', 'LOCATAIRE')).toBe(true)
  })
  it('SYNDIC ne peut PAS contacter SYNDIC', () => {
    expect(can.messageUser('SYNDIC', 'SYNDIC')).toBe(false)
  })

  // Copropriétaire
  it('COPROPRIETAIRE peut contacter un autre COPROPRIETAIRE', () => {
    expect(can.messageUser('COPROPRIETAIRE', 'COPROPRIETAIRE')).toBe(true)
  })
  it('COPROPRIETAIRE peut contacter LOCATAIRE (ses locataires)', () => {
    expect(can.messageUser('COPROPRIETAIRE', 'LOCATAIRE')).toBe(true)
  })
  it('COPROPRIETAIRE peut contacter CONSEIL', () => {
    expect(can.messageUser('COPROPRIETAIRE', 'CONSEIL')).toBe(true)
  })
  it('COPROPRIETAIRE peut contacter SYNDIC', () => {
    expect(can.messageUser('COPROPRIETAIRE', 'SYNDIC')).toBe(true)
  })

  // Locataire
  it('LOCATAIRE peut contacter COPROPRIETAIRE (son proprio)', () => {
    expect(can.messageUser('LOCATAIRE', 'COPROPRIETAIRE')).toBe(true)
  })
  it('LOCATAIRE peut contacter CONSEIL', () => {
    expect(can.messageUser('LOCATAIRE', 'CONSEIL')).toBe(true)
  })
  it('LOCATAIRE peut contacter SYNDIC', () => {
    expect(can.messageUser('LOCATAIRE', 'SYNDIC')).toBe(true)
  })
  it('LOCATAIRE ne peut PAS contacter un autre LOCATAIRE', () => {
    expect(can.messageUser('LOCATAIRE', 'LOCATAIRE')).toBe(false)
  })
})

describe('permissions — can.validateTicket', () => {
  it('ADMIN peut valider un ticket', () => {
    expect(can.validateTicket('ADMIN')).toBe(true)
  })
  it('CONSEIL peut valider un ticket', () => {
    expect(can.validateTicket('CONSEIL')).toBe(true)
  })
  it('SYNDIC ne peut PAS valider un ticket', () => {
    expect(can.validateTicket('SYNDIC')).toBe(false)
  })
  it('COPROPRIETAIRE ne peut PAS valider un ticket', () => {
    expect(can.validateTicket('COPROPRIETAIRE')).toBe(false)
  })
  it('LOCATAIRE ne peut PAS valider un ticket', () => {
    expect(can.validateTicket('LOCATAIRE')).toBe(false)
  })
})

describe('permissions — can.publishAnnouncement', () => {
  it('ADMIN peut publier directement', () => {
    expect(can.publishAnnouncement('ADMIN')).toBe(true)
  })
  it('CONSEIL peut publier directement', () => {
    expect(can.publishAnnouncement('CONSEIL')).toBe(true)
  })
  it('SYNDIC ne peut PAS publier directement (doit attendre approbation)', () => {
    expect(can.publishAnnouncement('SYNDIC')).toBe(false)
  })
})

describe('permissions — can.accessBudget', () => {
  it('ADMIN a accès au budget', () => {
    expect(can.accessBudget('ADMIN')).toBe(true)
  })
  it('CONSEIL a accès au budget', () => {
    expect(can.accessBudget('CONSEIL')).toBe(true)
  })
  it('SYNDIC n\'a pas accès au budget', () => {
    expect(can.accessBudget('SYNDIC')).toBe(false)
  })
  it('COPROPRIETAIRE n\'a pas accès au budget', () => {
    expect(can.accessBudget('COPROPRIETAIRE')).toBe(false)
  })
})

describe('permissions — can.submitAnnouncement', () => {
  it('SYNDIC peut soumettre une annonce pour approbation', () => {
    expect(can.submitAnnouncement('SYNDIC')).toBe(true)
  })
  it('CONSEIL peut soumettre (et publie directement)', () => {
    expect(can.submitAnnouncement('CONSEIL')).toBe(true)
  })
  it('ADMIN peut soumettre', () => {
    expect(can.submitAnnouncement('ADMIN')).toBe(true)
  })
  it('COPROPRIETAIRE ne peut PAS soumettre', () => {
    expect(can.submitAnnouncement('COPROPRIETAIRE')).toBe(false)
  })
  it('LOCATAIRE ne peut PAS soumettre', () => {
    expect(can.submitAnnouncement('LOCATAIRE')).toBe(false)
  })
})

describe('permissions — can.managePoll', () => {
  it('ADMIN peut gérer les sondages', () => {
    expect(can.managePoll('ADMIN')).toBe(true)
  })
  it('CONSEIL peut gérer les sondages', () => {
    expect(can.managePoll('CONSEIL')).toBe(true)
  })
  it('SYNDIC ne peut PAS gérer les sondages', () => {
    expect(can.managePoll('SYNDIC')).toBe(false)
  })
  it('COPROPRIETAIRE ne peut PAS gérer les sondages', () => {
    expect(can.managePoll('COPROPRIETAIRE')).toBe(false)
  })
})

describe('permissions — can.inviteUser', () => {
  it('ADMIN peut inviter', () => {
    expect(can.inviteUser('ADMIN')).toBe(true)
  })
  it('CONSEIL peut inviter', () => {
    expect(can.inviteUser('CONSEIL')).toBe(true)
  })
  it('SYNDIC ne peut PAS inviter', () => {
    expect(can.inviteUser('SYNDIC')).toBe(false)
  })
})

describe('permissions — can.accessAdmin', () => {
  it('ADMIN a accès au back-office', () => {
    expect(can.accessAdmin('ADMIN')).toBe(true)
  })
  it('CONSEIL a accès au back-office', () => {
    expect(can.accessAdmin('CONSEIL')).toBe(true)
  })
  it('SYNDIC n\'a pas accès au back-office', () => {
    expect(can.accessAdmin('SYNDIC')).toBe(false)
  })
  it('LOCATAIRE n\'a pas accès au back-office', () => {
    expect(can.accessAdmin('LOCATAIRE')).toBe(false)
  })
})

describe('permissions — can.validateAccount', () => {
  it('ADMIN peut valider un compte', () => {
    expect(can.validateAccount('ADMIN')).toBe(true)
  })
  it('CONSEIL peut valider un compte', () => {
    expect(can.validateAccount('CONSEIL')).toBe(true)
  })
  it('SYNDIC ne peut PAS valider un compte', () => {
    expect(can.validateAccount('SYNDIC')).toBe(false)
  })
  it('COPROPRIETAIRE ne peut PAS valider un compte', () => {
    expect(can.validateAccount('COPROPRIETAIRE')).toBe(false)
  })
  it('LOCATAIRE ne peut PAS valider un compte', () => {
    expect(can.validateAccount('LOCATAIRE')).toBe(false)
  })
})

describe('permissions — can.uploadDocument', () => {
  it('ADMIN peut uploader des documents', () => {
    expect(can.uploadDocument('ADMIN')).toBe(true)
  })
  it('CONSEIL peut uploader des documents', () => {
    expect(can.uploadDocument('CONSEIL')).toBe(true)
  })
  it('SYNDIC peut uploader des documents', () => {
    expect(can.uploadDocument('SYNDIC')).toBe(true)
  })
  it('COPROPRIETAIRE ne peut PAS uploader', () => {
    expect(can.uploadDocument('COPROPRIETAIRE')).toBe(false)
  })
  it('LOCATAIRE ne peut PAS uploader', () => {
    expect(can.uploadDocument('LOCATAIRE')).toBe(false)
  })
})
