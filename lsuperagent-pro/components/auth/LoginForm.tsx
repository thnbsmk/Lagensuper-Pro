'use client'

import { useState, type FormEvent } from 'react'
import { signInWithPassword } from '@/lib/auth/browser-auth'

type LoginFormProps = {
  signIn?: typeof signInWithPassword
}

export function LoginForm({ signIn = signInWithPassword }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<'idle' | 'submitting' | 'authenticated' | 'failed'>('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'submitting') return

    setState('submitting')
    const result = await signIn(email, password)
    setPassword('')

    if (result.status === 'authenticated') {
      setState('authenticated')
      return
    }

    setState('failed')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-200">Email</span>
        <input
          aria-label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-200">Password</span>
        <input
          aria-label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
      >
        {state === 'submitting' ? 'Signing in…' : 'Sign in'}
      </button>

      <p aria-live="polite" className="min-h-5 text-sm text-zinc-400">
        {state === 'authenticated' && 'Signed in. You can return to Chat.'}
        {state === 'failed' && 'Sign in failed. Check your account credentials.'}
      </p>
    </form>
  )
}
