import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { can } from '@/lib/permissions'
import { deleteDocument } from './actions'
import { UploadDocumentForm } from './UploadDocumentForm'
import { FolderOpen, FileText, Trash2, Upload } from 'lucide-react'
import { formatFileSize } from '@/lib/queries/documents'
import type { Role } from '@prisma/client'

export default async function AdminDocumentsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!can.uploadDocument(session.user.role)) redirect('/documents')

  const folders = await prisma.documentFolder.findMany({
    orderBy: { name: 'asc' },
    include: {
      documents: {
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { name: true } } },
      },
    },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100">
            <Upload className="h-5 w-5 text-stone-700" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-stone-900">Gestion des documents</h1>
            <p className="text-sm text-stone-500">
              {folders.reduce((acc, f) => acc + f.documents.length, 0)} document(s) au total
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire d'upload */}
      <div className="rounded-xl border border-stone-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-stone-900">Ajouter un document</h2>
        <UploadDocumentForm folders={folders.map((f) => ({ id: f.id, name: f.name }))} />
      </div>

      {/* Liste par dossier */}
      <div className="space-y-4">
        {folders.map((folder) => (
          <section key={folder.id} className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-600">
              <FolderOpen className="h-4 w-4" />
              {folder.name}
              <span className="font-normal text-stone-400">({folder.documents.length})</span>
            </h2>

            {folder.documents.length === 0 ? (
              <p className="px-4 text-sm text-stone-400">Aucun document dans ce dossier.</p>
            ) : (
              <div className="divide-y divide-stone-50 rounded-xl border border-stone-100 bg-white shadow-sm">
                {folder.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 px-5 py-3">
                    <FileText className="h-4 w-4 shrink-0 text-stone-400" />
                    <div className="min-w-0 flex-1">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm font-medium text-stone-900 hover:underline"
                      >
                        {doc.name}
                      </a>
                      <p className="text-xs text-stone-400">
                        {formatFileSize(doc.fileSize)} · par {doc.uploadedBy.name}
                      </p>
                    </div>
                    <form
                      action={async () => {
                        'use server'
                        await deleteDocument(doc.id)
                      }}
                    >
                      <button
                        type="submit"
                        title="Supprimer"
                        className="rounded p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
