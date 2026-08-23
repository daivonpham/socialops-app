import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { hasPermission, usePermissions } from '@/shared/permissions'
import {
  Button,
  Checkbox,
  EmptyState,
  IconCheck,
  IconFacebook,
  IconInfo,
  IconLink,
  IconSearch,
  Input,
  SectionError,
  SectionSkeleton,
} from '@/shared/ui'
import { useConnectFacebook, useManageableFacebookPages, useSelectFacebookPages } from '../api'
import { FACEBOOK_ACCESS } from '../config/facebook-access'

export function FacebookDisconnected({ brandId }: { brandId: string }) {
  const { t } = useTranslation('facebook')
  const { granted } = usePermissions()
  const connect = useConnectFacebook(brandId)
  const allowed = hasPermission(granted, FACEBOOK_ACCESS.manageConnection[0])

  return (
    <div className="mx-auto grid max-w-narrow gap-8 py-8 md:py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info-50 text-icon-lg text-platform-facebook">
        <IconFacebook />
      </div>
      <div>
        <h1 className="text-heading-1 text-text-primary">{t('connection.disconnectedTitle')}</h1>
        <p className="mt-2 text-body-md text-text-tertiary">
          {t('connection.disconnectedDescription')}
        </p>
      </div>
      <div className="grid gap-3">
        {(['capability1', 'capability2', 'capability3'] as const).map((key) => (
          <div key={key} className="flex items-start gap-3 text-body-sm text-text-secondary">
            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-success-50 text-success-700">
              <IconCheck />
            </span>
            {t(`connection.${key}`)}
          </div>
        ))}
      </div>
      <div>
        <Button
          variant="primary"
          icon={<IconFacebook />}
          loading={connect.isPending}
          disabled={!allowed}
          onClick={() => connect.mutate({ brandId })}
        >
          {connect.isPending ? t('connection.connecting') : t('connection.connect')}
        </Button>
        {!allowed ? (
          <p className="mt-2 text-caption text-error-700">{t('connection.permissionReason')}</p>
        ) : null}
      </div>
      <div className="flex gap-2 rounded-lg bg-bg-surface-muted p-3 text-caption text-text-tertiary">
        <IconInfo />
        <span>{t('connection.privacy')}</span>
      </div>
    </div>
  )
}

export function FacebookPagePicker({
  brandId,
  onCancel,
}: {
  brandId: string
  onCancel?: () => void
}) {
  const { t } = useTranslation('facebook')
  const pagesQuery = useManageableFacebookPages(brandId, true)
  const selectPages = useSelectFacebookPages(brandId)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const pages = pagesQuery.data ?? []
  const filtered = useMemo(
    () =>
      pages.filter((page) =>
        `${page.name} ${page.handle}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [pages, query],
  )

  useEffect(() => {
    if (pages.length) setSelected(pages.filter((page) => page.selected).map((page) => page.id))
  }, [pages])

  if (pagesQuery.isPending)
    return (
      <div className="mx-auto max-w-narrow py-12">
        <SectionSkeleton rows={5} />
      </div>
    )
  if (pagesQuery.isError)
    return (
      <SectionError
        title={t('common.loadError')}
        retryLabel={t('common.retry')}
        onRetry={() => void pagesQuery.refetch()}
      />
    )
  return (
    <div className="mx-auto grid max-w-narrow gap-6 py-6">
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info-50 text-icon-lg text-platform-facebook">
          <IconLink />
        </div>
        <h1 className="mt-5 text-heading-1 text-text-primary">{t('connection.pickerTitle')}</h1>
        <p className="mt-2 text-body-md text-text-tertiary">{t('connection.pickerDescription')}</p>
      </div>
      {pages.length ? (
        <>
          <div className="relative">
            <span className="pointer-events-none absolute start-3 top-3 text-text-tertiary">
              <IconSearch />
            </span>
            <Input
              className="ps-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('connection.searchPages')}
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
            {filtered.map((page) => (
              <label
                key={page.id}
                className="flex cursor-pointer items-center gap-4 border-b border-border-subtle p-4 last:border-b-0 hover:bg-bg-surface-subtle"
              >
                <Checkbox
                  checked={selected.includes(page.id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, page.id]
                        : current.filter((id) => id !== page.id),
                    )
                  }
                />
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-info-50 text-platform-facebook">
                  <IconFacebook />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-label-md text-text-primary">
                    {page.name}
                  </strong>
                  <span className="text-caption text-text-tertiary">
                    {page.handle} · {page.category}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            {onCancel ? <Button onClick={onCancel}>{t('common.cancel')}</Button> : null}
            <Button
              variant="primary"
              loading={selectPages.isPending}
              disabled={!selected.length}
              onClick={() =>
                selectPages.mutate(
                  { brandId, pageIds: selected },
                  { onSuccess: () => onCancel?.() },
                )
              }
            >
              {t('connection.connectSelected', { count: selected.length })}
            </Button>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<IconFacebook />}
          title={t('connection.noPagesTitle')}
          description={t('connection.noPagesDescription')}
          action={<Button onClick={() => void pagesQuery.refetch()}>{t('common.retry')}</Button>}
        />
      )}
    </div>
  )
}
