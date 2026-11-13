import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiErrorCode } from '@/shared/api/errors'
import { useAuth } from '@/shared/auth'
import { useActiveBrand } from '@/shared/scope'
import { useApiErrorMessage } from '@/shared/hooks'
import {
  Button,
  DatePicker,
  Dropdown,
  IconCheck,
  IconChevronDown,
  Modal,
  useToast,
} from '@/shared/ui'
import {
  useUpdatePlanningApproval,
  type PlanningApprovalStatus,
  type PlanningContent,
} from '../api'
import { approvalStatusLabelKey, approvalTransitions } from '../model'

const STATUS_CLASS: Record<PlanningApprovalStatus, string> = {
  none: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
  pending: 'bg-warning-50 text-warning-700 hover:bg-warning-100',
  approved: 'bg-success-50 text-success-700 hover:bg-success-100',
  rejected: 'bg-error-50 text-error-700 hover:bg-error-100',
}

/**
 * Changes a post's approval status, with the toast that follows. An approval whose requested time
 * has passed asks the approver how it goes out instead: render `dialog` for that.
 */
export function useApprovalChange(brandId: string, contentId: string) {
  const { t } = useTranslation('planning')
  const errorMessage = useApiErrorMessage('planning')
  const toast = useToast()
  const [expiredOpen, setExpiredOpen] = useState(false)
  const [newTime, setNewTime] = useState('')
  const approval = useUpdatePlanningApproval(brandId)

  const change = (
    approvalStatus: PlanningApprovalStatus,
    options: { publishNow?: boolean; scheduledAt?: string } = {},
  ) =>
    approval.mutate(
      { brandId, contentId, approvalStatus, ...options },
      {
        onSuccess: () => {
          setExpiredOpen(false)
          toast.success({ title: t(`approvalActions.done.${approvalStatus}`) })
        },
        onError: (error) => {
          // The requested time passed while waiting: the approver picks how it goes out.
          if (approvalStatus === 'approved' && isApiErrorCode(error, 'APPROVAL_SCHEDULE_EXPIRED')) {
            setNewTime('')
            setExpiredOpen(true)
            return
          }
          toast.error({ title: errorMessage(error, t('approvalActions.error')) })
        },
      },
    )

  const newTimeValid = Boolean(newTime) && new Date(newTime).getTime() > Date.now()

  const dialog = expiredOpen ? (
    <Modal
      open
      width={480}
      title={t('approvalActions.expired.title')}
      onClose={() => setExpiredOpen(false)}
      footer={
        <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
          <Button
            loading={approval.isPending && approval.variables?.publishNow}
            disabled={approval.isPending}
            onClick={() => change('approved', { publishNow: true })}
          >
            {t('approvalActions.expired.publishNow')}
          </Button>
          <Button
            variant="primary"
            loading={approval.isPending && Boolean(approval.variables?.scheduledAt)}
            disabled={!newTimeValid || approval.isPending}
            onClick={() => change('approved', { scheduledAt: new Date(newTime).toISOString() })}
          >
            {t('approvalActions.expired.schedule')}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3" onClick={(event) => event.stopPropagation()}>
        <p className="text-body-md text-text-secondary">
          {t('approvalActions.expired.description')}
        </p>
        <DatePicker
          showTime
          aria-label={t('approvalActions.expired.newTime')}
          placeholder={t('approvalActions.expired.newTime')}
          value={newTime}
          className="w-full"
          onChange={setNewTime}
        />
      </div>
    </Modal>
  ) : null

  return {
    change,
    pending: approval.isPending,
    nextStatus: approval.variables?.approvalStatus,
    dialog,
  }
}

export function ApprovalStatusSelect({
  brandId,
  content,
  canApprove,
  canSubmit,
}: {
  brandId: string
  content: PlanningContent
  canApprove: boolean
  canSubmit: boolean
}) {
  const { t } = useTranslation('planning')
  const [open, setOpen] = useState(false)
  const { change, pending, dialog } = useApprovalChange(brandId, content.id)
  const value = content.approvalStatus
  const { user } = useAuth()
  const transitions = approvalTransitions(content, { canApprove, canSubmit, userId: user?.id })
  const valueLabel = t(approvalStatusLabelKey(content))

  if (!transitions.length)
    return (
      <span
        className={`inline-flex h-10 items-center rounded-lg px-3 text-label-md ${STATUS_CLASS[value]}`}
      >
        {valueLabel}
      </span>
    )

  return (
    <>
      <Dropdown
        placement="bottomLeft"
        open={open}
        onOpenChange={setOpen}
        content={
          <div
            role="listbox"
            aria-label={t('list.approvalStatus')}
            className="grid w-56 gap-2 p-2"
            onClick={(event) => event.stopPropagation()}
          >
            {[value, ...transitions].map((status) => (
              <button
                key={status}
                type="button"
                role="option"
                aria-selected={status === value}
                className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-start text-label-md outline-none transition-colors duration-fast focus-visible:focus-ring ${STATUS_CLASS[status]}`}
                onClick={() => {
                  setOpen(false)
                  if (status !== value) change(status)
                }}
              >
                <span>{status === value ? valueLabel : t(`approvalActions.to.${status}`)}</span>
                {status === value ? <IconCheck aria-hidden className="text-icon-sm" /> : null}
              </button>
            ))}
          </div>
        }
      >
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t('list.changeApprovalStatus', {
            status: valueLabel,
          })}
          disabled={pending}
          className={`flex h-10 w-full min-w-40 items-center justify-between gap-3 rounded-lg border border-border px-3 text-label-md outline-none transition-[background-color,border-color,box-shadow] duration-fast focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-60 ${open ? 'control-active' : 'hover:border-border-strong'} ${STATUS_CLASS[value]}`}
          onClick={(event) => event.stopPropagation()}
        >
          <span className="truncate">{valueLabel}</span>
          <IconChevronDown
            aria-hidden
            className={`shrink-0 text-icon-sm transition-transform duration-base ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </Dropdown>
      {dialog}
    </>
  )
}

/** Approve and Reject as buttons, for a post waiting on this approver; nothing otherwise. */
export function ApprovalButtons({
  content,
  canApprove,
}: {
  content: PlanningContent
  canApprove: boolean
}) {
  const { t } = useTranslation('planning')
  const { brandId } = useActiveBrand()
  const { change, pending, nextStatus, dialog } = useApprovalChange(brandId ?? '', content.id)
  const transitions = approvalTransitions(content, { canApprove, canSubmit: false })
  if (!brandId || !transitions.includes('approved')) return null
  return (
    <>
      <Button
        variant="destructive"
        loading={pending && nextStatus === 'rejected'}
        disabled={pending}
        onClick={() => change('rejected')}
      >
        {t('approvalActions.to.rejected')}
      </Button>
      <Button
        variant="primary"
        icon={<IconCheck aria-hidden />}
        loading={pending && nextStatus === 'approved'}
        disabled={pending}
        onClick={() => change('approved')}
      >
        {t('approvalActions.to.approved')}
      </Button>
      {dialog}
    </>
  )
}
