'use client'

import { useEffect, useState } from 'react'

/**
 * Affiche un badge rouge avec le nombre de messages non lus.
 * Poll /api/messages/unread toutes les 10s.
 */
export function UnreadBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/messages/unread', { cache: 'no-store' })
        if (!res.ok) return
        const { count } = await res.json() as { count: number }
        setCount(count)
      } catch { /* silencieux */ }
    }

    fetchCount()
    const id = setInterval(fetchCount, 10_000)
    return () => clearInterval(id)
  }, [])

  if (count === 0) return null

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 16,
        height: 16,
        borderRadius: 99,
        background: '#C0392B',
        color: 'white',
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1,
        padding: '0 4px',
        marginLeft: 'auto',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
