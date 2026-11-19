import type { ReactNode } from 'react'
import { IconCheck } from '@/shared/ui'

export type ReportStep = { id: number; icon: ReactNode; title: string; hint: string }

/**
 * Vertical step list for the left rail: an outlined icon tile per step, its title and hint,
 * and a short connector between tiles. Only the current step is emphasised.
 */
export function ReportStepper({
  steps,
  current,
  reached,
  label,
  collapsed = false,
  onSelect,
}: {
  steps: ReportStep[]
  current: number
  /** Highest step the user may jump back to. */
  reached: number
  label: string
  /** Icons only, like the collapsed app sidebar; the title moves to the tooltip. */
  collapsed?: boolean
  onSelect: (id: number) => void
}) {
  // A row joined by lines below4 1280px, a column from there (the builder's rail). On a phone
  // only the current step keeps its name.
  return (
    <nav aria-label={label}>
      <ol className="flex items-center xl:block">
        {steps.map((step, index) => {
          const active = step.id === current
          const done = step.id < current
          return (
            <li
              key={step.id}
              className={`flex min-w-0 items-center last:flex-none xl:block ${active ? 'flex-none' : 'flex-1'}`}
            >
              <button
                type="button"
                disabled={step.id > reached}
                aria-current={active ? 'step' : undefined}
                aria-label={collapsed ? step.title : undefined}
                title={collapsed ? step.title : undefined}
                onClick={() => onSelect(step.id)}
                className={`flex items-center gap-2 rounded-lg text-left outline-none focus-visible:focus-ring disabled:cursor-default xl:w-full xl:gap-3 ${active ? 'shrink-0' : 'min-w-0'}`}
              >
                <span
                  className={`relative flex size-8 shrink-0 items-center justify-center rounded-lg border bg-bg-surface text-icon-md shadow-xs xl:size-10 ${
                    active
                      ? 'border-border-strong text-text-primary'
                      : 'border-border-subtle text-text-disabled'
                  }`}
                >
                  {step.icon}
                  {done ? (
                    <span className="absolute -end-2 -top-2 flex size-[18px] items-center justify-center rounded-full bg-brand-600 text-[10px] text-text-inverse ring-2 ring-bg-surface-subtle">
                      <IconCheck aria-hidden />
                    </span>
                  ) : null}
                </span>
                {collapsed ? null : (
                  <span className={`min-w-0 xl:grid ${active ? 'grid' : 'hidden sm:grid'}`}>
                    <span
                      className={`truncate text-label-md font-semibold xl:whitespace-normal ${active ? 'text-text-primary' : 'text-text-disabled'}`}
                    >
                      {step.title}
                    </span>
                    <span
                      className={`text-body-sm max-xl:hidden ${active ? 'text-text-secondary' : 'text-text-disabled'}`}
                    >
                      {step.hint}
                    </span>
                  </span>
                )}
              </button>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="mx-2 block h-[2px] min-w-4 flex-1 rounded-pill bg-border-subtle xl:mx-0 xl:my-1 xl:ms-[19px] xl:h-6 xl:w-[2px] xl:min-w-0 xl:flex-none"
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Centered heading of a step: outlined icon tile, title and supporting text. */
export function ReportStepHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="grid justify-items-center gap-5 text-center">
      <span className="flex size-[56px] items-center justify-center rounded-[12px] border border-border-subtle bg-bg-surface text-[26px] text-text-secondary shadow-xs">
        {icon}
      </span>
      <div className="grid gap-2">
        <h1 className="text-heading-1 text-text-primary">{title}</h1>
        <p className="text-body-md text-text-secondary">{description}</p>
      </div>
    </div>
  )
}

/** Progress dots under the step content. */
export function ReportStepDots({
  total,
  current,
  label,
}: {
  total: number
  current: number
  label: string
}) {
  return (
    <div className="flex justify-center gap-4" role="img" aria-label={label}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`size-[10px] rounded-full ${index + 1 === current ? 'bg-brand-600' : 'bg-neutral-200'}`}
        />
      ))}
    </div>
  )
}
