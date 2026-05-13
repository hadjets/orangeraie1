'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { markConversationRead } from '../actions'

interface RealtimeMessagesProps {
  conversationId: string
  /** Timestamp du dernier message affiché — sert à détecter les nouveaux */
  lastMessageAt: string | null
}

/**
 * Composant invisible qui :
 * 1. Marque la conversation comme lue dès l'ouverture
 * 2. Poll toutes les 3s pour détecter les nouveaux messages et rafraîchir la page
 */
export function RealtimeMessages({ conversationId, lastMessageAt }: RealtimeMessagesProps) {
  const router        = useRouter()
  const lastRef       = useRef(lastMessageAt)
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  // Marquer comme lu à l'ouverture
  useEffect(() => {
    markConversationRead(conversationId)
  }, [conversationId])

  // Poll toutes les 3s
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/messages/latest?conversationId=${conversationId}`, { cache: 'no-store' })
        if (!res.ok) return
        const { lastAt } = await res.json() as { lastAt: string | null }
        if (lastAt && lastAt !== lastRef.current) {
          lastRef.current = lastAt
          router.refresh()
        }
      } catch { /* réseau — silencieux */ }
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [conversationId, router])

  return null
}
