import { describe, it, expect } from 'vitest'

// Logique pure de calcul budgétaire — testable sans Prisma
interface BudgetLine {
  id: string
  label: string
  budgeted: number
  expenses: { amount: number }[]
}

function computeBudgetLine(line: BudgetLine) {
  const spent     = line.expenses.reduce((sum, e) => sum + e.amount, 0)
  const remaining = line.budgeted - spent
  const pct       = line.budgeted === 0 ? 0 : Math.round((spent / line.budgeted) * 100)
  return { ...line, spent, remaining, pct }
}

function computeSummary(lines: BudgetLine[]) {
  const computed   = lines.map(computeBudgetLine)
  const totalBudget = computed.reduce((s, l) => s + l.budgeted, 0)
  const totalSpent  = computed.reduce((s, l) => s + l.spent,    0)
  return { lines: computed, totalBudget, totalSpent, totalRemaining: totalBudget - totalSpent }
}

function formatAmount(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

describe('budget — computeBudgetLine', () => {
  it('calcule correctement spent et remaining', () => {
    const line = { id: '1', label: 'Nettoyage', budgeted: 1000, expenses: [{ amount: 300 }, { amount: 200 }] }
    const result = computeBudgetLine(line)
    expect(result.spent).toBe(500)
    expect(result.remaining).toBe(500)
    expect(result.pct).toBe(50)
  })

  it('retourne 0% si aucune depense', () => {
    const line = { id: '2', label: 'Ascenseur', budgeted: 5000, expenses: [] }
    const result = computeBudgetLine(line)
    expect(result.spent).toBe(0)
    expect(result.pct).toBe(0)
  })

  it('retourne 100% si budget epuise', () => {
    const line = { id: '3', label: 'Travaux', budgeted: 2000, expenses: [{ amount: 2000 }] }
    const result = computeBudgetLine(line)
    expect(result.pct).toBe(100)
    expect(result.remaining).toBe(0)
  })

  it('gere un depassement de budget (remaining negatif)', () => {
    const line = { id: '4', label: 'Urgence', budgeted: 500, expenses: [{ amount: 700 }] }
    const result = computeBudgetLine(line)
    expect(result.remaining).toBe(-200)
    expect(result.pct).toBe(140)
  })

  it('retourne pct = 0 si budget = 0 (evite division par zero)', () => {
    const line = { id: '5', label: 'Divers', budgeted: 0, expenses: [] }
    const result = computeBudgetLine(line)
    expect(result.pct).toBe(0)
  })
})

describe('budget — computeSummary', () => {
  const lines: BudgetLine[] = [
    { id: '1', label: 'Nettoyage', budgeted: 1000, expenses: [{ amount: 400 }] },
    { id: '2', label: 'Ascenseur', budgeted: 3000, expenses: [{ amount: 1000 }, { amount: 500 }] },
  ]

  it('calcule les totaux globaux', () => {
    const summary = computeSummary(lines)
    expect(summary.totalBudget).toBe(4000)
    expect(summary.totalSpent).toBe(1900)
    expect(summary.totalRemaining).toBe(2100)
  })

  it('retourne les lignes calculees', () => {
    const summary = computeSummary(lines)
    expect(summary.lines).toHaveLength(2)
    expect(summary.lines[0].spent).toBe(400)
    expect(summary.lines[1].spent).toBe(1500)
  })
})

describe('budget — formatAmount', () => {
  it('formate un montant en euros', () => {
    const result = formatAmount(1234.5)
    expect(result).toContain('1')
    expect(result).toContain('€')
  })
})
