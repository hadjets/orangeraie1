'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerFromInvitation } from './register-action'
import { User, Lock, Loader2, AlertCircle } from 'lucide-react'

const roleLabel: Record<string, string> = {
  ADMIN:          'Administrateur',
  CONSEIL:        'Conseil syndical',
  SYNDIC:         'Syndic',
  COPROPRIETAIRE: 'Copropriétaire',
  LOCATAIRE:      'Locataire',
}

interface RegisterFormProps {
  token: string
  email: string
  role:  string
}

export function RegisterForm({ token, email, role }: RegisterFormProps) {
  const router = useRouter()
  const [name,     setName]     = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (name.trim().length < 2) {
      setError('Le nom doit faire au moins 2 caractères.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await registerFromInvitation({ token, name: name.trim(), password })
      router.push('/feed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>

      {/* Email (lecture seule) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
          Adresse e-mail
        </label>
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            fontSize: 14,
            color: 'var(--muted)',
          }}
        >
          {email}
        </div>
      </div>

      {/* Rôle (lecture seule) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
          Votre rôle
        </label>
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            fontSize: 14,
            color: 'var(--muted)',
          }}
        >
          {roleLabel[role] ?? role}
        </div>
      </div>

      {/* Nom complet */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="name" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
          Votre nom complet
        </label>
        <div style={{ position: 'relative' }}>
          <User style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)',
            width: 16, height: 16, color: 'var(--muted-light)',
            pointerEvents: 'none',
          }} />
          <input
            id="name" type="text" required autoComplete="name"
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Prénom Nom"
            className="input"
            style={{ paddingLeft: 42 }}
          />
        </div>
      </div>

      {/* Mot de passe */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="password" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
          Choisissez un mot de passe
        </label>
        <div style={{ position: 'relative' }}>
          <Lock style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)',
            width: 16, height: 16, color: 'var(--muted-light)',
            pointerEvents: 'none',
          }} />
          <input
            id="password" type="password" required autoComplete="new-password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="8 caractères minimum"
            className="input"
            style={{ paddingLeft: 42 }}
          />
        </div>
      </div>

      {/* Confirmation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="confirm" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
          Confirmez le mot de passe
        </label>
        <div style={{ position: 'relative' }}>
          <Lock style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)',
            width: 16, height: 16, color: 'var(--muted-light)',
            pointerEvents: 'none',
          }} />
          <input
            id="confirm" type="password" required autoComplete="new-password"
            value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="input"
            style={{ paddingLeft: 42 }}
          />
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            fontSize: 13, color: '#B91C1C',
          }}
        >
          <AlertCircle style={{ width: 15, height: 15, marginTop: 1, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
        style={{ width: '100%', fontSize: 15, padding: '13px 20px' }}
      >
        {loading
          ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />Création du compte…</>
          : 'Créer mon compte et me connecter'
        }
      </button>
    </form>
  )
}
