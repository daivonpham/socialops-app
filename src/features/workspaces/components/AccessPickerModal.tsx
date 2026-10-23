import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Modal, SectionSkeleton } from '@/shared/ui'
import { useMemberAccessOptions, type BrandAccessInput } from '../api'
import { isAccessComplete } from '../model/member-role'
import { MemberAccessEditor } from './MemberAccessEditor'

/** Chooses Brand/Page access for one invite row; mount it only while open. */
export function AccessPickerModal({
  workspaceId,
  title,
  value,
  onApply,
  onClose,
}: {
  workspaceId: string
  title: string
  value: BrandAccessInput[]
  onApply: (value: BrandAccessInput[]) => void
  onClose: () => void
}) {
  const { t } = useTranslation('workspaces')
  const options = useMemberAccessOptions(workspaceId)
  const [access, setAccess] = useState(value)

  return (
    <Modal
      open
      width={600}
      title={title}
      headerDescription={t('access.pickerDescription')}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('members.cancel')}</Button>
          <Button
            variant="primary"
            disabled={!isAccessComplete(access)}
            onClick={() => {
              onApply(access)
              onClose()
            }}
          >
            {t('members.save')}
          </Button>
        </div>
      }
    >
      {options.isPending ? (
        <SectionSkeleton rows={4} />
      ) : options.isError ? (
        <Alert variant="soft" tone="error" title={t('access.loadError')} />
      ) : (
        <MemberAccessEditor options={options.data} value={access} onChange={setAccess} />
      )}
    </Modal>
  )
}
