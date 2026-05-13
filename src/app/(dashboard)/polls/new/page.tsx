'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createPoll } from '../actions'
import { AlertCircle, Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

const ALL_ROLES = [
  { value: 'COPROPRIETAIRE', label: 'Copropriétaires' },
  { value: 'LOCATAIRE',      label: 'Locataires'       },
  { value: 'CONSEIL',        label: 'Conseil syndical' },
  { value: 'SYNDIC',         label: 'Syndic'           },
]

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>
      {children}
    </label>
  )
}

export default function NewPollPage() {
  const router = useRouter()
  const [isPending, startTransition]   = useTransition()
  const [error, setError]              = useState<string | null>(null)
  const [fieldErrors, setFieldErrors]  = useState<Record<string, string>>({})
  const [options, setOptions]          = useState(['', ''])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  function addOption() { if (options.length < 6) setOptions((p) => [...p, '']) }
  function removeOption(i: number) { if (options.length > 2) setOptions((p) => p.filter((_, idx) => idx !== i)) }
  function toggleRole(v: string) { setSelectedRoles((p) => p.includes(v) ? p.filter((r) => r !== v) : [...p, v]) }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null); setFieldErrors({})
    const fd = new FormData(e.currentTarget)
    const schema = z.object({
      question:    z.string().min(5, 'Question trop courte'),
      options:     z.array(z.string().min(1)).min(2).max(6),
      targetRoles: z.array(z.string()).min(1, 'Sélectionnez au moins un public'),
      targetBloc:  z.string().optional(),
      endsAt:      z.string().datetime({ offset: true }).optional(),
    })
    const endsAtRaw = fd.get('endsAt') as string
    const raw = {
      question: fd.get('question') as string,
      options: options.filter((o) => o.trim() !== ''),
      targetRoles: selectedRoles,
      targetBloc: (fd.get('targetBloc') as string) || undefined,
      endsAt: endsAtRaw ? new Date(endsAtRaw).toISOString() : undefined,
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
        const result = await createPoll(parsed.data)
        if (result.success) router.push('/polls')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      }
    })
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <Link href="/polls" className="btn-ghost" style={{ padding: 8, minHeight: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </Link>
        <div>
          <h1 className="page-title" style={{ fontSize: 22 }}>Créer un sondage</h1>
          <p className="page-subtitle">Définissez la question, les options et l'audience.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Question */}
        <div>
          <Label htmlFor="question">Question <span style={{ color: 'var(--clay)' }}>*</span></Label>
          <input id="question" name="question" type="text" required className="input"
            placeholder="Ex : Êtes-vous favorables aux nouveaux horaires ?" />
          {fieldErrors.question && <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>{fieldErrors.question}</p>}
        </div>

        {/* Options */}
        <div>
          <Label>Options <span style={{ color: 'var(--clay)' }}>*</span> <span style={{ fontWeight: 400, color: 'var(--muted-light)', fontSize: 12 }}>(2 à 6)</span></Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="text" value={opt}
                  onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n) }}
                  placeholder={`Option ${i + 1}`}
                  className="input" style={{ flex: 1 }}
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="btn-ghost" style={{ padding: 8, minHeight: 'auto', borderRadius: 8, color: 'var(--danger)' }}>
                    <Trash2 style={{ width: 15, height: 15 }} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button type="button" onClick={addOption}
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 13, fontWeight: 600, color: 'var(--clay)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Plus style={{ width: 14, height: 14 }} /> Ajouter une option
            </button>
          )}
          {fieldErrors.options && <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>{fieldErrors.options}</p>}
        </div>

        {/* Public cible */}
        <div>
          <Label>Public cible <span style={{ color: 'var(--clay)' }}>*</span></Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_ROLES.map((r) => {
              const active = selectedRoles.includes(r.value)
              return (
                <button key={r.value} type="button" onClick={() => toggleRole(r.value)}
                  style={{
                    padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'var(--ease)', border: '1.5px solid',
                    borderColor: active ? 'var(--clay)' : 'var(--border)',
                    background: active ? 'var(--clay-light)' : 'var(--surface)',
                    color: active ? 'var(--clay-hover)' : 'var(--muted)',
                  }}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
          {fieldErrors.targetRoles && <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>{fieldErrors.targetRoles}</p>}
        </div>

        {/* Bloc optionnel */}
        <div>
          <Label htmlFor="targetBloc">Bloc spécifique <span style={{ fontWeight: 400, color: 'var(--muted-light)', fontSize: 12 }}>(optionnel)</span></Label>
          <select id="targetBloc" name="targetBloc" className="input" style={{ cursor: 'pointer' }}>
            <option value="">Tous les blocs</option>
            <option value="A">Bloc A</option>
            <option value="B">Bloc B</option>
            <option value="C">Bloc C</option>
          </select>
        </div>

        {/* Date de fin */}
        <div>
          <Label htmlFor="endsAt">Date de clôture <span style={{ fontWeight: 400, color: 'var(--muted-light)', fontSize: 12 }}>(optionnel)</span></Label>
          <input id="endsAt" name="endsAt" type="datetime-local" className="input" />
        </div>

        {error && (
          <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '12px 14px', fontSize: 13, color: '#B91C1C' }}>
            <AlertCircle style={{ width: 15, height: 15, marginTop: 1, flexShrink: 0 }} />{error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
          <Link href="/polls" className="btn-secondary">Annuler</Link>
          <button type="submit" disabled={isPending} className="btn-primary" style={{ flex: 1 }}>
            {isPending ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />Création…</> : 'Créer le sondage'}
          </button>
        </div>
      </form>
    </div>
  )
}
