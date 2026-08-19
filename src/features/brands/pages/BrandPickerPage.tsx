import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useWorkspaces } from '@/features/workspaces'
import { useActiveBrand, useActiveWorkspace } from '@/shared/scope'
import { Avatar, Button, SectionLabel, Spin } from '@/shared/ui'
import { useBrands } from '../api'

/**
 * Landing route of the brand guard: the shell never renders without an active
 * brand, so this page is where one gets picked (workspace first, then brand).
 */
export default function BrandPickerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { workspaceId: activeWorkspaceId } = useActiveWorkspace()
  const { selectBrand } = useActiveBrand()

  const [pickedWorkspaceId, setPickedWorkspaceId] = useState<string | null>(activeWorkspaceId)
  const [pickedBrandId, setPickedBrandId] = useState<string | null>(null)

  const { data: workspaces, isPending: isLoadingWorkspaces } = useWorkspaces()
  const { data: brands, isPending: isLoadingBrands } = useBrands(pickedWorkspaceId)

  const openBrand = () => {
    if (pickedWorkspaceId === null || pickedBrandId === null) return
    selectBrand(pickedWorkspaceId, pickedBrandId)
    // The guard sends the attempted path along; '/' is the neutral fallback on direct visits.
    const from = (location.state as { from?: string } | null)?.from
    navigate(from ?? '/', { replace: true })
  }

  return (
    // Large onboarding panel: 16px radius and 24px padding (design.md §7, §6.1).
    <main className="flex min-h-screen items-center justify-center bg-bg-page p-4 md:p-6">
      <section className="w-full max-w-narrow rounded-xl border border-border bg-bg-surface p-6 shadow-xs">
        <h1 className="text-heading-2 text-text-primary">Choose a brand</h1>
        <p className="mt-2 text-body-md text-text-secondary">
          Accounts, content and permissions in SocialOps are scoped to one brand at a time.
        </p>

        <SectionLabel as="h2" className="mt-8 block">
          Workspace
        </SectionLabel>
        {isLoadingWorkspaces ? (
          <div className="mt-3 flex justify-center py-4">
            <Spin />
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(workspaces ?? []).map((workspace) => (
              <SelectableCard
                key={workspace.id}
                name={workspace.name}
                selected={pickedWorkspaceId === workspace.id}
                onClick={() => {
                  setPickedWorkspaceId(workspace.id)
                  setPickedBrandId(null)
                }}
              />
            ))}
          </div>
        )}

        <SectionLabel as="h2" className="mt-6 block">
          Brand
        </SectionLabel>
        {pickedWorkspaceId === null ? (
          <p className="mt-3 text-body-sm text-text-secondary">Pick a workspace first.</p>
        ) : isLoadingBrands ? (
          <div className="mt-3 flex justify-center py-4">
            <Spin />
          </div>
        ) : brands?.length ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {brands.map((brand) => (
              <SelectableCard
                key={brand.id}
                name={brand.name}
                selected={pickedBrandId === brand.id}
                onClick={() => setPickedBrandId(brand.id)}
              />
            ))}
          </div>
        ) : (
          // design.md §34 — the empty branch is part of the state matrix, not an afterthought.
          <p className="mt-3 text-body-sm text-text-secondary">
            This workspace has no brands yet. Ask a workspace admin to create one.
          </p>
        )}

        <Button
          variant="primary"
          disabled={pickedBrandId === null}
          onClick={openBrand}
          className="mt-8 w-full"
        >
          Open brand
        </Button>
      </section>
    </main>
  )
}

function SelectableCard({
  name,
  selected,
  onClick,
}: {
  name: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      // Compact interactive card: 8px radius, 16px padding, border-strong on
      // hover, brand-600 border + selection ring when picked (design.md §13.2).
      className={
        'flex items-center gap-3 rounded-md border p-4 text-left outline-none transition-colors duration-base ease-standard focus-visible:focus-ring ' +
        (selected
          ? 'border-border-focus bg-action-subtle ring-2 ring-brand-100'
          : 'border-border bg-bg-surface hover:border-border-strong')
      }
    >
      <Avatar name={name} size="sm" />
      <span className="truncate text-label-md text-text-primary">{name}</span>
    </button>
  )
}
