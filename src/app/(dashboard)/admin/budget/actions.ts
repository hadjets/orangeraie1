'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'

export async function approveQuote(quoteId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.accessBudget(session.user.role)) throw new Error('Permission refusee')

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: 'APPROVED', approvedById: session.user.id, approvedAt: new Date() },
  })

  revalidatePath('/admin/budget')
  return { success: true }
}

export async function rejectQuote(quoteId: string, reason: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.accessBudget(session.user.role)) throw new Error('Permission refusee')

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: 'REJECTED', rejectedReason: reason || 'Rejete par le conseil' },
  })

  revalidatePath('/admin/budget')
  return { success: true }
}

const budgetLineSchema = z.object({
  year:     z.number().int().min(2020).max(2100),
  category: z.string().min(2),
  label:    z.string().min(2),
  budgeted: z.number().positive(),
})

export async function createBudgetLine(input: z.infer<typeof budgetLineSchema>) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.accessBudget(session.user.role)) throw new Error('Permission refusee')

  await prisma.budgetLine.create({ data: budgetLineSchema.parse(input) })
  revalidatePath('/admin/budget')
  return { success: true }
}

const expenseSchema = z.object({
  budgetLineId: z.string().min(1),
  amount:       z.number().positive(),
  description:  z.string().min(3),
  date:         z.string().datetime({ offset: true }),
})

export async function addExpense(input: z.infer<typeof expenseSchema>) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.accessBudget(session.user.role)) throw new Error('Permission refusee')

  const data = expenseSchema.parse(input)
  await prisma.expense.create({
    data: { ...data, date: new Date(data.date), createdById: session.user.id },
  })

  revalidatePath('/admin/budget')
  return { success: true }
}
