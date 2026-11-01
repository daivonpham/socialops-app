import { Image as AntImage } from 'antd'
import type { ImagePreviewGroupProps, ImageProps } from '@/shared/ui/primitives/Image'

export function Image(props: ImageProps) {
  return <AntImage {...props} />
}

export function ImagePreviewGroup({ items, children }: ImagePreviewGroupProps) {
  return <AntImage.PreviewGroup items={items}>{children}</AntImage.PreviewGroup>
}
