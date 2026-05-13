import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Newspaper, Wrench, MessageCircle, FolderOpen,
  BarChart2, Settings, LogOut, Bell, UserCircle,
} from 'lucide-react'
import { UnreadBadge } from './UnreadBadge'

const roleBadge: Record<string, { label: string; bg: string; color: string }> = {
  ADMIN:          { label: 'Admin',          bg: '#EDEDEB', color: '#3D3D3D' },
  CONSEIL:        { label: 'Conseil',        bg: '#D6EBE0', color: '#1F5C3A' },
  SYNDIC:         { label: 'Syndic',         bg: '#FBF0DC', color: '#7A5520' },
  COPROPRIETAIRE: { label: 'Copropriétaire', bg: '#F7EDE9', color: '#8B3E2A' },
  LOCATAIRE:      { label: 'Locataire',      bg: '#E8F2DE', color: '#3D5C1F' },
}

const navGroups = [
  {
    label: 'Espace commun',
    items: [
      { href: '/feed',      label: 'Actualités', icon: Newspaper,     roles: null },
      { href: '/messages',  label: 'Messages',   icon: MessageCircle, roles: null },
      { href: '/tickets',   label: 'Incidents',  icon: Wrench,        roles: null },
      { href: '/polls',     label: 'Sondages',   icon: BarChart2,     roles: null },
      { href: '/documents', label: 'Documents',  icon: FolderOpen,    roles: null },
    ],
  },
  {
    label: 'Mon espace',
    items: [
      { href: '/settings/profile',       label: 'Mon profil',    icon: UserCircle, roles: null },
      { href: '/settings/notifications', label: 'Notifications', icon: Bell,       roles: null },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { href: '/admin', label: 'Administration', icon: Settings, roles: ['ADMIN', 'CONSEIL', 'SYNDIC'] },
    ],
  },
]

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.status !== 'ACTIVE') redirect('/pending')

  const { user } = session
  const badge    = roleBadge[user.role] ?? { label: user.role, bg: '#EDEDEB', color: '#3D3D3D' }
  const initials = getInitials(user.name ?? '?')

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Sidebar desktop ─────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-[220px] shrink-0 flex-col"
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5"
          style={{
            padding: '22px 20px 18px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: 34, height: 34,
              background: 'var(--clay)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z" fill="white"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.2 }}>
              Orangeraie 1
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted-light)', lineHeight: 1 }}>
              Copropriété
            </p>
          </div>
        </div>

        {/* Navigation groupée */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '12px 12px' }}>
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.roles || item.roles.includes(user.role)
            )
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label} style={{ marginBottom: 24 }}>
                <p className="section-label" style={{ padding: '0 10px', marginBottom: 6 }}>
                  {group.label}
                </p>
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 10px',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--muted)',
                        textDecoration: 'none',
                        transition: 'var(--ease)',
                      }}
                      className="nav-link"
                    >
                      <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                      {item.label}
                      {item.href === '/messages' && <UnreadBadge />}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Profil utilisateur */}
        <div
          style={{
            padding: '14px 12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px',
              borderRadius: 12,
              background: 'var(--surface-2)',
            }}
          >
            {/* Avatar */}
            <div
              className="avatar"
              style={{
                width: 34, height: 34, fontSize: 11,
                background: 'var(--clay)',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>

            {/* Nom + badge */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }} className="truncate">
                {user.name}
              </p>
              <span
                className="badge"
                style={{
                  background: badge.bg,
                  color: badge.color,
                  fontSize: 10,
                  padding: '2px 8px',
                  marginTop: 2,
                }}
              >
                {badge.label}
              </span>
            </div>

            {/* Déconnexion */}
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
              }}
            >
              <button
                type="submit"
                title="Déconnexion"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32, height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted-light)',
                  cursor: 'pointer',
                  transition: 'var(--ease)',
                  flexShrink: 0,
                }}
                className="btn-logout"
              >
                <LogOut style={{ width: 15, height: 15 }} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Colonne principale ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Topbar mobile */}
        <header
          className="md:hidden flex items-center justify-between"
          style={{
            padding: '12px 16px',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 30, height: 30,
                background: 'var(--clay)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z" fill="white"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Orangeraie 1
            </span>
          </div>
          <span
            className="badge"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </header>

        {/* Nav mobile horizontale */}
        <nav
          className="md:hidden flex overflow-x-auto"
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '0 8px',
            gap: 2,
            scrollbarWidth: 'none',
          }}
        >
          {navGroups.flatMap((g) =>
            g.items.filter((item) => !item.roles || item.roles.includes(user.role))
          ).map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 14px',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--muted)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'var(--ease)',
                  position: 'relative',
                }}
              >
                <Icon style={{ width: 17, height: 17 }} />
                {item.label}
                {item.href === '/messages' && (
                  <span style={{ position: 'absolute', top: 6, right: 8 }}>
                    <UnreadBadge />
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Contenu */}
        <main style={{ flex: 1, padding: 'clamp(20px, 4vw, 40px)', maxWidth: 860, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      {/* Styles hover nav — inline car pas de CSS modules */}
      <style>{`
        .nav-link:hover {
          background: var(--surface-2);
          color: var(--ink);
        }
        .btn-logout:hover {
          background: var(--surface-2);
          color: var(--ink);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
