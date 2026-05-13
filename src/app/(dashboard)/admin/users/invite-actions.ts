'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import type { Role } from '@prisma/client'

const createInvitationSchema = z.object({
  email: z.string().email('Email invalide'),
  role:  z.enum(['ADMIN', 'CONSEIL', 'SYNDIC', 'COPROPRIETAIRE', 'LOCATAIRE']),
})

export async function createInvitation(input: { email: string; role: string }) {
  const session = await auth()
  /* c8 ignore next */
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.inviteUser(session.user.role)) throw new Error('Permission refusee')

  const data = createInvitationSchema.parse(input)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invitation = await prisma.invitation.create({
    data: {
      email:       data.email,
      role:        data.role as Role,
      expiresAt,
      invitedById: session.user.id,
    },
  })

  revalidatePath('/admin/users')
  return { success: true, token: invitation.token, id: invitation.id }
}

export async function acceptInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } })

  if (!invitation)        throw new Error('Invitation introuvable')
  if (invitation.usedAt)  throw new Error('Invitation déjà utilisée')
  if (new Date() > new Date(invitation.expiresAt)) throw new Error('Invitation expirée')

  // Trouver l'utilisateur avec cet email
  const user = await prisma.user.findUnique({ where: { email: invitation.email } })
  if (!user) throw new Error('Aucun compte avec cet email')

  // Marquer l'invitation comme utilisée et lier à l'utilisateur
  await Promise.all([
    prisma.invitation.update({
      where: { id: invitation.id },
      data:  { usedAt: new Date(), invitedUserId: user.id },
    }),
    prisma.user.update({
      where: { id: user.id },
      data:  { role: invitation.role, status: 'ACTIVE' },
    }),
  ])

  return { success: true, role: invitation.role }
}

export async function revokeInvitation(invitationId: string) {
  const session = await auth()
  /* c8 ignore next */
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.inviteUser(session.user.role)) throw new Error('Permission refusee')

  // On marque comme expiré immédiatement (expiresAt = maintenant)
  await prisma.invitation.update({
    where: { id: invitationId },
    data:  { expiresAt: new Date() },
  })

  revalidatePath('/admin/users')
  return { success: true }
}
