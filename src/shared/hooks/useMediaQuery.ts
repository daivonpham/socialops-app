import { useCallback, useSyncExternalStore } from 'react'

/**
 * Whether a CSS media query matches, kept in step as the window changes. For layout that CSS
 * alone cannot switch, such as what a third-party widget renders. False where there is no
 * `matchMedia`, as in tests.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => undefined
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () =>
      typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false,
    () => false,
  )
}

/** Below Tailwind's `md` (768px): a phone. */
export const PHONE_QUERY = '(max-width: 767.98px)'
