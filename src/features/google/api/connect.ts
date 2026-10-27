import { startGoogleConnect } from './service'

export const GOOGLE_OAUTH_CHANNEL = 'socialops.google.oauth'

export type GoogleOAuthResult = {
  type: typeof GOOGLE_OAUTH_CHANNEL
  email?: string
  error?: string
}

/** Sent by the callback page. A BroadcastChannel also works when Google's pages cut `opener`. */
export function reportGoogleOAuthResult(result: Omit<GoogleOAuthResult, 'type'>) {
  const message: GoogleOAuthResult = { type: GOOGLE_OAUTH_CHANNEL, ...result }
  const channel = new BroadcastChannel(GOOGLE_OAUTH_CHANNEL)
  channel.postMessage(message)
  channel.close()
  if (window.opener && window.opener !== window)
    (window.opener as Window).postMessage(message, window.location.origin)
}

/**
 * Runs Google consent in a popup and resolves once the callback page reports back. Call it
 * straight from a click handler: the popup is opened before any await, so it is not blocked.
 */
export function connectGoogleInPopup(): Promise<GoogleOAuthResult> {
  const popup = window.open(
    'about:blank',
    'socialops-google-oauth',
    'popup=yes,width=560,height=720',
  )
  return new Promise<GoogleOAuthResult>((resolve, reject) => {
    const channel = new BroadcastChannel(GOOGLE_OAUTH_CHANNEL)
    let done = false
    let timer = 0
    const finish = (settle: () => void) => {
      if (done) return
      done = true
      channel.close()
      window.removeEventListener('message', receive)
      window.clearInterval(timer)
      settle()
    }
    const handle = (result: GoogleOAuthResult | undefined) => {
      if (result?.type !== GOOGLE_OAUTH_CHANNEL) return
      finish(() => (result.error ? reject(new Error(result.error)) : resolve(result)))
    }
    const receive = (event: MessageEvent) => {
      if (event.origin === window.location.origin) handle(event.data as GoogleOAuthResult)
    }
    channel.onmessage = (event: MessageEvent) => handle(event.data as GoogleOAuthResult)
    window.addEventListener('message', receive)
    // Closing the popup without finishing counts as cancelled (after a grace period, since the
    // callback page reports its result and closes itself at the same moment).
    timer = window.setInterval(() => {
      if (!popup?.closed) return
      window.clearInterval(timer)
      window.setTimeout(() => finish(() => reject(new Error('GOOGLE_AUTH_CANCELLED'))), 1000)
    }, 500)
    startGoogleConnect()
      .then(({ authorizationUrl }) => {
        if (popup) popup.location.href = authorizationUrl
        else window.location.assign(authorizationUrl)
      })
      .catch((error: unknown) => {
        popup?.close()
        finish(() => reject(error))
      })
  })
}
