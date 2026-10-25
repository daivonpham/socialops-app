import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReportSectionsEditor } from './ReportSectionsEditor'

const sections = [
  { id: 'kpis' as const, enabled: true },
  { id: 'trends' as const, enabled: false },
]

describe('ReportSectionsEditor', () => {
  it('toggles a section by clicking anywhere on its row', async () => {
    const onChange = vi.fn()
    render(<ReportSectionsEditor value={sections} onChange={onChange} />)
    await userEvent.click(screen.getByText('Daily trends'))
    expect(onChange).toHaveBeenLastCalledWith([
      { id: 'kpis', enabled: true },
      { id: 'trends', enabled: true },
    ])
  })

  it('toggles exactly once when the checkbox itself is clicked', async () => {
    const onChange = vi.fn()
    render(<ReportSectionsEditor value={sections} onChange={onChange} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'Key metrics' }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenLastCalledWith([
      { id: 'kpis', enabled: false },
      { id: 'trends', enabled: false },
    ])
  })

  it('does not toggle when grabbing the drag handle', async () => {
    const onChange = vi.fn()
    render(<ReportSectionsEditor value={sections} onChange={onChange} />)
    await userEvent.click(screen.getByTitle('Drag to reorder Daily trends'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
