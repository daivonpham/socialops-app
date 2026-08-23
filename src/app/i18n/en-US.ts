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
    goToAllPlatforms: 'Go to All Platforms',
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
    profile: 'Profile',
    languageOption: 'Language: {{language}}',
    signOut: 'Sign out',
  },
  permissions: {
    manageChannels: 'Manage channels',
    publishContent: 'Publish content',
    viewAnalytics: 'View analytics',
    viewReports: 'View reports',
    viewMembers: 'View members',
    viewSettings: 'View settings',
  },
} as const

export type AppNavigationKey = `navigation.${keyof typeof appEnUS.navigation}`
