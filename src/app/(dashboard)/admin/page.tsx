import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { can } from '@/lib/permissions'
import { Megaphone, Wrench, Wallet, Users, ChevronRight, FolderOpen, Clock } from 'lucide-react'
import Link from 'next/link'

const currentYear = new Date().getFullYear()

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!can.accessAdmin(session.user.role)) redirect('/feed')

  const [pendingAnnouncements, pendingTickets, pendingQuotes, userCount] = await Promise.all([
    prisma.announcement.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.ticket.count({ where: { status: 'PENDING' } }),
    can.accessBudget(session.user.role) ? prisma.quote.count({ where: { status: 'PENDING' } }) : Promise.resolve(0),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
  ])

  const stats = [
    { href: '/admin/announcements', icon: Megaphone, label: 'Annonces',  value: pendingAnnouncements, suffix: 'en attente',    accent: '#8B6020', bg: '#FBF0DC', show: true },
    { href: '/tickets',             icon: Wrench,    label: 'Incidents', value: pendingTickets,       suffix: 'non traités',   accent: 'var(--clay-hover)', bg: 'var(--clay-light)', show: true },
    { href: '/admin/budget',        icon: Wallet,    label: 'Budget',    value: pendingQuotes,        suffix: 'devis en attente', accent: '#2E6B49', bg: '#D6EBE0', show: can.accessBudget(session.user.role) },
    { href: '/admin/users',         icon: Users,     label: 'Résidents', value: userCount,            suffix: 'comptes actifs',accent: '#3D3D3D', bg: '#EDEDEB', show: can.validateAccount(session.user.role) },
  ].filter((c) => c.show)

  const shortcuts = [
    { href: '/admin/announcements/new', label: 'Rédiger une annonce',  icon: Megaphone  },
    { href: '/admin/announcements',     label: 'Modérer les annonces', icon: Clock      },
    { href: '/admin/documents',         label: 'Gérer les documents',  icon: FolderOpen },
    { href: '/admin/users',             label: 'Gérer les résidents',  icon: Users      },
    ...(can.accessBudget(session.user.role) ? [{ href: '/admin/budget', label: `Budget ${currentYear}`, icon: Wallet }] : []),
  ]

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div>
        <h1 className="page-title">Administration</h1>
        <p className="page-subtitle">Tableau de bord — Orangeraie 1</p>
      </div>

      {/* Cartes bento stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.href} href={s.href}
              className="card card-interactive"
              style={{ padding: '20px 22px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 18, height: 18, color: s.accent }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.suffix}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Raccourcis */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p className="section-label">Accès rapide</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {shortcuts.map(({ href, label, icon: Icon }, i) => (
            <Link key={href} href={href}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                textDecoration: 'none', transition: 'var(--ease)',
              }}
              className="shortcut-row"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon style={{ width: 16, height: 16, color: 'var(--muted)' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-2)' }}>{label}</span>
              </div>
              <ChevronRight style={{ width: 15, height: 15, color: 'var(--muted-light)' }} />
            </Link>
          ))}
        </div>
      </section>

      <style>{`.shortcut-row:hover { background: var(--surface-2); }`}</style>
    </div>
  )
}
