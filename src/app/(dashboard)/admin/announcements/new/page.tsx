'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createAnnouncement } from '../actions'
import { AlertCircle, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const schema = z.object({
  title:   z.string().min(3, 'Titre trop court').max(150),
  content: z.string().min(10, 'Contenu trop court').max(5000),
})

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError]             = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg]   = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null); setFieldErrors({}); setSuccessMsg(null)
    const fd  = new FormData(e.currentTarget)
    const raw = { title: fd.get('title') as string, content: fd.get('content') as string }
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      parsed.error.issues.forEach((i) => { if (i.path[0]) errs[String(i.path[0])] = i.message })
      setFieldErrors(errs); return
    }
    startTransition(async () => {
      try {
        const result = await createAnnouncement(parsed.data)
        if (result.success) {
          if (result.status === 'PUBLISHED') { router.push('/feed') }
          else { setSuccessMsg("Votre annonce a été soumise au Conseil pour approbation.") }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      }
    })
  }

  if (successMsg) {
    return (
      <div style={{ maxWidth: 520 }}>
        <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#D6EBE0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 style={{ width: 24, height: 24, color: '#2E6B49' }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Annonce soumise</p>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>{successMsg}</p>
          <Link href="/feed" className="btn-primary" style={{ display: 'inline-flex' }}>
            Retour aux actualités
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <Link href="/admin/announcements" className="btn-ghost" style={{ padding: 8, minHeight: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </Link>
        <div>
          <h1 className="page-title" style={{ fontSize: 22 }}>Rédiger une annonce</h1>
          <p className="page-subtitle">Publiée immédiatement ou soumise selon votre rôle.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label htmlFor="title" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>
            Titre <span style={{ color: 'var(--clay)' }}>*</span>
          </label>
          <input id="title" name="title" type="text" required className="input"
            placeholder="Ex : Réunion de copropriété le 15 juin" />
          {fieldErrors.title && <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>{fieldErrors.title}</p>}
        </div>

        <div>
          <label htmlFor="content" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>
            Contenu <span style={{ color: 'var(--clay)' }}>*</span>
          </label>
          <textarea id="content" name="content" rows={9} required className="input"
            style={{ resize: 'none', lineHeight: 1.7 }}
            placeholder="Rédigez votre annonce ici…" />
          {fieldErrors.content && <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>{fieldErrors.content}</p>}
        </div>

        {error && (
          <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: 13, color: '#B91C1C' }}>
            <AlertCircle style={{ width: 15, height: 15, marginTop: 1, flexShrink: 0 }} />{error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
          <Link href="/admin/announcements" className="btn-secondary">Annuler</Link>
          <button type="submit" disabled={isPending} className="btn-primary" style={{ flex: 1 }}>
            {isPending ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />Publication…</> : 'Publier l\'annonce'}
          </button>
        </div>
      </form>
    </div>
  )
}
