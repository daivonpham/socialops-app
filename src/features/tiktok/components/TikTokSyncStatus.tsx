import { useEffect, useRef, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useApiErrorMessage } from '@/shared/hooks'
import { CodedError } from '@/shared/api/errors'
import { formatDate } from '@/shared/i18n'
import { Alert, IconCheck, Progress, Spin } from '@/shared/ui'
import type { TikTokAccountDto } from '../api'

const NON_DATA_KEYS = new Set(['integration', 'creator-info'])

/**
 * The screens read locally synced figures. Whenever an account finishes a sync, the figures are
 * fetched again so new data appears without a reload.
 */
export function useRefreshOnTikTokSync(brandId: string, accounts: TikTokAccountDto[]) {
  const client = useQueryClient()
  const previous = useRef<string | null>(null)
  const marker = accounts.map((account) => account.sync.lastSyncedAt ?? '').join('|')
  useEffect(() => {
    if (previous.current !== null && previous.current !== marker) {
      void client.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'tiktok' &&
          query.queryKey[1] === brandId &&
          !NON_DATA_KEYS.has(String(query.queryKey[2])),
      })
    }
    previous.current = marker
  }, [brandId, client, marker])
}

/**
 * Notices for the accounts on screen: syncs that keep failing, and that daily figures only exist
 * from the day SocialOps began recording them (TikTok keeps no history).
 */
export function TikTokSyncBanner({ accounts }: { accounts: TikTokAccountDto[] }) {
  const { t, i18n } = useTranslation('tiktok')
  const errorMessage = useApiErrorMessage('tiktok')
  const failing = accounts.filter(
    (account) => account.sync.status === 'failed' && account.sync.failureCount >= 2,
  )
  const history = accounts
    .map((account) => account.sync.historyStartAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)
  // Only worth saying while the history is younger than the longest quick range.
  const recent = history && Date.now() - Date.parse(history) < 90 * 86_400_000

  return (
    <>
      {failing.length ? (
        <Alert
          variant="soft"
          tone="warning"
          title={t('sync.failedTitle', { count: failing.length })}
          description={t('sync.failedDescription', {
            error: errorMessage(
              new CodedError(failing[0]!.sync.lastErrorCode ?? 'TIKTOK_REQUEST_FAILED'),
              t('common.loadError'),
            ),
          })}
        />
      ) : null}
      {recent ? (
        <Alert
          variant="soft"
          tone="info"
          title={t('sync.historyNote', { date: formatDate(history, i18n.resolvedLanguage) })}
        />
      ) : null}
    </>
  )
}

/**
 * Right after TikTok is connected nothing has synced yet, and the screen would show only zeros.
 * This shows the sync's progress instead, then the content once an account has data.
 */
export function TikTokFirstSync({
  accounts,
  children,
}: {
  accounts: TikTokAccountDto[]
  children: ReactNode
}) {
  const { t } = useTranslation('tiktok')
  const done = accounts.filter((account) => account.sync.lastSyncedAt).length
  if (!accounts.length || done > 0) return <>{children}</>

  return (
    <section
      role="status"
      aria-live="polite"
      className="grid justify-items-center gap-6 rounded-xl border border-border-subtle bg-bg-surface px-6 py-16 text-center shadow-xs"
    >
      <Spin size="lg" />
      <div className="grid max-w-[540px] gap-2">
        <h2 className="text-heading-3 text-text-primary">{t('sync.firstTitle')}</h2>
        <p className="text-body-sm text-text-secondary">{t('sync.firstDescription')}</p>
      </div>
      {accounts.length > 1 ? (
        <div className="grid w-full max-w-[360px] gap-2">
          <Progress
            percent={(done / accounts.length) * 100}
            ariaLabel={t('sync.progress', { done, total: accounts.length })}
          />
          <span className="text-caption text-text-tertiary">
            {t('sync.progress', { done, total: accounts.length })}
          </span>
        </div>
      ) : null}
      <ul className="grid w-full max-w-[440px] gap-2 text-start">
        {accounts.map((account) => {
          const finished = Boolean(account.sync.lastSyncedAt)
          const retrying = account.sync.status === 'failed'
          return (
            <li
              key={account.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle px-4 py-3"
            >
              <span className="truncate text-body-sm text-text-primary">{account.name}</span>
              <span className="flex shrink-0 items-center gap-2 text-caption text-text-secondary">
                {finished ? (
                  <IconCheck aria-hidden className="text-success-700" />
                ) : (
                  <Spin size="sm" indicator="ring" />
                )}
                {finished
                  ? t('sync.accountDone')
                  : retrying
                    ? t('sync.accountRetrying')
                    : t('sync.accountSyncing')}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
