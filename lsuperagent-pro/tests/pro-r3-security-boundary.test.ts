import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('PRO-R3 live-gateway source security boundary', () => {
  it('keeps network and server env access isolated to the server dispatcher', () => {
    const signing = source('lib/gateway/r3-signing.ts')
    const dispatcher = source('lib/gateway/server-dispatch.ts')
    const route = source('app/api/chat/route.ts')

    expect(dispatcher).toContain('fetch')
    expect(dispatcher).toContain('process.env')
    expect(signing).not.toContain('fetch(')
    expect(signing).not.toContain('process.env')
    expect(route).not.toContain('fetch(')
    expect(route).not.toContain('process.env')
  })

  it('uses only the approved server-only gateway variable names', () => {
    const dispatcher = source('lib/gateway/server-dispatch.ts')
    expect(dispatcher).toContain('LSUPERAGENT_GATEWAY_URL')
    expect(dispatcher).toContain('LSUPERAGENT_GATEWAY_CLIENT_ID')
    expect(dispatcher).toContain('LSUPERAGENT_GATEWAY_HMAC_SECRET')
    expect(dispatcher).not.toContain('NEXT_PUBLIC_LSUPERAGENT_GATEWAY')
    expect(dispatcher).not.toContain('LSUPERAGENT_GATEWAY_SHARED_SECRET')
  })

  it('keeps provider, direct Supabase, and public gateway authority absent', () => {
    const joined = [
      source('lib/gateway/r3-signing.ts'),
      source('lib/gateway/server-dispatch.ts'),
      source('app/api/chat/route.ts'),
    ]
      .join('\n')
      .toLowerCase()

    const forbidden = [
      '@supabase/',
      'openai',
      'anthropic',
      'gemini',
      'next_public_lsuperagent_gateway',
      'service_' + 'role',
    ]

    for (const marker of forbidden) {
      expect(joined).not.toContain(marker)
    }
  })
})
