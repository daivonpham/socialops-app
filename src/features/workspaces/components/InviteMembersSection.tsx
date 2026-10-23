import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { Button, IconClose, IconMail, IconPlus, Input, Select, useToast } from '@/shared/ui'
import {
  useInviteWorkspaceMember,
  type AccessOptionBrandDto,
  type BrandAccessInput,
  type WorkspaceMemberRole,
} from '../api'
import { grantableRoles, isAccessComplete, type InvitableRole } from '../model/member-role'
import { AccessPickerModal } from './AccessPickerModal'
import { AccessSummary } from './AccessSummary'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Shared by the header and every row so the columns line up like a table. */
const ROW_GRID =
  'grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_minmax(0,1.3fr)_2rem] md:items-center'

type InviteRow = {
  id: string
  email: string
  role: InvitableRole
  access: BrandAccessInput[]
  error?: 'alreadyMember' | 'failed'
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
  const toast = useToast()
  const invite = useInviteWorkspaceMember()
  const [rows, setRows] = useState<InviteRow[]>(() => [newRow()])
  const [accessRowId, setAccessRowId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const filled = rows.filter((row) => row.email.trim())
  const isRowValid = (row: InviteRow) =>
    EMAIL_PATTERN.test(row.email.trim()) && (row.role === 'admin' || isAccessComplete(row.access))
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
          brands: row.role === 'admin' ? [] : row.access,
        }),
      ),
    )
    setSending(false)
    const failed = new Map<string, InviteRow['error']>()
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') return
      const code = isAxiosError<{ error?: { code?: string } }>(result.reason)
        ? result.reason.response?.data?.error?.code
        : undefined
      failed.set(
        filled[index]!.id,
        code === 'ALREADY_WORKSPACE_MEMBER' ? 'alreadyMember' : 'failed',
      )
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
                autoComplete="off"
                onChange={(event) => patch(row.id, { email: event.target.value })}
              />
              <Select
                aria-label={t('members.role')}
                value={row.role}
                showSearch={false}
                className="w-full"
                onChange={(event) => patch(row.id, { role: event.target.value as InvitableRole })}
                options={grantableRoles(actorRole).map((role) => ({
                  value: role,
                  label: t(`roles.${role}`),
                }))}
              />
              <Button
                className="h-9 w-full justify-start px-3"
                disabled={row.role === 'admin'}
                title={t(`roleDescriptions.${row.role}`)}
                onClick={() => setAccessRowId(row.id)}
              >
                {row.role !== 'admin' && !row.access.length ? (
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
                disabled={rows.length === 1}
                onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
              />
            </div>
            {row.error ? (
              <p className="text-caption text-error-700">
                {row.error === 'alreadyMember'
                  ? t('members.alreadyMember')
                  : t('members.inviteError')}
              </p>
            ) : null}
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
