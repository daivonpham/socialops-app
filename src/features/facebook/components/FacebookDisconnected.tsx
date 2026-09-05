import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { hasPermission, usePermissions } from '@/shared/permissions'
import { Button, IconCalendar, IconFacebook, IconImage, IconInfo, IconReports } from '@/shared/ui'
import { useConnectFacebook } from '../api'
import { FACEBOOK_ACCESS } from '../config/facebook-access'

export function FacebookDisconnected({ brandId }: { brandId: string }) {
  const { t } = useTranslation('facebook')
  const { granted } = usePermissions()
  const connect = useConnectFacebook(brandId)
  const canManageConnection = hasPermission(granted, FACEBOOK_ACCESS.manageConnection[0])

  return (
    <div className="grid gap-6">
      <h1 className="text-heading-2 font-semibold text-text-primary">{t('title')}</h1>

      <section className="flex flex-col gap-5 rounded-2xl border border-info-100 bg-info-50 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-wide">
          <div className="flex items-center gap-3">
            <IconFacebook className="h-10 w-10 shrink-0 text-platform-facebook" />
            <h2 className="text-heading-2 text-text-primary">
              {t('connection.disconnectedTitle')}
            </h2>
          </div>
          <p className="mt-3 text-body-md text-text-secondary">
            {t('connection.disconnectedDescription')}
          </p>
          <p className="mt-3 flex items-center gap-2 text-caption text-text-tertiary">
            <IconInfo className="shrink-0" />
            {t('connection.privacy')}
          </p>
        </div>
        <div className="shrink-0">
          <Button
            size="lg"
            variant="primary"
            icon={<IconFacebook />}
            loading={connect.isPending}
            disabled={!canManageConnection}
            onClick={() => connect.mutate({ brandId })}
          >
            {connect.isPending ? t('connection.connecting') : t('connection.connect')}
          </Button>
          {!canManageConnection ? (
            <p className="mt-2 max-w-56 text-caption text-error-700">
              {t('connection.permissionReason')}
            </p>
          ) : null}
        </div>
      </section>

      <section
        aria-label={t('connection.featuresLabel')}
        className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface lg:grid lg:grid-cols-3 lg:divide-x lg:divide-border-subtle"
      >
        <FeaturePanel
          icon={<IconReports />}
          title={t('connection.insightsTitle')}
          description={t('connection.insightsDescription')}
        >
          <InsightsPreview
            followersLabel={t('metrics.followers')}
            viewsLabel={t('metrics.mediaViews')}
            interactionsLabel={t('metrics.contentInteractions')}
          />
        </FeaturePanel>
        <FeaturePanel
          icon={<IconImage />}
          title={t('connection.performanceTitle')}
          description={t('connection.performanceDescription')}
        >
          <PerformancePreview
            postsLabel={t('metrics.published')}
            viewsLabel={t('metrics.mediaViews')}
            interactionsLabel={t('overview.contentInteractions')}
          />
        </FeaturePanel>
        <FeaturePanel
          icon={<IconCalendar />}
          title={t('connection.planningTitle')}
          description={t('connection.planningDescription')}
        >
          <PlanningPreview
            scheduledLabel={t('connection.scheduled')}
            draftLabel={t('connection.draft')}
          />
        </FeaturePanel>
      </section>
    </div>
  )
}

function FeaturePanel({
  icon,
  title,
  description,
  children,
}: {
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
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border-subtle bg-bg-surface p-3 text-icon-md text-platform-facebook shadow-xs">
          {icon}
        </span>
      </div>
      <div className="mt-auto pt-8" aria-hidden>
        {children}
      </div>
    </article>
  )
}

function PreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-info-100 bg-bg-surface p-3 shadow-md">{children}</div>
  )
}

function InsightsPreview({
  followersLabel,
  viewsLabel,
  interactionsLabel,
}: {
  followersLabel: string
  viewsLabel: string
  interactionsLabel: string
}) {
  return (
    <div className="relative px-3 pb-4">
      <PreviewShell>
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
                <span className={`block h-full rounded-pill bg-platform-facebook ${item.width}`} />
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
  postsLabel,
  viewsLabel,
  interactionsLabel,
}: {
  postsLabel: string
  viewsLabel: string
  interactionsLabel: string
}) {
  return (
    <div className="relative px-3 pb-4">
      <PreviewShell>
        <div className="mb-2 flex items-center justify-between border-b border-border-subtle pb-2">
          <span className="text-label-sm text-text-primary">{postsLabel}</span>
          <strong className="text-label-md tabular-nums text-platform-facebook">42</strong>
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
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-info-50 text-platform-facebook">
              <IconImage />
            </span>
            <span className="min-w-0 flex-1 truncate text-caption text-text-secondary">
              {item.label}
            </span>
            <strong className="text-caption tabular-nums text-platform-facebook">
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
  scheduledLabel,
  draftLabel,
}: {
  scheduledLabel: string
  draftLabel: string
}) {
  return (
    <div className="relative px-3 pb-4">
      <PreviewShell>
        <div className="mb-3 flex items-center justify-between border-b border-border-subtle pb-2">
          <span className="text-label-sm text-text-primary">{scheduledLabel}</span>
          <span className="rounded-pill bg-info-50 px-2 py-1 text-caption text-platform-facebook">
            3
          </span>
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
            <span className="h-2 w-2 rounded-pill bg-platform-facebook" />
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
