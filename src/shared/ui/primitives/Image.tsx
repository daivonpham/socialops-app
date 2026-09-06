import type { ReactNode } from 'react'

/** Platform-owned image API implemented by the active component adapter. */
export type ImageProps = {
  src?: string
  alt: string
  className?: string
  wrapperClassName?: string
  preview?: boolean | { mask?: ReactNode }
}

export { Image } from '@/shared/components/ant/Image'
