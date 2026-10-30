import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Form, Input } from '@/shared/ui'
import { useForgotPassword } from '../api'
import { AuthLayout } from '../components/AuthLayout'
import { BackToLoginLink } from '../components/BackToLoginLink'
import { useApiErrorMessage } from '@/shared/hooks'

type ForgotPasswordValues = { email: string }

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const errorMessage = useApiErrorMessage('auth')
  const request = useForgotPassword()
  const [submitted, setSubmitted] = useState(false)

  const submit = (values: ForgotPasswordValues) =>
    request.mutate(values, { onSuccess: () => setSubmitted(true) })

  return (
    <AuthLayout
      title={t('forgot.title')}
      description={t('forgot.description')}
      footer={<BackToLoginLink />}
    >
      {submitted ? (
        <Alert tone="success" variant="soft" title={t('forgot.success')} />
      ) : (
        <Form<ForgotPasswordValues> layout="vertical" requiredMark={false} onFinish={submit}>
          {request.isError ? (
            <Alert variant="soft" tone="error" title={errorMessage(request.error)} />
          ) : null}
          <Form.Item
            name="email"
            label={t('fields.email')}
            rules={[
              { required: true, message: t('validation.emailRequired') },
              Form.rules.email(t('validation.emailInvalid')),
            ]}
          >
            <Input
              type="email"
              size="lg"
              placeholder={t('fields.emailPlaceholder')}
              autoComplete="email"
            />
          </Form.Item>
          <Button
            variant="primary"
            size="lg"
            htmlType="submit"
            className="w-full"
            loading={request.isPending}
          >
            {t('forgot.submit')}
          </Button>
        </Form>
      )}
    </AuthLayout>
  )
}
