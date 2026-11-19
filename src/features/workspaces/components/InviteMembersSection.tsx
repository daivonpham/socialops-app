import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  IconClose,
  IconInfo,
  IconMail,
  IconPlus,
  Input,
  Select,
  useToast,
} from '@/shared/ui'
import {
  useInviteWorkspaceMember,
  type AccessOptionBrandDto,
  type BrandAccessInput,
  type WorkspaceMemberRole,
} from '../api'
import {
  grantableRoles,
  hasFullAccess,
  isAccessComplete,
  type InvitableRole,
} from '../model/member-role'
import { AccessPickerModal } from './AccessPickerModal'
import { AccessSummary } from './AccessSummary'
import { RoleGuideModal } from './RoleGuideModal'
import { useApiErrorMessage } from '@/shared/hooks'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Shared by the header and every row so the columns line up like a table. */
/** On a phone the remove button sits beside the email and the rest take full rows. */
const ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-x-2 gap-y-3 md:grid-cols-[minmax(0,1fr)_11rem_minmax(0,1.3fr)_2rem] md:gap-3'

type InviteRow = {
  id: string
  email: string
  role: InvitableRole
  access: BrandAccessInput[]
  /** Translated reason the last send failed; cleared when the row is edited. */
  error?: string
}

const newRow = (): InviteRow => ({
  id: crypto.randomUUID(),
  email: '',
  role: 'editor',
  access: [],
})

/** Several email + role + Brand/Page rows, sent together like the Untitled UI pattern. */
export function InviteMembersSection({
  workspaceId,
  actorRole,
  accessOptions,
  brandNames,
}: {
  workspaceId: string
  actorRole: WorkspaceMemberRole | undefined
  accessOptions?: AccessOptionBrandDto[]
  brandNames: Map<string, string>
}) {
  const { t } = useTranslation('workspaces')
  const errorMessage = useApiErrorMessage('workspaces')
  const toast = useToast()
  const invite = useInviteWorkspaceMember()
  const [rows, setRows] = useState<InviteRow[]>(() => [newRow()])
  const [accessRowId, setAccessRowId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const filled = rows.filter((row) => row.email.trim())
  const isRowValid = (row: InviteRow) =>
    EMAIL_PATTERN.test(row.email.trim()) &&
    (hasFullAccess(row.role) || isAccessComplete(row.access))
  const canSend = filled.length > 0 && filled.every(isRowValid) && !sending
  const accessRow = rows.find((row) => row.id === accessRowId)

  const patch = (id: string, value: Partial<InviteRow>) =>
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...value, error: undefined } : row)),
    )

  const send = async () => {
    if (!canSend) return
    setSending(true)
    const results = await Promise.allSettled(
      filled.map((row) =>
        invite.mutateAsync({
          workspaceId,
          email: row.email.trim(),
          role: row.role,
          brands: hasFullAccess(row.role) ? [] : row.access,
        }),
      ),
    )
    setSending(false)
    const failed = new Map<string, InviteRow['error']>()
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') return
      failed.set(filled[index]!.id, errorMessage(result.reason, t('members.inviteError')))
    })
    const sent = filled.length - failed.size
    if (sent) toast.success({ title: t('members.invitesSent') })
    if (failed.size) toast.error({ title: t('members.inviteFailedMany', { count: failed.size }) })
    // Sent rows disappear; failed rows stay with their error so they can be fixed and resent.
    const remaining = rows
      .filter((row) => failed.has(row.id))
      .map((row) => ({ ...row, error: failed.get(row.id) }))
    setRows(remaining.length ? remaining : [newRow()])
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle">
      <div
        aria-hidden
        className={`${ROW_GRID} hidden border-b border-border-subtle px-4 py-3 text-label-sm text-text-tertiary md:grid`}
      >
        <span>{t('members.inviteColumns.email')}</span>
        <span>{t('members.inviteColumns.role')}</span>
        <span>{t('members.inviteColumns.access')}</span>
        <span />
      </div>
      <ul className="divide-y divide-border-subtle">
        {rows.map((row) => (
          <li key={row.id} className="grid gap-1 px-4 py-3">
            <div className={ROW_GRID}>
              <Input
                type="email"
                value={row.email}
                prefix={<IconMail aria-hidden className="text-icon-md text-neutral-400" />}
                placeholder={t('members.emailPlaceholder')}
                aria-label={t('members.email')}
                className="max-md:col-start-1 max-md:row-start-1"
                autoComplete="off"
                onChange={(event) => patch(row.id, { email: event.target.value })}
              />
              <Select
                aria-label={t('members.role')}
                value={row.role}
                showSearch={false}
                className="w-full max-md:col-span-2"
                onChange={(event) => patch(row.id, { role: event.target.value as InvitableRole })}
                options={grantableRoles(actorRole).map((role) => ({
                  value: role,
                  label: t(`roles.${role}`),
                }))}
                footerAction={{
                  label: t('roleGuide.open'),
                  icon: <IconInfo aria-hidden />,
                  onClick: () => setGuideOpen(true),
                }}
              />
              <Button
                className="h-9 w-full justify-start px-3 max-md:col-span-2"
                disabled={hasFullAccess(row.role)}
                title={t(`roleDescriptions.${row.role}`)}
                onClick={() => setAccessRowId(row.id)}
              >
                {!hasFullAccess(row.role) && !row.access.length ? (
                  <span className="truncate text-body-sm text-text-tertiary">
                    {t('members.chooseAccess')}
                  </span>
                ) : (
                  <AccessSummary
                    role={row.role}
                    access={row.access}
                    options={accessOptions}
                    brandNames={brandNames}
                    compact
                  />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<IconClose aria-hidden />}
                aria-label={t('members.removeRow')}
                className="max-md:col-start-2 max-md:row-start-1"
                disabled={rows.length === 1}
                onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
              />
            </div>
            {row.error ? <p className="text-caption text-error-700">{row.error}</p> : null}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-border-subtle px-2 py-1">
        <Button
          variant="ghost"
          icon={<IconPlus aria-hidden />}
          onClick={() => setRows((current) => [...current, newRow()])}
        >
          {t('members.addRow')}
        </Button>
        <Button
          variant="primary"
          icon={<IconMail aria-hidden />}
          loading={sending}
          disabled={!canSend}
          onClick={() => void send()}
        >
          {t('members.sendInvites')}
        </Button>
      </div>
      {guideOpen ? <RoleGuideModal onClose={() => setGuideOpen(false)} /> : null}
      {accessRow ? (
        <AccessPickerModal
          workspaceId={workspaceId}
          title={accessRow.email.trim() || t('access.title')}
          value={accessRow.access}
          onApply={(access) => patch(accessRow.id, { access })}
          onClose={() => setAccessRowId(null)}
        />
      ) : null}
    </div>
  )
}
