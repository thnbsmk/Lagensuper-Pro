import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UserDisplayName } from '../components/auth/UserDisplayName'

afterEach(() => cleanup())

describe('signed-in user display name', () => {
  it('replaces the neutral fallback with the current account name', async () => {
    const loadDisplayName = vi.fn(async () => ({
      status: 'authenticated' as const,
      displayName: 'Alice Example',
    }))

    render(
      <UserDisplayName
        fallback="there"
        loadDisplayName={loadDisplayName}
      />,
    )

    expect(screen.getByText('there')).toBeInTheDocument()
    expect(await screen.findByText('Alice Example')).toBeInTheDocument()
    expect(loadDisplayName).toHaveBeenCalledOnce()
  })

  it('keeps the neutral fallback when no user is signed in', async () => {
    const loadDisplayName = vi.fn(async () => ({
      status: 'unauthenticated' as const,
    }))

    render(
      <UserDisplayName
        fallback="there"
        loadDisplayName={loadDisplayName}
      />,
    )

    expect(await screen.findByText('there')).toBeInTheDocument()
    expect(screen.queryByText('Bank')).not.toBeInTheDocument()
  })
})
