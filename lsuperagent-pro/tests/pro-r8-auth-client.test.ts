import { describe, expect, it, vi } from 'vitest'
import {
  getAuthenticatedDisplayName,
  readBrowserAuthConfig,
  resolveUserDisplayName,
  sendAuthenticatedChat,
  signInWithPassword,
} from '../lib/auth/browser-auth'

describe('PRO R8 browser auth config', () => {
  it('accepts only an HTTPS Supabase URL with the public publishable key', () => {
    expect(
      readBrowserAuthConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      }),
    ).toEqual({
      url: 'https://project.supabase.co',
      publishableKey: 'sb_publishable_test',
    })

    expect(
      readBrowserAuthConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'http://project.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      }),
    ).toBeNull()
  })
})

describe('PRO R8 owner sign-in', () => {
  it('persists the Supabase session through the client without returning the access token to UI state', async () => {
    const client = {
      auth: {
        signInWithPassword: vi.fn(async () => ({
          data: {
            session: { access_token: 'owner-session-token' },
            user: { id: 'owner-1' },
          },
          error: null,
        })),
      },
    }

    const result = await signInWithPassword('owner@example.test', 'password', {
      client,
    })

    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.test',
      password: 'password',
    })
    expect(result).toEqual({ status: 'authenticated', userId: 'owner-1' })
    expect(JSON.stringify(result)).not.toContain('owner-session-token')
  })
})

describe('PRO R8 authenticated display name', () => {
  it('uses the signed-in account display name instead of a hardcoded owner name', async () => {
    const client = {
      auth: {
        getUser: vi.fn(async () => ({
          data: {
            user: {
              id: 'user-1',
              email: 'alice@example.test',
              user_metadata: { full_name: 'Alice Example' },
            },
          },
          error: null,
        })),
      },
    }

    await expect(getAuthenticatedDisplayName({ client })).resolves.toEqual({
      status: 'authenticated',
      displayName: 'Alice Example',
    })
  })

  it('supports common provider metadata and falls back to the account email name', () => {
    expect(resolveUserDisplayName({
      user_metadata: { preferred_username: 'alice-github' },
      email: 'ignored@example.test',
    })).toBe('alice-github')

    expect(resolveUserDisplayName({
      user_metadata: {},
      email: 'second.user@example.test',
    })).toBe('second.user')
  })
})

describe('PRO R8 authenticated command transport', () => {
  it('fails closed without an authenticated Supabase session and makes no API call', async () => {
    const fetchImpl = vi.fn<typeof fetch>()
    const client = {
      auth: {
        getSession: vi.fn(async () => ({
          data: { session: null },
          error: null,
        })),
      },
    }

    await expect(
      sendAuthenticatedChat('hello', { client, fetchImpl }),
    ).resolves.toEqual({ status: 'unauthenticated' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('sends the access token only in Authorization and never in the request body', async () => {
    const client = {
      auth: {
        getSession: vi.fn(async () => ({
          data: { session: { access_token: 'owner-session-token' } },
          error: null,
        })),
      },
    }
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>
      const body = String(init?.body)

      expect(headers.authorization).toBe('Bearer owner-session-token')
      expect(body).toBe(JSON.stringify({ message: 'hello' }))
      expect(body).not.toContain('owner-session-token')

      return Response.json(
        {
          status: 'verified',
          requestId: 'req-r8-1',
          data: { status: 'EXECUTED', provider: 'xai' },
        },
        { status: 200 },
      )
    })

    await expect(
      sendAuthenticatedChat('hello', { client, fetchImpl }),
    ).resolves.toEqual({
      status: 'verified',
      requestId: 'req-r8-1',
      data: { status: 'EXECUTED', provider: 'xai' },
    })
  })
})
