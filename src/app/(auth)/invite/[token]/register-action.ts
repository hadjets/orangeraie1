'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { signIn } from '@/lib/auth'

const registerSchema = z.object({
  token:    z.string().min(1),
  name:     z.string().min(2, 'Le nom doit faire au moins 2 caractères').max(80),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
})

export async function registerFromInvitation(input: {
  token: string
  name: string
  password: string
}) {
  const data = registerSchema.parse(input)

  // Vérifier l'invitation
  const invitation = await prisma.invitation.findUnique({ where: { token: data.token } })
  if (!invitation)                                  throw new Error('Invitation invalide')
  if (invitation.usedAt)                            throw new Error('Invitation déjà utilisée')
  if (new Date() > new Date(invitation.expiresAt))  throw new Error('Invitation expirée')

  // Vérifier que l'email n'est pas déjà pris
  const existing = await prisma.user.findUnique({ where: { email: invitation.email } })
  if (existing) throw new Error('Un compte existe déjà avec cet email')

  const passwordHash = await hash(data.password, 12)

  // Créer l'utilisateur + compte credentials en une transaction
  await prisma.$transaction([
    prisma.user.create({
      data: {
        email:  invitation.email,
        name:   data.name,
        role:   invitation.role,
        status: 'ACTIVE',
        accounts: {
          create: {
            type:              'credentials',
            provider:          'credentials',
            providerAccountId: invitation.email,
            access_token:      passwordHash,
          },
        },
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data:  { usedAt: new Date() },
    }),
  ])

  // Connecter automatiquement après inscription
  await signIn('credentials', {
    email:    invitation.email,
    password: data.password,
    redirect: false,
  })
}
