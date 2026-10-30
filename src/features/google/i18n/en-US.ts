export const googleEnUS = {
  callback: {
    completing: 'Connecting your Google account…',
    connected: 'Google account connected. You can close this window.',
    failed: 'Google account could not be connected.',
    back: 'Back to reports',
  },
  integration: {
    title: 'Google account',
    description:
      'Used to export reports to Google Sheets. Files are created in this account’s Drive.',
    notConnected: 'No Google account connected yet.',
    connectedAs: 'Connected as {{email}}',
    reconnectNeeded: 'Google access was revoked or expired. Connect again to keep exporting.',
    connect: 'Connect Google',
    reconnect: 'Connect again',
    disconnect: 'Disconnect',
    disconnectTitle: 'Disconnect Google?',
    disconnectDescription:
      'SocialOps will no longer create Google Sheets for you. Files already exported stay in your Drive.',
    disconnected: 'Google account disconnected.',
    connectedToast: 'Google account connected.',
    error: 'Something went wrong with Google. Please try again.',
    loadError: 'Google connection could not be loaded.',
  },
  errors: {
    GOOGLE_AUTH_FAILED: 'Google account could not be connected.',
    GOOGLE_PERMISSION_MISSING:
      'SocialOps needs access to the files it creates in Google Drive. Connect again and keep that box ticked.',
  },
} as const
