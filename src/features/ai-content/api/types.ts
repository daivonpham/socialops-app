export type AiAvailability = {
  /** The system switch is on. */
  enabled: boolean
  /** This person may create posts, and so generate them. */
  canGenerate: boolean
  canManageChannels: boolean
  pages: Array<{ id: string; name: string; avatarUrl?: string }>
  hasProfile: boolean
}

export type AiTemplateField = {
  key: string
  label: string
  placeholder?: string
  required: boolean
}
export type AiTemplateOption = {
  key: string
  name: string
  description: string | null
  briefFields: AiTemplateField[]
}

export const AI_TONE_PRESETS = [
  'friendly',
  'professional',
  'playful',
  'inspiring',
  'informative',
] as const
export type AiTonePreset = (typeof AI_TONE_PRESETS)[number]

export type BrandAiProfile = {
  industry: string | null
  products: string | null
  targetAudience: string | null
  tonePreset: AiTonePreset | null
  toneNotes: string | null
  preferredWords: string[]
  bannedWords: string[]
  updatedAt: string | null
}
export type UpdateBrandAiProfileInput = Omit<BrandAiProfile, 'updatedAt'>

export type StartAiGenerationInput = {
  socialAccountIds: string[]
  templateKey?: string
  brief: Record<string, string>
  wantsImage: boolean
  /** Send for approval instead of leaving a draft. */
  autoSubmit: boolean
}

export type AiGenerationPhase = 'queued' | 'writing' | 'image' | 'checking' | 'saving'
export type AiGeneration = {
  id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  phase: AiGenerationPhase | null
  wantsImage: boolean
  contentId: string | null
  errorCode: string | null
  /** An image was asked for and could not be made; the post has none. */
  imageErrorCode: string | null
}

export type AiAttachment = {
  id: string
  type: 'image' | 'document'
  name: string
  /** Signed read address, valid for an hour. */
  url: string
}
