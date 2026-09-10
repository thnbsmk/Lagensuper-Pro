import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
          LSUPERAGENT PRO
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm leading-6 text-zinc-400">
          Use the existing owner account. Account creation is not enabled here.
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
        <LoginForm />
      </div>

      <a href="/chat" className="text-sm text-zinc-400 underline">
        Back to Chat
      </a>
    </div>
  )
}
