import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { DataTable } from './DataTable'

type Row = { id: string; name: string; city: string }
const rows: Row[] = [{ id: '1', name: 'An', city: 'Huế' }]
const columns = [
  { key: 'name', dataIndex: 'name' as const, title: 'Name' },
  { key: 'city', dataIndex: 'city' as const, title: 'City' },
]

describe('DataTable column settings', () => {
  beforeEach(() => window.localStorage.clear())

  it('hides and shows a column from the settings panel', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        title="T"
        showColumnSettings
      />,
    )
    expect(screen.getByRole('columnheader', { name: /City/ })).toBeInTheDocument()

    await user.click(screen.getAllByRole('button')[0]!)
    const panel = await screen.findByRole('region')
    const [, cityToggle] = within(panel).getAllByRole('checkbox')
    await user.click(cityToggle!)
    expect(screen.queryByRole('columnheader', { name: /City/ })).not.toBeInTheDocument()

    await user.click(cityToggle!)
    expect(screen.getByRole('columnheader', { name: /City/ })).toBeInTheDocument()
  })

  it('remembers hidden columns per key and restores them with reset', async () => {
    const user = userEvent.setup()
    const table = (
      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        title="T"
        showColumnSettings
        columnPersistenceKey="test-table"
      />
    )
    const first = render(table)
    await user.click(screen.getAllByRole('button')[0]!)
    const [, cityToggle] = within(await screen.findByRole('region')).getAllByRole('checkbox')
    await user.click(cityToggle!)
    first.unmount()

    render(table)
    expect(screen.queryByRole('columnheader', { name: /City/ })).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button')[0]!)
    const panel = await screen.findByRole('region')
    await user.click(within(panel).getAllByRole('button')[0]!)
    expect(screen.getByRole('columnheader', { name: /City/ })).toBeInTheDocument()
  })

  it('sorts on its own when the parent does not control sorting', async () => {
    const user = userEvent.setup()
    const data: Row[] = [
      { id: '1', name: 'B', city: 'x' },
      { id: '2', name: 'A', city: 'y' },
    ]
    render(
      <DataTable
        data={data}
        columns={[{ key: 'name', dataIndex: 'name' as const, title: 'Name', sortable: true }]}
        getRowId={(row) => row.id}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Name/ }))
    await user.click((await screen.findAllByRole('menuitem'))[0]!)
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['A', 'B'])
  })

  it('sorts a server-sorted column that only renders its value', async () => {
    const user = userEvent.setup()
    const changes: unknown[] = []
    render(
      <DataTable
        data={rows}
        columns={[
          { key: 'name', title: 'Name', sortable: true, render: (_, row: Row) => row.name },
        ]}
        getRowId={(row) => row.id}
        manualSorting
        sorting={[]}
        onSortingChange={(value) => changes.push(value)}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Name/ }))
    await user.click((await screen.findAllByRole('menuitem'))[1]!)
    expect(changes).toEqual([[{ columnKey: 'name', direction: 'desc' }]])
  })

  it('shows the shared empty state when there are no rows', () => {
    const { container } = render(
      <DataTable data={[]} columns={columns} getRowId={(row: Row) => row.id} />,
    )
    expect(container.querySelector('.ant-empty')).toBeInTheDocument()
  })
})
