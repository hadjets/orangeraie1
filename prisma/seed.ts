import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seed...')

  // ─── Admin ──────────────────────────────────────────────────────
  const adminPassword = await hash('Admin1234!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@orangeraie1.fr' },
    update: {},
    create: {
      email: 'admin@orangeraie1.fr',
      name: 'Admin Orangeraie',
      role: 'ADMIN',
      status: 'ACTIVE',
      accounts: {
        create: {
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: 'admin@orangeraie1.fr',
          access_token: adminPassword, // mot de passe haché
        },
      },
    },
  })
  console.log('✅ Admin créé:', admin.email)

  // ─── Conseil ────────────────────────────────────────────────────
  const conseilPassword = await hash('Conseil1234!', 12)
  const conseil = await prisma.user.upsert({
    where: { email: 'conseil@orangeraie1.fr' },
    update: {},
    create: {
      email: 'conseil@orangeraie1.fr',
      name: 'Marie Dupont (Conseil)',
      role: 'CONSEIL',
      status: 'ACTIVE',
      bloc: 'A',
      apartment: 'A01',
      accounts: {
        create: {
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: 'conseil@orangeraie1.fr',
          access_token: conseilPassword,
        },
      },
    },
  })
  console.log('✅ Conseil créé:', conseil.email)

  // ─── Syndic ─────────────────────────────────────────────────────
  const syndicPassword = await hash('Syndic1234!', 12)
  const syndic = await prisma.user.upsert({
    where: { email: 'syndic@orangeraie1.fr' },
    update: {},
    create: {
      email: 'syndic@orangeraie1.fr',
      name: 'Cabinet Immo Gestion',
      role: 'SYNDIC',
      status: 'ACTIVE',
      accounts: {
        create: {
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: 'syndic@orangeraie1.fr',
          access_token: syndicPassword,
        },
      },
    },
  })
  console.log('✅ Syndic créé:', syndic.email)

  // ─── Copropriétaire ─────────────────────────────────────────────
  const coproPassword = await hash('Copro1234!', 12)
  const copro = await prisma.user.upsert({
    where: { email: 'copro@orangeraie1.fr' },
    update: {},
    create: {
      email: 'copro@orangeraie1.fr',
      name: 'Pierre Martin (Copropriétaire)',
      role: 'COPROPRIETAIRE',
      status: 'ACTIVE',
      bloc: 'B',
      apartment: 'B12',
      accounts: {
        create: {
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: 'copro@orangeraie1.fr',
          access_token: coproPassword,
        },
      },
    },
  })
  console.log('✅ Copropriétaire créé:', copro.email)

  // ─── Locataire ──────────────────────────────────────────────────
  const locatairePassword = await hash('Locataire1234!', 12)
  const locataire = await prisma.user.upsert({
    where: { email: 'locataire@orangeraie1.fr' },
    update: {},
    create: {
      email: 'locataire@orangeraie1.fr',
      name: 'Sophie Bernard (Locataire)',
      role: 'LOCATAIRE',
      status: 'ACTIVE',
      bloc: 'B',
      apartment: 'B12',
      landlordId: copro.id,
      accounts: {
        create: {
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: 'locataire@orangeraie1.fr',
          access_token: locatairePassword,
        },
      },
    },
  })
  console.log('✅ Locataire créé:', locataire.email)

  // ─── Structure de dossiers documentaires ────────────────────────
  const rootFolder = await prisma.documentFolder.upsert({
    where: { id: 'folder-root' },
    update: {},
    create: {
      id: 'folder-root',
      name: 'Orangeraie 1',
      allowedRoles: ['ADMIN', 'CONSEIL', 'SYNDIC', 'COPROPRIETAIRE', 'LOCATAIRE'],
      isLocked: true,
    },
  })

  const folders = [
    {
      id: 'folder-ag',
      name: 'Assemblées Générales',
      parentId: 'folder-root',
      allowedRoles: ['ADMIN', 'CONSEIL', 'COPROPRIETAIRE'],
    },
    {
      id: 'folder-reglement',
      name: 'Règlement de copropriété',
      parentId: 'folder-root',
      allowedRoles: ['ADMIN', 'CONSEIL', 'SYNDIC', 'COPROPRIETAIRE', 'LOCATAIRE'],
    },
    {
      id: 'folder-contrats',
      name: 'Contrats & Prestataires',
      parentId: 'folder-root',
      allowedRoles: ['ADMIN', 'CONSEIL', 'SYNDIC'],
    },
    {
      id: 'folder-budget',
      name: 'Budgets & Comptabilité',
      parentId: 'folder-root',
      allowedRoles: ['ADMIN', 'CONSEIL'],
    },
    {
      id: 'folder-travaux',
      name: 'Travaux & Devis',
      parentId: 'folder-root',
      allowedRoles: ['ADMIN', 'CONSEIL', 'SYNDIC'],
    },
    {
      id: 'folder-infos',
      name: 'Informations pratiques',
      parentId: 'folder-root',
      allowedRoles: ['ADMIN', 'CONSEIL', 'SYNDIC', 'COPROPRIETAIRE', 'LOCATAIRE'],
    },
  ]

  for (const folder of folders) {
    await prisma.documentFolder.upsert({
      where: { id: folder.id },
      update: {},
      create: { ...folder, isLocked: true } as any,
    })
  }
  console.log('✅ Structure documentaire créée (6 dossiers)')

  // ─── Annonce de bienvenue ────────────────────────────────────────
  await prisma.announcement.upsert({
    where: { id: 'announcement-welcome' },
    update: {},
    create: {
      id: 'announcement-welcome',
      title: 'Bienvenue sur Orangeraie 1 !',
      content:
        "L'application de gestion de votre copropriété est désormais disponible. " +
        'Vous pouvez signaler des incidents, consulter les documents et échanger avec le conseil et le syndic. ' +
        "N'hésitez pas à nous contacter si vous avez des questions.",
      status: 'PUBLISHED',
      authorId: conseil.id,
      publishedAt: new Date(),
    },
  })
  console.log('✅ Annonce de bienvenue créée')

  // ─── Préférences de notifications (tous les utilisateurs) ───────
  const users = [admin, conseil, syndic, copro, locataire]
  for (const user of users) {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        newMessage: true,
        ticketUpdate: true,
        newAnnouncement: true,
        newPoll: true,
        emailEnabled: true,
        pushEnabled: true,
      },
    })
  }
  console.log('✅ Préférences de notifications créées pour tous les utilisateurs')

  console.log('\n🎉 Seed terminé avec succès !')
  console.log('\n📋 Comptes de test disponibles :')
  console.log('  admin@orangeraie1.fr     / Admin1234!')
  console.log('  conseil@orangeraie1.fr   / Conseil1234!')
  console.log('  syndic@orangeraie1.fr    / Syndic1234!')
  console.log('  copro@orangeraie1.fr     / Copro1234!')
  console.log('  locataire@orangeraie1.fr / Locataire1234!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
