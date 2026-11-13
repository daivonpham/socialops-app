import { Image as AntImage } from 'antd'
import type { ImagePreviewGroupProps, ImageProps } from '@/shared/ui/primitives/Image'

/** Ant's dark layer on hover stays, without the eye and the "Preview" label it puts on it. */
export function Image({ preview, ...props }: ImageProps) {
  const emptyHoverLayer =
    preview === false ? false : { mask: <></>, ...(typeof preview === 'object' ? preview : {}) }
  return <AntImage {...props} preview={emptyHoverLayer} />
}

export function ImagePreviewGroup({ items, children }: ImagePreviewGroupProps) {
  return <AntImage.PreviewGroup items={items}>{children}</AntImage.PreviewGroup>
}
