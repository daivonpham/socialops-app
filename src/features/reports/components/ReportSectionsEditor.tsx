import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, IconDrag } from '@/shared/ui'
import type { ReportConfig } from '../api/types'
import { SECTION_ICONS } from '../model/report-sections'

type Sections = ReportConfig['sections']

/** Section list for the content step: toggle each one and drag to reorder. */
export function ReportSectionsEditor({
  value,
  onChange,
}: {
  value: Sections
  onChange: (sections: Sections) => void
}) {
  const { t } = useTranslation('reports')
  const [dragging, setDragging] = useState<number | null>(null)

  const setEnabled = (id: Sections[number]['id'], enabled: boolean) =>
    onChange(value.map((item) => (item.id === id ? { ...item, enabled } : item)))

  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    if (item) next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <ul className="grid gap-2">
      {value.map((section, index) => (
        <li
          key={section.id}
          draggable
          onDragStart={() => setDragging(index)}
          onDragEnd={() => setDragging(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (dragging !== null) move(dragging, index)
            setDragging(null)
          }}
          // The whole row toggles the section; the checkbox stays the keyboard control.
          onClick={() => setEnabled(section.id, !section.enabled)}
          className={`flex cursor-pointer select-none items-center gap-3 rounded-xl border bg-bg-surface px-3 py-3 transition-colors ${
            section.enabled
              ? 'border-brand-200 bg-brand-50 hover:border-brand-300'
              : 'border-border-subtle hover:border-border-strong hover:bg-bg-surface-subtle'
          } ${dragging === index ? 'opacity-50' : ''}`}
        >
          <span
            onClick={(event) => event.stopPropagation()}
            className="cursor-grab text-icon-md text-text-tertiary"
            title={t('content.drag', { name: t(`sectionNames.${section.id}`) })}
            aria-hidden
          >
            <IconDrag />
          </span>
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg border bg-bg-surface text-icon-md ${
              section.enabled
                ? 'border-brand-200 text-brand-600'
                : 'border-border-subtle text-text-tertiary'
            }`}
          >
            {SECTION_ICONS[section.id]}
          </span>
          <span className="grid min-w-0 flex-1 gap-1">
            <span className="text-label-md text-text-primary">
              {t(`sectionNames.${section.id}`)}
            </span>
            <span className="text-caption text-text-tertiary">
              {t(`sectionDescriptions.${section.id}`)}
            </span>
          </span>
          <Checkbox
            checked={section.enabled}
            aria-label={t(`sectionNames.${section.id}`)}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => setEnabled(section.id, event.target.checked)}
          />
        </li>
      ))}
    </ul>
  )
}
