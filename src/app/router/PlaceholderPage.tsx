import { useMatches, useParams } from 'react-router-dom'
import { PLATFORM_LABEL, type Platform } from '@/features/social-accounts'
import type { AppRouteHandle } from './routes'

/** Placeholder body for every shell route — real pages ship in later tasks. */
export default function PlaceholderPage() {
  const matches = useMatches()
  const { platform } = useParams()

  const nav = [...matches]
    .reverse()
    .map((match) => (match.handle as AppRouteHandle | undefined)?.nav)
    .find((value) => value !== undefined)

  const title =
    nav?.label ??
    (platform ? (PLATFORM_LABEL[platform as Platform] ?? platform) : 'Coming soon')

  return (
    <section>
      <h1 className="text-heading-1 text-text-primary">{title}</h1>
      <p className="mt-2 max-w-narrow text-body-md text-text-secondary">
        This is a placeholder screen — the {title} feature ships in a later task.
      </p>
    </section>
  )
}
