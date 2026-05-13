import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { can } from '@/lib/permissions'
import { StatusBadge } from '@/components/tickets/StatusBadge'
import { ArrowLeft, MapPin, Calendar, MessageSquare, CheckCircle2, XCircle, PlayCircle, Flag } from 'lucide-react'
import Link from 'next/link'
import { updateTicketStatus, addTicketComment } from '../actions'

const locationLabel: Record<string, string> = {
  BLOC_A: 'Bloc A', BLOC_B: 'Bloc B', BLOC_C: 'Bloc C', COMMUN: 'Parties communes',
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      createdBy:  { select: { name: true, role: true } },
      validatedBy: { select: { name: true } },
      comments: {
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!ticket) notFound()

  const { role, id: userId } = session.user
  const isCreator   = ticket.createdById === userId
  const canValidate = can.validateTicket(role)
  const canComment  = isCreator || ['ADMIN', 'CONSEIL', 'SYNDIC'].includes(role)

  return (
    <div style={{ maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <Link href="/tickets" className="btn-ghost" style={{ padding: 8, minHeight: 'auto', borderRadius: 10, border: '1px solid var(--border)', flexShrink: 0 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1.3 }}>
              {ticket.title}
            </h1>
            <StatusBadge status={ticket.status} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
              <MapPin style={{ width: 12, height: 12 }} />
              {locationLabel[ticket.location]}{ticket.bloc ? ` — ${ticket.bloc}` : ''}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
              <Calendar style={{ width: 12, height: 12 }} />
              {formatDate(ticket.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Corps du ticket */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="avatar" style={{ width: 38, height: 38, fontSize: 12, background: 'var(--clay)' }}>
            {getInitials(ticket.createdBy.name ?? '?')}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{ticket.createdBy.name}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>Déclarant</p>
          </div>
        </div>
        <div className="divider" style={{ margin: '0 0 16px' }} />
        <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)' }}>{ticket.description}</p>
        {ticket.validatedBy && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
            fontSize: 13, color: 'var(--muted)',
          }}>
            Traité par <strong style={{ color: 'var(--ink-2)' }}>{ticket.validatedBy.name}</strong>
            {ticket.validatedAt ? ` · ${formatDate(ticket.validatedAt)}` : ''}
          </div>
        )}
      </div>

      {/* Actions modération */}
      {canValidate && ticket.status === 'PENDING' && (
        <div style={{ display: 'flex', gap: 10 }}>
          <form action={async () => { 'use server'; await updateTicketStatus(ticket.id, 'APPROVED') }} style={{ flex: 1 }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', background: 'var(--success)', gap: 8 }}>
              <CheckCircle2 style={{ width: 15, height: 15 }} /> Approuver
            </button>
          </form>
          <form action={async () => { 'use server'; await updateTicketStatus(ticket.id, 'REJECTED') }} style={{ flex: 1 }}>
            <button type="submit" className="btn-secondary" style={{ width: '100%' }}>
              <XCircle style={{ width: 15, height: 15 }} /> Rejeter
            </button>
          </form>
        </div>
      )}
      {canValidate && ticket.status === 'APPROVED' && (
        <form action={async () => { 'use server'; await updateTicketStatus(ticket.id, 'IN_PROGRESS') }}>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            <PlayCircle style={{ width: 15, height: 15 }} /> Marquer En cours
          </button>
        </form>
      )}
      {canValidate && ticket.status === 'IN_PROGRESS' && (
        <form action={async () => { 'use server'; await updateTicketStatus(ticket.id, 'RESOLVED') }}>
          <button type="submit" className="btn-primary" style={{ width: '100%', background: 'var(--success)' }}>
            <Flag style={{ width: 15, height: 15 }} /> Marquer Résolu
          </button>
        </form>
      )}

      {/* Commentaires */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare style={{ width: 15, height: 15, color: 'var(--muted)' }} />
          Commentaires ({ticket.comments.length})
        </p>

        {ticket.comments.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--muted-light)', fontStyle: 'italic' }}>
            Aucun commentaire pour le moment.
          </p>
        )}

        {ticket.comments.map((comment) => (
          <div key={comment.id} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 10, background: '#8B6020' }}>
                {getInitials(comment.author.name ?? '?')}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{comment.author.name}</p>
              <span style={{ fontSize: 12, color: 'var(--muted-light)' }}>· {formatDate(comment.createdAt)}</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)' }}>{comment.content}</p>
          </div>
        ))}

        {canComment && (
          <form action={async (fd: FormData) => {
            'use server'
            await addTicketComment(ticket.id, fd.get('content') as string)
          }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea name="content" rows={3} required
              placeholder="Ajouter un commentaire…"
              className="input"
              style={{ resize: 'none', lineHeight: 1.6 }}
            />
            <button type="submit" className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
              Commenter
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
