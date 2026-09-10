import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Home from '../app/page'
import { AppShell } from '../components/shell/AppShell'

afterEach(() => cleanup())

describe('LSUPERAGENT V5 preview', () => {
  it('presents LS_BOTAGENT as the Sheetz chat-first home experience', () => {
    render(
      <AppShell>
        <Home />
      </AppShell>,
    )

    expect(screen.getByText('LS_BOTAGENT')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Sheetz, LS_BOTAGENT' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Ready when you are, there/i })).toBeInTheDocument()
    expect(screen.queryByText(/Bank\./i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Research' })).toHaveAttribute('href', '/tools')
    expect(screen.getByRole('link', { name: 'Create' })).toHaveAttribute('href', '/projects')
    expect(screen.getByRole('link', { name: 'Agent' })).toHaveAttribute('href', '/runtime')
    expect(screen.getByRole('textbox', { name: 'Message LS_BOTAGENT' })).toBeInTheDocument()
  })

  it('opens and closes the right-side application menu', () => {
    render(
      <AppShell>
        <p>Route content</p>
      </AppShell>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

    const navigation = screen.getByRole('navigation', { name: 'LS_BOTAGENT navigation' })
    expect(navigation).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Chat' })).toHaveAttribute('href', '/chat')

    fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }))
    expect(screen.queryByRole('navigation', { name: 'LS_BOTAGENT navigation' })).not.toBeInTheDocument()
  })
})
