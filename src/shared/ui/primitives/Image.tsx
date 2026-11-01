import { lazy, Suspense, type ReactNode } from 'react'

/** Platform-owned image API implemented by the active component adapter. */
export type ImageProps = {
  src?: string
  alt: string
  className?: string
  wrapperClassName?: string
  preview?: boolean | { mask?: ReactNode }
}

/** Groups previewable images so the viewer can page through them; `items` adds images not rendered. */
export type ImagePreviewGroupProps = {
  items?: string[]
  children: ReactNode
}

const LazyImage = lazy(() =>
  import('@/shared/components/ant/Image').then(({ Image }) => ({ default: Image })),
)

const LazyImagePreviewGroup = lazy(() =>
  import('@/shared/components/ant/Image').then(({ ImagePreviewGroup }) => ({
    default: ImagePreviewGroup,
  })),
)

export function Image(props: ImageProps) {
  return (
    <Suspense fallback={<span className={props.wrapperClassName} aria-busy="true" />}>
      <LazyImage {...props} />
    </Suspense>
  )
}

export function ImagePreviewGroup(props: ImagePreviewGroupProps) {
  return (
    <Suspense fallback={props.children}>
      <LazyImagePreviewGroup {...props} />
    </Suspense>
  )
}
