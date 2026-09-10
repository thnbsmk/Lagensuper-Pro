import { AuthenticatedCommandForm } from '@/components/chat/AuthenticatedCommandForm'
import { UserDisplayName } from '@/components/auth/UserDisplayName'

export default function ChatPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
          LSUPERAGENT PRO
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Chat with <UserDisplayName fallback="your account" />
        </h1>
        <p className="text-sm leading-6 text-zinc-400">
          Ask, analyze, research, or run a command from one place.
        </p>
      </header>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
        <p className="text-sm text-zinc-400">
          Sign in with the existing owner account to run commands.
        </p>
        <a
          href="/login"
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100"
        >
          Sign in
        </a>
      </div>

      <AuthenticatedCommandForm />
    </div>
  )
}
