import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClickWave } from '@/shared/ui'
import { useAiAvailability } from '../api'
import { AiCreateModal } from './AiCreateModal'
import { AiMark } from './AiMark'

/**
 * Sits beside "Create post". Shows only when AI is switched on and this person may create posts,
 * and looks different on purpose: the `ai` gradient, the sparkle and a Beta tag.
 */
export function AiCreateButton({
  brandId,
  defaultPageId,
  onOpenContent,
  onCreated,
}: {
  brandId: string | null
  defaultPageId?: string
  onOpenContent: (contentId: string) => void
  onCreated: () => void
}) {
  const { t } = useTranslation('aiContent')
  const availability = useAiAvailability(brandId)
  const [open, setOpen] = useState(false)
  const data = availability.data
  if (!brandId || !data?.enabled || !data.canGenerate) return null

  return (
    <>
      <ClickWave>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-[36px] items-center gap-2 rounded-lg bg-linear-to-r from-ai-400 to-ai-600 px-4 text-label-md text-text-inverse shadow-[0_4px_14px_-4px] shadow-ai-500/60 ring-1 ring-ai-300/60 ring-inset transition-[filter,box-shadow] duration-fast hover:brightness-110 hover:shadow-ai-500/80 focus-visible:focus-ring active:brightness-95"
        >
          <AiMark tone="white" className="w-[20px]" />
          {t('button')}
          <span className="rounded-full border border-bg-surface/40 bg-bg-surface/20 px-2 text-caption font-medium">
            {t('beta')}
          </span>
        </button>
      </ClickWave>
      {open ? (
        <AiCreateModal
          brandId={brandId}
          availability={data}
          defaultPageId={defaultPageId}
          onOpenContent={(contentId) => {
            setOpen(false)
            onOpenContent(contentId)
          }}
          onCreated={onCreated}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}
