import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppShell } from '../components/shell/AppShell'

const expectedLinks = [
  ['Home', '/'],
  ['Chat', '/chat'],
  ['Projects', '/projects'],
  ['Memory', '/memory'],
  ['Tools', '/tools'],
  ['Runtime', '/runtime'],
  ['Audit', '/audit'],
  ['Settings', '/settings'],
] as const

afterEach(() => cleanup())

describe('PRO-R2 application shell', () => {
  it('renders the V5 LS_BOTAGENT identity and all module destinations', () => {
    render(
      <AppShell>
        <p>Route content</p>
      </AppShell>,
    )

    expect(screen.getByText('LS_BOTAGENT')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

    for (const [label, href] of expectedLinks) {
      const links = screen.getAllByRole('link', { name: label })
      expect(links.some((link) => link.getAttribute('href') === href)).toBe(true)
    }
  })
})
