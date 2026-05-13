import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getRootFolders, formatFileSize, getFileIcon } from '@/lib/queries/documents'
import { FolderOpen, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import type { Role } from '@prisma/client'

const roleLabel: Record<string, string> = {
  ADMIN: 'Admin',
  CONSEIL: 'Conseil',
  SYNDIC: 'Syndic',
  COPROPRIETAIRE: 'Copropriétaire',
  LOCATAIRE: 'Locataire',
}

const fileIconClass: Record<string, string> = {
  pdf: 'text-red-600',
  image: 'text-blue-600',
  word: 'text-blue-800',
  excel: 'text-green-700',
  file: 'text-stone-500',
}

export default async function DocumentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { role } = session.user
  const folders = await getRootFolders(role as Role)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Documents</h1>
        <p className="text-sm text-stone-500">
          Espace documentaire de la copropriete Orangeraie 1
        </p>
      </div>

      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-white py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <FolderOpen className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-stone-600">Aucun dossier accessible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {folders.map((folder) => (
            <div key={folder.id} className="rounded-xl border border-stone-100 bg-white shadow-sm">
              {/* Header dossier */}
              <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-3">
                <FolderOpen className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-semibold text-stone-900">{folder.name}</span>
                <div className="ml-auto flex gap-1">
                  {folder.allowedRoles.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500"
                    >
                      {roleLabel[r as string] ?? r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sous-dossiers */}
              {folder.children.length > 0 && (
                <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-stone-50">
                  {folder.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/documents/${child.id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
                    >
                      <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Documents */}
              {folder.documents.length === 0 ? (
                <p className="px-5 py-4 text-xs text-stone-400">Aucun document dans ce dossier.</p>
              ) : (
                <div className="divide-y divide-stone-50">
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
                          title="Telecharger"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
