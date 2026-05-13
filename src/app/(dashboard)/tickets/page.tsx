import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Plus, Wrench } from 'lucide-react'
import Link from 'next/link'
import { TicketCard } from '@/components/tickets/TicketCard'

export default async function TicketsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user
  const canSeeAll = ['ADMIN', 'CONSEIL', 'SYNDIC'].includes(role)

  const tickets = await prisma.ticket.findMany({
    where: canSeeAll
      ? role === 'SYNDIC'
        ? { status: { in: ['APPROVED', 'IN_PROGRESS', 'RESOLVED'] } }
        : {}
      : { createdById: userId },
    include: { createdBy: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  })

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
          <h1 className="page-title">Incidents</h1>
          <p className="page-subtitle">
            {tickets.length > 0
              ? `${tickets.length} ticket${tickets.length > 1 ? 's' : ''}`
              : 'Aucun incident signalé'}
          </p>
        </div>
        <Link href="/tickets/new" className="btn-primary" style={{ flexShrink: 0 }}>
          <Plus style={{ width: 15, height: 15 }} />
          Signaler
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <div
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--clay-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Wrench style={{ width: 24, height: 24, color: 'var(--clay)' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>
            Aucun incident signalé
          </p>
          <p style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
            Signalez un problème pour qu&apos;il soit pris en charge.
          </p>
          <Link href="/tickets/new" className="btn-primary" style={{ marginTop: 20 }}>
            <Plus style={{ width: 15, height: 15 }} />
            Signaler un incident
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}
