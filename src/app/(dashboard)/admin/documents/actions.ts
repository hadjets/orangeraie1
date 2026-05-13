'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'

const uploadSchema = z.object({
  name:     z.string().min(1, 'Nom requis').max(255),
  fileUrl:  z.string().url('URL invalide'),
  fileType: z.string().min(1),
  fileSize: z.number().int().min(0),
  folderId: z.string().min(1),
})

export async function uploadDocument(input: {
  name:     string
  fileUrl:  string
  fileType: string
  fileSize: number
  folderId: string
}) {
  const session = await auth()
  /* c8 ignore next */
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.uploadDocument(session.user.role)) throw new Error('Permission refusee')

  const data = uploadSchema.parse(input)

  // Vérifier que le dossier existe
  const folder = await prisma.documentFolder.findUnique({ where: { id: data.folderId } })
  if (!folder) throw new Error('Dossier introuvable')

  const document = await prisma.document.create({
    data: {
      name:         data.name,
      fileUrl:      data.fileUrl,
      fileType:     data.fileType,
      fileSize:     data.fileSize,
      folderId:     data.folderId,
      uploadedById: session.user.id,
    },
  })

  revalidatePath('/documents')
  revalidatePath('/admin/documents')
  return { success: true, document }
}

export async function deleteDocument(documentId: string) {
  const session = await auth()
  /* c8 ignore next */
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.uploadDocument(session.user.role)) throw new Error('Permission refusee')

  await prisma.document.delete({ where: { id: documentId } })

  revalidatePath('/documents')
  revalidatePath('/admin/documents')
  return { success: true }
}
