import type { ReactNode } from 'react'
import { Button, IconCalendar, IconImage, IconInfo, IconReports } from '../primitives'

type Tone = 'facebook' | 'tiktok'

/** Class names per platform; written out in full so Tailwind keeps them. */
const TONES: Record<
  Tone,
  { hero: string; icon: string; text: string; bar: string; chip: string; border: string }
> = {
  facebook: {
    hero: 'border-info-100 bg-info-50',
    icon: 'text-platform-facebook',
    text: 'text-platform-facebook',
    bar: 'bg-platform-facebook',
    chip: 'bg-info-50 text-platform-facebook',
    border: 'border-info-100',
  },
  tiktok: {
    hero: 'border-border-subtle bg-bg-surface-subtle',
    icon: 'text-platform-tiktok',
    text: 'text-platform-tiktok',
    bar: 'bg-platform-tiktok',
    chip: 'bg-bg-surface-muted text-platform-tiktok',
    border: 'border-border-subtle',
  },
}

export type PlatformDisconnectedText = {
  title: string
  heroTitle: string
  heroDescription: string
  privacy: string
  connect: string
  connecting: string
  permissionReason: string
  featuresLabel: string
  insightsTitle: string
  insightsDescription: string
  performanceTitle: string
  performanceDescription: string
  planningTitle: string
  planningDescription: string
  /** Labels inside the three illustrations. */
  followers: string
  views: string
  interactions: string
  /** The interactions label of the performance illustration, when it differs. */
  performanceInteractions?: string
  posts: string
  scheduled: string
  draft: string
}

/**
 * A platform screen before any account is connected: the connect panel and three panels showing
 * what the platform offers, each with a small illustration.
 */
export function PlatformDisconnected({
  tone,
  icon,
  buttonIcon,
  text,
  canConnect,
  isConnecting,
  onConnect,
}: {
  tone: Tone
  /** The platform logo, 40px. */
  icon: ReactNode
  buttonIcon: ReactNode
  text: PlatformDisconnectedText
  canConnect: boolean
  isConnecting: boolean
  onConnect: () => void
}) {
  return (
    <div className="grid gap-6">
      <h1 className="text-heading-2 font-semibold text-text-primary">{text.title}</h1>

      <section
        className={`flex flex-col gap-5 rounded-2xl border p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between ${TONES[tone].hero}`}
      >
        <div className="max-w-wide">
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-heading-2 text-text-primary">{text.heroTitle}</h2>
          </div>
          <p className="mt-3 text-body-md text-text-secondary">{text.heroDescription}</p>
          <p className="mt-3 flex items-center gap-2 text-caption text-text-tertiary">
            <IconInfo className="shrink-0" />
            {text.privacy}
          </p>
        </div>
        <div className="shrink-0">
          <Button
            size="lg"
            variant="primary"
            icon={buttonIcon}
            loading={isConnecting}
            disabled={!canConnect}
            onClick={onConnect}
          >
            {isConnecting ? text.connecting : text.connect}
          </Button>
          {!canConnect ? (
            <p className="mt-2 max-w-56 text-caption text-error-700">{text.permissionReason}</p>
          ) : null}
        </div>
      </section>

      <section
        aria-label={text.featuresLabel}
        className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface lg:grid lg:grid-cols-3 lg:divide-x lg:divide-border-subtle"
      >
        <FeaturePanel
          tone={tone}
          icon={<IconReports />}
          title={text.insightsTitle}
          description={text.insightsDescription}
        >
          <InsightsPreview
            tone={tone}
            followersLabel={text.followers}
            viewsLabel={text.views}
            interactionsLabel={text.interactions}
          />
        </FeaturePanel>
        <FeaturePanel
          tone={tone}
          icon={<IconImage />}
          title={text.performanceTitle}
          description={text.performanceDescription}
        >
          <PerformancePreview
            tone={tone}
            postsLabel={text.posts}
            viewsLabel={text.views}
            interactionsLabel={text.performanceInteractions ?? text.interactions}
          />
        </FeaturePanel>
        <FeaturePanel
          tone={tone}
          icon={<IconCalendar />}
          title={text.planningTitle}
          description={text.planningDescription}
        >
          <PlanningPreview tone={tone} scheduledLabel={text.scheduled} draftLabel={text.draft} />
        </FeaturePanel>
      </section>
    </div>
  )
}

function FeaturePanel({
  tone,
  icon,
  title,
  description,
  children,
}: {
  tone: Tone
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <article className="flex min-h-112 flex-col border-b border-border-subtle p-6 last:border-b-0 lg:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-heading-3 text-text-primary">{title}</h3>
          <p className="mt-2 text-body-sm text-text-tertiary">{description}</p>
        </div>
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border-subtle bg-bg-surface p-3 text-icon-md shadow-xs ${TONES[tone].icon}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-auto pt-8" aria-hidden>
        {children}
      </div>
    </article>
  )
}

function PreviewShell({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div className={`rounded-xl border bg-bg-surface p-3 shadow-md ${TONES[tone].border}`}>
      {children}
    </div>
  )
}

function InsightsPreview({
  tone,
  followersLabel,
  viewsLabel,
  interactionsLabel,
}: {
  tone: Tone
  followersLabel: string
  viewsLabel: string
  interactionsLabel: string
}) {
  return (
    <div className="relative px-3 pb-4">
      <PreviewShell tone={tone}>
        <div className="mb-3 flex items-center justify-between border-b border-border-subtle pb-2">
          <span className="text-label-sm text-text-primary">{followersLabel}</span>
          <strong className="text-label-md tabular-nums text-text-primary">24.8K</strong>
        </div>
        {[
          { label: viewsLabel, value: '124.8K', width: 'w-4/5' },
          { label: interactionsLabel, value: '18.4K', width: 'w-3/5' },
          { label: followersLabel, value: '80.5K', width: 'w-2/3' },
        ].map((item) => (
          <div
            key={item.label}
            className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 py-2"
          >
            <span className="truncate text-caption text-text-secondary">{item.label}</span>
            <span className="grid gap-1 text-end">
              <strong className="text-caption tabular-nums text-text-primary">{item.value}</strong>
              <span className="h-1 overflow-hidden rounded-pill bg-bg-surface-muted">
                <span className={`block h-full rounded-pill ${TONES[tone].bar} ${item.width}`} />
              </span>
            </span>
          </div>
        ))}
      </PreviewShell>
      <span className="absolute -bottom-1 inset-s-0 rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-caption shadow-md">
        <strong className="block text-label-md tabular-nums text-text-primary">+8.2%</strong>
        <span className="text-success-700">{followersLabel}</span>
      </span>
    </div>
  )
}

function PerformancePreview({
  tone,
  postsLabel,
  viewsLabel,
  interactionsLabel,
}: {
  tone: Tone
  postsLabel: string
  viewsLabel: string
  interactionsLabel: string
}) {
  return (
    <div className="relative px-3 pb-4">
      <PreviewShell tone={tone}>
        <div className="mb-2 flex items-center justify-between border-b border-border-subtle pb-2">
          <span className="text-label-sm text-text-primary">{postsLabel}</span>
          <strong className={`text-label-md tabular-nums ${TONES[tone].text}`}>42</strong>
        </div>
        {[
          { label: viewsLabel, value: '32K' },
          { label: interactionsLabel, value: '4.8K' },
          { label: postsLabel, value: '18' },
        ].map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="mt-2 flex items-center gap-3 rounded-lg bg-bg-surface-subtle px-3 py-2"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-md ${TONES[tone].chip}`}
            >
              <IconImage />
            </span>
            <span className="min-w-0 flex-1 truncate text-caption text-text-secondary">
              {item.label}
            </span>
            <strong className={`text-caption tabular-nums ${TONES[tone].text}`}>
              {item.value}
            </strong>
          </div>
        ))}
      </PreviewShell>
      <span className="absolute -bottom-1 inset-e-0 rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 shadow-md">
        <span className="text-caption text-text-tertiary">{interactionsLabel}</span>
        <strong className="block text-label-md tabular-nums text-text-primary">+12.4%</strong>
      </span>
    </div>
  )
}

function PlanningPreview({
  tone,
  scheduledLabel,
  draftLabel,
}: {
  tone: Tone
  scheduledLabel: string
  draftLabel: string
}) {
  return (
    <div className="relative px-3 pb-4">
      <PreviewShell tone={tone}>
        <div className="mb-3 flex items-center justify-between border-b border-border-subtle pb-2">
          <span className="text-label-sm text-text-primary">{scheduledLabel}</span>
          <span className={`rounded-pill px-2 py-1 text-caption ${TONES[tone].chip}`}>3</span>
        </div>
        {[
          { day: '24', time: '09:30', status: scheduledLabel },
          { day: '26', time: '14:00', status: scheduledLabel },
          { day: '28', time: '—', status: draftLabel },
        ].map((item) => (
          <div
            key={item.day}
            className="flex items-center gap-3 border-b border-border-subtle py-2 last:border-0"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-surface-muted text-label-sm tabular-nums text-text-primary">
              {item.day}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-caption text-text-primary">{item.status}</strong>
              <span className="text-caption tabular-nums text-text-tertiary">{item.time}</span>
            </span>
            <span className={`h-2 w-2 rounded-pill ${TONES[tone].bar}`} />
          </div>
        ))}
      </PreviewShell>
      <span className="absolute -bottom-1 inset-s-0 rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 shadow-md">
        <span className="text-caption text-text-tertiary">{scheduledLabel}</span>
        <strong className="block text-label-md tabular-nums text-text-primary">3</strong>
      </span>
    </div>
  )
}
