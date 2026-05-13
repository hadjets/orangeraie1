'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const profileSchema = z.object({
  name:      z.string().min(2, 'Nom trop court (2 caractères minimum)').max(100),
  apartment: z.string().max(20).optional(),
  bloc:      z.string().max(20).optional(),
})

export async function updateProfile(input: {
  name:      string
  apartment?: string
  bloc?:      string
}) {
  const session = await auth()
  /* c8 ignore next */
  if (!session?.user) throw new Error('Non authentifie')

  const data = profileSchema.parse(input)

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name:      data.name,
      apartment: data.apartment ?? null,
      bloc:      data.bloc      ?? null,
    },
    select: { id: true, name: true, apartment: true, bloc: true },
  })

  revalidatePath('/settings/profile')
  return { success: true, user }
}
