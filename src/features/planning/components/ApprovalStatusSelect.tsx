import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, IconCheck, IconChevronDown } from '@/shared/ui'
import type { PlanningApprovalStatus } from '../api'

const APPROVAL_STATUSES: PlanningApprovalStatus[] = ['none', 'pending', 'approved', 'rejected']

const STATUS_CLASS: Record<PlanningApprovalStatus, string> = {
  none: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
  pending: 'bg-warning-50 text-warning-700 hover:bg-warning-100',
  approved: 'bg-success-50 text-success-700 hover:bg-success-100',
  rejected: 'bg-error-50 text-error-700 hover:bg-error-100',
}

export function ApprovalStatusSelect({
  value,
  disabled,
  onChange,
}: {
  value: PlanningApprovalStatus
  disabled?: boolean
  onChange: (value: PlanningApprovalStatus) => void
}) {
  const { t } = useTranslation('planning')
  const [open, setOpen] = useState(false)

  return (
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
          {APPROVAL_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              role="option"
              aria-selected={status === value}
              className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-start text-label-md outline-none transition-colors duration-fast focus-visible:focus-ring ${STATUS_CLASS[status]}`}
              onClick={() => {
                setOpen(false)
                if (status !== value) onChange(status)
              }}
            >
              <span>{t(`approvalStatus.${status}`)}</span>
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
          status: t(`approvalStatus.${value}`),
        })}
        disabled={disabled}
        className={`flex h-10 w-full min-w-40 items-center justify-between gap-3 rounded-lg border border-border px-3 text-label-md outline-none transition-[background-color,border-color,box-shadow] duration-fast focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-60 ${open ? 'control-active' : 'hover:border-border-strong'} ${STATUS_CLASS[value]}`}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="truncate">{t(`approvalStatus.${value}`)}</span>
        <IconChevronDown
          aria-hidden
          className={`shrink-0 text-icon-sm transition-transform duration-base ${open ? 'rotate-180' : ''}`}
        />
      </button>
    </Dropdown>
  )
}
