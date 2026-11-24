import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePlanningContent, type PlanningContent } from '../api'

/**
 * `?content=<id>`, as a notification links to a post: opens that post with `onOpen` once it has
 * loaded, or calls `onMissing` when it cannot be (deleted, or out of the person's reach), then
 * takes the parameter off the address so a reload does not open it again.
 */
export function useLinkedContent(
  brandId: string | null,
  onOpen: (content: PlanningContent) => void,
  onMissing: () => void,
): void {
  const [searchParams, setSearchParams] = useSearchParams()
  const contentId = searchParams.get('content')
  const content = usePlanningContent(brandId, contentId)
  // The latest callbacks, so a new render does not open the post twice.
  const callbacks = useRef({ onOpen, onMissing })
  callbacks.current = { onOpen, onMissing }
  useEffect(() => {
    if (!contentId || content.isPending) return
    if (content.data) callbacks.current.onOpen(content.data)
    else callbacks.current.onMissing()
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('content')
        return next
      },
      { replace: true },
    )
  }, [content.data, content.isPending, contentId, setSearchParams])
}
