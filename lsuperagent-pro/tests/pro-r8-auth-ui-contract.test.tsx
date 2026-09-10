import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ChatPage from '../app/chat/page'

describe('PRO R8 Supabase auth surface', () => {
  it('presents a sign-in path and authenticated command input instead of the old shell-only chat placeholder', () => {
    render(<ChatPage />)

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument()
    expect(screen.queryByText(/conversation shell only/i)).not.toBeInTheDocument()
  })
})
