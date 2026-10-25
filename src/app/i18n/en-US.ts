export const appEnUS = {
  document: {
    title: 'SocialOps',
  },
  navigation: {
    allPlatforms: 'All Platforms',
    overview: 'Overview',
    planning: 'Planning',
    reports: 'Reports',
    members: 'Members',
    settings: 'Settings',
  },
  sections: {
    summary: 'Summary',
    platforms: 'Platforms',
  },
  placeholder: {
    comingSoon: 'Coming soon',
    description: 'This is a placeholder screen — the {{title}} feature ships in a later task.',
  },
  accessDenied: {
    title: "You don't have access to this page",
    description:
      "Your role in the current brand doesn't include this area. Switch to another brand or ask a workspace admin.",
    workspaceDescription:
      "Your role in the current workspace doesn't include this area. Ask a workspace admin for access.",
    goToAllPlatforms: 'Go to All Platforms',
  },
  noBrand: {
    title: 'No brand selected',
    reportsDescription: 'Create or select a brand to view reports.',
  },
  sidebar: {
    collapse: 'Collapse sidebar',
    expand: 'Expand sidebar',
  },
  topbar: {
    openNavigation: 'Open navigation',
    home: 'SocialOps home',
    primaryNavigation: 'Primary navigation',
  },
  account: {
    menu: 'Account menu',
    profile: 'Personal profile',
    changePassword: 'Change password',
    languageOption: 'Language: {{language}}',
    signOut: 'Sign out',
  },
  profile: {
    title: 'Personal profile',
    subtitle: 'Manage your personal information and account security.',
    tabsLabel: 'Profile sections',
    detailsTab: 'My details',
    passwordTab: 'Password',
    detailsTitle: 'Personal information',
    detailsDescription: 'Information associated with your SocialOps account.',
    name: 'Full name',
    email: 'Email address',
    language: 'Language',
    editAvatar: 'Change profile photo',
    avatarPreview: 'Preview profile photo',
    avatarHint: 'JPEG, PNG, or WebP. Maximum 5 MB.',
    avatarInvalid: 'Use a JPEG, PNG, or WebP image up to 5 MB.',
    avatarUploadError: 'The profile photo could not be updated. Please try again.',
    avatarUploadSuccess: 'Your profile photo has been updated.',
    saveError: 'Your information could not be saved. Please try again.',
    saveSuccess: 'Your personal information has been updated.',
    nameRequired: 'Enter your full name',
    nameMin: 'Full name must contain at least 2 characters',
    nameMax: 'Full name must not exceed 120 characters',
    cancel: 'Cancel',
    save: 'Save changes',
  },
  permissions: {
    manageChannels: 'Manage channels',
    publishContent: 'Publish content',
    approveContent: 'Approve content',
    manageWorkspace: 'Manage workspace',
    viewAnalytics: 'View analytics',
    viewReports: 'View reports',
    manageReports: 'Manage reports',
    viewMembers: 'View members',
    viewSettings: 'View settings',
  },
} as const

export type AppNavigationKey = `navigation.${keyof typeof appEnUS.navigation}`
