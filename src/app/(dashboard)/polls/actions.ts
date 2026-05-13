'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'

export async function submitVote(pollId: string, optionId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { targetRoles: true, endsAt: true },
  })
  if (!poll) throw new Error('Sondage introuvable')

  if (!poll.targetRoles.includes(session.user.role)) {
    throw new Error("Vous n'etes pas dans l'audience de ce sondage")
  }

  if (poll.endsAt && poll.endsAt < new Date()) {
    throw new Error('Ce sondage est termine')
  }

  await prisma.pollResponse.upsert({
    where: {
      pollId_userId: { pollId, userId: session.user.id },
    },
    create: { pollId, optionId, userId: session.user.id },
    update: { optionId },
  })

  revalidatePath(`/polls/${pollId}`)
  return { success: true }
}

const createPollSchema = z.object({
  question: z.string().min(5, 'Question trop courte').max(500),
  options: z.array(z.string().min(1)).min(2, 'Au moins 2 options requises').max(6),
  targetRoles: z.array(z.string()).min(1, 'Au moins un role cible requis'),
  targetBloc: z.string().optional(),
  endsAt: z.string().datetime().optional(),
})

export async function createPoll(input: z.infer<typeof createPollSchema>) {
  const session = await auth()
  if (!session?.user) throw new Error('Non authentifie')
  if (!can.managePoll(session.user.role)) throw new Error('Permission refusee')

  const data = createPollSchema.parse(input)

  const poll = await prisma.poll.create({
    data: {
      question: data.question,
      targetRoles: data.targetRoles as any[],
      targetBloc: data.targetBloc || null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      options: {
        create: data.options.map((text) => ({ text })),
      },
    },
    include: { options: true },
  })

  revalidatePath('/polls')
  return { success: true, pollId: poll.id }
}
