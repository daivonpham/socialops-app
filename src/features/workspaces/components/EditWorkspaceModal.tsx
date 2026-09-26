import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Form, Input, Modal, useToast } from '@/shared/ui'
import {
  WORKSPACE_QUERY_KEYS,
  type WorkspaceDto,
  useUpdateWorkspace,
} from '../api'

type Values = { name: string }

export function EditWorkspaceModal({
  workspace,
  open,
  onClose,
}: {
  workspace: WorkspaceDto | null
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('workspaces')
  const [form] = Form.useForm<Values>()
  const queryClient = useQueryClient()
  const toast = useToast()
  const updateWorkspace = useUpdateWorkspace()

  useEffect(() => {
    if (open && workspace) form.setFieldsValue({ name: workspace.name })
  }, [form, open, workspace])

  const close = () => {
    if (updateWorkspace.isPending) return
    updateWorkspace.reset()
    form.resetFields()
    onClose()
  }

  const submit = async ({ name }: Values) => {
    if (!workspace) return
    try {
      await updateWorkspace.mutateAsync({ workspaceId: workspace.id, name: name.trim() })
    } catch {
      toast.error({ title: t('toast.updateError') })
      return
    }
    await queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEYS.list() })
    toast.success({ title: t('toast.updateSuccess') })
    form.resetFields()
    onClose()
  }

  return (
    <Modal open={open} title={t('editModal.title')} width={440} onClose={close} footer={null}>
      <Form<Values> form={form} layout="vertical" requiredMark={false} onFinish={submit}>
        {updateWorkspace.isError ? (
          <Alert variant="soft" tone="error" title={t('editModal.error')} />
        ) : null}
        <Form.Item
          name="name"
          label={t('createModal.name')}
          rules={[
            { required: true, whitespace: true, message: t('createModal.nameRequired') },
            { min: 2, message: t('createModal.nameMin') },
            { max: 120, message: t('createModal.nameMax') },
          ]}
        >
          <Input size="lg" placeholder={t('createModal.namePlaceholder')} allowClear />
        </Form.Item>
        <div className="mt-6 flex justify-end gap-3">
          <Button disabled={updateWorkspace.isPending} onClick={close}>
            {t('editModal.cancel')}
          </Button>
          <Button
            variant="primary"
            htmlType="submit"
            loading={updateWorkspace.isPending}
            disabled={!workspace}
          >
            {t('editModal.submit')}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
