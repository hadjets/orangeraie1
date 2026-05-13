'use client'

import { useState, useTransition } from 'react'
import { uploadDocument } from './actions'
import { Upload, Loader2, CheckCircle2 } from 'lucide-react'

interface UploadDocumentFormProps {
  folders: { id: string; name: string }[]
}

export function UploadDocumentForm({ folders }: UploadDocumentFormProps) {
  const [name,     setName]     = useState('')
  const [url,      setUrl]      = useState('')
  const [folderId, setFolderId] = useState(folders[0]?.id ?? '')
  const [error,    setError]    = useState<string | null>(null)
  const [saved,    setSaved]    = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        await uploadDocument({
          name:     name.trim(),
          fileUrl:  url.trim(),
          fileType: guessMime(url),
          fileSize: 0,
          folderId,
        })
        setSaved(true)
        setName('')
        setUrl('')
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      {/* Nom */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-stone-700">Nom du document</label>
        <input
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Règlement intérieur 2024.pdf"
          className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* Dossier */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-stone-700">Dossier</label>
        <select
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        >
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* URL */}
      <div className="space-y-1.5 sm:col-span-2">
        <label className="text-xs font-medium text-stone-700">
          URL du fichier
          <span className="ml-1 font-normal text-stone-400">(lien public vers le fichier)</span>
        </label>
        <input
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://cdn.example.com/fichier.pdf"
          className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={isPending || folders.length === 0}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-orange-500 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Ajouter le document
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Document ajouté
          </span>
        )}
      </div>
    </form>
  )
}

function guessMime(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    pdf:  'application/pdf',
    doc:  'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls:  'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png:  'image/png',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
  }
  return map[ext] ?? 'application/octet-stream'
}
