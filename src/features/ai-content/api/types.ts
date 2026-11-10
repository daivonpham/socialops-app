export type AiAvailability = {
  /** The system switch is on. */
  enabled: boolean
  /** This person may create posts, and so generate them. */
  canGenerate: boolean
  /** May publish without approval: sees "Publish now" rather than "Send for approval". */
  canPublishDirect: boolean
  canManageChannels: boolean
  pages: Array<{ id: string; name: string; avatarUrl?: string }>
  hasProfile: boolean
  /** No Brand profile yet, and the first-run screen was neither skipped nor finished. */
  needsOnboarding: boolean
  /** Days a chat is kept after its last turn. */
  historyDays: number
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

/** The profile the AI proposes from the Page's posts, with three topics for the samples. */
export type AiProfileSuggestion = Omit<BrandAiProfile, 'updatedAt' | 'bannedWords'> & {
  ideas: string[]
}
export type AiOnboarding = {
  state: 'done' | 'syncing' | 'few_posts' | 'ready'
  suggestion: AiProfileSuggestion | null
}
export type ConfirmAiOnboardingInput = UpdateBrandAiProfileInput & {
  socialAccountId: string
  topics: string[]
}

export type StartAiGenerationInput = {
  socialAccountIds: string[]
  templateKey?: string
  brief: Record<string, string>
  /** Send for approval instead of showing a suggestion in the chat. */
  autoSubmit: boolean
  /** The chat to continue; a new one starts without it. */
  conversationId?: string
  attachmentIds?: string[]
}
export type AiGenerationStarted = { id: string; conversationId: string }

/** Where the caption of a request made without Pages is, in a suggestion's `captions`. */
export const AI_GENERAL_CAPTION_KEY = 'general'

export type AiGenerationPhase = 'queued' | 'writing' | 'image' | 'checking' | 'finishing'
/** The AI's picture choice: post the customer's images, make a new one, or none. */
export type AiImageAction = 'none' | 'use_attachment' | 'generate'
export type AiAttachment = {
  id: string
  type: 'image' | 'document'
  name: string
  /** Signed read address, valid for an hour. */
  url: string
}
/** A file of a turn: what was sent, or what the suggestion would post. */
export type AiTurnFile = AiAttachment & {
  /** Sent by the customer with a request, not made by the AI. */
  fromCustomer: boolean
}

export type AiSuggestion = {
  /** Caption by Page id. */
  captions: Record<string, string>
  images: AiTurnFile[]
}

/** One turn of a chat: what was asked, and what came back. */
export type AiGeneration = {
  id: string
  conversationId: string | null
  /** A fresh request, "Try another idea", or "Edit again". */
  kind: 'new' | 'retry' | 'edit'
  createdAt: string
  /** What was asked; an edit holds `instruction`. */
  brief: Record<string, string>
  templateKey: string | null
  socialAccountIds: string[]
  autoSubmit: boolean
  attachments: AiTurnFile[]
  suggestion: AiSuggestion | null
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  phase: AiGenerationPhase | null
  /** Null until the AI has written the captions and chosen. */
  imageAction: AiImageAction | null
  /** Documents sent with the request whose text could not be read. */
  unreadableFiles: string[]
  /** The writer learned the voice from the Page's best posts. */
  usedBestPosts: boolean
  /** The post made from this turn; set means the suggestion is used. */
  contentId: string | null
  errorCode: string | null
  /** The AI chose to make an image and none could be made. */
  imageErrorCode: string | null
}

export type AiConversationSummary = { id: string; title: string; lastActivityAt: string }
export type AiConversation = AiConversationSummary & { turns: AiGeneration[] }

export type AiPostIntent = 'publish_now' | 'approval_publish_now'

/**
 * What "Use" hands to the post screen: it fills the composer with this and saves nothing, and
 * the post it saves carries `generationId`, so the suggestion shows as used.
 */
export type AiSuggestionHandoff = {
  generationId: string
  socialAccountIds: string[]
  captions: Record<string, string>
  /** One caption for whichever Pages are picked: the request was made without Pages. */
  generalCaption?: string
  images: Array<{ id: string; url: string; name: string }>
}
