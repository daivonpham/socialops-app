import { Image as AntImage } from 'antd'
import type { ImageProps } from '@/shared/ui/primitives/Image'

export function Image(props: ImageProps) {
  return <AntImage {...props} />
}
