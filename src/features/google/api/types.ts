export type GoogleConnection = {
  connected: boolean
  /** False once Google rejected the stored grant; the user must connect again. */
  usable: boolean
  email: string | null
  connectedAt: string | null
}
