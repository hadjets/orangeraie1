import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { RegisterForm } from './RegisterForm'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const invitation = await prisma.invitation.findUnique({ where: { token } })

  // ── Token invalide ───────────────────────────────────────────────
  if (!invitation) {
    return (
      <InviteLayout>
        <XCircle style={{ width: 48, height: 48, color: '#EF4444', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          Lien invalide
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          Ce lien d&apos;invitation n&apos;existe pas ou a déjà été supprimé.
        </p>
      </InviteLayout>
    )
  }

  // ── Déjà utilisé ─────────────────────────────────────────────────
  if (invitation.usedAt) {
    return (
      <InviteLayout>
        <CheckCircle2 style={{ width: 48, height: 48, color: 'var(--success)', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          Invitation déjà utilisée
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
          Ce lien a déjà été activé. Connectez-vous directement.
        </p>
        <a href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>
          Se connecter
        </a>
      </InviteLayout>
    )
  }

  // ── Expiré ───────────────────────────────────────────────────────
  if (new Date() > new Date(invitation.expiresAt)) {
    return (
      <InviteLayout>
        <Clock style={{ width: 48, height: 48, color: '#F59E0B', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          Invitation expirée
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          Ce lien a expiré. Demandez un nouveau lien à votre gestionnaire.
        </p>
      </InviteLayout>
    )
  }

  // ── Compte déjà existant — juste connecter ───────────────────────
  const existing = await prisma.user.findUnique({ where: { email: invitation.email } })
  if (existing) {
    redirect('/login')
  }

  // ── Valide — afficher le formulaire d'inscription ─────────────────
  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--bg)' }}>

      {/* ── Panneau gauche — branding ─────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-14"
        style={{ background: '#1C2B1E' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40, height: 40, background: 'var(--clay)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{
            fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 300,
            lineHeight: 1.35, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.02em',
          }}>
            Bienvenue dans votre{' '}
            <span style={{ color: 'var(--clay)', fontWeight: 500 }}>espace résident.</span>
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
            Créez votre compte en quelques secondes.<br />
            Votre rôle et vos accès sont déjà configurés.
          </p>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 Orangeraie 1</p>
      </div>

      {/* ── Panneau droit — formulaire ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Logo mobile */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: 'var(--clay)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z" fill="white"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Orangeraie 1</span>
          </div>

          {/* En-tête */}
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink)', lineHeight: 1.15 }}>
              Créez votre compte 🏠
            </h1>
            <p style={{ marginTop: 6, fontSize: 15, color: 'var(--muted)' }}>
              Vous avez été invité à rejoindre la résidence.
            </p>
          </div>

          <RegisterForm
            token={token}
            email={invitation.email}
            role={invitation.role}
          />

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
            Déjà un compte ?{' '}
            <a href="/login" style={{ color: 'var(--clay)', fontWeight: 600, textDecoration: 'none' }}>
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 400,
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 8, fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
          Orangeraie 1
        </div>
        {children}
      </div>
    </div>
  )
}
