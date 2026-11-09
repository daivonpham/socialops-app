/**
 * Which chat was open when the AI dialog closed, per person and Brand, so opening it again lands
 * in the same place (D14): that chat, or a new one when a new chat was open.
 */
const keyOf = (userId: string, brandId: string): string => `socialops.ai-chat.${userId}.${brandId}`

/** The chat to reopen; `null` for a new chat. */
export function readOpenChat(userId: string | undefined, brandId: string): string | null {
  if (!userId) return null
  try {
    return window.localStorage.getItem(keyOf(userId, brandId)) || null
  } catch {
    return null
  }
}

export function rememberOpenChat(
  userId: string | undefined,
  brandId: string,
  conversationId: string | null,
): void {
  if (!userId) return
  try {
    if (conversationId) window.localStorage.setItem(keyOf(userId, brandId), conversationId)
    else window.localStorage.removeItem(keyOf(userId, brandId))
  } catch {
    // Storage may be off; the dialog then opens on a new chat.
  }
}
