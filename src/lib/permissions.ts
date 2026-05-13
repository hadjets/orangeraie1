import type { Role } from '@prisma/client'

/**
 * Fonctions de vérification des permissions RBAC.
 * Toute la logique d'autorisation de l'application est centralisée ici.
 */
export const can = {
  /**
   * Valider un ticket d'incident (approuver ou rejeter)
   */
  validateTicket: (role: Role): boolean =>
    ['ADMIN', 'CONSEIL'].includes(role),

  /**
   * Publier directement une annonce (sans approbation)
   */
  publishAnnouncement: (role: Role): boolean =>
    ['ADMIN', 'CONSEIL'].includes(role),

  /**
   * Soumettre une annonce pour approbation
   */
  submitAnnouncement: (role: Role): boolean =>
    ['ADMIN', 'CONSEIL', 'SYNDIC'].includes(role),

  /**
   * Accéder au tableau de bord budgétaire
   */
  accessBudget: (role: Role): boolean =>
    ['ADMIN', 'CONSEIL'].includes(role),

  /**
   * Créer ou gérer des sondages
   */
  managePoll: (role: Role): boolean =>
    ['ADMIN', 'CONSEIL'].includes(role),

  /**
   * Inviter des utilisateurs
   */
  inviteUser: (role: Role): boolean =>
    ['ADMIN', 'CONSEIL'].includes(role),

  /**
   * Accéder au back-office d'administration
   */
  accessAdmin: (role: Role): boolean =>
    ['ADMIN', 'CONSEIL'].includes(role),

  /**
   * Uploader des documents
   */
  uploadDocument: (role: Role): boolean =>
    ['ADMIN', 'CONSEIL', 'SYNDIC'].includes(role),

  /**
   * Valider les comptes en attente
   */
  validateAccount: (role: Role): boolean =>
    ['ADMIN', 'CONSEIL'].includes(role),

  /**
   * Vérifier si un utilisateur peut envoyer un message à un autre.
   * Règles métier :
   * - Locataire → son proprio, Conseil, Syndic
   * - Copropriétaire → autres copros, ses locataires, Conseil, Syndic
   * - Conseil → tout le monde (+ canal privé entre membres)
   * - Syndic → Conseil, Copropriétaires, Locataires
   * - Admin → tout le monde
   */
  messageUser: (senderRole: Role, targetRole: Role): boolean => {
    const rules: Record<Role, Role[]> = {
      LOCATAIRE: ['COPROPRIETAIRE', 'CONSEIL', 'SYNDIC', 'ADMIN'],
      COPROPRIETAIRE: ['COPROPRIETAIRE', 'LOCATAIRE', 'CONSEIL', 'SYNDIC', 'ADMIN'],
      CONSEIL: ['ADMIN', 'CONSEIL', 'SYNDIC', 'COPROPRIETAIRE', 'LOCATAIRE'],
      SYNDIC: ['CONSEIL', 'COPROPRIETAIRE', 'LOCATAIRE', 'ADMIN'],
      ADMIN: ['ADMIN', 'CONSEIL', 'SYNDIC', 'COPROPRIETAIRE', 'LOCATAIRE'],
    }
    return (
      /* c8 ignore next */
      rules[senderRole]?.includes(targetRole) ?? false
    )
  },
}
