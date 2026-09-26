export interface BrandDto {
  id: string
  workspaceId: string
  name: string
  avatarUrl: string | null
}

export type CreateBrandInput = { workspaceId: string; name: string; slug: string }
export type UpdateBrandInput = { brandId: string; name: string }

export interface BrandDetailDto extends BrandDto {
  /** Permission keys granted to the CURRENT user in THIS brand — the backend scopes them per brand. */
  permissions: string[]
}
