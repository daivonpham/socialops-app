export const privacyEnUS = {
  dataDeletion: {
    title: 'Facebook data deletion',
    completedTitle: 'Your Facebook data was deleted',
    completedDescription:
      'SocialOps removed the Facebook connection, its access tokens and the Page analytics synced through it. Pages connected with it were disconnected.',
    code: 'Confirmation code',
    completedAt: 'Completed',
    notFoundTitle: 'Request not found',
    notFoundDescription: 'Check the link from Facebook. The confirmation code may be incomplete.',
    error: 'The status could not be loaded. Please try again.',
  },
  legal: {
    home: 'SocialOps home',
    updatedAt: 'Last updated: {{date}}',
    contents: 'Contents',
    contactTitle: 'Contact',
    contactBody: 'SocialOps is operated by {{operator}}. For any question or request, contact:',
    email: 'Email',
    phone: 'Phone',
    pages: 'Legal pages',
    login: 'Sign in',
  },
  privacyPolicy: {
    title: 'Privacy Policy',
    intro:
      'This policy explains what data SocialOps collects, why, who it is shared with, how long it is kept and how you can have it deleted. It applies to the SocialOps web app and to the Facebook, TikTok and Google connections you make in it.',
    sections: {
      controller: {
        title: 'Who is responsible for your data',
        body: 'SocialOps is operated by {{operator}}, an individual, who decides how your personal data is processed. Contact: {{email}}, {{phone}}.',
      },
      dataCollected: {
        title: 'Data we collect',
        body: `- Account: your name, email address and password (stored only as a one-way hash). If you sign in with Google, we receive your name, email address and profile picture from Google.
- Workspaces and brands: the workspaces and brands you create, their members, roles and invitations.
- Content you create: posts, captions, schedules, images and videos you upload, comments to post, reports and their settings.
- AI assistant: the requests you send, the conversations and the content generated for you.
- Technical data: sign-in sessions, IP address, browser type, error logs and an audit trail of important actions, used to keep the service secure and working.`,
      },
      facebookData: {
        title: 'Data from Facebook',
        body: `When you connect Facebook, you choose which Pages SocialOps may access. We request only the permissions the features need:

- pages_show_list: list the Pages you manage so you can choose which to connect.
- pages_manage_posts: publish, schedule, edit and delete posts on the Pages you connected, only when you or your team ask for it.
- pages_read_engagement and pages_read_user_content: read the Page's posts, reactions and comments to show them in SocialOps.
- read_insights: read Page and post statistics for the dashboards and reports.
- pages_manage_engagement (optional): post the first comment you write under your own post.

We store the Page name, ID and picture, an encrypted Page access token, the Page's posts and their statistics. Facebook data is used only to provide these features to the workspace that connected the Page. It is not sold, not used for advertising and not used to train AI models.`,
      },
      otherIntegrations: {
        title: 'Data from TikTok and Google',
        body: `- TikTok: when you connect a TikTok account, we request only what the features need: user.info.basic, user.info.profile and user.info.stats (name, username, picture, bio, verified badge and follower, following, like and video counts), video.list (the account's public videos and their view, like, comment and share counts), video.publish (post the videos and photos you ask us to) and, optionally, video.upload (send drafts to your TikTok inbox). We store an encrypted access token, the profile, the public videos and a daily record of their counts to draw the statistics over time. If you remove SocialOps in TikTok, TikTok tells us and we disconnect the account.
- Google Sheets: when you export a report to Google Sheets, we ask for access only to the files SocialOps creates (drive.file). We cannot see the rest of your Google Drive.

SocialOps's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.`,
      },
      use: {
        title: 'How we use your data',
        body: `- To run your account and the workspaces you belong to.
- To publish and schedule content, and to show analytics and reports for the accounts you connected.
- To generate content suggestions with the AI assistant when you ask for them.
- To send service emails such as email verification, password reset and invitations.
- To keep the service secure, prevent abuse and fix errors.

We do not sell your data and do not use it for advertising.`,
      },
      sharing: {
        title: 'Who we share data with',
        body: `We share data only with the services needed to run SocialOps, and only what each one needs:

- Meta (Facebook), TikTok and Google: to publish content and read data for the accounts you connected.
- OpenAI: the requests and content you send to the AI assistant are processed to generate a response.
- Cloudflare R2: storage for the images and videos you upload.
- Resend: delivery of service emails.
- Grafana Cloud: technical monitoring (performance and error metrics), without the content of your posts.
- Hosting and database providers that run the SocialOps servers.

We may also disclose data when required by law or by a competent authority.`,
      },
      retention: {
        title: 'How long we keep data',
        body: `We keep your account and content while your account exists. Some data is deleted automatically sooner:

- AI assistant conversations: 30 days.
- Sign-in sessions: 30 days after they end.
- Analytics of a disconnected Facebook or TikTok account: 90 days after it is disconnected.
- Publishing history, report refreshes and expired invitations: 90 days.
- In-app notifications: 90 days.
- Security audit trail: 365 days.`,
      },
      deletion: {
        title: 'Deleting your data',
        body: `- Disconnect a Page or account in SocialOps at any time. Its access token is deleted at once and its analytics after the period above.
- Remove SocialOps from Facebook (Settings and privacy > Settings > Business integrations). Facebook then asks us to delete your data: we delete the connection, its access tokens and the Page analytics synced through it, and give you a confirmation code to check the status.
- To delete your whole SocialOps account and all its data, email {{email}} from the address of the account. We complete the request within 30 days.`,
      },
      rights: {
        title: 'Your rights',
        body: 'You may ask to access, correct, export or delete your personal data, to withdraw a consent you gave or to object to its processing, by writing to {{email}}. We answer within 30 days. You may also complain to the competent data protection authority.',
      },
      security: {
        title: 'Security',
        body: 'Connections use HTTPS. Passwords are hashed, and Facebook, TikTok and Google access tokens are encrypted at rest. Access inside a workspace follows the roles its owners assign. No system is perfectly secure, but we work to protect your data and will notify you of an incident that affects it, as required by law.',
      },
      storage: {
        title: 'Cookies and browser storage',
        body: 'SocialOps uses a secure, HTTP-only cookie to keep you signed in, and browser storage to remember your language and the workspace and brand you last opened. We do not use advertising or third-party tracking cookies.',
      },
      children: {
        title: 'Children',
        body: 'SocialOps is a tool for businesses and is not intended for anyone under 16. We do not knowingly collect data from children.',
      },
      changes: {
        title: 'Changes to this policy',
        body: 'We may update this policy as SocialOps changes. The date at the top shows the latest version. If a change is significant, we will let you know in the app or by email before it takes effect.',
      },
    },
  },
  terms: {
    title: 'Terms of Service',
    intro:
      'These terms govern your use of SocialOps, a tool for planning, publishing and reporting on social media content. Please read them together with the Privacy Policy.',
    sections: {
      acceptance: {
        title: 'Accepting these terms',
        body: 'By creating an account, signing in or using SocialOps, you agree to these terms and to the Privacy Policy. If you use SocialOps on behalf of a business, you confirm you may accept them for it.',
      },
      service: {
        title: 'The service',
        body: 'SocialOps is operated by {{operator}}. It lets your team plan and publish content to the social media accounts you connect, use an AI assistant to draft content, and view analytics and reports. Features may change as the product develops.',
      },
      accounts: {
        title: 'Your account',
        body: `- Give accurate information and keep your password secret. You are responsible for activity under your account.
- Workspace owners and admins decide who joins their workspace and which role each member has.
- Tell us at {{email}} if you think your account has been used without permission.`,
      },
      connectedPlatforms: {
        title: 'Connected platforms',
        body: 'When you connect Facebook, TikTok or Google, you authorize SocialOps to act on those accounts as described in the Privacy Policy. You must have the right to manage the accounts you connect, and you remain bound by those platforms’ own terms. SocialOps is not affiliated with or endorsed by Meta, TikTok or Google, and is not responsible for changes or outages on their side.',
      },
      content: {
        title: 'Your content',
        body: 'You own the content you create or upload. You give SocialOps the permission needed to store, process and publish it on your behalf, only to provide the service. You are responsible for your content and must have the rights to publish it.',
      },
      ai: {
        title: 'AI-generated content',
        body: 'The AI assistant can produce inaccurate or unsuitable content. Review everything before you publish it. You are responsible for the content you choose to publish.',
      },
      acceptableUse: {
        title: 'Acceptable use',
        body: `You must not use SocialOps to:

- break the law or the rules of a connected platform;
- publish spam, misleading, hateful or infringing content;
- access accounts or data you are not authorized to use;
- disrupt, overload or try to break the security of the service.`,
      },
      availability: {
        title: 'Availability',
        body: 'We work to keep SocialOps running but do not guarantee it will always be available or error-free. Scheduled posts may be delayed or fail when a platform rejects them or is unavailable; SocialOps shows the status of each post so you can act.',
      },
      liability: {
        title: 'Limitation of liability',
        body: 'SocialOps is provided "as is". To the extent the law allows, the operator is not liable for indirect losses, lost profits or data loss arising from your use of the service, including from connected platforms.',
      },
      termination: {
        title: 'Suspension and termination',
        body: 'You may stop using SocialOps and ask us to delete your account at any time. We may suspend or close an account that breaks these terms, after notice where reasonable.',
      },
      changes: {
        title: 'Changes to these terms',
        body: 'We may update these terms. The date at the top shows the latest version. If a change is significant, we will let you know before it takes effect. Continuing to use SocialOps after that means you accept the new terms.',
      },
      law: {
        title: 'Governing law',
        body: 'These terms are governed by the laws of Vietnam. Disputes will first be resolved by negotiation; failing that, by a competent court in Vietnam.',
      },
    },
  },
} as const
