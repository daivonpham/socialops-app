import { useTranslation } from 'react-i18next'
import { IconCheck, IconInfo, Modal } from '@/shared/ui'
import type { WorkspaceMemberRole } from '../api'

const ROLES: WorkspaceMemberRole[] = ['owner', 'full_access', 'admin', 'editor', 'viewer']

/**
 * What each role can do, mirroring the API role policy (`workspace-permissions.ts`). `scoped`
 * marks roles limited to the Brands/Pages they are assigned.
 */
type Capability =
  | 'view'
  | 'createContent'
  | 'publishDirect'
  | 'approve'
  | 'managePublished'
  | 'channels'
  | 'reports'
  | 'members'
  | 'brands'
  | 'ownerOnly'

const CAPABILITIES: Array<{ key: Capability; roles: WorkspaceMemberRole[] }> = [
  { key: 'view', roles: ROLES },
  { key: 'createContent', roles: ['owner', 'full_access', 'admin', 'editor'] },
  { key: 'publishDirect', roles: ['owner', 'full_access', 'admin'] },
  { key: 'approve', roles: ['owner', 'full_access', 'admin'] },
  { key: 'managePublished', roles: ['owner', 'full_access', 'admin'] },
  { key: 'channels', roles: ['owner', 'full_access', 'admin'] },
  { key: 'reports', roles: ['owner', 'full_access', 'admin', 'editor'] },
  { key: 'members', roles: ['owner', 'full_access', 'admin'] },
  { key: 'brands', roles: ['owner', 'full_access'] },
  { key: 'ownerOnly', roles: ['owner'] },
]

export function RoleGuideModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('workspaces')
  return (
    <Modal
      open
      width={920}
      floatingClose
      headerIcon={<IconInfo aria-hidden />}
      title={t('roleGuide.title')}
      headerDescription={t('roleGuide.description')}
      onClose={onClose}
      footer={null}
    >
      {/* The table scrolls inside the dialog so a tall list never pushes the close button off
          screen. */}
      <div className="grid max-h-[calc(100dvh-16rem)] gap-5 overflow-y-auto pe-1">
        <div className="overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full min-w-[44rem] border-collapse text-body-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border-subtle bg-bg-surface-subtle">
                <th
                  scope="col"
                  className="w-[34%] px-4 py-3 text-start text-label-sm font-medium text-text-tertiary"
                >
                  {t('roleGuide.capability')}
                </th>
                {ROLES.map((role) => (
                  <th
                    key={role}
                    scope="col"
                    className="px-2 py-3 text-center text-label-sm font-medium text-text-secondary"
                  >
                    {t(`roles.${role}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              <tr className="bg-bg-surface-subtle">
                <th
                  scope="row"
                  className="px-4 py-[10px] text-start font-normal text-text-secondary"
                >
                  {t('roleGuide.capabilities.scope')}
                </th>
                {ROLES.map((role) => (
                  <td
                    key={role}
                    className="px-2 py-[10px] text-center text-caption text-text-tertiary"
                  >
                    {t(
                      role === 'owner' || role === 'full_access'
                        ? 'roleGuide.scopeAll'
                        : 'roleGuide.scopeAssigned',
                    )}
                  </td>
                ))}
              </tr>
              {CAPABILITIES.map((capability) => (
                <tr key={capability.key} className="hover:bg-bg-surface-subtle">
                  <th
                    scope="row"
                    className="px-4 py-[10px] text-start font-normal text-text-primary"
                  >
                    {t(`roleGuide.capabilities.${capability.key}`)}
                  </th>
                  {ROLES.map((role) => (
                    <td key={role} className="px-2 py-[10px] text-center">
                      {capability.roles.includes(role) ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-success-50 text-success-700">
                          <IconCheck aria-label={t('roleGuide.allowed')} className="text-icon-sm" />
                        </span>
                      ) : (
                        <span aria-label={t('roleGuide.notAllowed')} className="text-text-disabled">
                          –
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((role) => (
            <div key={role} className="rounded-xl border border-border-subtle px-4 py-3">
              <dt className="text-label-md text-text-primary">{t(`roles.${role}`)}</dt>
              <dd className="mt-1 text-body-sm text-text-tertiary">
                {t(`roleDescriptions.${role}`)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  )
}
