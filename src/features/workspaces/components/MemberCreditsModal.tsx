import { useTranslation } from 'react-i18next'
import { useApiErrorMessage } from '@/shared/hooks'
import { Button, Form, Input, Modal, useToast } from '@/shared/ui'
import { useUpdateMemberAiCredits, type WorkspaceMemberDto } from '../api'

const WHOLE_NUMBER = /^\d{1,9}$/

type Values = { credits?: string }

/** The Owner sets one member's Credits; empty goes back to sharing what is not handed out. */
export function MemberCreditsModal({
  workspaceId,
  member,
  current,
  onClose,
}: {
  workspaceId: string
  member: WorkspaceMemberDto
  current: number | null
  onClose: () => void
}) {
  const { t } = useTranslation('workspaces')
  const errorMessage = useApiErrorMessage('workspaces')
  const toast = useToast()
  const update = useUpdateMemberAiCredits()

  const submit = async ({ credits }: Values) => {
    const text = credits?.trim() ?? ''
    try {
      await update.mutateAsync({
        workspaceId,
        memberId: member.id,
        credits: text ? Number(text) : null,
      })
    } catch (error) {
      toast.error({ title: errorMessage(error, t('members.credits.saveError')) })
      return
    }
    toast.success({ title: t('members.credits.saved') })
    onClose()
  }

  return (
    <Modal
      open
      title={t('members.credits.editFor', { name: member.displayName || member.email })}
      width={440}
      onClose={onClose}
      footer={null}
    >
      <Form<Values>
        layout="vertical"
        className="mt-4"
        requiredMark={false}
        initialValues={{ credits: current?.toString() ?? '' }}
        onFinish={(values) => void submit(values)}
      >
        <Form.Item
          name="credits"
          label={t('members.credits.amount')}
          extra={t('members.credits.amountHint')}
          rules={[{ pattern: WHOLE_NUMBER, message: t('members.credits.invalid') }]}
        >
          <Input />
        </Form.Item>
        <div className="mt-6 flex justify-end gap-3">
          <Button disabled={update.isPending} onClick={onClose}>
            {t('members.credits.cancel')}
          </Button>
          <Button variant="primary" htmlType="submit" loading={update.isPending}>
            {t('members.credits.save')}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
