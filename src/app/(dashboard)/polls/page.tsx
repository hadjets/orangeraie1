import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { can } from '@/lib/permissions'
import { BarChart2, Plus, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { Role } from '@prisma/client'

function isPollOpen(endsAt: Date | null): boolean {
  if (!endsAt) return true
  return endsAt > new Date()
}

function formatDeadline(endsAt: Date | null): string {
  if (!endsAt) return 'Permanent'
  if (!isPollOpen(endsAt)) return 'Terminé'
  const diff = endsAt.getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days === 1) return 'Se termine demain'
  return `${days} jours restants`
}

export default async function PollsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user

  const polls = await prisma.poll.findMany({
    where: { targetRoles: { has: role as Role } },
    include: {
      options: { include: { responses: { select: { id: true } } } },
      responses: { where: { userId }, select: { optionId: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const canManage = can.managePoll(role)

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
          <h1 className="page-title">Sondages</h1>
          <p className="page-subtitle">
            {polls.length > 0
              ? `${polls.length} sondage${polls.length > 1 ? 's' : ''} vous concernent`
              : 'Aucun sondage pour le moment'}
          </p>
        </div>
        {canManage && (
          <Link href="/polls/new" className="btn-primary" style={{ flexShrink: 0 }}>
            <Plus style={{ width: 15, height: 15 }} />
            Créer un sondage
          </Link>
        )}
      </div>

      {polls.length === 0 ? (
        <div className="empty-state">
          <div
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--clay-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <BarChart2 style={{ width: 24, height: 24, color: 'var(--clay)' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>
            Aucun sondage pour le moment
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {polls.map((poll) => {
            const userVote   = poll.responses[0]?.optionId ?? null
            const totalVotes = poll.options.reduce((sum, o) => sum + o.responses.length, 0)
            const open       = isPollOpen(poll.endsAt)

            return (
              <Link
                key={poll.id}
                href={`/polls/${poll.id}`}
                className="card card-interactive"
                style={{ display: 'block', padding: '20px 22px', textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <p
                    style={{
                      fontSize: 15, fontWeight: 700,
                      color: 'var(--ink)', letterSpacing: '-0.02em',
                      lineHeight: 1.4,
                    }}
                  >
                    {poll.question}
                  </p>

                  {/* Badge état */}
                  {userVote ? (
                    <span className="badge" style={{ background: '#D6EBE0', color: '#1F5C3A', flexShrink: 0, gap: 5 }}>
                      <CheckCircle2 style={{ width: 11, height: 11 }} />
                      Voté
                    </span>
                  ) : open ? (
                    <span className="badge" style={{ background: 'var(--clay-light)', color: 'var(--clay-hover)', flexShrink: 0 }}>
                      À voter
                    </span>
                  ) : (
                    <span className="badge" style={{ background: '#F0EDED', color: '#7A7672', flexShrink: 0 }}>
                      Terminé
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    marginTop: 14, paddingTop: 14,
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
                    <Clock style={{ width: 12, height: 12 }} />
                    {formatDeadline(poll.endsAt)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
