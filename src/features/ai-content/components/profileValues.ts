import type { AiTonePreset, UpdateBrandAiProfileInput } from '../api'

/** What the Brand profile form holds; blank fields are saved as empty. */
export type ProfileValues = {
  industry?: string
  products?: string
  targetAudience?: string
  tonePreset?: AiTonePreset | null
  toneNotes?: string
  preferredWords?: string[]
  bannedWords?: string[]
}

const orNull = (text: string | undefined): string | null => text?.trim() || null

export const toProfileInput = (values: ProfileValues): UpdateBrandAiProfileInput => ({
  industry: orNull(values.industry),
  products: orNull(values.products),
  targetAudience: orNull(values.targetAudience),
  tonePreset: values.tonePreset ?? null,
  toneNotes: orNull(values.toneNotes),
  preferredWords: values.preferredWords ?? [],
  bannedWords: values.bannedWords ?? [],
})
