'use client'

import { useEffect, useState } from 'react'
import {
  getAuthenticatedDisplayName,
  type DisplayNameResult,
} from '@/lib/auth/browser-auth'

type UserDisplayNameProps = {
  fallback: string
  loadDisplayName?: () => Promise<DisplayNameResult>
}

export function UserDisplayName({
  fallback,
  loadDisplayName = getAuthenticatedDisplayName,
}: UserDisplayNameProps) {
  const [displayName, setDisplayName] = useState(fallback)

  useEffect(() => {
    let active = true

    void loadDisplayName().then((result) => {
      if (!active) return
      setDisplayName(
        result.status === 'authenticated' ? result.displayName : fallback,
      )
    })

    return () => {
      active = false
    }
  }, [fallback, loadDisplayName])

  return <span aria-live="polite">{displayName}</span>
}
