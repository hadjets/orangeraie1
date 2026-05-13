import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getConversationsForUser } from '@/lib/queries/messages'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { NewConversationModal } from './NewConversationModal'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

const roleLabel: Record<string, string> = {
  ADMIN:         'Admin',
  CONSEIL:       'Conseil',
  SYNDIC:        'Syndic',
  COPROPRIETAIRE:'Copropriétaire',
  LOCATAIRE:     'Locataire',
}

const roleBg: Record<string, { bg: string; color: string }> = {
  ADMIN:          { bg: '#EDEDEB', color: '#3D3D3D' },
  CONSEIL:        { bg: '#D6EBE0', color: '#1F5C3A' },
  SYNDIC:         { bg: '#FBF0DC', color: '#7A5520' },
  COPROPRIETAIRE: { bg: '#F7EDE9', color: '#8B3E2A' },
  LOCATAIRE:      { bg: '#E8F2DE', color: '#3D5C1F' },
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'maintenant'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function MessagesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const senderRole   = session.user.role
  const conversations = await getConversationsForUser(session.user.id)

  const allUsers = await prisma.user.findMany({
    where:   { status: 'ACTIVE', id: { not: session.user.id } },
    select:  { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  })
  const contacts = allUsers.filter((u) => can.messageUser(senderRole, u.role))

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
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">
            {conversations.length > 0
              ? `${conversations.length} conversation${conversations.length > 1 ? 's' : ''}`
              : 'Aucune conversation'}
          </p>
        </div>
        <NewConversationModal contacts={contacts} />
      </div>

      {conversations.length === 0 ? (
        <div className="empty-state">
          <div
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--clay-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <MessageCircle style={{ width: 24, height: 24, color: 'var(--clay)' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>
            Aucune conversation
          </p>
          <p style={{ marginTop: 6, fontSize: 14, color: 'var(--muted)' }}>
            Démarrez une conversation avec un autre résident.
          </p>
        </div>
      ) : (
        <div
          className="card"
          style={{ overflow: 'hidden', padding: 0 }}
        >
          {conversations.map((conv, i) => {
            const others      = conv.members.filter((m) => m.userId !== session.user.id).map((m) => m.user)
            const lastMessage = conv.messages[0]
            const displayName = conv.isGroup && conv.name ? conv.name : others.map((u) => u.name).join(', ')
            const avatarUser  = others[0]
            const rb          = roleBg[avatarUser?.role ?? ''] ?? { bg: 'var(--clay-light)', color: 'var(--clay)' }

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  textDecoration: 'none',
                  transition: 'var(--ease)',
                }}
                className="conv-row"
              >
                {/* Avatar */}
                <div
                  className="avatar"
                  style={{ width: 42, height: 42, fontSize: 13, background: 'var(--clay)', flexShrink: 0 }}
                >
                  {avatarUser ? getInitials(avatarUser.name ?? '?') : '?'}
                </div>

                {/* Infos */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <p
                      style={{
                        fontSize: 14, fontWeight: 700, color: 'var(--ink)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {displayName}
                    </p>
                    {lastMessage && (
                      <span style={{ fontSize: 11, color: 'var(--muted-light)', flexShrink: 0 }}>
                        {timeAgo(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    {avatarUser && (
                      <span
                        className="badge"
                        style={{ background: rb.bg, color: rb.color, fontSize: 10, padding: '2px 7px' }}
                      >
                        {roleLabel[avatarUser.role ?? ''] ?? avatarUser.role}
                      </span>
                    )}
                    {lastMessage ? (
                      <p
                        style={{
                          fontSize: 13, color: 'var(--muted)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {lastMessage.sender.name === session.user.name ? 'Vous : ' : ''}
                        {lastMessage.content}
                      </p>
                    ) : (
                      <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--muted-light)' }}>
                        Aucun message
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <style>{`.conv-row:hover { background: var(--surface-2); }`}</style>
    </div>
  )
}
