'use client'

import { useState, type FormEvent } from 'react'
import { sendAuthenticatedChat } from '@/lib/auth/browser-auth'

type AuthenticatedCommandFormProps = {
  sendChat?: typeof sendAuthenticatedChat
}

export function AuthenticatedCommandForm({
  sendChat = sendAuthenticatedChat,
}: AuthenticatedCommandFormProps) {
  const [message, setMessage] = useState('')
  const [state, setState] = useState<
    'idle' | 'sending' | 'completed' | 'unauthenticated' | 'failed'
  >('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'sending' || !message.trim()) return

    setState('sending')
    const result = await sendChat(message.trim())

    if (result.status === 'verified') {
      setState('completed')
      return
    }

    if (result.status === 'unauthenticated') {
      setState('unauthenticated')
      return
    }

    setState('failed')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-200">Message</span>
        <textarea
          aria-label="Message"
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-100 outline-none"
          placeholder="Ask LSUPERAGENT…"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state === 'sending' || !message.trim()}
          className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-60"
        >
          {state === 'sending' ? 'Sending…' : 'Send'}
        </button>

        <p aria-live="polite" className="text-sm text-zinc-400">
          {state === 'completed' && 'Completed.'}
          {state === 'failed' && 'Unable to complete the request.'}
          {state === 'unauthenticated' && (
            <>
              Sign in required. <a href="/login" className="underline">Sign in</a>
            </>
          )}
        </p>
      </div>
    </form>
  )
}
