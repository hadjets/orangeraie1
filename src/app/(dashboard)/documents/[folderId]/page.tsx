import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getFolderContents, formatFileSize, getFileIcon } from '@/lib/queries/documents'
import { FolderOpen, FileText, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Role } from '@prisma/client'

const roleLabel: Record<string, string> = {
  ADMIN:         'Admin',
  CONSEIL:       'Conseil',
  SYNDIC:        'Syndic',
  COPROPRIETAIRE:'Copropriétaire',
  LOCATAIRE:     'Locataire',
}

const fileIconClass: Record<string, string> = {
  pdf:   'text-red-600',
  image: 'text-blue-600',
  word:  'text-blue-800',
  excel: 'text-green-700',
  file:  'text-stone-500',
}

export default async function FolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>
}) {
  const { folderId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  let folder
  try {
    folder = await getFolderContents(folderId, session.user.role as Role)
  } catch {
    redirect('/documents')
  }

  if (!folder) notFound()

  return (
    <div className="space-y-6">
      {/* Header avec fil d'Ariane */}
      <div className="flex items-center gap-3">
        <Link
          href="/documents"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:bg-stone-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Link href="/documents" className="text-sm text-stone-400 hover:text-stone-600">
              Documents
            </Link>
            <span className="text-stone-300">/</span>
            <h1 className="text-sm font-semibold text-stone-900">{folder.name}</h1>
          </div>
          <p className="text-xs text-stone-500">
            {folder.documents.length} document{folder.documents.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Sous-dossiers */}
      {folder.children.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {folder.children.map((child) => (
            <Link
              key={child.id}
              href={`/documents/${child.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 shadow-sm transition hover:bg-stone-50"
            >
              <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Documents */}
      {folder.documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-white py-16 text-center">
          <FolderOpen className="mb-3 h-8 w-8 text-stone-300" />
          <p className="text-sm text-stone-400">Aucun document dans ce dossier.</p>
        </div>
      ) : (
        <div className="divide-y divide-stone-50 rounded-xl border border-stone-100 bg-white shadow-sm">
          {folder.documents.map((doc) => {
            const iconType = getFileIcon(doc.fileType)
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 px-5 py-3 transition hover:bg-stone-50"
              >
                <FileText className={`h-5 w-5 shrink-0 ${fileIconClass[iconType]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{doc.name}</p>
                  <p className="text-xs text-stone-400">
                    {formatFileSize(doc.fileSize)} · par {doc.uploadedBy.name} ·{' '}
                    {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-400 transition hover:bg-green-50 hover:text-green-700"
                  title="Télécharger"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
