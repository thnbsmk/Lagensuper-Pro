import Image from 'next/image'
import Link from 'next/link'
import { ArrowUp, ChevronRight } from 'lucide-react'
import { UserDisplayName } from '@/components/auth/UserDisplayName'

const modes = [
  { label: 'Research', href: '/tools' },
  { label: 'Create', href: '/projects' },
  { label: 'Agent', href: '/runtime' },
] as const

export default function Home() {
  return (
    <section className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-[430px] flex-col">
      <div className="flex items-center gap-4 pt-1">
        <div className="relative size-[92px] shrink-0 overflow-hidden rounded-[28px] border border-violet-400/20 bg-[#11131e] shadow-[0_18px_55px_rgba(111,45,255,0.18)]">
          <Image
            src="/brand/sheetz-core-avatar.jpg"
            alt="Sheetz, LS_BOTAGENT"
            fill
            priority
            sizes="92px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-white">Core is ready</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Context synced&nbsp; / &nbsp;Private</p>
        </div>
      </div>

      <div className="mt-9">
        <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-[38px]">
          Ready when you are,
          {' '}
          <span className="mt-1 block text-violet-400">
            <UserDisplayName fallback="there" />.
          </span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">Start with a message or choose a focused mode.</p>

        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {modes.map((mode) => (
            <Link
              key={mode.label}
              href={mode.href}
              className="rounded-full border border-white/15 bg-white/[0.025] px-3 py-3 text-center text-xs font-semibold text-zinc-200 transition hover:border-violet-400/60 hover:bg-violet-500/10"
            >
              {mode.label}
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/login"
        className="group mt-8 rounded-[24px] border border-violet-400/30 bg-[linear-gradient(145deg,rgba(91,39,163,0.22),rgba(20,17,31,0.82))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-violet-300/55"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.08em] text-violet-400">CONTINUE</p>
            <p className="mt-5 text-base font-semibold tracking-[0.01em] text-zinc-100">LSUPERAGENT Control Center</p>
            <p className="mt-2 text-sm text-zinc-400">Preview + owner login</p>
            <p className="mt-1 text-[11px] text-zinc-600">V5 preview · 24 Aug</p>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-violet-500/20 text-violet-300 transition group-hover:bg-violet-500/35 group-hover:text-white">
            <ChevronRight aria-hidden="true" className="size-5" />
          </span>
        </div>
      </Link>

      <form action="/chat" method="get" className="mt-auto pt-8">
        <label htmlFor="v5-message" className="sr-only">Message LS_BOTAGENT</label>
        <div className="flex items-center gap-3 rounded-[22px] border border-white/15 bg-white/[0.035] p-2 pl-4 focus-within:border-violet-400/60 focus-within:ring-2 focus-within:ring-violet-500/10">
          <input
            id="v5-message"
            name="message"
            aria-label="Message LS_BOTAGENT"
            placeholder="Talk to LS_BOTAGENT..."
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-zinc-600"
          />
          <button type="submit" aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-full bg-violet-500 text-white shadow-[0_8px_28px_rgba(124,58,237,0.38)] transition hover:bg-violet-400">
            <ArrowUp aria-hidden="true" className="size-5" strokeWidth={2.4} />
          </button>
        </div>
      </form>
    </section>
  )
}
