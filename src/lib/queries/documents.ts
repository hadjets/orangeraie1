import type { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export function canAccessFolder(allowedRoles: string[], userRole: string): boolean {
  return allowedRoles.includes(userRole)
}

export function canUploadToFolder(userRole: string): boolean {
  return ['ADMIN', 'CONSEIL', 'SYNDIC'].includes(userRole)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function getFileIcon(fileType: string): 'pdf' | 'image' | 'word' | 'excel' | 'file' {
  if (fileType.includes('pdf')) return 'pdf'
  if (fileType.includes('image')) return 'image'
  if (fileType.includes('word') || fileType.includes('document')) return 'word'
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'excel'
  return 'file'
}

export async function getRootFolders(userRole: Role) {
  return prisma.documentFolder.findMany({
    where: {
      parentId: null,
      allowedRoles: { has: userRole },
    },
    include: {
      children: {
        where: { allowedRoles: { has: userRole } },
      },
      documents: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getFolderContents(folderId: string, userRole: Role) {
  const folder = await prisma.documentFolder.findUnique({
    where: { id: folderId },
    include: {
      children: {
        where: { allowedRoles: { has: userRole } },
      },
      documents: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!folder) return null
  if (!canAccessFolder(folder.allowedRoles as string[], userRole as string)) {
    throw new Error('Acces refuse a ce dossier')
  }

  return folder
}
