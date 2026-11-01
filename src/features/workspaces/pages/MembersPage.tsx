import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useBrands } from '@/features/brands'
import { useAuth } from '@/shared/auth'
import { useActiveWorkspace } from '@/shared/scope'
import {
  Avatar,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  IconDelete,
  IconEdit,
  Pagination,
  SectionError,
  SectionSkeleton,
  StatusTag,
  Tooltip,
  useToast,
  type DataTableColumn,
} from '@/shared/ui'
import {
  useDeleteWorkspaceMember,
  useLeaveWorkspace,
  useMemberAccessOptions,
  useWorkspaceMembers,
  useWorkspaces,
  type WorkspaceMemberDto,
} from '../api'
import { AccessSummary } from '../components/AccessSummary'
import { EditMemberModal } from '../components/EditMemberModal'
import { InviteMembersSection } from '../components/InviteMembersSection'
import { canManageMembers, canManageWorkspace, memberAccessInput } from '../model/member-role'
import { useEnterWorkspace } from '../model/use-enter-workspace'
import { useApiErrorMessage } from '@/shared/hooks'

const PAGE_SIZE = 20

/** Settings-style layout: section label on the left, its controls on the right. */
export default function MembersPage() {
  const { t } = useTranslation('workspaces')
  const errorMessage = useApiErrorMessage('workspaces')
  const toast = useToast()
  const { workspaceId, setWorkspace } = useActiveWorkspace()
  const enterWorkspace = useEnterWorkspace()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [editMember, setEditMember] = useState<WorkspaceMemberDto | null>(null)
  const [removeMember, setRemoveMember] = useState<WorkspaceMemberDto | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const workspaces = useWorkspaces()
  const members = useWorkspaceMembers(workspaceId, page)
  const brands = useBrands(workspaceId)
  const remove = useDeleteWorkspaceMember()
  const leave = useLeaveWorkspace()
  const workspace = workspaces.data?.find((item) => item.id === workspaceId)
  const actorRole = workspace?.role
  const canManage = canManageMembers(actorRole)
  // An Admin removes members from their own Brands/Pages only; the member stays in the Workspace.
  const removesFromWorkspace = canManageWorkspace(actorRole)
  // Page names/avatars are only readable by members who can manage access.
  const accessOptions = useMemberAccessOptions(workspaceId, canManage)
  const brandNames = useMemo(
    () => new Map((brands.data ?? []).map((brand) => [brand.id, brand.name])),
    [brands.data],
  )

  const columns = useMemo<DataTableColumn<WorkspaceMemberDto>[]>(() => {
    return [
      {
        key: 'member',
        title: t('members.columns.member'),
        width: 'content',
        size: 280,
        hideable: false,
        render: (_, member) => {
          const name = member.displayName || member.email
          return (
            <span className="flex min-w-0 items-center gap-3">
              <Avatar name={name} src={member.avatarUrl ?? undefined} size="md" />
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate text-label-md text-text-primary">{name}</span>
                  {member.userId === user?.id ? (
                    <StatusTag tone="neutral">{t('members.you')}</StatusTag>
                  ) : null}
                </span>
                <span className="block truncate text-body-sm text-text-tertiary">
                  {member.email}
                </span>
              </span>
            </span>
          )
        },
      },
      {
        key: 'role',
        title: t('members.columns.role'),
        width: 'default',
        size: 130,
        render: (_, member) => (
          <span className="text-body-sm text-text-secondary">{t(`roles.${member.role}`)}</span>
        ),
      },
      {
        key: 'access',
        title: t('members.columns.access'),
        width: 'wide',
        size: 210,
        render: (_, member) => (
          <AccessSummary
            role={member.role}
            access={memberAccessInput(member)}
            options={accessOptions.data}
            brandNames={brandNames}
          />
        ),
      },
      {
        key: 'actions',
        title: '',
        width: 'compact',
        size: 96,
        align: 'end',
        hideable: false,
        reorderable: false,
        resizable: false,
        render: (_, member) =>
          member.canManage ? (
            <span className="flex items-center justify-end gap-1">
              <Tooltip title={t('members.remove')}>
                <span className="inline-flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<IconDelete aria-hidden />}
                    aria-label={t('members.removeFor', {
                      name: member.displayName || member.email,
                    })}
                    onClick={() => setRemoveMember(member)}
                  />
                </span>
              </Tooltip>
              <Tooltip title={t('members.edit')}>
                <span className="inline-flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<IconEdit aria-hidden />}
                    aria-label={t('members.editFor', { name: member.displayName || member.email })}
                    onClick={() => setEditMember(member)}
                  />
                </span>
              </Tooltip>
            </span>
          ) : null,
      },
    ]
  }, [accessOptions.data, brandNames, t, user?.id])

  if (!workspaceId) return <EmptyState title={t('members.noWorkspace')} description="" />
  if (members.isPending || workspaces.isPending) return <SectionSkeleton rows={8} />
  if (members.isError || workspaces.isError)
    return (
      <SectionError
        title={t('members.loadError')}
        retryLabel={t('members.retry')}
        onRetry={() => void members.refetch()}
      />
    )

  const pagination = members.data?.metadata?.pagination

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="border-b border-border-subtle pb-5">
        <h1 className="text-heading-2 font-semibold text-text-primary">{t('members.pageTitle')}</h1>
        <p className="mt-1 text-body-md text-text-tertiary">{t('members.pageDescription')}</p>
      </header>

      {canManage ? (
        <SettingsSection
          title={t('members.inviteTitle')}
          description={t('members.inviteSectionDescription')}
        >
          <InviteMembersSection
            workspaceId={workspaceId}
            actorRole={actorRole}
            accessOptions={accessOptions.data}
            brandNames={brandNames}
          />
        </SettingsSection>
      ) : null}

      <SettingsSection
        title={t('members.membersTitle')}
        description={t('members.membersSectionDescription')}
      >
        <div className="grid gap-4">
          <DataTable
            data={members.data?.data ?? []}
            columns={columns}
            getRowId={(member) => member.id}
            ariaLabel={t('members.membersTitle')}
            emptyState={<EmptyState title={t('members.empty')} description="" />}
          />
          {pagination && pagination.totalPage > 1 ? (
            <div className="flex justify-end">
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={pagination.total}
                onChange={(nextPage) => setPage(nextPage)}
              />
            </div>
          ) : null}
        </div>
      </SettingsSection>

      {actorRole && actorRole !== 'owner' ? (
        <SettingsSection
          title={t('members.leaveTitle')}
          description={t('members.leaveDescription')}
        >
          <div>
            <Button variant="destructive" onClick={() => setLeaveOpen(true)}>
              {t('members.leave')}
            </Button>
          </div>
        </SettingsSection>
      ) : null}

      {editMember ? (
        <EditMemberModal
          workspaceId={workspaceId}
          member={editMember}
          actorRole={actorRole}
          onClose={() => {
            setEditMember(null)
            void members.refetch()
          }}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(removeMember)}
        title={t(removesFromWorkspace ? 'members.removeConfirm' : 'members.removeScopedConfirm', {
          name: removeMember?.displayName || removeMember?.email || '',
        })}
        description={t(
          removesFromWorkspace ? 'members.removeDescription' : 'members.removeScopedDescription',
        )}
        confirmLabel={t('members.remove')}
        loading={remove.isPending}
        onClose={() => setRemoveMember(null)}
        onConfirm={() => {
          if (!removeMember) return
          remove.mutate(
            { workspaceId, memberId: removeMember.id },
            {
              onSuccess: () => {
                void members.refetch()
                setRemoveMember(null)
                toast.success({ title: t('members.removed') })
              },
              onError: (error) =>
                toast.error({ title: errorMessage(error, t('members.saveError')) }),
            },
          )
        }}
      />
      <ConfirmDialog
        open={leaveOpen}
        title={t('members.leaveConfirm', { name: workspace?.name ?? '' })}
        description={t('members.leaveConfirmDescription')}
        confirmLabel={t('members.leave')}
        loading={leave.isPending}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => {
          leave.mutate(workspaceId, {
            onSuccess: () => {
              setLeaveOpen(false)
              toast.success({ title: t('members.left') })
              const next = workspaces.data?.find((item) => item.id !== workspaceId)
              if (next) void enterWorkspace(next.id).catch(() => setWorkspace(next.id))
              else setWorkspace(null)
            },
            onError: (error) =>
              toast.error({ title: errorMessage(error, t('members.leaveError')) }),
          })
        }}
      />
    </div>
  )
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-5 border-b border-border-subtle py-6 last:border-b-0 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-8">
      <div>
        <h2 className="text-label-md font-semibold text-text-secondary">{title}</h2>
        <p className="mt-1 text-body-sm text-text-tertiary">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
