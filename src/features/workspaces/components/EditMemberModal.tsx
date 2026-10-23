import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/shared/i18n/format'
import {
  Alert,
  Avatar,
  Button,
  IconInfo,
  Modal,
  SectionLabel,
  SectionSkeleton,
  useToast,
} from '@/shared/ui'
import {
  useMemberAccessOptions,
  useUpdateWorkspaceMember,
  useUpdateWorkspaceMemberAccess,
  type WorkspaceMemberDto,
  type WorkspaceMemberRole,
} from '../api'
import {
  grantableRoles,
  isAccessComplete,
  memberAccessInput,
  type InvitableRole,
} from '../model/member-role'
import { MemberAccessEditor } from './MemberAccessEditor'

/** Role and Brand/Page access for one member, saved together. */
export function EditMemberModal({
  workspaceId,
  member,
  actorRole,
  onClose,
}: {
  workspaceId: string
  member: WorkspaceMemberDto
  actorRole: WorkspaceMemberRole | undefined
  onClose: () => void
}) {
  const { t, i18n } = useTranslation('workspaces')
  const toast = useToast()
  const options = useMemberAccessOptions(workspaceId)
  const updateRole = useUpdateWorkspaceMember()
  const updateAccess = useUpdateWorkspaceMemberAccess()
  const [role, setRole] = useState<InvitableRole>(member.role as InvitableRole)
  const [access, setAccess] = useState(() => memberAccessInput(member))
  const [failed, setFailed] = useState(false)
  const saving = updateRole.isPending || updateAccess.isPending
  const name = member.displayName || member.email
  const canSave = !saving && (role === 'admin' || isAccessComplete(access))

  const save = async () => {
    setFailed(false)
    try {
      // Change the role first: access only applies to Editor/Viewer.
      if (role !== member.role)
        await updateRole.mutateAsync({ workspaceId, memberId: member.id, role })
      if (role !== 'admin')
        await updateAccess.mutateAsync({ workspaceId, memberId: member.id, brands: access })
      toast.success({ title: t('members.saved') })
      onClose()
    } catch {
      setFailed(true)
    }
  }

  return (
    <Modal
      open
      width={640}
      floatingClose
      title={t('members.editTitle', { name })}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('members.cancel')}</Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={!canSave}
            onClick={() => void save()}
          >
            {t('members.save')}
          </Button>
        </div>
      }
    >
      <div className="grid gap-5">
        {failed ? <Alert variant="soft" tone="error" title={t('members.saveError')} /> : null}
        <div className="flex items-center gap-3">
          <Avatar name={name} src={member.avatarUrl ?? undefined} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-heading-4 text-text-primary">{name}</p>
            <p className="truncate text-body-sm text-text-tertiary">
              {member.email}
              <span aria-hidden> · </span>
              {t('members.joinedOn', { date: formatDate(member.createdAt, i18n.language) })}
            </p>
          </div>
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-2">
            <SectionLabel>{t('members.role')}</SectionLabel>
          </legend>
          {grantableRoles(actorRole).map((item) => (
            <label
              key={item}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:focus-ring ${
                role === item
                  ? 'border-border-strong bg-bg-surface-subtle'
                  : 'border-border-subtle hover:bg-bg-surface-subtle'
              }`}
            >
              <input
                type="radio"
                name="member-role"
                value={item}
                checked={role === item}
                className="mt-0.5 size-4 shrink-0 accent-neutral-900"
                onChange={() => setRole(item)}
              />
              <span className="grid min-w-0 gap-0.5">
                <span className="text-label-md text-text-primary">{t(`roles.${item}`)}</span>
                <span className="text-body-sm text-text-tertiary">
                  {t(`roleDescriptions.${item}`)}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="grid gap-2">
          <SectionLabel>{t('access.title')}</SectionLabel>
          {role === 'admin' ? (
            <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface-subtle px-4 py-3">
              <IconInfo aria-hidden className="shrink-0 text-icon-sm text-text-tertiary" />
              <p className="text-body-sm text-text-secondary">{t('access.adminNote')}</p>
            </div>
          ) : options.isPending ? (
            <SectionSkeleton rows={3} />
          ) : options.isError ? (
            <Alert variant="soft" tone="error" title={t('access.loadError')} />
          ) : (
            <MemberAccessEditor options={options.data} value={access} onChange={setAccess} />
          )}
        </div>
      </div>
    </Modal>
  )
}
