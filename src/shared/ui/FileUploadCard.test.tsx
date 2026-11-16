import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FileUploadCard } from './FileUploadCard'

const file = { name: 'reel.mp4', preview: { type: 'video' as const, url: 'blob:reel' } }

describe('FileUploadCard', () => {
  it('shows how much is uploaded while uploading, without a way to remove it', () => {
    render(
      <FileUploadCard
        {...file}
        size={200 * 1024}
        status="uploading"
        percent={10}
        onRemove={vi.fn()}
      />,
    )
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText(/20 KB/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reel\.mp4/ })).not.toBeInTheDocument()
  })

  it('offers to try again when the upload failed, and to remove the file', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const onRemove = vi.fn()
    render(
      <FileUploadCard
        {...file}
        size={1024}
        status="failed"
        onRetry={onRetry}
        onRemove={onRemove}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Try again|Thử lại/ }))
    await user.click(screen.getByRole('button', { name: /reel\.mp4/ }))
    expect(onRetry).toHaveBeenCalledOnce()
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('plays the video elsewhere: the button only toggles and shows the state', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const { rerender } = render(
      <FileUploadCard {...file} playback={{ playing: false, onToggle }} />,
    )
    await user.click(screen.getByRole('button', { name: /Play reel\.mp4|Phát reel\.mp4/ }))
    expect(onToggle).toHaveBeenCalledOnce()
    rerender(<FileUploadCard {...file} playback={{ playing: true, onToggle }} />)
    expect(screen.getByRole('button', { name: /Pause reel\.mp4|Dừng reel\.mp4/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('shows the full bar once complete', () => {
    render(<FileUploadCard {...file} size={1024} status="complete" />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
