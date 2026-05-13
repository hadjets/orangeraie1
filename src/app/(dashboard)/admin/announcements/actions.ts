'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { announcementSchema, type CreateAnnouncementInput } from './schemas'

export async function createAnnouncement(input: CreateAnnouncementInput) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')

  const { role } = session.user
  if (!can.submitAnnouncement(role)) throw new Error('Permission refusee')

  const data   = announcementSchema.parse(input)
  const status = can.publishAnnouncement(role) ? 'PUBLISHED' : 'PENDING_APPROVAL'

  const announcement = await prisma.announcement.create({
    data: {
      title:       data.title,
      content:     data.content,
      imageUrl:    data.imageUrl || null,
      status,
      authorId:    session.user.id,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  })

  revalidatePath('/feed')
  revalidatePath('/admin/announcements')
  return { success: true, announcementId: announcement.id, status }
}

export async function approveAnnouncement(announcementId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.publishAnnouncement(session.user.role)) throw new Error('Permission refusee')

  await prisma.announcement.update({
    where: { id: announcementId, status: 'PENDING_APPROVAL' },
    data:  { status: 'PUBLISHED', publishedAt: new Date() },
  })

  revalidatePath('/feed')
  revalidatePath('/admin/announcements')
  return { success: true }
}

export async function rejectAnnouncement(announcementId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.publishAnnouncement(session.user.role)) throw new Error('Permission refusee')

  await prisma.announcement.update({
    where: { id: announcementId, status: 'PENDING_APPROVAL' },
    data:  { status: 'DRAFT' },
  })

  revalidatePath('/admin/announcements')
  return { success: true }
}
