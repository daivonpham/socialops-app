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

const pagesKeyOf = (userId: string, brandId: string): string =>
  `socialops.ai-pages.${userId}.${brandId}`

/** The Pages last chosen in the dialog, per person and Brand, so a reload keeps them. */
export function readChosenPages(userId: string | undefined, brandId: string): string[] {
  if (!userId) return []
  try {
    const stored: unknown = JSON.parse(
      window.localStorage.getItem(pagesKeyOf(userId, brandId)) ?? '[]',
    )
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function rememberChosenPages(
  userId: string | undefined,
  brandId: string,
  pageIds: string[],
): void {
  if (!userId) return
  try {
    if (pageIds.length)
      window.localStorage.setItem(pagesKeyOf(userId, brandId), JSON.stringify(pageIds))
    else window.localStorage.removeItem(pagesKeyOf(userId, brandId))
  } catch {
    // Storage may be off; the dialog then opens with no Page chosen.
  }
}
