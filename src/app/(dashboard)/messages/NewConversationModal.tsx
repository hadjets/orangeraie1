'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { startConversation } from './actions'
import { X, Search, MessageCircle, Loader2 } from 'lucide-react'
import type { Role } from '@prisma/client'

const roleBadge: Record<Role, { label: string; bg: string; color: string }> = {
  ADMIN:          { label: 'Admin',          bg: '#EDEDEB', color: '#3D3D3D' },
  CONSEIL:        { label: 'Conseil',        bg: '#D6EBE0', color: '#1F5C3A' },
  SYNDIC:         { label: 'Syndic',         bg: '#FBF0DC', color: '#7A5520' },
  COPROPRIETAIRE: { label: 'Copropriétaire', bg: '#F7EDE9', color: '#8B3E2A' },
  LOCATAIRE:      { label: 'Locataire',      bg: '#E8F2DE', color: '#3D5C1F' },
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

interface ContactUser { id: string; name: string | null; role: Role }
interface NewConversationModalProps { contacts: ContactUser[] }

export function NewConversationModal({ contacts }: NewConversationModalProps) {
  const router = useRouter()
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransitionFn] = useTransition()

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts
    const q = query.toLowerCase()
    return contacts.filter(
      (c) => c.name?.toLowerCase().includes(q) || roleBadge[c.role].label.toLowerCase().includes(q)
    )
  }, [query, contacts])

  function handleSelect(userId: string) {
    setError(null)
    startTransitionFn(async () => {
      try {
        const result = await startConversation(userId)
        if (result.success) {
          setOpen(false)
          router.push(`/messages/${result.conversationId}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setQuery(''); setError(null) }}
        className="btn-primary"
        style={{ flexShrink: 0 }}
      >
        <MessageCircle style={{ width: 15, height: 15 }} />
        Nouveau message
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                Nouvelle conversation
              </p>
              <button
                onClick={() => setOpen(false)}
                className="btn-ghost"
                style={{ minHeight: 'auto', padding: '6px', borderRadius: 8 }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Recherche */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 15, height: 15, color: 'var(--muted-light)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un résident…"
                  className="input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Liste */}
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {contacts.length === 0 ? (
                <p style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                  Aucun résident disponible.
                </p>
              ) : filtered.length === 0 ? (
                <p style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                  Aucun résultat pour « {query} »
                </p>
              ) : (
                filtered.map((contact) => {
                  const rb = roleBadge[contact.role]
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleSelect(contact.id)}
                      disabled={isPending}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        width: '100%', padding: '13px 20px',
                        background: 'transparent', border: 'none',
                        cursor: isPending ? 'not-allowed' : 'pointer',
                        transition: 'var(--ease)',
                        opacity: isPending ? 0.5 : 1,
                      }}
                      className="contact-row"
                    >
                      <div
                        className="avatar"
                        style={{ width: 38, height: 38, fontSize: 12, background: 'var(--clay)', flexShrink: 0 }}
                      >
                        {getInitials(contact.name ?? '?')}
                      </div>
                      <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                          {contact.name}
                        </p>
                        <span
                          className="badge"
                          style={{ background: rb.bg, color: rb.color, marginTop: 3 }}
                        >
                          {rb.label}
                        </span>
                      </div>
                      {isPending && (
                        <Loader2 style={{ width: 15, height: 15, color: 'var(--muted-light)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Erreur */}
            {error && (
              <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: 13, color: '#B91C1C' }}>
                {error}
              </div>
            )}
          </div>

          <style>{`.contact-row:hover { background: var(--surface-2) !important; }`}</style>
        </div>
      )}
    </>
  )
}
