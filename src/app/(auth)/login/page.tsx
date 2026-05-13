'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
})

export default function LoginPage() {
  const router = useRouter()
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const raw = {
      email:    formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const parsed = loginSchema.safeParse(raw)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      email:    parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })

    if (result?.error) {
      setError('Identifiants incorrects ou compte non activé.')
      setLoading(false)
      return
    }

    router.push('/feed')
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--bg)' }}>

      {/* ── Panneau gauche — branding ───────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-14"
        style={{ background: '#1C2B1E' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center"
            style={{
              background: 'var(--clay)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>
            Orangeraie 1
          </span>
        </div>

        {/* Citation centrale */}
        <div className="space-y-6">
          <p
            style={{
              fontSize: 'clamp(26px, 3vw, 36px)',
              fontWeight: 300,
              lineHeight: 1.35,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '-0.02em',
            }}
          >
            Gérez votre copropriété simplement,{' '}
            <span style={{ color: 'var(--clay)', fontWeight: 500 }}>
              en toute transparence.
            </span>
          </p>

          {/* 3 points forts */}
          <div className="space-y-3">
            {[
              'Annonces et communications en temps réel',
              'Suivi des incidents et demandes',
              'Documents et budget accessibles',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--clay)' }}
                />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          © 2026 Orangeraie 1
        </p>
      </div>

      {/* ── Panneau droit — formulaire ──────────────────────────────── */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-[380px] space-y-10">

          {/* Logo mobile uniquement */}
          <div className="flex items-center gap-3 lg:hidden">
            <div
              className="flex h-9 w-9 items-center justify-center"
              style={{ background: 'var(--clay)', borderRadius: 'var(--radius-sm)' }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z" fill="white"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Orangeraie 1
            </span>
          </div>

          {/* En-tête */}
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'var(--ink)',
                lineHeight: 1.15,
              }}
            >
              Bon retour 👋
            </h1>
            <p style={{ marginTop: 6, fontSize: 15, color: 'var(--muted)' }}>
              Connectez-vous à votre espace résident
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block' }}
              >
                Adresse e-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 16, height: 16, color: 'var(--muted-light)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="email" name="email" type="email"
                  autoComplete="email" required
                  className="input"
                  style={{ paddingLeft: 42 }}
                  placeholder="votre@email.fr"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block' }}
              >
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 16, height: 16, color: 'var(--muted-light)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="password" name="password" type="password"
                  autoComplete="current-password" required
                  className="input"
                  style={{ paddingLeft: 42 }}
                  placeholder="••••••••"
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

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', fontSize: 15, padding: '13px 20px' }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                  Connexion…
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Note bas de page */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            Accès sur invitation uniquement.{' '}
            <span style={{ color: 'var(--muted-light)' }}>
              Contactez le conseil syndical.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
