import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { PlanningContent } from '../api'
import { PlanningMediaThumbnail } from './PlanningMediaThumbnail'

const content = (values: Partial<PlanningContent>) =>
  ({ id: crypto.randomUUID(), mediaType: 'video', media: [], ...values }) as PlanningContent

describe('PlanningMediaThumbnail', () => {
  it('shows the Facebook picture as an image, even for a video post', () => {
    const { container } = render(
      <PlanningMediaThumbnail
        className="size-12"
        content={content({
          pictureUrl: 'https://fb.test/p.jpg',
          media: [
            { id: crypto.randomUUID(), type: 'video', url: 'https://r2.test/v.mp4', name: 'v' },
          ],
        })}
      />,
    )
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://fb.test/p.jpg')
    expect(container.querySelector('video')).toBeNull()
  })

  it('falls back to our file when the Facebook link has expired', () => {
    const { container } = render(
      <PlanningMediaThumbnail
        className="size-12"
        content={content({
          mediaType: 'image',
          pictureUrl: 'https://fb.test/expired.jpg',
          media: [
            { id: crypto.randomUUID(), type: 'image', url: 'https://r2.test/a.jpg', name: 'a' },
          ],
        })}
      />,
    )
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://r2.test/a.jpg')
  })

  it('shows a placeholder when neither is available', () => {
    const { container } = render(
      <PlanningMediaThumbnail className="size-12" content={content({ mediaType: 'image' })} />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
