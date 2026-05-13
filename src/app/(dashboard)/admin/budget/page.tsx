import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { can } from '@/lib/permissions'
import { computeSummary, formatAmount } from '@/lib/budget'
import { TrendingDown, TrendingUp, Wallet, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { approveQuote, rejectQuote } from './actions'

const currentYear = new Date().getFullYear()

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function BudgetPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!can.accessBudget(session.user.role)) redirect('/feed')

  const [lines, quotes] = await Promise.all([
    prisma.budgetLine.findMany({
      where:   { year: currentYear },
      include: { expenses: true },
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    }),
    prisma.quote.findMany({
      where:   { status: 'PENDING' },
      include: { submittedBy: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const { lines: computed, totalBudget, totalSpent, totalRemaining } = computeSummary(lines)
  const globalPct = totalBudget === 0 ? 0 : Math.round((totalSpent / totalBudget) * 100)

  const byCategory = computed.reduce<Record<string, typeof computed>>((acc, line) => {
    if (!acc[line.category]) acc[line.category] = []
    acc[line.category].push(line)
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Header */}
      <div>
        <h1 className="page-title">Budget {currentYear}</h1>
        <p className="page-subtitle">Suivi des charges et dépenses de la copropriété</p>
      </div>

      {/* Cartes synthèse — bento 3 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { icon: Wallet,      label: 'Budget total',        value: formatAmount(totalBudget),    accent: '#2E6B49',   bg: '#D6EBE0', sub: null },
          { icon: TrendingDown, label: `Dépenses (${globalPct}%)`, value: formatAmount(totalSpent), accent: '#8B6020', bg: '#FBF0DC', sub: globalPct },
          { icon: TrendingUp,  label: 'Restant',             value: formatAmount(Math.abs(totalRemaining)),
            accent: totalRemaining < 0 ? '#B85050' : '#2E6B49',
            bg:     totalRemaining < 0 ? '#F7E0E0' : '#D6EBE0',
            sub: null,
          },
        ].map(({ icon: Icon, label, value, accent, bg, sub }) => (
          <div key={label} className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 16, height: 16, color: accent }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{label}</p>
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em' }}>{value}</p>
            {sub !== null && (
              <div style={{ height: 4, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden', marginTop: 10 }}>
                <div style={{ height: '100%', borderRadius: 99, background: accent, width: `${Math.min(sub, 100)}%`, transition: 'width 0.4s ease' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Devis en attente */}
      {quotes.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#7A5520', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock style={{ width: 14, height: 14 }} />
            Devis en attente ({quotes.length})
          </p>
          {quotes.map((quote) => (
            <div key={quote.id} className="card" style={{ padding: '18px 22px', borderLeft: '3px solid #D4A04A' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ width: 34, height: 34, fontSize: 11, background: '#8B6020' }}>
                    {getInitials(quote.submittedBy.name ?? '?')}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{quote.description}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {quote.submittedBy.name} · {formatDate(quote.createdAt)}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', flexShrink: 0 }}>
                  {formatAmount(Number(quote.amount))}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <form action={async () => { 'use server'; await approveQuote(quote.id) }} style={{ flex: 1 }}>
                  <button type="submit" className="btn-primary" style={{ width: '100%', background: 'var(--success)', fontSize: 13 }}>
                    <CheckCircle2 style={{ width: 14, height: 14 }} /> Approuver
                  </button>
                </form>
                <form action={async () => { 'use server'; await rejectQuote(quote.id) }} style={{ flex: 1 }}>
                  <button type="submit" className="btn-secondary" style={{ width: '100%', fontSize: 13 }}>
                    <XCircle style={{ width: 14, height: 14 }} /> Refuser
                  </button>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Lignes budgétaires par catégorie */}
      {Object.entries(byCategory).map(([category, catLines]) => (
        <section key={category} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="section-label">{category}</p>
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            {catLines.map((line, i) => (
              <div key={line.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 20px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{line.label}</p>
                  <div style={{ height: 4, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden', marginTop: 6 }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: line.pct > 100 ? 'var(--danger)' : line.pct > 80 ? '#D4A04A' : '#3D9E6A',
                      width: `${Math.min(line.pct, 100)}%`,
                    }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{formatAmount(line.spent)}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>/ {formatAmount(Number(line.budgeted))}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {computed.length === 0 && (
        <div className="empty-state">
          <Wallet style={{ width: 32, height: 32, color: 'var(--muted-light)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Aucune ligne budgétaire pour {currentYear}.</p>
        </div>
      )}
    </div>
  )
}
