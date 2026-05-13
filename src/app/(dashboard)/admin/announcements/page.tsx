import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { can } from '@/lib/permissions'
import { Clock, CheckCircle2, XCircle, Plus, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { approveAnnouncement, rejectAnnouncement } from './actions'

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function AdminAnnouncementsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!can.publishAnnouncement(session.user.role)) redirect('/feed')

  const [pending, published] = await Promise.all([
    prisma.announcement.findMany({
      where:   { status: 'PENDING_APPROVAL' },
      include: { author: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.announcement.findMany({
      where:   { status: 'PUBLISHED' },
      include: { author: { select: { name: true, role: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    }),
  ])

  return (
    <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 className="page-title">Gestion des annonces</h1>
          <p className="page-subtitle">
            {pending.length > 0
              ? `${pending.length} annonce${pending.length > 1 ? 's' : ''} en attente d'approbation`
              : 'Aucune annonce en attente'}
          </p>
        </div>
        <Link href="/admin/announcements/new" className="btn-primary" style={{ flexShrink: 0 }}>
          <Plus style={{ width: 15, height: 15 }} /> Nouvelle annonce
        </Link>
      </div>

      {/* En attente */}
      {pending.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#7A5520', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock style={{ width: 14, height: 14 }} /> En attente d&apos;approbation ({pending.length})
          </p>
          {pending.map((ann) => (
            <div key={ann.id} className="card" style={{ padding: '20px 22px', borderLeft: '3px solid #D4A04A' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 11, background: '#8B6020' }}>
                  {getInitials(ann.author.name ?? '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{ann.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    Soumis par {ann.author.name} · {formatDate(ann.createdAt)}
                  </p>
                </div>
                <span className="badge" style={{ background: '#FBF0DC', color: '#7A5520', flexShrink: 0 }}>En attente</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: 16,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                {ann.content}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <form action={async () => { 'use server'; await approveAnnouncement(ann.id) }} style={{ flex: 1 }}>
                  <button type="submit" className="btn-primary" style={{ width: '100%', background: 'var(--success)', fontSize: 13, gap: 7 }}>
                    <CheckCircle2 style={{ width: 14, height: 14 }} /> Approuver et publier
                  </button>
                </form>
                <form action={async () => { 'use server'; await rejectAnnouncement(ann.id) }} style={{ flex: 1 }}>
                  <button type="submit" className="btn-secondary" style={{ width: '100%', fontSize: 13 }}>
                    <XCircle style={{ width: 14, height: 14 }} /> Refuser
                  </button>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Publiées */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Megaphone style={{ width: 14, height: 14, color: 'var(--muted)' }} />
          Publiées récemment ({published.length})
        </p>
        {published.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--muted-light)', fontStyle: 'italic' }}>Aucune annonce publiée.</p>
        ) : (
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            {published.map((ann, i) => (
              <div key={ann.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div className="avatar" style={{ width: 34, height: 34, fontSize: 11, background: '#2E6B49' }}>
                  {getInitials(ann.author.name ?? '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ann.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{ann.author.name} · {ann.publishedAt ? formatDate(ann.publishedAt) : ''}</p>
                </div>
                <span className="badge" style={{ background: '#D6EBE0', color: '#1F5C3A', flexShrink: 0 }}>Publiée</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
