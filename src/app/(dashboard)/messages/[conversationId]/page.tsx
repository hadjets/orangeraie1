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

  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
  })
  if (!member) notFound()

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

  let lastDateLabel = ''

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 8rem)',
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Header ────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <Link
          href="/messages"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            textDecoration: 'none',
            transition: 'var(--ease)',
            flexShrink: 0,
          }}
          className="btn-back"
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
        </Link>

        {/* Avatar */}
        <div
          className="avatar"
          style={{ width: 36, height: 36, fontSize: 12, background: 'var(--clay)', flexShrink: 0 }}
        >
          {others[0] ? getInitials(others[0].name ?? '?') : '?'}
        </div>

        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>
            {title}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted-light)' }}>
            {others.length + 1} participants
          </p>
        </div>
      </div>

      {/* ── Zone messages ─────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--muted-light)', fontStyle: 'italic' }}>
              Démarrez la conversation…
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine    = msg.senderId === session.user.id
          const dateLabel = formatDateSeparator(msg.createdAt)
          const showSep   = dateLabel !== lastDateLabel
          if (showSep) lastDateLabel = dateLabel

          return (
            <div key={msg.id}>
              {/* Séparateur de date */}
              {showSep && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    margin: '16px 0 12px',
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted-light)', fontWeight: 500 }}>
                    {dateLabel}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
              )}

              {/* Bulle message */}
              <div
                className="msg-row"
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 8,
                  flexDirection: isMine ? 'row-reverse' : 'row',
                  marginBottom: 4,
                }}
              >
                {/* Avatar expéditeur */}
                {!isMine && (
                  <div
                    className="avatar"
                    style={{
                      width: 28,
                      height: 28,
                      fontSize: 10,
                      background: 'var(--clay)',
                      marginBottom: 2,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(msg.sender.name ?? '?')}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '68%',
                  }}
                >
                  {!isMine && (
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 3, paddingLeft: 2 }}>
                      {msg.sender.name}
                    </p>
                  )}

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 16,
                      borderBottomRightRadius: isMine ? 4 : 16,
                      borderBottomLeftRadius:  isMine ? 16 : 4,
                      fontSize: 14,
                      lineHeight: 1.5,
                      background: isMine ? 'var(--clay)' : 'var(--surface-2)',
                      color:      isMine ? 'white'       : 'var(--ink)',
                    }}
                  >
                    {msg.content}
                  </div>

                  <span style={{ fontSize: 10, color: 'var(--muted-light)', marginTop: 3 }}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>

                {/* Bouton supprimer — visible au hover */}
                {isMine && (
                  <form
                    action={async () => {
                      'use server'
                      await deleteMessageForMe(msg.id)
                    }}
                    style={{ marginBottom: 16, opacity: 0, transition: 'opacity 0.15s' }}
                    className="msg-delete-btn"
                  >
                    <button
                      type="submit"
                      title="Supprimer pour moi"
                      style={{
                        display: 'flex',
                        padding: 4,
                        borderRadius: 6,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--muted-light)',
                        cursor: 'pointer',
                        transition: 'var(--ease)',
                      }}
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Zone de saisie ────────────────────────────────────────── */}
      <MessageInput conversationId={conversationId} />

      {/* Polling temps réel + marquer lu */}
      <RealtimeMessages
        conversationId={conversationId}
        lastMessageAt={messages[0]?.createdAt.toISOString() ?? null}
      />

      <style>{`
        .btn-back:hover { background: var(--surface-2); color: var(--ink); }
        .msg-row:hover .msg-delete-btn { opacity: 1; }
        .msg-delete-btn button:hover { color: var(--danger); }
      `}</style>
    </div>
  )
}
