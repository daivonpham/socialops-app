import { lazy, Suspense, type ReactNode } from 'react'

/** Platform-owned image API implemented by the active component adapter. */
export type ImageProps = {
  src?: string
  alt: string
  className?: string
  wrapperClassName?: string
  preview?: boolean | { mask?: ReactNode }
}

const LazyImage = lazy(() =>
  import('@/shared/components/ant/Image').then(({ Image }) => ({ default: Image })),
)

export function Image(props: ImageProps) {
  return (
    <Suspense fallback={<span className={props.wrapperClassName} aria-busy="true" />}>
      <LazyImage {...props} />
    </Suspense>
  )
}
