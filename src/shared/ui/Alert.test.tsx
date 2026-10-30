import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Alert } from '@/shared/ui'

describe('Alert pill variant', () => {
  it('opens the action link in a new tab', () => {
    render(
      <Alert
        variant="pill"
        tone="success"
        title="Link sent"
        pillAction={{ label: 'Open email', href: 'https://mail.google.com/' }}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Link sent')
    const link = screen.getByRole('link', { name: 'Open email' })
    expect(link).toHaveAttribute('href', 'https://mail.google.com/')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('runs the action callback and announces errors assertively', async () => {
    const onClick = vi.fn()
    render(
      <Alert variant="pill" tone="error" title="Failed" pillAction={{ label: 'Retry', onClick }} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.getByRole('alert')).toHaveTextContent('Failed')
  })
})
