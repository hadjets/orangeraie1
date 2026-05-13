'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import type { Role } from '@prisma/client'

export async function validateUser(userId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.validateAccount(session.user.role)) throw new Error('Permission refusee')
  if (userId === session.user.id) throw new Error('Impossible de valider son propre compte')

  await prisma.user.update({
    where: { id: userId },
    data:  { status: 'ACTIVE' },
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function suspendUser(userId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.validateAccount(session.user.role)) throw new Error('Permission refusee')
  if (userId === session.user.id) throw new Error('Impossible de suspendre son propre compte')

  await prisma.user.update({
    where: { id: userId },
    data:  { status: 'SUSPENDED' },
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function changeUserRole(userId: string, newRole: Role) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')
  // Seul ADMIN peut changer les rôles
  if (session.user.role !== 'ADMIN') throw new Error('Permission refusee : ADMIN uniquement')
  if (userId === session.user.id) throw new Error('Impossible de changer son propre role')

  await prisma.user.update({
    where: { id: userId },
    data:  { role: newRole },
  })

  revalidatePath('/admin/users')
  return { success: true }
}
