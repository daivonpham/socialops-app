import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useBrands } from '@/features/brands'
import { useAuth } from '@/shared/auth'
import { useActiveWorkspace } from '@/shared/scope'
import {
  Alert,
  Button,
  Checkbox,
  EmptyState,
  Input,
  Modal,
  SectionSkeleton,
  Select,
  useToast,
} from '@/shared/ui'
import {
  useAssignWorkspaceMemberBrand,
  useDeleteWorkspaceMember,
  useInviteWorkspaceMember,
  useRevokeWorkspaceMemberBrand,
  useUpdateWorkspaceMember,
  useWorkspaceMembers,
  useWorkspaces,
  type WorkspaceMemberDto,
  type WorkspaceMemberRole,
} from '../api'

type EditableRole = Exclude<WorkspaceMemberRole, 'owner'>

export default function MembersPage() {
  const { t } = useTranslation('workspaces')
  const { workspaceId } = useActiveWorkspace()
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedMember, setSelectedMember] = useState<WorkspaceMemberDto | null>(null)
  const [removeMember, setRemoveMember] = useState<WorkspaceMemberDto | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<EditableRole>('viewer')
  const workspaces = useWorkspaces()
  const members = useWorkspaceMembers(workspaceId, page)
  const brands = useBrands(workspaceId)
  const updateRole = useUpdateWorkspaceMember()
  const remove = useDeleteWorkspaceMember()
  const assign = useAssignWorkspaceMemberBrand()
  const revoke = useRevokeWorkspaceMemberBrand()
  const invite = useInviteWorkspaceMember()
  const workspace = workspaces.data?.find((item) => item.id === workspaceId)
  const canManage = workspace?.role === 'owner' || workspace?.role === 'admin'
  const canManageMember = (member: WorkspaceMemberDto) =>
    canManage &&
    member.role !== 'owner' &&
    member.userId !== user?.id &&
    (workspace?.role === 'owner' || member.role !== 'admin')
  const roleOptions = (
    workspace?.role === 'owner'
      ? (['admin', 'editor', 'viewer'] as const)
      : (['editor', 'viewer'] as const)
  ).map((role) => ({ value: role, label: t(`roles.${role}`) }))
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'members'] })

  const changeRole = async (member: WorkspaceMemberDto, role: EditableRole) => {
    if (!workspaceId || role === member.role) return
    try {
      await updateRole.mutateAsync({ workspaceId, memberId: member.id, role })
      await refresh()
      toast.success({ title: t('members.saved') })
    } catch {
      toast.error({ title: t('members.saveError') })
    }
  }

  const toggleBrand = async (member: WorkspaceMemberDto, brandId: string, checked: boolean) => {
    if (!workspaceId) return
    try {
      await (checked ? assign : revoke).mutateAsync({ workspaceId, memberId: member.id, brandId })
      await refresh()
      setSelectedMember((current) =>
        current?.id === member.id
          ? {
              ...current,
              brandIds: checked
                ? [...current.brandIds, brandId]
                : current.brandIds.filter((id) => id !== brandId),
            }
          : current,
      )
      toast.success({ title: t('members.saved') })
    } catch {
      toast.error({ title: t('members.saveError') })
    }
  }

  if (!workspaceId) return <EmptyState title={t('members.noWorkspace')} description="" />
  if (members.isPending || workspaces.isPending || brands.isPending)
    return <SectionSkeleton rows={8} />
  if (members.isError || workspaces.isError || brands.isError) {
    return <Alert variant="soft" tone="error" title={t('members.loadError')} />
  }

  const pagination = members.data?.metadata?.pagination
  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-heading-2 text-text-primary">{t('members.title')}</h1>
          <p className="text-body-sm text-text-secondary">{workspace?.name}</p>
        </div>
        {canManage ? (
          <Button onClick={() => setInviteOpen(true)}>{t('members.invite')}</Button>
        ) : null}
      </header>
      <div className="grid gap-3">
        {members.data?.data.map((member) => (
          <div
            key={member.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4"
          >
            <div className="min-w-48 flex-1">
              <p className="text-label-md text-text-primary">
                {member.displayName || member.email}
              </p>
              <p className="text-caption text-text-secondary">{member.email}</p>
            </div>
            {canManageMember(member) ? (
              <Select
                aria-label={t('members.roleFor', { name: member.displayName || member.email })}
                value={member.role}
                disabled={updateRole.isPending}
                options={roleOptions}
                onChange={(event) => void changeRole(member, event.target.value as EditableRole)}
              />
            ) : (
              <span className="text-body-sm text-text-secondary">{t(`roles.${member.role}`)}</span>
            )}
            <Button size="sm" onClick={() => setSelectedMember(member)}>
              {t('members.brands')}
            </Button>
            {canManageMember(member) ? (
              <Button size="sm" variant="ghost" onClick={() => setRemoveMember(member)}>
                {t('members.remove')}
              </Button>
            ) : null}
          </div>
        ))}
        {members.data?.data.length === 0 ? (
          <EmptyState title={t('members.empty')} description="" />
        ) : null}
      </div>
      {pagination && pagination.totalPage > 1 ? (
        <div className="flex items-center justify-end gap-3">
          <Button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            {t('members.previous')}
          </Button>
          <span className="text-body-sm text-text-secondary">
            {page} / {pagination.totalPage}
          </span>
          <Button
            disabled={page >= pagination.totalPage}
            onClick={() => setPage((value) => value + 1)}
          >
            {t('members.next')}
          </Button>
        </div>
      ) : null}
      <Modal
        open={Boolean(selectedMember)}
        title={t('members.brandsFor', {
          name: selectedMember?.displayName || selectedMember?.email || '',
        })}
        onClose={() => setSelectedMember(null)}
        footer={<Button onClick={() => setSelectedMember(null)}>{t('members.close')}</Button>}
      >
        <div className="grid gap-3">
          {(brands.data ?? []).map((brand) => (
            <Checkbox
              key={brand.id}
              checked={selectedMember?.brandIds.includes(brand.id)}
              disabled={
                !selectedMember ||
                !canManageMember(selectedMember) ||
                assign.isPending ||
                revoke.isPending
              }
              onChange={(event) => {
                if (selectedMember) void toggleBrand(selectedMember, brand.id, event.target.checked)
              }}
            >
              {brand.name}
            </Checkbox>
          ))}
        </div>
      </Modal>
      <Modal
        open={Boolean(removeMember)}
        title={t('members.remove')}
        onClose={() => setRemoveMember(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setRemoveMember(null)}>{t('members.close')}</Button>
            <Button
              variant="primary"
              loading={remove.isPending}
              onClick={async () => {
                if (!workspaceId || !removeMember) return
                try {
                  await remove.mutateAsync({ workspaceId, memberId: removeMember.id })
                  await refresh()
                  setRemoveMember(null)
                  toast.success({ title: t('members.removed') })
                } catch {
                  toast.error({ title: t('members.saveError') })
                }
              }}
            >
              {t('members.remove')}
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-text-secondary">
          {t('members.removeConfirm', {
            name: removeMember?.displayName || removeMember?.email || '',
          })}
        </p>
      </Modal>
      <Modal
        open={inviteOpen}
        title={t('members.invite')}
        onClose={() => setInviteOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setInviteOpen(false)}>{t('members.close')}</Button>
            <Button
              variant="primary"
              disabled={!email.trim() || invite.isPending}
              loading={invite.isPending}
              onClick={async () => {
                if (!workspaceId) return
                try {
                  await invite.mutateAsync({ workspaceId, email: email.trim(), role: inviteRole })
                  setInviteOpen(false)
                  setEmail('')
                  toast.success({ title: t('members.invited') })
                } catch {
                  toast.error({ title: t('members.inviteError') })
                }
              }}
            >
              {t('members.invite')}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          <Input
            label={t('members.email')}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Select
            label={t('members.role')}
            value={inviteRole}
            options={roleOptions}
            onChange={(event) => setInviteRole(event.target.value as EditableRole)}
          />
        </div>
      </Modal>
    </div>
  )
}
