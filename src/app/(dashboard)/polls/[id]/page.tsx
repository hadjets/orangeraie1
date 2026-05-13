import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { submitVote } from '../actions'
import type { Role } from '@prisma/client'

export default async function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: userId, role } = session.user
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      options:   { include: { responses: { select: { id: true } } } },
      responses: { where: { userId }, select: { optionId: true } },
    },
  })
  if (!poll) notFound()
  if (!poll.targetRoles.includes(role as Role)) redirect('/polls')

  const userVote    = poll.responses[0]?.optionId ?? null
  const isOpen      = !poll.endsAt || poll.endsAt > new Date()
  const totalVotes  = poll.options.reduce((sum, o) => sum + o.responses.length, 0)
  const canSeeResults = !isOpen || ['ADMIN', 'CONSEIL'].includes(role) || userVote !== null

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <Link href="/polls" className="btn-ghost" style={{ padding: 8, minHeight: 'auto', borderRadius: 10, border: '1px solid var(--border)', flexShrink: 0 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1.3 }}>
            {poll.question}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {isOpen ? 'Sondage en cours' : 'Sondage terminé'} · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        {isOpen && !userVote ? (
          /* ── Zone de vote ── */
          <form style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>
              Choisissez votre réponse :
            </p>
            {poll.options.map((option) => (
              <button
                key={option.id}
                formAction={async () => { 'use server'; await submitVote(poll.id, option.id) }}
                type="submit"
                style={{
                  width: '100%', padding: '14px 18px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface)',
                  fontSize: 14, fontWeight: 500,
                  color: 'var(--ink-2)', textAlign: 'left',
                  cursor: 'pointer', transition: 'var(--ease)',
                }}
                className="vote-btn"
              >
                {option.text}
              </button>
            ))}
          </form>
        ) : (
          /* ── Résultats ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {userVote && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: '#D6EBE0', fontSize: 13, fontWeight: 600, color: '#1F5C3A',
              }}>
                <CheckCircle2 style={{ width: 15, height: 15 }} />
                Votre vote a bien été enregistré
              </div>
            )}
            {canSeeResults ? (
              poll.options.map((option) => {
                const count   = option.responses.length
                const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
                const isMyVote = option.id === userVote

                return (
                  <div key={option.id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                      <span style={{
                        fontSize: 14, fontWeight: isMyVote ? 700 : 500,
                        color: isMyVote ? 'var(--clay-hover)' : 'var(--ink-2)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {option.text}
                        {isMyVote && <CheckCircle2 style={{ width: 13, height: 13, color: 'var(--clay)' }} />}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {count} · <strong>{percent}%</strong>
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        background: isMyVote ? 'var(--clay)' : 'var(--border-hover)',
                        width: `${percent}%`,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
                Les résultats seront visibles après votre vote ou la clôture du sondage.
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`.vote-btn:hover { background: var(--clay-light) !important; border-color: var(--clay) !important; color: var(--clay-hover) !important; }`}</style>
    </div>
  )
}
