import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LoginForm } from '../components/auth/LoginForm'
import { AuthenticatedCommandForm } from '../components/chat/AuthenticatedCommandForm'

afterEach(() => cleanup())

describe('PRO R8 login form', () => {
  it('signs in the existing account without exposing session material', async () => {
    const signIn = vi.fn(async () => ({
      status: 'authenticated' as const,
      userId: 'owner-1',
    }))

    render(<LoginForm signIn={signIn} />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'owner@example.test' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'owner-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('owner@example.test', 'owner-password')
    })
    expect(screen.getByText(/signed in/i)).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('owner-password')
    expect(document.body.textContent).not.toContain('owner-session-token')
  })
})

describe('PRO R8 authenticated command form', () => {
  it('sends a message through the authenticated transport and shows a user-facing success state only', async () => {
    const sendChat = vi.fn(async () => ({
      status: 'verified' as const,
      requestId: 'req-r8-ui-1',
      data: {
        status: 'EXECUTED',
        provider: 'xai',
        model: 'grok-build-0.1',
        evidence: { provider_request_id: 'xai-secret-ish-id' },
      },
    }))

    render(<AuthenticatedCommandForm sendChat={sendChat} />)

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Summarize this project' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledWith('Summarize this project')
    })
    expect(screen.getByText(/completed/i)).toBeInTheDocument()

    const visible = document.body.textContent ?? ''
    expect(visible).not.toContain('grok-build-0.1')
    expect(visible).not.toContain('xai-secret-ish-id')
    expect(visible).not.toContain('provider')
  })

  it('shows a sign-in path when no Supabase session exists', async () => {
    const sendChat = vi.fn(async () => ({ status: 'unauthenticated' as const }))

    render(<AuthenticatedCommandForm sendChat={sendChat} />)
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'hello' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login',
    )
  })
})
