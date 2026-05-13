import type { Ticket, User } from '@prisma/client'
import Link from 'next/link'
import { StatusBadge } from './StatusBadge'
import { MapPin, Clock } from 'lucide-react'

type TicketWithAuthor = Ticket & {
  createdBy: Pick<User, 'name' | 'role'>
}

const locationLabel: Record<string, string> = {
  BLOC_A: 'Bloc A',
  BLOC_B: 'Bloc B',
  BLOC_C: 'Bloc C',
  COMMUN: 'Parties communes',
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function TicketCard({ ticket }: { ticket: TicketWithAuthor }) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="card card-interactive"
      style={{ display: 'block', padding: '20px 22px', textDecoration: 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        {/* Auteur + contenu */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0, flex: 1 }}>
          <div
            className="avatar"
            style={{ width: 36, height: 36, fontSize: 11, background: 'var(--clay)', flexShrink: 0 }}
          >
            {getInitials(ticket.createdBy.name ?? '?')}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 14, fontWeight: 700,
                color: 'var(--ink)', letterSpacing: '-0.01em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {ticket.title}
            </p>
            <p
              style={{
                marginTop: 4, fontSize: 13, color: 'var(--muted)',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }}
            >
              {ticket.description}
            </p>
          </div>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      {/* Métadonnées */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          marginTop: 14, paddingTop: 14,
          borderTop: '1px solid var(--border)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
          <MapPin style={{ width: 12, height: 12 }} />
          {locationLabel[ticket.location] ?? ticket.location}
          {ticket.bloc ? ` — ${ticket.bloc}` : ''}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
          <Clock style={{ width: 12, height: 12 }} />
          {timeAgo(ticket.createdAt)}
        </span>
      </div>
    </Link>
  )
}
