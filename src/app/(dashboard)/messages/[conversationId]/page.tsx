import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getMessages } from '@/lib/queries/messages'
import { deleteMessageForMe } from '../actions'
import { MessageInput } from './MessageInput'
import { RealtimeMessages } from './RealtimeMessages'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateSeparator(date: Date) {
  const today     = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const d = new Date(date)
  if (d.toDateString() === today.toDateString())     return "Aujourd'hui"
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Vérifier que l'utilisateur est membre
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: session.user.id },
    },
  })
  if (!member) notFound()

  // Charger les membres et les messages
  const [conv, messages] = await Promise.all([
    prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    }),
    getMessages(conversationId, session.user.id),
  ])

  if (!conv) notFound()

  const others = conv.members
    .filter((m) => m.userId !== session.user.id)
    .map((m) => m.user)

  const title = conv.isGroup && conv.name
    ? conv.name
    : others.map((u) => u.name).join(', ')

  // Grouper messages par jour pour les séparateurs de date
  let lastDateLabel = ''

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-stone-100 bg-white shadow-sm">
      {/* Header conversation */}
      <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
        <Link
          href="/messages"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:bg-stone-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-800 text-xs font-semibold text-white">
          {others[0] ? getInitials(others[0].name ?? '?') : '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-900">{title}</p>
          <p className="text-xs text-stone-400">{others.length + 1} participants</p>
        </div>
      </div>

      {/* Zone messages — scrollable */}
      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-stone-400">Demarrez la conversation…</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine      = msg.senderId === session.user.id
          const dateLabel   = formatDateSeparator(msg.createdAt)
          const showSep     = dateLabel !== lastDateLabel
          if (showSep) lastDateLabel = dateLabel

          return (
            <div key={msg.id}>
              {/* Séparateur de date */}
              {showSep && (
                <div className="my-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-stone-100" />
                  <span className="text-xs text-stone-400">{dateLabel}</span>
                  <div className="h-px flex-1 bg-stone-100" />
                </div>
              )}

              {/* Bulle message */}
              <div className={`group flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                {!isMine && (
                  <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-700 text-[10px] font-semibold text-white">
                    {getInitials(msg.sender.name ?? '?')}
                  </div>
                )}

                <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMine && (
                    <p className="mb-0.5 text-xs font-medium text-stone-500">{msg.sender.name}</p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isMine
                        ? 'rounded-br-sm bg-green-800 text-white'
                        : 'rounded-bl-sm bg-stone-100 text-stone-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="mt-0.5 text-[10px] text-stone-400">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>

                {/* Bouton soft-delete — visible au hover si c'est mon message */}
                {isMine && (
                  <form
                    action={async () => {
                      'use server'
                      await deleteMessageForMe(msg.id)
                    }}
                    className="mb-4 opacity-0 transition group-hover:opacity-100"
                  >
                    <button
                      type="submit"
                      title="Supprimer pour moi"
                      className="rounded p-1 text-stone-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Zone de saisie — Client Component pour onKeyDown + useTransition */}
      <MessageInput conversationId={conversationId} />

      {/* Polling temps réel + marquer lu */}
      <RealtimeMessages
        conversationId={conversationId}
        lastMessageAt={messages[0]?.createdAt.toISOString() ?? null}
      />
    </div>
  )
}
