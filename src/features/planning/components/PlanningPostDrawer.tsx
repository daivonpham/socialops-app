import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { type AppLocale } from '@/shared/i18n'
import { Drawer, IconFacebook, IconImage, IconTikTok, StatusTag } from '@/shared/ui'
import type { PlanningContent } from '../api'
import { PLANNING_STATUS_TONE } from '../model'

export function PlanningPostDrawer({
  content,
  onClose,
}: {
  content: PlanningContent | null
  onClose: () => void
}) {
  const { t, i18n } = useTranslation('planning')
  const locale = i18n.resolvedLanguage as AppLocale
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }),
    [locale],
  )
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    <Drawer
      open={Boolean(content)}
      onClose={onClose}
      placement="right"
      width="normal"
      title={t('detail.title')}
    >
      {content ? (
        <div className="grid gap-6 p-5">
          {content.thumbnailUrl ? (
            <img
              src={content.thumbnailUrl}
              alt=""
              className="h-56 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl bg-bg-surface-muted text-icon-lg text-text-tertiary">
              <IconImage />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 text-label-md text-text-secondary">
                {content.platform === 'facebook' ? (
                  <IconFacebook className="text-platform-facebook" />
                ) : (
                  <IconTikTok className="text-text-primary" />
                )}
                {t(`platform.${content.platform}`)}
              </span>
              <StatusTag tone={PLANNING_STATUS_TONE[content.status]}>
                {t(`status.${content.status}`)}
              </StatusTag>
            </div>
            {content.title ? (
              <h2 className="mt-4 text-heading-3 text-text-primary">{content.title}</h2>
            ) : null}
            <p className="mt-2 whitespace-pre-wrap text-body-md text-text-secondary">
              {content.caption}
            </p>
          </div>

          <dl className="grid gap-4 border-t border-border-subtle pt-5">
            <DetailRow label={t('detail.accounts')}>
              <ul className="grid gap-1">
                {content.targets.map((target) => (
                  <li key={target.id}>{target.name}</li>
                ))}
              </ul>
            </DetailRow>
            <DetailRow label={t('detail.scheduledAt')}>
              {content.scheduledAt ? dateFormatter.format(new Date(content.scheduledAt)) : '—'}
            </DetailRow>
            <DetailRow label={t('detail.createdAt')}>
              {dateFormatter.format(new Date(content.createdAt))}
            </DetailRow>
            <DetailRow label={t('detail.createdBy')}>{content.createdBy}</DetailRow>
            <DetailRow label={t('detail.timeZone')}>{timeZone}</DetailRow>
          </dl>
        </div>
      ) : null}
    </Drawer>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-label-sm text-text-tertiary">{label}</dt>
      <dd className="text-body-sm text-text-primary">{children}</dd>
    </div>
  )
}
