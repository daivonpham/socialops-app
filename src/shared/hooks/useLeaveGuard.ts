import { useCallback, useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Holds navigation to another page while `dirty`, and asks the browser to confirm closing or
 * reloading the tab. Render a confirm dialog with `blocked`, `leave` and `stay`; call `allowLeave`
 * right before navigating away on purpose (after a save).
 */
export function useLeaveGuard(dirty: boolean) {
  const allowed = useRef(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !allowed.current && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const allowLeave = useCallback(() => {
    allowed.current = true
  }, [])

  return {
    blocked: blocker.state === 'blocked',
    leave: () => blocker.proceed?.(),
    stay: () => blocker.reset?.(),
    allowLeave,
  }
}
