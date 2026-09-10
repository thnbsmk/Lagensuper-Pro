import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const modulePages = [
  'chat',
  'projects',
  'memory',
  'tools',
  'runtime',
  'audit',
  'settings',
] as const

const prohibitedServerRoutes = [
  'app/api/execute/route.ts',
  'app/api/memory/route.ts',
  'app/api/memory/candidate/route.ts',
  'app/api/tools/route.ts',
  'app/api/audit/route.ts',
] as const

describe('PRO-R2 route and authority boundary', () => {
  it('contains all seven approved module pages', () => {
    for (const page of modulePages) {
      expect(existsSync(resolve(process.cwd(), `app/${page}/page.tsx`))).toBe(true)
    }
  })

  it('allows only health plus the PRO-R3 pre-live chat boundary', () => {
    expect(existsSync(resolve(process.cwd(), 'app/api/health/route.ts'))).toBe(true)
    expect(existsSync(resolve(process.cwd(), 'app/api/chat/route.ts'))).toBe(true)
    for (const route of prohibitedServerRoutes) {
      expect(existsSync(resolve(process.cwd(), route))).toBe(false)
    }
  })

  it('does not introduce privileged secret names in app or lib source', () => {
    const forbidden = [
      'SUPABASE_' + 'SERVICE_ROLE_KEY',
      'OPENAI_' + 'API_KEY',
      'ANTHROPIC_' + 'API_KEY',
      'GEMINI_' + 'API_KEY',
      'GITHUB_' + 'TOKEN',
      'VERCEL_' + 'TOKEN',
    ]

    const sources = [
      'app/page.tsx',
      'lib/gateway/client.ts',
      'lib/gateway/types.ts',
    ]
      .map((path) => readFileSync(resolve(process.cwd(), path), 'utf8'))
      .join('\n')

    for (const name of forbidden) {
      expect(sources).not.toContain(name)
    }
  })
})
