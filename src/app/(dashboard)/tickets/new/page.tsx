'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createTicket } from '../actions'
import { AlertCircle, Loader2, ArrowLeft, ImagePlus } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  title:       z.string().min(5, 'Titre trop court (min 5 caractères)').max(100),
  description: z.string().min(10, 'Description trop courte (min 10 caractères)').max(1000),
  location:    z.enum(['BLOC_A', 'BLOC_B', 'BLOC_C', 'COMMUN']),
  bloc:        z.string().optional(),
})

const locationOptions = [
  { value: 'BLOC_A', label: 'Bloc A' },
  { value: 'BLOC_B', label: 'Bloc B' },
  { value: 'BLOC_C', label: 'Bloc C' },
  { value: 'COMMUN', label: 'Parties communes' },
] as const

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>{msg}</p>
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>
      {children}
    </label>
  )
}

export default function NewTicketPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError]           = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const fd = new FormData(e.currentTarget)
    const raw = {
      title:       fd.get('title') as string,
      description: fd.get('description') as string,
      location:    fd.get('location') as string,
      bloc:        (fd.get('bloc') as string) || undefined,
    }
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      parsed.error.issues.forEach((i) => { if (i.path[0]) errs[String(i.path[0])] = i.message })
      setFieldErrors(errs)
      return
    }
    startTransition(async () => {
      try {
        const result = await createTicket({ ...parsed.data, photoUrls: [] })
        if (result.success) router.push(`/tickets/${result.ticketId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      }
    })
  }

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Back + titre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <Link href="/tickets" className="btn-ghost" style={{ padding: 8, minHeight: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </Link>
        <div>
          <h1 className="page-title" style={{ fontSize: 22 }}>Signaler un incident</h1>
          <p className="page-subtitle">Décrivez le problème avec le plus de détails possible.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Titre */}
        <div>
          <Label htmlFor="title">Titre <span style={{ color: 'var(--clay)' }}>*</span></Label>
          <input id="title" name="title" type="text" required
            placeholder="Ex : Fuite d'eau dans la cave"
            className="input"
          />
          <FieldError msg={fieldErrors.title} />
        </div>

        {/* Localisation */}
        <div>
          <Label htmlFor="location">Localisation <span style={{ color: 'var(--clay)' }}>*</span></Label>
          <select id="location" name="location" required className="input" style={{ cursor: 'pointer' }}>
            <option value="">Choisir…</option>
            {locationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <FieldError msg={fieldErrors.location} />
        </div>

        {/* Précision */}
        <div>
          <Label htmlFor="bloc">Précision <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted-light)' }}>(étage, couloir…)</span></Label>
          <input id="bloc" name="bloc" type="text"
            placeholder="Ex : 2ème étage, couloir gauche"
            className="input"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description <span style={{ color: 'var(--clay)' }}>*</span></Label>
          <textarea id="description" name="description" rows={5} required
            placeholder="Décrivez le problème en détail : quand cela a commencé, la gravité, ce que vous avez observé…"
            className="input"
            style={{ resize: 'none', lineHeight: 1.6 }}
          />
          <FieldError msg={fieldErrors.description} />
        </div>

        {/* Photo placeholder */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px', gap: 8,
          border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-md)',
          background: 'var(--surface-2)',
        }}>
          <ImagePlus style={{ width: 24, height: 24, color: 'var(--muted-light)' }} />
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Upload de photos disponible après configuration d'UploadThing
          </p>
        </div>

        {/* Erreur globale */}
        {error && (
          <div role="alert" style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 'var(--radius-sm)', padding: '12px 14px',
            fontSize: 13, color: '#B91C1C',
          }}>
            <AlertCircle style={{ width: 15, height: 15, marginTop: 1, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
          <Link href="/tickets" className="btn-secondary" style={{ flexShrink: 0 }}>Annuler</Link>
          <button type="submit" disabled={isPending} className="btn-primary" style={{ flex: 1 }}>
            {isPending ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />Envoi…</> : 'Soumettre le signalement'}
          </button>
        </div>
      </form>
    </div>
  )
}
