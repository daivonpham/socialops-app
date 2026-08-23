import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams()
  const values = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(defaults).map(([key, fallback]) => [key, searchParams.get(key) ?? fallback]),
      ) as T,
    [defaults, searchParams],
  )
  const setFilters = useCallback(
    (patch: Partial<T>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(patch)) {
            if (value === defaults[key]) next.delete(key)
            else next.set(key, value ?? '')
          }
          return next
        },
        { replace: true },
      )
    },
    [defaults, setSearchParams],
  )
  return [values, setFilters] as const
}
