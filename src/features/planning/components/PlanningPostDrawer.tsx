import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDateTime, getLocalTimeZone } from '@/shared/i18n'
import {
  Avatar,
  Button,
  IconCalendar,
  IconClock,
  IconEdit,
  IconFacebook,
  IconLink,
  IconProfile,
  IconTikTok,
  Modal,
  StatusTag,
} from '@/shared/ui'
import type { PlanningContent, PlanningPostType, PlanningTarget } from '../api'
import {
  createComposerDraftFromContent,
  PLANNING_APPROVAL_STATUS_TONE,
  PLANNING_STATUS_TONE,
  type PlanningAccount,
  type PreviewViewport,
} from '../model'
import { FacebookPostPreview } from './preview/FacebookPostPreview'
import { TikTokPostPreview } from './preview/TikTokPostPreview'

export function PlanningPostModal({
  content,
  onClose,
  onEdit,
}: {
  content: PlanningContent | null
  onClose: () => void
  onEdit: (content: PlanningContent) => void
}) {
  const { t } = useTranslation('planning')
  const timeZone = getLocalTimeZone()

  return (
    <Modal
      open={Boolean(content)}
      onClose={onClose}
      width={1120}
      floatingClose
      title={
        <span className="flex items-center gap-2">
          {content?.platform === 'tiktok' ? (
            <IconTikTok className="shrink-0 text-icon-md text-text-primary" />
          ) : (
            <IconFacebook className="shrink-0 text-icon-md text-platform-facebook" />
          )}
          <span>{t('detail.title')}</span>
        </span>
      }
      footer={
        content ? (
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>{t('common.close')}</Button>
            <Button
              variant="primary"
              icon={<IconEdit aria-hidden />}
              onClick={() => onEdit(content)}
            >
              {t('detail.edit')}
            </Button>
          </div>
        ) : null
      }
    >
      {content ? (
        <PlanningPostModalContent key={content.id} content={content} timeZone={timeZone} />
      ) : null}
    </Modal>
  )
}

function PlanningPostModalContent({
  content,
  timeZone,
}: {
  content: PlanningContent
  timeZone: string
}) {
  const { t, i18n } = useTranslation('planning')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const viewport = useResponsivePreviewViewport()
  const draft = createComposerDraftFromContent(content)
  const accounts: PlanningAccount[] = content.targets.map((target) => ({
    ...target,
    platform: content.platform,
  }))
  const previewAccount = accounts[0]
  const previewCaption = previewAccount
    ? draft.captionOverrides[previewAccount.id] || draft.caption
    : draft.caption

  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, left: 0 })
  }, [content.id])

  return (
    <div
      ref={scrollContainerRef}
      className="app-scrollbar max-h-[74vh] overflow-y-auto overscroll-y-contain py-2 pe-1"
    >
      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(30rem,1fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          <header className="flex items-center gap-3 p-5">
            {content.platform === 'facebook' ? (
              <IconFacebook className="shrink-0 text-icon-lg text-platform-facebook" />
            ) : (
              <IconTikTok className="shrink-0 text-icon-lg text-text-primary" />
            )}
            <div className="min-w-0">
              <p className="text-label-md text-text-primary">{t(`platform.${content.platform}`)}</p>
              <p className="mt-0.5 text-caption text-text-tertiary">
                {content.type
                  ? t(`composer.postType.${POST_TYPE_TRANSLATION_KEY[content.type]}`)
                  : t('detail.post')}
              </p>
            </div>
          </header>

          <div className="grid gap-3 border-t border-border-subtle p-5">
            <StatusRow label={t('detail.postStatus')}>
              <StatusTag tone={PLANNING_STATUS_TONE[content.status]}>
                {t(`status.${content.status}`)}
              </StatusTag>
            </StatusRow>
            <StatusRow label={t('detail.approvalStatus')}>
              <StatusTag tone={PLANNING_APPROVAL_STATUS_TONE[content.approvalStatus]}>
                {t(`approvalStatus.${content.approvalStatus}`)}
              </StatusTag>
            </StatusRow>
          </div>

          <div className="border-t border-border-subtle p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-label-md text-text-primary">{t('detail.accounts')}</h3>
              <span className="text-caption tabular-nums text-text-tertiary">
                {t('calendar.targetCount', { count: content.targets.length })}
              </span>
            </div>
            <ul className="mt-4 divide-y divide-border-subtle">
              {content.targets.map((target) => (
                <AccountRow key={target.id} target={target} />
              ))}
            </ul>
          </div>

          <dl className="grid gap-4 border-t border-border-subtle p-5">
            <MetaItem icon={<IconCalendar />} label={t('detail.scheduledAt')}>
              <span className="block">
                {content.scheduledAt
                  ? formatDateTime(content.scheduledAt, i18n.resolvedLanguage)
                  : '—'}
              </span>
              <span className="mt-0.5 block text-caption font-normal text-text-tertiary">
                {timeZone}
              </span>
            </MetaItem>
            <MetaItem icon={<IconClock />} label={t('detail.createdAt')}>
              {formatDateTime(content.createdAt, i18n.resolvedLanguage)}
            </MetaItem>
            <MetaItem icon={<IconProfile />} label={t('detail.createdBy')}>
              {content.createdBy}
            </MetaItem>
          </dl>

          {content.link ? (
            <div className="border-t border-border-subtle p-4">
              <a
                href={content.link}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 text-body-sm text-platform-facebook hover:underline"
              >
                <IconLink className="shrink-0" />
                <span className="truncate">{content.link}</span>
              </a>
            </div>
          ) : null}
        </section>

        <aside className="flex min-w-0 items-start justify-center">
          {content.platform === 'facebook' ? (
            <FacebookPostPreview
              account={previewAccount}
              caption={previewCaption}
              media={draft.media}
              viewport={viewport}
              postType={draft.postType}
              fluid
            />
          ) : (
            <TikTokPostPreview
              account={previewAccount}
              caption={previewCaption}
              media={draft.media}
              viewport={viewport}
              fluid
            />
          )}
        </aside>
      </div>
    </div>
  )
}

function useResponsivePreviewViewport(): PreviewViewport {
  const getViewport = (): PreviewViewport =>
    window.matchMedia('(max-width: 1023px)').matches ? 'mobile' : 'desktop'
  const [viewport, setViewport] = useState<PreviewViewport>(getViewport)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    const updateViewport = () => setViewport(mediaQuery.matches ? 'mobile' : 'desktop')
    mediaQuery.addEventListener('change', updateViewport)
    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  return viewport
}

function StatusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <span className="text-body-sm text-text-secondary">{label}</span>
      {children}
    </div>
  )
}

function AccountRow({ target }: { target: PlanningTarget }) {
  return (
    <li className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0">
      <Avatar name={target.name} src={target.avatarUrl} size="sm" />
      <span
        className="min-w-0 truncate text-body-sm font-medium text-text-primary"
        title={target.name}
      >
        {target.name}
      </span>
    </li>
  )
}

function MetaItem({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <dt className="flex shrink-0 items-center gap-2 text-body-sm text-text-secondary">
        <span aria-hidden className="flex size-5 items-center justify-center text-text-tertiary">
          {icon}
        </span>
        <span>{label}</span>
      </dt>
      <dd
        className="min-w-0 text-end text-body-sm font-medium tabular-nums text-text-primary"
        title={String(children)}
      >
        {children}
      </dd>
    </div>
  )
}

const POST_TYPE_TRANSLATION_KEY = {
  facebook_feed: 'facebookFeed',
  facebook_reel: 'facebookReel',
  facebook_story: 'facebookStory',
  tiktok_video: 'tiktokVideo',
  tiktok_photo: 'tiktokPhoto',
} as const satisfies Record<PlanningPostType, string>
