import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Plus, Megaphone } from 'lucide-react'
import Link from 'next/link'

const roleBadge: Record<string, { label: string; bg: string; color: string }> = {
  ADMIN:          { label: 'Admin',          bg: '#EDEDEB', color: '#3D3D3D' },
  CONSEIL:        { label: 'Conseil',        bg: '#D6EBE0', color: '#1F5C3A' },
  SYNDIC:         { label: 'Syndic',         bg: '#FBF0DC', color: '#7A5520' },
  COPROPRIETAIRE: { label: 'Copropriétaire', bg: '#F7EDE9', color: '#8B3E2A' },
  LOCATAIRE:      { label: 'Locataire',      bg: '#E8F2DE', color: '#3D5C1F' },
}

const avatarBg: Record<string, string> = {
  ADMIN:          '#5C5C5C',
  CONSEIL:        '#2E6B49',
  SYNDIC:         '#8B6020',
  COPROPRIETAIRE: '#C07C66',
  LOCATAIRE:      '#5C7A3A',
}

function formatDate(date: Date | null) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function FeedPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const announcements = await prisma.announcement.findMany({
    where:   { status: 'PUBLISHED' },
    include: { author: { select: { name: true, role: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  })

  const canPost = ['ADMIN', 'CONSEIL', 'SYNDIC'].includes(session.user.role)

  return (
    <div style={{ maxWidth: 680 }}>

      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <h1 className="page-title">Actualités</h1>
          <p className="page-subtitle">
            {announcements.length > 0
              ? `${announcements.length} annonce${announcements.length > 1 ? 's' : ''} publiées`
              : 'Aucune annonce publiée'}
          </p>
        </div>
        {canPost && (
          <Link href="/admin/announcements/new" className="btn-primary" style={{ flexShrink: 0 }}>
            <Plus style={{ width: 15, height: 15 }} />
            Nouvelle annonce
          </Link>
        )}
      </div>

      {/* État vide */}
      {announcements.length === 0 ? (
        <div className="empty-state">
          <div
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--clay-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Megaphone style={{ width: 24, height: 24, color: 'var(--clay)' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>
            Aucune annonce pour le moment
          </p>
          <p style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
            Les nouvelles publiées par le conseil apparaîtront ici.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map((announcement) => {
            const badge  = roleBadge[announcement.author.role]
            const bg     = avatarBg[announcement.author.role] ?? '#5C5C5C'
            const initials = getInitials(announcement.author.name ?? '?')

            return (
              <article
                key={announcement.id}
                className="card"
                style={{ padding: '22px 24px' }}
              >
                {/* Meta auteur */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div
                    className="avatar"
                    style={{ width: 38, height: 38, fontSize: 12, background: bg }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>
                      {announcement.author.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      {badge && (
                        <span
                          className="badge"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--muted-light)' }}>·</span>
                      <time style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {formatDate(announcement.publishedAt)}
                      </time>
                    </div>
                  </div>
                </div>

                {/* Séparateur */}
                <div className="divider" style={{ margin: '0 0 16px' }} />

                {/* Contenu */}
                <h2
                  style={{
                    fontSize: 16, fontWeight: 700,
                    color: 'var(--ink)', letterSpacing: '-0.02em',
                    marginBottom: 8,
                  }}
                >
                  {announcement.title}
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>
                  {announcement.content}
                </p>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
