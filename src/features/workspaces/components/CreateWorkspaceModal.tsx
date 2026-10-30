import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Form, Input, Modal, useToast } from '@/shared/ui'
import { useActiveWorkspace } from '@/shared/scope'
import { WORKSPACE_QUERY_KEYS, type WorkspaceDto, useCreateWorkspace } from '../api'
import { useApiErrorMessage } from '@/shared/hooks'

type Values = { name: string }

export function CreateWorkspaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('workspaces')
  const errorMessage = useApiErrorMessage('workspaces')
  const [form] = Form.useForm<Values>()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { setWorkspace } = useActiveWorkspace()
  const createWorkspace = useCreateWorkspace()

  const close = () => {
    if (createWorkspace.isPending) return
    createWorkspace.reset()
    form.resetFields()
    onClose()
  }

  const submit = async ({ name }: Values) => {
    let workspace: WorkspaceDto
    try {
      workspace = await createWorkspace.mutateAsync({ name: name.trim() })
    } catch (error) {
      toast.error({ title: errorMessage(error, t('toast.createError')) })
      return
    }
    await queryClient.invalidateQueries({ queryKey: WORKSPACE_QUERY_KEYS.list() })
    setWorkspace(workspace.id)
    toast.success({ title: t('toast.createSuccess') })
    form.resetFields()
    onClose()
  }

  return (
    <Modal open={open} title={t('createModal.title')} width={440} onClose={close} footer={null}>
      <Form<Values> form={form} layout="vertical" requiredMark={false} onFinish={submit}>
        {createWorkspace.isError ? (
          <Alert
            variant="soft"
            tone="error"
            title={errorMessage(createWorkspace.error, t('createModal.error'))}
          />
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
          <Button disabled={createWorkspace.isPending} onClick={close}>
            {t('createModal.cancel')}
          </Button>
          <Button variant="primary" htmlType="submit" loading={createWorkspace.isPending}>
            {t('createModal.submit')}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
