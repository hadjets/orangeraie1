'use client'

import { useState, useTransition } from 'react'
import { createInvitation } from './invite-actions'
import { UserPlus, Loader2, X, Send, Copy, Check } from 'lucide-react'
import type { Role } from '@prisma/client'

const ROLES: { value: Role; label: string }[] = [
  { value: 'LOCATAIRE',      label: 'Locataire'      },
  { value: 'COPROPRIETAIRE', label: 'Copropriétaire' },
  { value: 'SYNDIC',         label: 'Syndic'         },
  { value: 'CONSEIL',        label: 'Conseil'        },
  { value: 'ADMIN',          label: 'Admin'          },
]

export function InviteUserModal() {
  const [open, setOpen]         = useState(false)
  const [email, setEmail]       = useState('')
  const [role, setRole]         = useState<Role>('LOCATAIRE')
  const [error, setError]       = useState<string | null>(null)
  const [token, setToken]       = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setEmail(''); setRole('LOCATAIRE'); setError(null); setToken(null); setCopied(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const result = await createInvitation({ email, role })
        if (result.success) setToken(result.token)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  function copyLink() {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true) }}
        className="flex items-center gap-2 rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
      >
        <UserPlus className="h-4 w-4" />
        Inviter un résident
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-stone-900">Inviter un résident</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {token ? (
              /* ─ Étape 2 : lien généré ─ */
              <div className="px-5 py-6 space-y-4">
                <p className="text-sm text-stone-700">
                  Lien d&apos;invitation généré. Partagez-le avec le résident — il expire dans <strong>7 jours</strong>.
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                  <code className="flex-1 truncate text-xs text-stone-600">
                    {typeof window !== 'undefined' ? `${window.location.origin}/invite/${token}` : `/invite/${token}`}
                  </code>
                  <button onClick={copyLink} className="shrink-0 rounded p-1 text-stone-400 hover:text-stone-700">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  onClick={() => { reset(); setOpen(false) }}
                  className="w-full rounded-lg bg-green-800 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Terminé
                </button>
              </div>
            ) : (
              /* ─ Étape 1 : formulaire ─ */
              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700">Adresse e-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="resident@exemple.fr"
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700">Rôle attribué</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 focus:border-orange-400 focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-stone-200 py-2 text-sm text-stone-600 hover:bg-stone-50">
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-800 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Envoyer l&apos;invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
