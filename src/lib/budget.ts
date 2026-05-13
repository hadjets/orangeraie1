import type { BudgetLine, Expense } from '@prisma/client'

export type BudgetLineWithExpenses = BudgetLine & { expenses: Expense[] }

export function computeBudgetLine(line: BudgetLineWithExpenses) {
  const spent     = line.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const budgeted  = Number(line.budgeted)
  const remaining = budgeted - spent
  const pct       = budgeted === 0 ? 0 : Math.round((spent / budgeted) * 100)
  return { ...line, spent, remaining, pct }
}

export function computeSummary(lines: BudgetLineWithExpenses[]) {
  const computed        = lines.map(computeBudgetLine)
  const totalBudget     = computed.reduce((s, l) => s + Number(l.budgeted), 0)
  const totalSpent      = computed.reduce((s, l) => s + l.spent, 0)
  return { lines: computed, totalBudget, totalSpent, totalRemaining: totalBudget - totalSpent }
}

export function formatAmount(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}
