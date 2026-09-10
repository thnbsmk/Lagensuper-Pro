'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { navItems } from './nav-items'

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  return (
    <div className="min-h-dvh bg-[#070810] text-[#f8f7ff]">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#070810]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-7">
          <Link href="/" className="text-[13px] font-bold tracking-[0.12em] text-white">
            LS_BOTAGENT
          </Link>
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-100 transition hover:border-violet-400/50 hover:bg-violet-500/10"
          >
            <Menu aria-hidden="true" className="size-5" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-6xl px-5 py-6 sm:px-7">
        {children}
      </main>

      {menuOpen && (
        <div className="fixed inset-0 z-50" role="presentation">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col border-l border-white/10 bg-[#0d0e18] p-5 shadow-[-24px_0_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
              <div>
                <p className="text-xs font-bold tracking-[0.13em] text-violet-400">LS_BOTAGENT</p>
                <p className="mt-1 text-xs text-zinc-500">V5 · Sheetz core</p>
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
                className="grid size-10 place-items-center rounded-full border border-white/10 text-zinc-300 hover:bg-white/[0.06]"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <nav aria-label="LS_BOTAGENT navigation" className="mt-6 space-y-1">
              {navItems.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm text-zinc-300 transition hover:bg-violet-500/10 hover:text-white"
                >
                  <Icon aria-hidden="true" className="size-[18px] text-violet-400" strokeWidth={1.8} />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto rounded-2xl border border-violet-400/20 bg-violet-500/[0.07] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                <ShieldCheck aria-hidden="true" className="size-4" />
                Private owner workspace
              </div>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="mt-3 inline-flex text-sm font-semibold text-white">
                Owner sign in →
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
