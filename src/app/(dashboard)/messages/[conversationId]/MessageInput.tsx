'use client'

import { useRef, useTransition } from 'react'
import { sendMessage } from '../actions'
import { Send, Loader2 } from 'lucide-react'

interface MessageInputProps {
  conversationId: string
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const ref                          = useRef<HTMLTextAreaElement>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    const content = ref.current?.value.trim()
    if (!content) return
    startTransition(async () => {
      await sendMessage({ conversationId, content })
      if (ref.current) ref.current.value = ''
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        padding: '14px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flexShrink: 0,
        background: 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <textarea
          ref={ref}
          rows={1}
          placeholder="Écrivez votre message…"
          disabled={isPending}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            resize: 'none',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            padding: '10px 14px',
            fontSize: 14,
            color: 'var(--ink)',
            lineHeight: 1.5,
            outline: 'none',
            transition: 'var(--ease)',
            fontFamily: 'inherit',
            opacity: isPending ? 0.5 : 1,
          }}
          className="msg-input"
        />
        <button
          onClick={submit}
          disabled={isPending}
          className="btn-primary"
          style={{
            width: 42,
            height: 42,
            padding: 0,
            borderRadius: 12,
            flexShrink: 0,
            minHeight: 'unset',
          }}
        >
          {isPending
            ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
            : <Send style={{ width: 16, height: 16 }} />
          }
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--muted-light)', textAlign: 'center' }}>
        Entrée pour envoyer · Maj+Entrée pour saut de ligne
      </p>

      <style>{`
        .msg-input:focus {
          border-color: var(--clay);
          box-shadow: 0 0 0 3px rgba(192, 124, 102, 0.12);
          background: var(--surface);
        }
        .msg-input::placeholder { color: var(--muted-light); }
      `}</style>
    </div>
  )
}
