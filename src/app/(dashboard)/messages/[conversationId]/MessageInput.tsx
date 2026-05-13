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
    <div className="border-t border-stone-100 px-4 py-3">
      <div className="flex items-end gap-3">
        <textarea
          ref={ref}
          rows={1}
          placeholder="Ecrivez votre message…"
          disabled={isPending}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={isPending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-800 text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          {isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-stone-400">
        Entrée pour envoyer · Maj+Entrée pour saut de ligne
      </p>
    </div>
  )
}
