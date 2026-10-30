import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { ToastProvider, useToast, type ToastAction } from './primitives/Toast'

function ShowToast({ action }: { action: ToastAction }) {
  const toast = useToast()
  useEffect(() => toast.error({ title: 'Page needs reconnecting', action }), [action, toast])
  return null
}

describe('Toast action', () => {
  it('stays open and loading while an async action runs', async () => {
    let finish: () => void = () => {}
    const action = {
      label: 'Reconnect Page',
      onClick: () => new Promise<void>((resolve) => (finish = resolve)),
    }
    render(
      <ToastProvider>
        <ShowToast action={action} />
      </ToastProvider>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Reconnect Page' }))
    const button = screen.getByRole('button', { name: 'Reconnect Page' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Page needs reconnecting')).toBeInTheDocument()

    finish()
    // jsdom never ends Ant's exit animation, so a closing toast is one that started leaving.
    await waitFor(() =>
      expect(button.closest('.ant-notification-notice-wrapper')).toHaveClass(
        'ant-notification-fade-leave',
      ),
    )
  })
})
