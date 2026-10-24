import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('shows the copy and runs the right callback for each action', async () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(
      <ConfirmDialog
        open
        title="Delete blog post"
        description="Are you sure?"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    )
    expect(screen.getByText('Delete blog post')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('cannot be dismissed while the action is running', async () => {
    const onClose = vi.fn()
    render(<ConfirmDialog open loading title="Remove" onConfirm={() => {}} onClose={onClose} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('blocks confirmation until the caller allows it', () => {
    render(
      <ConfirmDialog
        open
        confirmDisabled
        title="Delete workspace"
        confirmLabel="Delete workspace"
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Delete workspace' })).toBeDisabled()
  })
})
