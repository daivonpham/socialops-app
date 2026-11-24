export const notificationsEnUS = {
  title: 'Notifications',
  trigger: 'Notifications',
  triggerWithCount: 'Notifications ({{count}} unread)',
  newCount: '{{count}} new',
  markAllRead: 'Mark all as read',
  tabs: { label: 'Show', all: 'All', action: 'To do' },
  groups: { today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier' },
  empty: 'You are all caught up.',
  emptyAction: 'Nothing waits on you.',
  loadError: 'Notifications could not be loaded.',
  retry: 'Try again',
  loadMore: 'Show older',
  unread: 'Unread',
  actions: {
    review: 'Review',
    openPost: 'Open post',
    reconnect: 'Reconnect',
    reconnected: 'Reconnected.',
    reconnectError: 'Could not reconnect. Try again from the account manager.',
  },
  roles: {
    owner: 'Owner',
    full_access: 'Full access',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
  },
  types: {
    approval: {
      requested: { title: 'Post waiting for review', body: '{{actor}}: “{{caption}}”' },
      requested_untitled: {
        title: 'Post waiting for review',
        body: '{{actor}} sent a post without a caption.',
      },
      approved: { title: 'Post approved', body: '{{actor}} approved “{{caption}}”.' },
      approved_untitled: {
        title: 'Post approved',
        body: '{{actor}} approved your post without a caption.',
      },
      rejected: { title: 'Post rejected', body: '{{actor}} rejected “{{caption}}”.' },
      rejected_untitled: {
        title: 'Post rejected',
        body: '{{actor}} rejected your post without a caption.',
      },
    },
    publish: {
      failed: { title: 'Post failed', body: '{{account}}: “{{caption}}”' },
      failed_untitled: { title: 'Post failed', body: 'Not posted to {{account}}.' },
      unknown: { title: 'Post may not have gone out', body: '{{account}}: “{{caption}}”' },
      unknown_untitled: {
        title: 'Post may not have gone out',
        body: 'Check whether it reached {{account}}.',
      },
    },
    channel: {
      expiring: { title: '{{network}} login about to expire', body: '{{channels}}' },
      expiring_more: {
        title: '{{network}} login about to expire',
        body: '{{channels}} and {{count}} more',
      },
      reconnect: { title: '{{network}} needs reconnecting', body: '{{channels}}' },
      reconnect_more: {
        title: '{{network}} needs reconnecting',
        body: '{{channels}} and {{count}} more',
      },
      permission: {
        title: '{{network}} permission missing',
        body: '{{channels}}: reconnect and grant every permission.',
      },
      permission_more: {
        title: '{{network}} permission missing',
        body: '{{channels}} and {{count}} more: reconnect and grant every permission.',
      },
      removed: {
        title: 'Removed on {{network}}',
        body: '{{channels}} removed SocialOps and was disconnected.',
      },
      removed_more: {
        title: 'Removed on {{network}}',
        body: '{{channels}} and {{count}} more removed SocialOps and were disconnected.',
      },
    },
    member: {
      invited: { title: 'Workspace invitation', body: '{{actor}} invited you to {{workspace}}.' },
      joined: { title: 'New member', body: '{{actor}} joined {{workspace}}.' },
      role_changed: { title: 'Role changed', body: '{{actor}} made you {{role}}.' },
    },
    ai: {
      succeeded: { title: 'AI finished a post', body: 'Your suggestion for {{brand}} is ready.' },
      replied: { title: 'AI answered', body: 'In your chat for {{brand}}.' },
      failed: { title: 'AI could not make the post', body: 'Open the chat to try again.' },
    },
    credits: {
      low: { title: 'Credits running low', body: '{{used}} of {{limit}} used this month.' },
      out: {
        title: 'Out of Credits',
        body: 'All {{limit}} used this month; new AI requests wait for next month.',
      },
    },
  },
}
