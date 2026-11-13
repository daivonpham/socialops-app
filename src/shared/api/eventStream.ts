import { getAccessToken, refreshAccessToken } from './client'

/**
 * Reads a server-sent event stream of JSON messages from the API. `fetch` rather than
 * `EventSource`, which cannot send the access token. Resolves when the stream ends, whether the
 * server closed it or `signal` aborted it; rejects when it could not be opened.
 */
export async function readEventStream(
  path: string,
  onMessage: (message: unknown) => void,
  signal: AbortSignal,
): Promise<void> {
  const open = () =>
    fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
      headers: {
        accept: 'text/event-stream',
        ...(getAccessToken() ? { authorization: `Bearer ${getAccessToken()}` } : {}),
      },
      credentials: 'include',
      signal,
    })
  let response = await open()
  // An expired token is renewed once, as `apiClient` does.
  if (response.status === 401) {
    await refreshAccessToken()
    response = await open()
  }
  if (!response.ok || !response.body) throw new Error(`Event stream refused: ${response.status}`)

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let pending = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) return
      pending += value
      // Events end with a blank line; a `data:` line holds the JSON, `:` lines keep it alive.
      const events = pending.split('\n\n')
      pending = events.pop() ?? ''
      for (const event of events) {
        const data = event
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n')
        if (!data) continue
        try {
          onMessage(JSON.parse(data))
        } catch {
          // A message that is not JSON is skipped; the next one carries everything so far.
        }
      }
    }
  } catch (error) {
    if (signal.aborted) return
    throw error
  } finally {
    reader.releaseLock()
  }
}
